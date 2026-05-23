import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------- AI provider fallback ----------------
async function callAI(messages: any[], temperature: number): Promise<string | null> {
  const nvKey = Deno.env.get("NVIDIA_API_KEY");
  if (nvKey) {
    try {
      const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${nvKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages, temperature, max_tokens: 3000 }),
      });
      if (resp.ok) { const d = await resp.json(); return d.choices?.[0]?.message?.content || null; }
      console.error("NVIDIA error:", resp.status);
    } catch (e) { console.error("NVIDIA err:", e); }
  }
  const orKey = Deno.env.get("OPENROUTER_API_KEY");
  if (orKey) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages, temperature }),
      });
      if (resp.ok) { const d = await resp.json(); return d.choices?.[0]?.message?.content || null; }
      console.error("OpenRouter error:", resp.status);
    } catch (e) { console.error("OR err:", e); }
  }
  const lvKey = Deno.env.get("LOVABLE_API_KEY");
  if (lvKey) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lvKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, temperature }),
      });
      if (resp.ok) { const d = await resp.json(); return d.choices?.[0]?.message?.content || null; }
      console.error("Lovable error:", resp.status);
    } catch (e) { console.error("LV err:", e); }
  }
  return null;
}

// ---------------- Text utilities ----------------
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z])/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 8);
}

// Pick distinctive n-gram phrases (length 10-14 words) from sentences
function selectPhrases(text: string, max = 6): string[] {
  const sents = splitSentences(text);
  const out: string[] = [];
  for (const s of sents) {
    const words = s.split(/\s+/);
    if (words.length >= 10) {
      // take middle 10-12 words to avoid section headers
      const start = Math.floor(Math.max(0, (words.length - 12) / 2));
      const phrase = words.slice(start, start + 12).join(" ").replace(/[",;:()]/g, "");
      if (phrase.length > 50) out.push(phrase);
    }
    if (out.length >= max) break;
  }
  return out;
}

// ---------------- Source search ----------------
type Match = { phrase: string; url: string; title: string; source: string; snippet: string; overlap: number };

async function searchDuckDuckGo(phrase: string): Promise<Match[]> {
  try {
    const q = encodeURIComponent(`"${phrase}"`);
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PaperForge/1.0)" },
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const results: Match[] = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = re.exec(html)) !== null && count < 3) {
      const rawUrl = decodeURIComponent(m[1].replace(/^.*uddg=/, "").split("&")[0]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
      const overlap = computeOverlap(phrase, snippet);
      if (overlap >= 0.6 && rawUrl.startsWith("http")) {
        results.push({ phrase, url: rawUrl, title, source: "Web", snippet, overlap });
        count++;
      }
    }
    return results;
  } catch (e) {
    console.error("DDG err:", e);
    return [];
  }
}

async function searchCrossref(phrase: string): Promise<Match[]> {
  try {
    const resp = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(phrase)}&rows=3`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const items = data.message?.items || [];
    const out: Match[] = [];
    for (const it of items) {
      const abstract = (it.abstract || "").replace(/<[^>]+>/g, " ");
      const title = (it.title?.[0] || "").trim();
      const haystack = `${title} ${abstract}`;
      const overlap = computeOverlap(phrase, haystack);
      if (overlap >= 0.55) {
        out.push({
          phrase, url: it.URL || `https://doi.org/${it.DOI}`, title, source: "Crossref",
          snippet: abstract.slice(0, 240) || title, overlap,
        });
      }
    }
    return out;
  } catch (e) {
    console.error("Crossref err:", e);
    return [];
  }
}

// fraction of phrase words found contiguously or near-contiguously in haystack
function computeOverlap(phrase: string, haystack: string): number {
  const p = tokenize(phrase);
  const h = new Set(tokenize(haystack));
  if (p.length === 0) return 0;
  let hits = 0;
  for (const w of p) if (h.has(w)) hits++;
  const wordFrac = hits / p.length;
  // bonus if exact 6-word substring appears
  const hayLower = haystack.toLowerCase();
  const phraseLower = phrase.toLowerCase();
  const sixGram = phraseLower.split(/\s+/).slice(0, 6).join(" ");
  const exact = sixGram.length > 20 && hayLower.includes(sixGram) ? 0.25 : 0;
  return Math.min(1, wordFrac + exact);
}

// ---------------- Stylometric AI detection ----------------
function stylometricScore(text: string): number {
  const sents = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  if (sents.length < 3) return 30;
  const lens = sents.map(s => s.split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  const stdev = Math.sqrt(variance);
  const burstiness = stdev / (mean || 1); // human writing has higher burstiness
  // AI tends to have burstiness < 0.4 and very uniform length
  const tokens = tokenize(text);
  const uniq = new Set(tokens).size;
  const ttr = uniq / Math.max(1, tokens.length); // type-token ratio
  // AI signals
  let aiScore = 50;
  if (burstiness < 0.35) aiScore += 25;
  else if (burstiness < 0.5) aiScore += 10;
  else if (burstiness > 0.8) aiScore -= 20;
  if (ttr < 0.45) aiScore += 15;
  else if (ttr > 0.65) aiScore -= 15;
  // generic AI phrases
  const aiPhrases = [/\bin conclusion\b/gi, /\bit is important to note\b/gi, /\bfurthermore\b/gi, /\bmoreover\b/gi, /\boverall\b/gi, /\bin summary\b/gi, /\bdelve into\b/gi, /\bleverage\b/gi, /\butilize\b/gi, /\bmultifaceted\b/gi];
  let phraseHits = 0;
  for (const r of aiPhrases) phraseHits += (text.match(r) || []).length;
  aiScore += Math.min(20, phraseHits * 3);
  return Math.max(0, Math.min(100, Math.round(aiScore)));
}

// ---------------- Main ----------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, journal } = await req.json();
    const eligible = sections.filter((s: any) => s.content?.trim() && !["title", "keywords", "references", "works-cited", "bibliography", "reference-list"].includes(s.id));
    if (eligible.length === 0) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1) Real source matching per section
    const sectionResults: any[] = [];
    let totalMatchedWords = 0;
    let totalWords = 0;
    const allSources: Match[] = [];

    for (const sec of eligible) {
      const text = sec.content as string;
      const wordCount = tokenize(text).length;
      totalWords += wordCount;

      const phrases = selectPhrases(text, 5);
      const matches: Match[] = [];
      // parallelize searches per phrase
      const settled = await Promise.all(phrases.flatMap(p => [searchDuckDuckGo(p), searchCrossref(p)]));
      for (const arr of settled) for (const m of arr) matches.push(m);

      // dedupe by url, keep highest overlap
      const byUrl = new Map<string, Match>();
      for (const m of matches) {
        const ex = byUrl.get(m.url);
        if (!ex || ex.overlap < m.overlap) byUrl.set(m.url, m);
      }
      const uniqueMatches = Array.from(byUrl.values()).sort((a, b) => b.overlap - a.overlap).slice(0, 5);

      // estimate matched words: each strong match ~ phrase length words
      const matchedWords = uniqueMatches.reduce((acc, m) => acc + Math.round(tokenize(m.phrase).length * m.overlap), 0);
      totalMatchedWords += matchedWords;

      const originality = Math.max(0, Math.min(100, Math.round(100 - (matchedWords / Math.max(1, wordCount)) * 100)));
      const aiLikelihood = stylometricScore(text);

      const flags: string[] = [];
      if (uniqueMatches.length > 0) flags.push(`${uniqueMatches.length} potential source match${uniqueMatches.length > 1 ? "es" : ""} found`);
      if (aiLikelihood > 65) flags.push("High AI-writing signal (low burstiness)");
      if (originality < 70) flags.push("Significant phrase overlap with existing sources");

      const suggestions: string[] = [];
      if (uniqueMatches.length > 0) suggestions.push("Paraphrase the flagged passages and add proper citations to the matched sources.");
      if (aiLikelihood > 60) suggestions.push("Vary sentence length and structure; replace generic transitions with specific language.");

      sectionResults.push({
        name: sec.label || sec.id,
        originality,
        ai_likelihood: aiLikelihood,
        flags,
        suggestions,
        matches: uniqueMatches.map(m => ({ phrase: m.phrase, url: m.url, title: m.title, source: m.source, snippet: m.snippet.slice(0, 240), similarity: Math.round(m.overlap * 100) })),
      });
      allSources.push(...uniqueMatches);
    }

    const overallOriginality = Math.max(0, Math.min(100, Math.round(100 - (totalMatchedWords / Math.max(1, totalWords)) * 100)));
    const overallAi = Math.round(sectionResults.reduce((a, s) => a + s.ai_likelihood, 0) / sectionResults.length);

    // 2) Optional AI synthesis for recommendations (best-effort)
    let recommendations: string[] = [];
    let common_phrases: string[] = [];
    try {
      const summary = sectionResults.map(s => `- ${s.name}: ${s.matches.length} matches, originality ${s.originality}%, AI ${s.ai_likelihood}%`).join("\n");
      const ai = await callAI([
        { role: "system", content: "You are an academic integrity assistant. Return ONLY raw JSON: {\"recommendations\":[\"...\"],\"common_phrases\":[\"...\"]}. Max 5 items each, concrete and actionable." },
        { role: "user", content: `Journal: ${journal || "IEEE"}. Section findings:\n${summary}\n\nProvide recommendations to improve originality and reduce AI-detection risk.` },
      ], 0.2);
      if (ai) {
        const j = ai.match(/\{[\s\S]*\}/);
        if (j) {
          const parsed = JSON.parse(j[0]);
          recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [];
          common_phrases = Array.isArray(parsed.common_phrases) ? parsed.common_phrases.slice(0, 5) : [];
        }
      }
    } catch (e) { console.error("AI synth err:", e); }

    if (recommendations.length === 0) {
      recommendations = [
        overallOriginality < 80 ? "Paraphrase flagged passages and cite the matched sources." : "Originality looks good — keep citing primary sources.",
        overallAi > 50 ? "Humanize text: vary sentence length, use active voice, add personal voice." : "AI-writing signal is acceptable.",
        "Run a final pass through the Humanize tool on any section over 60% AI likelihood.",
      ];
    }

    const overall_risk = overallOriginality < 60 || overallAi > 70 ? "high" : overallOriginality < 80 || overallAi > 50 ? "medium" : "low";

    return new Response(JSON.stringify({
      success: true,
      originality_score: overallOriginality,
      ai_detection_score: overallAi,
      overall_risk,
      total_sources_matched: allSources.length,
      sections: sectionResults,
      common_phrases,
      recommendations,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("check-plagiarism error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
