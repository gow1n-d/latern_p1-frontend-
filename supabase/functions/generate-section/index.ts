import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sectionPrompts: Record<string, string> = {
  abstract: "Write a concise academic abstract (150-250 words). Include background, objective, methods, results, and conclusion.",
  introduction: "Write an academic introduction. Include background context, problem statement, research gap, objectives, and paper organization.",
  literature: "Write a literature review. Summarize and critically analyze relevant prior work, identify research gaps, and position the current study.",
  methodology: "Write a detailed methodology section. Describe research design, data collection methods, tools/frameworks, experimental setup, and evaluation metrics.",
  results: "Write a results section presenting key findings. Describe quantitative/qualitative results objectively. Reference tables and figures.",
  discussion: "Write a discussion section. Interpret results, explain significance, compare with prior work, discuss limitations.",
  conclusion: "Write a conclusion. Summarize key contributions, restate main findings, discuss implications, suggest future directions.",
  keywords: "Generate 5-8 relevant academic keywords/keyphrases, separated by commas.",
  background: "Write a background/preliminaries section covering foundational concepts, definitions, and theoretical framework needed to understand this work.",
  "experimental-setup": "Write an experimental setup section detailing datasets, hardware/software environment, hyperparameters, baselines, and evaluation protocol.",
  experiments: "Write an experiments section describing experimental design, datasets used, baselines compared, and evaluation methodology.",
  evaluation: "Write an evaluation section with metrics, benchmarks, comparative analysis, and statistical significance of results.",
  theoretical: "Write a theoretical analysis section with formal proofs, complexity analysis, convergence guarantees, or mathematical foundations.",
  "broader-impact": "Write a broader impact statement discussing societal implications, potential risks, benefits, and ethical considerations.",
  limitations: "Write a limitations section honestly discussing constraints, assumptions, potential biases, and scope boundaries.",
  ethics: "Write an ethics statement addressing data privacy, consent, potential biases, and responsible use of the research.",
  highlights: "Write 3-5 bullet-point highlights summarizing the key contributions and novelty of this paper.",
  "ccs-concepts": "Generate ACM CCS concepts classification for this paper (e.g., • Computing methodologies → Machine learning).",
  acknowledgements: "Write an acknowledgements section thanking funding bodies, collaborators, and resources used.",
  "data-availability": "Write a data availability statement describing how and where the data and code can be accessed.",
  "supporting-info": "Write a supporting information section describing supplementary materials, datasets, or additional analyses.",
  supplementary: "Write a supplementary materials section with additional experiments, proofs, or data not in the main paper.",
  implementation: "Write an implementation details section covering architecture specifics, training procedures, and engineering decisions.",
  ablation: "Write an ablation study section systematically analyzing the contribution of each component of the proposed method.",
  analysis: "Write a detailed analysis section examining error cases, performance breakdowns, and qualitative examples.",
  body: "Write the main body of the paper with well-structured arguments, evidence, and analysis.",
  coi: "Write a declaration of competing interest / conflicts of interest statement.",
  funding: "Write a funding statement acknowledging financial support and grant numbers.",
  reproducibility: "Write a reproducibility statement detailing steps taken to ensure reproducibility of results.",
  "materials-methods": "Write a materials and methods section combining both material descriptions and methodological procedures.",
  methods: "Write a methods section describing the experimental and analytical procedures used in this study.",
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
