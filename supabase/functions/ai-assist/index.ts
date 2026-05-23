import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAuth, readJsonWithLimit, tooLarge } from "../_shared/auth.ts";

const MAX_FIELD = 20_000;

async function callNvidia(messages: any[], stream: boolean, temperature: number) {
  const key = Deno.env.get("NVIDIA_API_KEY");
  if (!key) return null;
  const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages, stream, temperature, max_tokens: 4096 }),
  });
  if (!resp.ok) { console.error("NVIDIA error:", resp.status); return null; }
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
    const { instruction, content, journal } = await req.json();

    const systemPrompt = `You are an expert academic writing assistant for ${journal || "IEEE"} journal papers.

CRITICAL RULES:
1. Apply the requested change and return ONLY the improved text. No markdown, no explanations.
2. Do NOT add new claims, data, statistics, or citations that are not in the original content.
3. Do NOT change the meaning or introduce new information — only improve clarity, grammar, tone, and structure.
4. Preserve all factual claims, numbers, and references exactly as they appear in the original.
5. If the instruction asks to expand, elaborate ONLY on what is already stated — never invent new findings or references.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Instruction: ${instruction}\n\nContent to improve:\n${content}` },
    ];

    const resp = await callNvidia(messages, true, 0.15) || await callOpenRouter(messages, true, 0.15) || await callLovableGateway(messages, true, 0.15);

    if (!resp || !resp.body) {
      return new Response(JSON.stringify({ error: "All AI providers failed. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
