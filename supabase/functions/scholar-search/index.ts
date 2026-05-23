import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAuth, readJsonWithLimit, tooLarge } from "../_shared/auth.ts";

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

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await readJsonWithLimit(req, 20_000);
    if (body instanceof Response) return body;
    const { query, journal, paperTitle } = body;
    if ((query?.length ?? 0) > 500) return tooLarge("Query too long (max 500 chars)");
    if ((paperTitle?.length ?? 0) > 500) return tooLarge("paperTitle too long");

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Search query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert academic research assistant. Given a search query, generate realistic and properly formatted academic references.

Return a JSON array of 8-12 references with this EXACT structure (no markdown, just raw JSON array):

[
  {
    "title": "<paper title>",
    "authors": "<Author1, A.B., Author2, C.D.>",
    "year": <year number>,
    "venue": "<journal or conference name>",
    "doi": "<doi if known, or empty string>",
    "abstract": "<brief 1-2 sentence summary>",
    "citations": <estimated citation count>,
    "relevance": <0-100>,
    "formatted_${journal || "ieee"}": "<fully formatted citation in ${journal?.toUpperCase() || "IEEE"} style>"
  }
]

Generate references spanning 2018-2025 with some seminal older works. Include a mix of journal papers and conference proceedings.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Find relevant academic papers for: "${query}"${paperTitle ? `\nContext: This is for a paper titled "${paperTitle}"` : ""}` },
    ];

    const content = await callAI(messages, 0.3);

    if (!content) {
      return new Response(JSON.stringify({ error: "All AI providers failed. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let results;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      results = [];
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scholar-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
