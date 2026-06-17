import { useState, useEffect, useCallback } from "react";

// ── Types ──

export type ReportSection = {
  id: string;
  label: string;
  content: string;
};

export type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sections: ReportSection[];
};

export type Report = {
  id: string;
  title: string;
  template_id: string;
  template_name: string;
  sections: ReportSection[];
  status: "draft" | "in-progress" | "complete";
  created_at: string;
  updated_at: string;
};

// ── Report Templates ──

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "lab-report",
    name: "Lab Report",
    description: "Standard laboratory experiment report with observations, calculations, and results",
    icon: "🔬",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-300/40",
    sections: [
      { id: "title", label: "Title", content: "" },
      { id: "objective", label: "Objective", content: "" },
      { id: "theory", label: "Theory / Background", content: "" },
      { id: "apparatus", label: "Apparatus & Materials", content: "" },
      { id: "procedure", label: "Procedure", content: "" },
      { id: "observations", label: "Observations", content: "" },
      { id: "calculations", label: "Calculations", content: "" },
      { id: "results", label: "Results", content: "" },
      { id: "discussion", label: "Discussion", content: "" },
      { id: "conclusion", label: "Conclusion", content: "" },
      { id: "references", label: "References", content: "" },
    ],
  },
  {
    id: "project-report",
    name: "Project Report",
    description: "Comprehensive project documentation with design, implementation, and testing",
    icon: "📋",
    color: "from-blue-500/20 to-indigo-500/20 border-blue-300/40",
    sections: [
      { id: "title", label: "Cover Page", content: "" },
      { id: "abstract", label: "Abstract", content: "" },
      { id: "acknowledgements", label: "Acknowledgements", content: "" },
      { id: "toc", label: "Table of Contents", content: "" },
      { id: "introduction", label: "Introduction", content: "" },
      { id: "literature-survey", label: "Literature Survey", content: "" },
      { id: "system-design", label: "System Design", content: "" },
      { id: "implementation", label: "Implementation", content: "" },
      { id: "testing", label: "Testing & Validation", content: "" },
      { id: "results", label: "Results & Screenshots", content: "" },
      { id: "conclusion", label: "Conclusion & Future Scope", content: "" },
      { id: "references", label: "References", content: "" },
      { id: "appendix", label: "Appendix", content: "" },
    ],
  },
  {
    id: "technical-report",
    name: "Technical Report",
    description: "Formal technical documentation with analysis, findings, and recommendations",
    icon: "⚙️",
    color: "from-slate-500/20 to-gray-500/20 border-slate-300/40",
    sections: [
      { id: "title", label: "Title Page", content: "" },
      { id: "executive-summary", label: "Executive Summary", content: "" },
      { id: "introduction", label: "Introduction", content: "" },
      { id: "background", label: "Background", content: "" },
      { id: "methodology", label: "Methodology", content: "" },
      { id: "findings", label: "Findings", content: "" },
      { id: "analysis", label: "Analysis", content: "" },
      { id: "recommendations", label: "Recommendations", content: "" },
      { id: "conclusion", label: "Conclusion", content: "" },
      { id: "references", label: "References", content: "" },
      { id: "appendix", label: "Appendix", content: "" },
    ],
  },
  {
    id: "internship-report",
    name: "Internship Report",
    description: "Document your internship experience, company profile, and learnings",
    icon: "💼",
    color: "from-amber-500/20 to-orange-500/20 border-amber-300/40",
    sections: [
      { id: "title", label: "Cover Page", content: "" },
      { id: "certificate", label: "Certificate", content: "" },
      { id: "acknowledgement", label: "Acknowledgement", content: "" },
      { id: "introduction", label: "Introduction", content: "" },
      { id: "company-profile", label: "Company / Organization Profile", content: "" },
      { id: "work-done", label: "Work Done / Tasks Performed", content: "" },
      { id: "technologies", label: "Technologies & Tools Used", content: "" },
      { id: "learning-outcomes", label: "Learning Outcomes", content: "" },
      { id: "challenges", label: "Challenges & Solutions", content: "" },
      { id: "conclusion", label: "Conclusion", content: "" },
    ],
  },
  {
    id: "seminar-report",
    name: "Seminar Report",
    description: "Structured seminar presentation report with topic analysis and discussion",
    icon: "🎓",
    color: "from-violet-500/20 to-purple-500/20 border-violet-300/40",
    sections: [
      { id: "title", label: "Title Page", content: "" },
      { id: "abstract", label: "Abstract", content: "" },
      { id: "introduction", label: "Introduction", content: "" },
      { id: "literature-review", label: "Literature Review", content: "" },
      { id: "topic-discussion", label: "Topic Discussion", content: "" },
      { id: "applications", label: "Applications", content: "" },
      { id: "advantages-limitations", label: "Advantages & Limitations", content: "" },
      { id: "conclusion", label: "Conclusion", content: "" },
      { id: "references", label: "References", content: "" },
    ],
  },
  {
    id: "business-report",
    name: "Business Report",
    description: "Professional business report with executive summary, analysis, and recommendations",
    icon: "📊",
    color: "from-rose-500/20 to-pink-500/20 border-rose-300/40",
    sections: [
      { id: "title", label: "Title Page", content: "" },
      { id: "executive-summary", label: "Executive Summary", content: "" },
      { id: "introduction", label: "Introduction", content: "" },
      { id: "analysis", label: "Analysis", content: "" },
      { id: "findings", label: "Findings", content: "" },
      { id: "recommendations", label: "Recommendations", content: "" },
      { id: "conclusion", label: "Conclusion", content: "" },
      { id: "appendices", label: "Appendices", content: "" },
    ],
  },
];

// ── LocalStorage helpers ──

const STORAGE_KEY = "pf_reports";

function getStoredReports(): Report[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: Report[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// ── Hooks ──

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setReports(getStoredReports());
    setIsLoading(false);
  }, []);

  return { data: reports, isLoading };
}

export function useReport(id: string | undefined) {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || id === "new") {
      setReport(null);
      setIsLoading(false);
      return;
    }
    const found = getStoredReports().find((r) => r.id === id) || null;
    setReport(found);
    setIsLoading(false);
  }, [id]);

  return { data: report, isLoading };
}

export function useCreateReport() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (params: { title: string; template_id: string }): Promise<Report> => {
      setIsPending(true);
      const template = REPORT_TEMPLATES.find((t) => t.id === params.template_id);
      if (!template) throw new Error("Template not found");

      const sections = template.sections.map((s) =>
        s.id === "title" ? { ...s, content: params.title } : { ...s }
      );

      const newReport: Report = {
        id: Math.random().toString(36).substring(2, 15),
        title: params.title,
        template_id: params.template_id,
        template_name: template.name,
        sections,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const reports = getStoredReports();
      reports.unshift(newReport);
      saveReports(reports);
      setIsPending(false);
      return newReport;
    },
    []
  );

  return { mutateAsync, isPending };
}

export function useUpdateReport() {
  const mutateAsync = useCallback(
    async (params: { id: string; updates: Partial<Pick<Report, "title" | "sections" | "status">> }) => {
      const reports = getStoredReports();
      const idx = reports.findIndex((r) => r.id === params.id);
      if (idx === -1) throw new Error("Report not found");

      const updated: Report = {
        ...reports[idx],
        ...params.updates,
        updated_at: new Date().toISOString(),
      };
      if (params.updates.sections) {
        const titleSec = params.updates.sections.find((s) => s.id === "title");
        if (titleSec?.content) updated.title = titleSec.content;
      }
      reports[idx] = updated;
      saveReports(reports);
      return updated;
    },
    []
  );

  return { mutateAsync };
}

export function useDeleteReport() {
  const mutate = useCallback((id: string, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    try {
      const reports = getStoredReports().filter((r) => r.id !== id);
      saveReports(reports);
      opts?.onSuccess?.();
    } catch {
      opts?.onError?.();
    }
  }, []);

  return { mutate };
}
