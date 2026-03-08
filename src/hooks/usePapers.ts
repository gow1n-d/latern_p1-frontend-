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
      const sections = DEFAULT_SECTIONS.map((s) =>
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
    mutationFn: async (params: { id: string; updates: Partial<Pick<Paper, "title" | "journal" | "status" | "domain" | "methodology_summary" | "results_summary" | "sections">>) => {
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
