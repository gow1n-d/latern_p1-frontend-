import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, journal } = await req.json();

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse&key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nHumanize this academic text while preserving its EXACT meaning, data, and all factual claims:\n\n${content}` }] },
          ],
          generationConfig: { temperature: 0.3 },
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
      return new Response(JSON.stringify({ error: "Humanization failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const openAIChunk = { choices: [{ delta: { content: text } }] };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
              }
            } catch { /* skip partial */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("humanize-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
