import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";

export type PaperSection = {
  id: string;
  label: string;
  content: string;
};

export type Paper = {
  id: string;
  user_id: string;
  title: string;
  journal: string;
  status: string;
  domain: string | null;
  methodology_summary: string | null;
  results_summary: string | null;
  sections: PaperSection[];
  created_at: string;
  updated_at: string;
};

const DEFAULT_SECTIONS: PaperSection[] = [
  { id: "title", label: "Title", content: "" },
  { id: "abstract", label: "Abstract", content: "" },
  { id: "keywords", label: "Keywords", content: "" },
  { id: "introduction", label: "Introduction", content: "" },
  { id: "literature", label: "Literature Review", content: "" },
  { id: "methodology", label: "Methodology", content: "" },
  { id: "results", label: "Results", content: "" },
  { id: "discussion", label: "Discussion", content: "" },
  { id: "conclusion", label: "Conclusion", content: "" },
  { id: "references", label: "References", content: "" },
];

// Format-specific section templates
const FORMAT_SECTIONS: Record<string, PaperSection[]> = {
  // === JOURNALS ===
  ieee: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Index Terms", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results and Analysis", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  springer: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  elsevier: [
    { id: "title", label: "Title", content: "" },
    { id: "highlights", label: "Highlights", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "coi", label: "Declaration of Competing Interest", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  acm: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "System Design / Methodology", content: "" },
    { id: "evaluation", label: "Evaluation", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  nature: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "methods", label: "Methods", content: "" },
    { id: "data-availability", label: "Data Availability", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  science: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "materials-methods", label: "Materials and Methods", content: "" },
    { id: "supplementary", label: "Supplementary Materials", content: "" },
    { id: "references", label: "References and Notes", content: "" },
  ],
  mdpi: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "funding", label: "Funding", content: "" },
    { id: "coi", label: "Conflicts of Interest", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  plos: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "supporting-info", label: "Supporting Information", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],

  // === CONFERENCES ===
  "ieee-conf": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Index Terms", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Approach", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion and Future Work", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "acm-conf": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Approach", content: "" },
    { id: "evaluation", label: "Evaluation", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  neurips: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background / Preliminaries", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "theoretical", label: "Theoretical Analysis", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "broader-impact", label: "Broader Impact", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  icml: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Preliminaries", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "theoretical", label: "Theoretical Analysis", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  cvpr: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Approach", content: "" },
    { id: "implementation", label: "Implementation Details", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "ablation", label: "Ablation Study", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  aaai: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "ethics", label: "Ethical Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  iclr: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results and Analysis", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "reproducibility", label: "Reproducibility Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  acl: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "analysis", label: "Analysis", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "limitations", label: "Limitations", content: "" },
    { id: "ethics", label: "Ethics Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],

  // === CITATION STANDARDS ===
  apa7: [
    { id: "title", label: "Title Page", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  chicago: [
    { id: "title", label: "Title Page", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "body", label: "Body", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "bibliography", label: "Bibliography", content: "" },
  ],
  mla: [
    { id: "title", label: "Title", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "body", label: "Body", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "works-cited", label: "Works Cited", content: "" },
  ],
  harvard: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "results", label: "Results / Findings", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "reference-list", label: "Reference List", content: "" },
  ],
};

export function getSectionsForFormat(formatId: string): PaperSection[] {
  return (FORMAT_SECTIONS[formatId] || DEFAULT_SECTIONS).map(s => ({ ...s }));
}

function parseSections(raw: Json): PaperSection[] {
  if (Array.isArray(raw) && raw.length > 0) return raw as unknown as PaperSection[];
  return DEFAULT_SECTIONS;
}

export function usePapers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["papers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p) => ({ ...p, sections: parseSections(p.sections) })) as Paper[];
    },
    enabled: !!user,
  });
}

export function usePaper(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paper", id],
    queryFn: async () => {
      if (!id || id === "new") return null;
      const { data, error } = await supabase.from("papers").select("*").eq("id", id).single();
      if (error) throw error;
      return { ...data, sections: parseSections(data.sections) } as Paper;
    },
    enabled: !!user && !!id && id !== "new",
  });
}

export function useCreatePaper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { title: string; journal: string; domain?: string; methodology_summary?: string; results_summary?: string }) => {
      const formatSections = getSectionsForFormat(params.journal || "");
      const sections = formatSections.map((s) =>
        s.id === "title" ? { ...s, content: params.title } : s
      );
      const { data, error } = await supabase
        .from("papers")
        .insert({
          user_id: user!.id,
          title: params.title,
          journal: params.journal,
          domain: params.domain || "",
          methodology_summary: params.methodology_summary || "",
          results_summary: params.results_summary || "",
          sections: sections as unknown as Json,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, sections: parseSections(data.sections) } as Paper;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["papers"] }),
  });
}

export function useUpdatePaper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Pick<Paper, "title" | "journal" | "status" | "domain" | "methodology_summary" | "results_summary" | "sections">> }) => {
      const updateData: Record<string, unknown> = { ...params.updates };
      if (params.updates.sections) {
        updateData.sections = params.updates.sections as unknown as Json;
      }
      // Keep title in sync with title section
      if (params.updates.sections) {
        const titleSection = params.updates.sections.find((s) => s.id === "title");
        if (titleSection?.content) updateData.title = titleSection.content;
      }
      const { error } = await supabase.from("papers").update(updateData).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["paper", vars.id] });
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
  });
}

export function useDeletePaper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("papers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["papers"] }),
  });
}

export { DEFAULT_SECTIONS };
