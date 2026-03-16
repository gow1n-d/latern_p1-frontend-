import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, journal } = await req.json();

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

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
  "originality_score": <number 0-100, where 100 is fully original>,
  "ai_detection_score": <number 0-100, percentage likelihood the text was AI-generated>,
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
  "common_phrases": ["<any overly generic or commonly seen academic phrases>"],
  "recommendations": ["<actionable improvement suggestions>"]
}

CRITICAL RULES:
1. Base your analysis ONLY on the text provided. Do NOT assume or fabricate patterns not present.
2. Be precise — do not inflate or deflate scores without textual evidence.
3. Each flag must point to a specific pattern in the actual text.
4. Recommendations must be actionable and specific to the content analyzed.

Evaluate based on:
1. Originality: Look for generic phrasing, template-like structures, overly common formulations
2. AI Detection: Check for uniform sentence length, lack of personal voice, overly structured arguments, perfect parallel constructions, excessive hedging patterns
3. Flag sections that feel templated or lack unique research perspective
4. Be thorough but fair — academic writing naturally shares conventions`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nAnalyze this ${journal || "academic"} paper for originality and AI-generated content:\n\n${allContent}` }] },
          ],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      result = {
        originality_score: 75,
        ai_detection_score: 50,
        overall_risk: "medium",
        sections: [],
        common_phrases: [],
        recommendations: ["Unable to fully parse analysis. Please try again."],
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
