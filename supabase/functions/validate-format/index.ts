import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Section = { id: string; label: string; content: string };

const journalRules: Record<string, {
  maxPages?: number;
  abstractWordRange?: [number, number];
  keywordsRange?: [number, number];
  requiredSections: string[];
  columns?: 1 | 2;
  citationStyle?: string;
}> = {
  ieee: { maxPages: 10, abstractWordRange: [150, 250], keywordsRange: [4, 8], requiredSections: ["title", "abstract", "keywords", "introduction", "methodology", "results", "conclusion", "references"], columns: 2, citationStyle: "numbered" },
  "ieee-conf": { maxPages: 8, abstractWordRange: [100, 200], keywordsRange: [4, 8], requiredSections: ["title", "abstract", "keywords", "introduction", "methodology", "results", "conclusion", "references"], columns: 2, citationStyle: "numbered" },
  springer: { maxPages: 20, abstractWordRange: [150, 300], keywordsRange: [4, 6], requiredSections: ["title", "abstract", "keywords", "introduction", "methodology", "results", "discussion", "conclusion", "references"], columns: 1 },
  elsevier: { maxPages: 25, abstractWordRange: [150, 300], keywordsRange: [4, 8], requiredSections: ["title", "abstract", "keywords", "introduction", "methodology", "results", "conclusion", "references"], columns: 1 },
  acm: { abstractWordRange: [150, 250], requiredSections: ["title", "abstract", "ccs-concepts", "keywords", "introduction", "methodology", "results", "conclusion", "references"], columns: 2 },
  nature: { abstractWordRange: [100, 200], requiredSections: ["title", "abstract", "introduction", "results", "discussion", "methods", "references"], columns: 1 },
  neurips: { maxPages: 9, abstractWordRange: [150, 250], requiredSections: ["title", "abstract", "introduction", "methodology", "experiments", "results", "conclusion", "references"], columns: 1 },
  cvpr: { maxPages: 8, abstractWordRange: [100, 200], requiredSections: ["title", "abstract", "introduction", "methodology", "experiments", "results", "conclusion", "references"], columns: 2 },
  apa7: { abstractWordRange: [150, 250], keywordsRange: [3, 5], requiredSections: ["title", "abstract", "keywords", "introduction", "methodology", "results", "discussion", "references"], columns: 1 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, journal } = await req.json() as { sections: Section[]; journal: string };
    const rules = journalRules[journal];
    const issues: { type: "error" | "warning" | "info"; message: string }[] = [];

    // Word count helper
    const wc = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0;
    const totalWords = sections.reduce((a, s) => a + wc(s.content), 0);

    // Estimate pages (~300 words/page single col, ~500 double col)
    const wordsPerPage = rules?.columns === 2 ? 500 : 300;
    const estimatedPages = Math.ceil(totalWords / wordsPerPage);

    // 1. Check required sections
    if (rules?.requiredSections) {
      for (const reqId of rules.requiredSections) {
        const sec = sections.find(s => s.id === reqId || s.id.includes(reqId));
        if (!sec || !sec.content.trim()) {
          issues.push({ type: "error", message: `Missing required section: ${reqId.replace(/-/g, " ")}` });
        }
      }
    } else {
      // Generic check
      const essentialIds = ["title", "abstract", "introduction", "conclusion", "references"];
      for (const id of essentialIds) {
        const sec = sections.find(s => s.id === id);
        if (!sec || !sec.content.trim()) {
          issues.push({ type: "error", message: `Missing essential section: ${id}` });
        }
      }
    }

    // 2. Abstract length
    const abstract = sections.find(s => s.id === "abstract");
    if (abstract?.content.trim()) {
      const absWords = wc(abstract.content);
      const range = rules?.abstractWordRange || [150, 300];
      if (absWords < range[0]) issues.push({ type: "warning", message: `Abstract too short (${absWords} words). Recommended: ${range[0]}-${range[1]} words.` });
      if (absWords > range[1]) issues.push({ type: "warning", message: `Abstract too long (${absWords} words). Recommended: ${range[0]}-${range[1]} words.` });
    }

    // 3. Keywords count
    const keywords = sections.find(s => s.id === "keywords");
    if (keywords?.content.trim()) {
      const kwCount = keywords.content.split(/[,;]/).filter(k => k.trim()).length;
      const range = rules?.keywordsRange || [3, 8];
      if (kwCount < range[0]) issues.push({ type: "warning", message: `Too few keywords (${kwCount}). Recommended: ${range[0]}-${range[1]}.` });
      if (kwCount > range[1]) issues.push({ type: "warning", message: `Too many keywords (${kwCount}). Recommended: ${range[0]}-${range[1]}.` });
    }

    // 4. Page limit
    if (rules?.maxPages && estimatedPages > rules.maxPages) {
      issues.push({ type: "warning", message: `Estimated ${estimatedPages} pages exceeds ${rules.maxPages}-page limit for ${journal.toUpperCase()}.` });
    }

    // 5. Title length
    const title = sections.find(s => s.id === "title");
    if (title?.content.trim()) {
      const titleWords = wc(title.content);
      if (titleWords < 5) issues.push({ type: "warning", message: "Title seems too short. Consider making it more descriptive." });
      if (titleWords > 25) issues.push({ type: "warning", message: "Title is quite long. Consider making it more concise." });
    }

    // 6. References check
    const refs = sections.find(s => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));
    if (refs?.content.trim()) {
      const refCount = refs.content.split("\n").filter(l => l.trim()).length;
      if (refCount < 5) issues.push({ type: "warning", message: `Only ${refCount} references. Most journals expect 15-30+ references.` });
    } else {
      issues.push({ type: "error", message: "No references provided." });
    }

    // 7. Short sections
    for (const sec of sections) {
      if (["title", "keywords", "ccs-concepts", "highlights"].includes(sec.id)) continue;
      if (sec.content.trim() && wc(sec.content) < 50 && !["keywords", "funding", "coi", "acknowledgements", "data-availability"].includes(sec.id)) {
        issues.push({ type: "info", message: `Section "${sec.label}" is very short (${wc(sec.content)} words). Consider expanding.` });
      }
    }

    // 8. Column format info
    if (rules?.columns) {
      issues.push({ type: "info", message: `${journal.toUpperCase()} uses ${rules.columns === 2 ? "double" : "single"}-column format.` });
    }

    // Summary
    const score = Math.max(0, 100 - issues.filter(i => i.type === "error").length * 15 - issues.filter(i => i.type === "warning").length * 5);

    return new Response(JSON.stringify({
      success: true,
      score,
      totalWords,
      estimatedPages,
      issues,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-format error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
