import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { content, journal } = await req.json();

    const systemPrompt = `You are an expert academic writing humanizer. Rewrite the given text so it reads like a real human researcher wrote it.

CRITICAL RULES:
1. Do NOT change the meaning, facts, data, or claims in any way.
2. Do NOT add new information, statistics, references, or findings.
3. Do NOT remove any factual content — only rephrase how it is expressed.
4. Preserve ALL numbers, percentages, citations, and technical terms exactly.

Humanization techniques to apply:
- Vary sentence length naturally (mix short and long)
- Use natural transitions, not formulaic ones
- Add subtle hedging ("appears to", "suggests that", "it is worth noting")
- Avoid repetitive sentence structures
- Use active voice more often where appropriate
- Add occasional first-person plural ("we observed", "our findings suggest")
- Remove overly perfect parallel structures
- Keep domain-specific terminology but vary introductions
- Make flow feel organic, not mechanical
- Target journal: ${journal || "IEEE"}
- Return ONLY the rewritten text, no explanations or markdown`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Humanize this academic text while preserving its EXACT meaning, data, and all factual claims:\n\n${content}` },
    ];

    const resp = await callNvidia(messages, true, 0.3) || await callOpenRouter(messages, true, 0.3) || await callLovableGateway(messages, true, 0.3);

    if (!resp || !resp.body) {
      return new Response(JSON.stringify({ error: "All AI providers failed. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("humanize-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
