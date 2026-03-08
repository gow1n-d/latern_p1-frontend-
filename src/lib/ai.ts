const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type StreamOptions = {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
};

async function parseSSEStream(resp: Response, opts: StreamOptions) {
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) { opts.onError("Rate limit exceeded. Please wait a moment and try again."); return; }
    if (resp.status === 402) { opts.onError("AI credits exhausted. Add funds in workspace settings."); return; }
    const text = await resp.text();
    try { const j = JSON.parse(text); opts.onError(j.error || "AI generation failed"); } catch { opts.onError("AI generation failed"); }
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { opts.onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) opts.onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  opts.onDone();
}

export async function generateSection(
  params: {
    section: string;
    title: string;
    domain: string;
    methodology: string;
    results_summary: string;
    journal: string;
    existing_content?: string;
  },
  opts: StreamOptions
) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-section`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  await parseSSEStream(resp, opts);
}

export async function aiAssist(
  params: { instruction: string; content: string; journal: string },
  opts: StreamOptions
) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-assist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  await parseSSEStream(resp, opts);
}
