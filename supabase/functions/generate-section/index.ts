import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sectionPrompts: Record<string, string> = {
  abstract: "Write a concise academic abstract (150-250 words). Include background, objective, methods, results, and conclusion. Use ONLY the information provided below — do not invent data, statistics, or findings.",
  introduction: "Write an academic introduction. Include background context, problem statement, research gap, objectives, and paper organization. Base everything strictly on the provided details.",
  literature: "Write a literature review section. Summarize and critically analyze relevant prior work concepts based ONLY on what the user describes. Do NOT fabricate author names, paper titles, years, or citation numbers. If specific references are not provided, discuss concepts and research directions generally without inventing citations.",
  methodology: "Write a detailed methodology section. Describe research design, data collection methods, tools/frameworks, experimental setup, and evaluation metrics. Use ONLY the methodology details provided by the user.",
  results: "Write a results section presenting key findings. Use ONLY the results/data the user has provided. Do NOT invent numbers, percentages, p-values, or statistical outcomes. If specific numbers are not given, describe results qualitatively.",
  discussion: "Write a discussion section. Interpret the results provided, explain significance, and discuss limitations. Do NOT fabricate comparisons with studies not mentioned by the user.",
  conclusion: "Write a conclusion. Summarize key contributions and main findings based ONLY on what was provided. Suggest future directions that logically follow from the actual work described.",
  keywords: "Generate 5-8 relevant academic keywords/keyphrases based strictly on the paper title and domain provided. Separate by commas.",
  background: "Write a background/preliminaries section covering foundational concepts relevant to the domain specified. Present well-established facts only — no speculative claims.",
  "experimental-setup": "Write an experimental setup section. Use ONLY the setup details (datasets, hardware, parameters) provided by the user. Do NOT invent dataset names, sizes, or specifications.",
  experiments: "Write an experiments section based strictly on the user's methodology and results. Do NOT fabricate experimental outcomes or baselines not mentioned.",
  evaluation: "Write an evaluation section. Use ONLY the metrics and results provided. Do NOT invent benchmark scores or statistical measures.",
  theoretical: "Write a theoretical analysis section. Present only well-established mathematical foundations relevant to the described methodology. Do NOT fabricate proofs or theorems.",
  "broader-impact": "Write a broader impact statement discussing societal implications based on the actual research described. Keep claims proportional to the work's scope.",
  limitations: "Write a limitations section honestly discussing constraints based on the described methodology. Do NOT invent limitations not related to the actual work.",
  ethics: "Write an ethics statement relevant to the research domain and methodology described.",
  highlights: "Write 3-5 bullet-point highlights summarizing key contributions based ONLY on what the user has described.",
  "ccs-concepts": "Generate ACM CCS concepts classification based strictly on the paper title and domain provided.",
  acknowledgements: "Write a brief, generic acknowledgements section. Do NOT fabricate grant numbers or funding body names unless provided.",
  "data-availability": "Write a data availability statement. Keep it generic unless the user provides specific repository or access details.",
  "supporting-info": "Write a supporting information section describing what supplementary materials might accompany this work, based on the methodology described.",
  supplementary: "Write a supplementary materials section based on the methodology and results provided.",
  implementation: "Write an implementation details section based ONLY on the methodology and tools described by the user.",
  ablation: "Write an ablation study section. Use ONLY the components described in the user's methodology. Do NOT invent ablation results or percentages.",
  analysis: "Write a detailed analysis section based on the results provided. Do NOT fabricate error cases or examples.",
  body: "Write the main body of the paper with well-structured arguments based strictly on the provided information.",
  coi: "Write a standard declaration of competing interest / conflicts of interest statement.",
  funding: "Write a funding statement. Keep it generic unless specific funding details are provided.",
  reproducibility: "Write a reproducibility statement based on the methodology described.",
  "materials-methods": "Write a materials and methods section using ONLY the materials and procedures described by the user.",
  methods: "Write a methods section using ONLY the procedures and tools described by the user.",
};

async function callNvidia(messages: any[], stream: boolean, temperature: number) {
  const key = Deno.env.get("NVIDIA_API_KEY");
  if (!key) return null;
  const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages, stream, temperature, max_tokens: 4096 }),
  });
  if (!resp.ok) { console.error("NVIDIA error:", resp.status, await resp.text()); return null; }
  return resp;
}

async function callOpenRouter(messages: any[], stream: boolean, temperature: number) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return null;
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages, stream, temperature }),
  });
  if (!resp.ok) { console.error("OpenRouter error:", resp.status); return null; }
  return resp;
}

async function callLovableGateway(messages: any[], stream: boolean, temperature: number) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, stream, temperature }),
  });
  if (!resp.ok) { console.error("Lovable gateway error:", resp.status); return null; }
  return resp;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { section, title, domain, methodology, results_summary, journal, existing_content } = await req.json();

    const sectionGuide = sectionPrompts[section] || `Write the "${section}" section for an academic research paper. Use formal academic writing style. Use ONLY information provided below.`;

    const systemPrompt = `You are an expert academic writing assistant specializing in research papers for ${journal || "IEEE"} journal publication.

CRITICAL ANTI-HALLUCINATION RULES — FOLLOW STRICTLY:
1. Use ONLY the information provided by the user (title, domain, methodology, results). Do NOT invent, fabricate, or assume any data, statistics, findings, author names, paper titles, years, or citations.
2. If specific data/numbers are not provided, describe concepts qualitatively. Never generate fake percentages, p-values, accuracy scores, or benchmark results.
3. Do NOT fabricate references or citations.
4. Do NOT invent dataset names, sizes, model names, or experimental configurations not mentioned by the user.
5. Use hedging language when the user hasn't provided concrete results.
6. Maintain strict academic tone, proper structure, and publication-ready quality.
7. Do not include section headings in your output — just the content.
8. Do not use markdown formatting.
9. Every claim must be directly traceable to the user's provided information.`;

    const userPrompt = `${sectionGuide}

Paper details provided by the researcher:
- Title: ${title || "Not specified"}
- Research Domain: ${domain || "Not specified"}
- Methodology: ${methodology || "Not specified"}
- Key Results: ${results_summary || "Not specified"}
- Target Journal: ${journal || "IEEE"}
${existing_content ? `\nExisting content from other sections (use for consistency, do NOT contradict):\n${existing_content}` : ""}

REMINDER: Write ONLY based on the details above. Write the ${section} section now.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Try NVIDIA first, then OpenRouter, then Lovable Gateway
    const resp = await callNvidia(messages, true, 0.2) || await callOpenRouter(messages, true, 0.2) || await callLovableGateway(messages, true, 0.2);

    if (!resp || !resp.body) {
      return new Response(JSON.stringify({ error: "All AI providers failed. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-section error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
