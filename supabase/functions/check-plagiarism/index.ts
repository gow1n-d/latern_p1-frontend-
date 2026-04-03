import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(messages: any[], temperature: number): Promise<string | null> {
  // Try NVIDIA first
  const nvKey = Deno.env.get("NVIDIA_API_KEY");
  if (nvKey) {
    const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${nvKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages, temperature, max_tokens: 4096 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    }
    console.error("NVIDIA error:", resp.status);
  }

  const orKey = Deno.env.get("OPENROUTER_API_KEY");
  if (orKey) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages, temperature }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    }
    console.error("OpenRouter error:", resp.status);
  }

  const lvKey = Deno.env.get("LOVABLE_API_KEY");
  if (lvKey) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lvKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, temperature }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    }
    console.error("Lovable gateway error:", resp.status);
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, journal } = await req.json();

    const allContent = sections
      .filter((s: any) => s.content.trim() && !["title", "keywords", "references", "works-cited", "bibliography", "reference-list"].includes(s.id))
      .map((s: any) => `[${s.label}]\n${s.content}`)
      .join("\n\n");

    if (!allContent.trim()) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an academic plagiarism and AI-content detection expert. Analyze the provided academic text and return a JSON response with this EXACT structure (no markdown, no code blocks, just raw JSON):

{
  "originality_score": <number 0-100>,
  "ai_detection_score": <number 0-100>,
  "overall_risk": "<low|medium|high>",
  "sections": [
    {
      "name": "<section name>",
      "originality": <0-100>,
      "ai_likelihood": <0-100>,
      "flags": ["<specific concern>"],
      "suggestions": ["<how to improve>"]
    }
  ],
  "common_phrases": ["<overly generic phrases>"],
  "recommendations": ["<actionable suggestions>"]
}

Be precise — base analysis ONLY on the text provided.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze this ${journal || "academic"} paper for originality and AI-generated content:\n\n${allContent}` },
    ];

    const content = await callAI(messages, 0.1);

    if (!content) {
      return new Response(JSON.stringify({ error: "All AI providers failed. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      result = {
        originality_score: 75, ai_detection_score: 50, overall_risk: "medium",
        sections: [], common_phrases: [], recommendations: ["Unable to fully parse analysis. Please try again."],
      };
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-plagiarism error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
