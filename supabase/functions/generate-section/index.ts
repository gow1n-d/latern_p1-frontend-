import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sectionPrompts: Record<string, string> = {
  abstract: "Write a concise academic abstract (150-250 words) for a research paper. Include background, objective, methods, results, and conclusion. Use formal academic tone.",
  introduction: "Write an academic introduction section. Include background context, problem statement, research gap, objectives, and paper organization. Use formal academic style with proper paragraph structure.",
  literature: "Write a literature review section. Summarize and critically analyze relevant prior work, identify research gaps, and position the current study. Group related works thematically.",
  methodology: "Write a detailed methodology section. Describe the research design, data collection methods, tools/frameworks used, experimental setup, and evaluation metrics. Be precise and reproducible.",
  results: "Write a results section presenting key findings. Describe quantitative/qualitative results objectively. Reference tables and figures where appropriate. Compare with baseline methods.",
  discussion: "Write a discussion section. Interpret the results, explain significance, compare with prior work, discuss limitations, and suggest implications.",
  conclusion: "Write a conclusion section. Summarize key contributions, restate main findings, discuss practical implications, and suggest future research directions.",
  keywords: "Generate 5-8 relevant academic keywords/keyphrases for this research paper, separated by commas.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { section, title, domain, methodology, results_summary, journal, existing_content } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sectionGuide = sectionPrompts[section] || `Write the "${section}" section for an academic research paper. Use formal academic writing style.`;

    const systemPrompt = `You are an expert academic writing assistant specializing in research papers for ${journal || "IEEE"} journal publication. You produce publication-ready content with proper academic tone, structure, and rigor. Do not include section headings in your output — just the content. Do not use markdown formatting.`;

    const userPrompt = `${sectionGuide}

Paper details:
- Title: ${title || "Not specified"}
- Research Domain: ${domain || "Not specified"}
- Methodology: ${methodology || "Not specified"}
- Key Results: ${results_summary || "Not specified"}
- Target Journal: ${journal || "IEEE"}
${existing_content ? `\nExisting content for context:\n${existing_content}` : ""}

Write the ${section} section now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-section error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
