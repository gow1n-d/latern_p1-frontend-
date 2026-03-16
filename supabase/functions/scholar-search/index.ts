import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, journal, paperTitle } = await req.json();

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Search query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert academic research assistant with extensive knowledge of published research papers across all domains. Given a search query, generate realistic and properly formatted academic references that would be relevant to the query topic.

Return a JSON array of 8-12 references. Each reference should have this EXACT structure (no markdown, just raw JSON array):

[
  {
    "title": "<paper title>",
    "authors": "<Author1, A.B., Author2, C.D.>",
    "year": <year number>,
    "venue": "<journal or conference name>",
    "doi": "<doi if known, or empty string>",
    "abstract": "<brief 1-2 sentence summary>",
    "citations": <estimated citation count>,
    "relevance": <0-100 relevance score to the query>,
    "formatted_${journal || "ieee"}": "<fully formatted citation in ${journal?.toUpperCase() || "IEEE"} style>"
  }
]

Generate references that:
- Are highly relevant to the search query
- Span recent years (2018-2025) with some seminal older works
- Include a mix of journal papers and conference proceedings
- Have realistic author names and publication venues
- Are properly formatted for the target citation style`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nFind relevant academic papers for: "${query}"${paperTitle ? `\nContext: This is for a paper titled "${paperTitle}"` : ""}` }] },
          ],
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
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
