import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronLeft, Save, Download, Sparkles, Check,
  X, Loader2, CheckCircle2, Copy, Eye, Edit3,
  Menu, Plus, Trash2, User, Wand2, Upload, FileUp,
  BookOpen, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  useReport, useCreateReport, useUpdateReport,
  REPORT_TEMPLATES, type ReportSection
} from "@/hooks/useReports";
import { ThemeToggle } from "@/components/ThemeToggle";
import { exportReportToPDF, exportReportToWord } from "@/lib/exportReport";
import MermaidBlock from "@/components/MermaidBlock";

// ── AI generation for report sections ──
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || "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";
const NVIDIA_BASE_URL = "/api/nvidia/v1";
const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

function stripMarkdownReport(text: string): string {
  // Allow markdown tables and mermaid code blocks.
  return text;
}

async function generateReportSection(
  params: { section: string; title: string; templateName: string; existingContent?: string; reportMeta?: ReportMeta },
  opts: { onDelta: (t: string) => void; onDone: () => void; onError: (e: string) => void }
) {
  try {
    const systemPrompt = `You are an expert report writer. Write professional, clear, and well-structured content for reports.
Write in a formal but accessible tone. Use proper paragraph structure, clear headings where appropriate, and professional language.
CRITICAL INSTRUCTIONS FOR UPLOADED FILES:
If the user has uploaded files containing data, statistics, or terms relevant to the section, you MUST proactively integrate this data into your response.
- Use Markdown tables (with | column | formatting) to present tabular data found in the files.
- If the files describe a process, architecture, flow, or relationships, you MUST proactively generate a mermaid.js diagram by outputting a \`\`\`mermaid code block.
Do NOT output plain text if a diagram or table would better represent the data.`;

    let metaContext = "";
    if (params.reportMeta) {
      const m = params.reportMeta;
      if (m.subject) metaContext += `\nSubject/Domain: ${m.subject}`;
      if (m.description) metaContext += `\nDescription: ${m.description}`;
      if (m.keyData) metaContext += `\nKey Data/Findings: ${m.keyData}`;
      if (m.institution) metaContext += `\nInstitution: ${m.institution}`;
      if (m.authorName) metaContext += `\nAuthor: ${m.authorName}`;
      if (m.uploadedFileNames.length > 0) metaContext += `\nReference files uploaded: ${m.uploadedFileNames.join(", ")}`;
      if (m.uploadedFileContents.length > 0) {
        metaContext += `\n\nUploaded file contents (use for context):\n`;
        m.uploadedFileContents.forEach((f, i) => {
          metaContext += `--- ${m.uploadedFileNames[i] || `File ${i + 1}`} ---\n${f.slice(0, 2000)}\n`;
        });
      }
    }

    const ctx = params.existingContent ? `\nContext from other sections:\n${params.existingContent.slice(0, 600)}` : "";
    const prompt = `Write the "${params.section}" section for a ${params.templateName} titled: "${params.title}".${metaContext}${ctx}
Write detailed, professional report content. No meta-commentary or filler. Output only the section content.`;

    const resp = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) { opts.onError("Rate limit. Wait and retry."); return; }
      opts.onError("Generation failed");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data: ")) continue;
        const json = t.slice(6).trim();
        if (json === "[DONE]") { opts.onDone(); return; }
        try {
          const c = JSON.parse(json).choices?.[0]?.delta?.content;
          if (c) opts.onDelta(c);
        } catch {}
      }
    }
    opts.onDone();
  } catch (err) {
    opts.onError(err instanceof Error ? err.message : "Stream failed");
  }
}

type ReportMeta = {
  subject: string;
  description: string;
  keyData: string;
  institution: string;
  authorName: string;
  uploadedFileNames: string[];
  uploadedFileContents: string[];
};

const defaultMeta: ReportMeta = {
  subject: "", description: "", keyData: "", institution: "", authorName: "",
  uploadedFileNames: [], uploadedFileContents: [],
};

const NON_GENERATABLE_REPORT = ["title", "toc", "certificate"];

// Exports moved to lib/exportReport.ts

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";
  const { user } = useAuth();

  const { data: existingReport, isLoading: loadingReport } = useReport(id);
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();

  const [showTemplatePicker, setShowTemplatePicker] = useState(isNew);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportMeta, setReportMeta] = useState<ReportMeta>(defaultMeta);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [activeSection, setActiveSection] = useState("title");
  const [reportId, setReportId] = useState<string | null>(isNew ? null : id || null);
  const [templateName, setTemplateName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [completingSection, setCompletingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "paper">("edit");
  const [wordCount, setWordCount] = useState(0);
  const [showMobileSections, setShowMobileSections] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing report
  useEffect(() => {
    if (existingReport) {
      setSections(existingReport.sections);
      setSelectedTemplate(existingReport.template_id);
      setTemplateName(existingReport.template_name);
      setReportId(existingReport.id);
      setReportTitle(existingReport.title);
      setShowTemplatePicker(false);
    }
  }, [existingReport]);

  // Word count
  useEffect(() => {
    const total = sections.reduce((acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0);
    setWordCount(total);
  }, [sections]);

  // Auto-save
  const autoSave = useCallback((updatedSections: ReportSection[]) => {
    if (!reportId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const filledCount = updatedSections.filter((s) => s.content.trim()).length;
      let status: "draft" | "in-progress" | "complete" = "draft";
      if (filledCount >= updatedSections.length) status = "complete";
      else if (filledCount >= 3) status = "in-progress";

      try {
        await updateReport.mutateAsync({
          id: reportId,
          updates: { sections: updatedSections, status },
        });
        setLastSaved(new Date());
      } catch {}
      setIsSaving(false);
    }, 2000);
  }, [reportId, updateReport]);

  const currentSection = sections.find((s) => s.id === activeSection);
  const filledSections = sections.filter((s) => s.content.trim()).length;

  const updateContent = useCallback((content: string) => {
    setSections((prev) => {
      const updated = prev.map((s) => (s.id === activeSection ? { ...s, content } : s));
      autoSave(updated);
      return updated;
    });
  }, [activeSection, autoSave]);

  const handleAddSection = useCallback(() => {
    const newId = `custom-section-${Date.now()}`;
    const newSection: ReportSection = { id: newId, label: "New Section", content: "" };
    setSections((prev) => {
      const updated = [...prev, newSection];
      autoSave(updated);
      return updated;
    });
    setActiveSection(newId);
    toast.success("New section added");
  }, [autoSave]);

  const handleRemoveSection = useCallback((idToRemove: string) => {
    if (!idToRemove.startsWith("custom-section-")) return;
    setSections((prev) => {
      const updated = prev.filter((s) => s.id !== idToRemove);
      autoSave(updated);
      return updated;
    });
    if (activeSection === idToRemove) setActiveSection(sections[0]?.id || "title");
    toast.success("Section removed");
  }, [activeSection, sections, autoSave]);

  const handleRenameSection = useCallback((idToRename: string, newLabel: string) => {
    setSections((prev) => {
      const updated = prev.map((s) => (s.id === idToRename ? { ...s, label: newLabel } : s));
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setReportMeta(prev => ({
          ...prev,
          uploadedFileNames: [...prev.uploadedFileNames, file.name],
          uploadedFileContents: [...prev.uploadedFileContents, content || ""],
        }));
      };
      if (file.type.startsWith("text/") || file.name.endsWith(".csv") || file.name.endsWith(".json") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        reader.readAsText(file);
      } else {
        setReportMeta(prev => ({
          ...prev,
          uploadedFileNames: [...prev.uploadedFileNames, file.name],
          uploadedFileContents: [...prev.uploadedFileContents, `[Binary file: ${file.name}, ${(file.size / 1024).toFixed(1)} KB]`],
        }));
      }
    });
    toast.success(`${files.length} file(s) attached`);
  };

  const removeUploadedFile = (index: number) => {
    setReportMeta(prev => ({
      ...prev,
      uploadedFileNames: prev.uploadedFileNames.filter((_, i) => i !== index),
      uploadedFileContents: prev.uploadedFileContents.filter((_, i) => i !== index),
    }));
  };

  // Template selection → show meta form
  const handleTemplateNext = () => {
    if (!reportTitle.trim()) { toast.error("Please enter a report title"); return; }
    if (!selectedTemplate) { toast.error("Please select a template"); return; }
    setShowTemplatePicker(false);
    setShowMetaForm(true);
  };

  const handleCreateReport = async () => {
    try {
      const newReport = await createReport.mutateAsync({ title: reportTitle, template_id: selectedTemplate });
      setReportId(newReport.id);
      setSections(newReport.sections);
      setTemplateName(newReport.template_name);
      setShowMetaForm(false);
      navigate(`/report/${newReport.id}`, { replace: true });
      toast.success("Report created!");
    } catch {
      toast.error("Failed to create report");
    }
  };

  const handleManualSave = async () => {
    if (!reportId) return;
    setIsSaving(true);
    try {
      const filledCount = sections.filter((s) => s.content.trim()).length;
      let status: "draft" | "in-progress" | "complete" = "draft";
      if (filledCount >= sections.length) status = "complete";
      else if (filledCount >= 3) status = "in-progress";
      await updateReport.mutateAsync({ id: reportId, updates: { sections, status } });
      setLastSaved(new Date());
      toast.success("Report saved!");
    } catch {
      toast.error("Failed to save");
    }
    setIsSaving(false);
  };

  const handleGenerateSection = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a report title first"); return; }

    setIsGenerating(true);
    let accumulated = "";
    setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: "" } : s)));

    await generateReportSection(
      {
        section: currentSection?.label || activeSection,
        title: titleContent,
        templateName,
        reportMeta,
        existingContent: sections
          .filter((s) => s.content.trim() && s.id !== activeSection)
          .map((s) => `${s.label}: ${s.content.slice(0, 500)}`)
          .join("\n"),
      },
      {
        onDelta: (text) => {
          accumulated += text;
          const current = stripMarkdownReport(accumulated);
          setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: current } : s)));
        },
        onDone: () => {
          setIsGenerating(false);
          toast.success(`${currentSection?.label} generated!`);
          setSections((prev) => { autoSave(prev); return prev; });
        },
        onError: (err) => {
          setIsGenerating(false);
          toast.error(err);
        },
      }
    );
  }, [activeSection, sections, currentSection, templateName, reportMeta, autoSave]);

  const handleCompleteEntireReport = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a report title first"); return; }

    setIsCompletingAll(true);
    const generatable = sections.filter((s) => !NON_GENERATABLE_REPORT.includes(s.id) && !s.content.trim());

    if (generatable.length === 0) {
      toast.info("All sections already have content!");
      setIsCompletingAll(false);
      return;
    }

    toast.info(`Generating ${generatable.length} empty sections...`);
    let latestSections = [...sections];

    for (const sec of generatable) {
      setCompletingSection(sec.id);
      setActiveSection(sec.id);
      let accumulated = "";

      await new Promise<void>((resolve) => {
        generateReportSection(
          {
            section: sec.label,
            title: titleContent,
            templateName,
            reportMeta,
            existingContent: latestSections
              .filter((s) => s.content.trim() && s.id !== sec.id)
              .map((s) => `${s.label}: ${s.content.slice(0, 500)}`)
              .join("\n"),
          },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = stripMarkdownReport(accumulated);
              setSections((prev) => prev.map((s) => (s.id === sec.id ? { ...s, content: current } : s)));
            },
            onDone: () => {
              toast.success(`${sec.label} generated!`);
              latestSections = latestSections.map((s) => (s.id === sec.id ? { ...s, content: accumulated } : s));
              setSections(latestSections);
              resolve();
            },
            onError: (err) => {
              toast.error(`Failed: ${sec.label} — ${err}`);
              resolve();
            },
          }
        );
      });
    }

    setCompletingSection(null);
    setIsCompletingAll(false);
    toast.success("Report completed! 🎉");
    setSections((prev) => { autoSave(prev); return prev; });
  }, [sections, templateName, reportMeta, autoSave]);

  // Export handlers
  const handleExportPDF = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const blob = await exportReportToPDF(sections, templateName);
      const safeName = (sections.find(s => s.id === "title")?.content || "Report").replace(/[^a-z0-9]/gi, "_").slice(0, 50);
      downloadBlob(blob, `${safeName}_Report.pdf`);
      toast.success("Report exported as PDF!");
    } catch (e: any) {
      toast.error("PDF export failed");
    }
    setIsExporting(false);
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const blob = await exportReportToWord(sections, templateName);
      const safeName = (sections.find(s => s.id === "title")?.content || "Report").replace(/[^a-z0-9]/gi, "_").slice(0, 50);
      downloadBlob(blob, `${safeName}_Report.docx`);
      toast.success("Report exported as Word document!");
    } catch (e: any) {
      toast.error("Word export failed");
    }
    setIsExporting(false);
  };

  const handleExportText = () => {
    setShowExportMenu(false);
    const titleContent = sections.find((s) => s.id === "title")?.content || "Report";
    const text = sections.map((s) => `${s.label.toUpperCase()}\n${"=".repeat(s.label.length)}\n\n${s.content || "(empty)"}\n`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const safeName = titleContent.replace(/[^a-z0-9]/gi, "_").slice(0, 50);
    downloadBlob(blob, `${safeName}_Report.txt`);
    toast.success("Report exported as text!");
  };

  const copySection = () => {
    if (currentSection?.content) {
      navigator.clipboard.writeText(currentSection.content);
      toast.success("Section copied to clipboard");
    }
  };

  const isBusy = isGenerating || isCompletingAll;
  const canGenerate = !NON_GENERATABLE_REPORT.includes(activeSection);

  // ── Loading state ──
  if (!isNew && loadingReport) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ── Template Picker ──
  if (showTemplatePicker) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <FileText className="h-6 w-6 text-accent" />
              <span className="font-display text-xl font-bold text-foreground">ReportForge</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Create a New Report
            </h1>
            <p className="text-muted-foreground mb-8">
              Choose a template that fits your needs. You can customize sections after creation.
            </p>

            {/* Report title input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-2">Report Title</label>
              <input
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your report title..."
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {REPORT_TEMPLATES.map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`group relative text-left rounded-2xl border-2 p-5 transition-all bg-gradient-to-br ${template.color} ${
                    selectedTemplate === template.id
                      ? "border-accent ring-2 ring-accent/30 shadow-lg scale-[1.02]"
                      : "border-border hover:border-accent/40 hover:shadow-md"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 rounded-full bg-accent p-1">
                      <Check className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                  <span className="text-3xl mb-3 block">{template.icon}</span>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.sections.slice(0, 5).map((s) => (
                      <span key={s.id} className="inline-block rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {s.label}
                      </span>
                    ))}
                    {template.sections.length > 5 && (
                      <span className="inline-block rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{template.sections.length - 5} more
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Next button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
              <Button
                variant="hero"
                onClick={handleTemplateNext}
                disabled={!reportTitle.trim() || !selectedTemplate}
                className="gap-2 px-8"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Meta Input Form (after template selection) ──
  if (showMetaForm) {
    const inputClass = "w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
    const selectedTemplateName = REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.name || "";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="max-w-2xl w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Report Details</h1>
          </div>
          <p className="text-muted-foreground mb-8 ml-[52px]">
            Provide context so AI can generate better content for your <strong>{selectedTemplateName}</strong>.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Report Title *</label>
              <input className={inputClass}
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Analysis of Heat Transfer in Micro-Channels"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Subject / Domain</label>
                <input className={inputClass}
                  placeholder="e.g., Mechanical Engineering, Computer Science"
                  value={reportMeta.subject}
                  onChange={(e) => setReportMeta(p => ({ ...p, subject: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Institution / Organization</label>
                <input className={inputClass}
                  placeholder="e.g., IIT Patna, MIT"
                  value={reportMeta.institution}
                  onChange={(e) => setReportMeta(p => ({ ...p, institution: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Author Name</label>
              <input className={inputClass}
                placeholder="e.g., John Doe"
                value={reportMeta.authorName}
                onChange={(e) => setReportMeta(p => ({ ...p, authorName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description / Scope</label>
              <textarea className={`${inputClass} resize-none h-20`}
                placeholder="Briefly describe what this report covers, its goals, or scope"
                value={reportMeta.description}
                onChange={(e) => setReportMeta(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Key Data / Findings</label>
              <textarea className={`${inputClass} resize-none h-20`}
                placeholder="Paste any key data, measurements, observations, or findings that should be included"
                value={reportMeta.keyData}
                onChange={(e) => setReportMeta(p => ({ ...p, keyData: e.target.value }))} />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-t border-border pt-6 mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-accent" /> Upload Reference Files
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Upload data files, notes, or references that AI should use for context (.txt, .csv, .json, .md, etc.)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.csv,.json,.md,.log,.py,.js,.ts,.html,.xml,.yaml,.yml,.tsv,.dat"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" size="sm" className="gap-2 mb-3" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Choose Files
            </Button>

            {reportMeta.uploadedFileNames.length > 0 && (
              <div className="space-y-2">
                {reportMeta.uploadedFileNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <span className="flex-1 truncate text-foreground">{name}</span>
                    <button onClick={() => removeUploadedFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowMetaForm(false); setShowTemplatePicker(true); }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button variant="ghost" onClick={() => { setShowMetaForm(false); handleCreateReport(); }}>Skip</Button>
            <Button variant="hero" onClick={() => { setShowMetaForm(false); handleCreateReport(); }} className="flex-1" disabled={createReport.isPending}>
              {createReport.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Start Writing <Sparkles className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Paper View (full document preview) ──
  const renderPaperView = () => {
    const titleContent = sections.find(s => s.id === "title")?.content || "Untitled Report";
    return (
      <div className="flex-1 overflow-y-auto bg-muted/40">
        <div className="max-w-[210mm] mx-auto my-8 bg-white dark:bg-card shadow-xl rounded-lg overflow-hidden" style={{ minHeight: "297mm" }}>
          {/* Title page */}
          <div className="flex flex-col items-center justify-center px-12 pt-32 pb-16 border-b border-border">
            <span className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase mb-4">{templateName}</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center max-w-xl mb-6 leading-tight">
              {titleContent}
            </h1>
            {reportMeta.authorName && (
              <p className="text-base text-muted-foreground">{reportMeta.authorName}</p>
            )}
            {reportMeta.institution && (
              <p className="text-sm text-muted-foreground mt-1">{reportMeta.institution}</p>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Sections */}
          <div className="px-12 py-10">
            {sections.filter(s => s.id !== "title" && s.content.trim()).map((sec, idx) => (
              <div key={sec.id} className="mb-8">
                <h2 className="font-display text-lg font-bold text-foreground uppercase tracking-wide mb-3 pb-1 border-b border-border/50">
                  {idx + 1}. {sec.label}
                </h2>
                <div className="text-[14px] leading-[1.8] text-foreground whitespace-pre-wrap" style={{ fontFamily: "'Times New Roman', Georgia, serif", textAlign: "justify" }}>
                  {sec.content.split(/\n\s*\n/).filter(Boolean).map((para, i) => {
                    if (para.includes("```mermaid")) {
                      const code = para.match(/```mermaid\s*([\s\S]*?)```/i)?.[1]?.trim();
                      if (code) return <MermaidBlock key={i} code={code} />;
                    }
                    if (para.includes("|") && para.split("\n").some(l => l.includes("|"))) {
                      const rows = para.split("\n").filter(l => l.includes("|"));
                      if (rows.length > 1) {
                        return (
                          <div key={i} className="my-4 overflow-x-auto">
                            <table className="w-full border-collapse border border-border text-sm">
                              <tbody>
                                {rows.map((row, ri) => (
                                  <tr key={ri} className={ri === 0 ? "bg-muted font-bold" : ""}>
                                    {row.split("|").filter((c, ci, arr) => (ci > 0 && ci < arr.length - 1) || c.trim()).map((cell, ci) => (
                                      <td key={ci} className="border border-border px-3 py-1.5">{cell.trim()}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }
                    return <p key={i} className="mb-4">{para.replace(/```mermaid[\s\S]*?```/g, "")}</p>;
                  })}
                </div>
              </div>
            ))}

            {sections.filter(s => s.id !== "title" && s.content.trim()).length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No content yet</p>
                <p className="text-sm">Switch to Edit mode and start writing to see the paper preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Report Editor ──
  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-background overflow-hidden">
      {/* Left sidebar — desktop */}
      <aside className="hidden md:flex w-60 border-r border-border bg-card flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-foreground text-sm">ReportForge</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">{templateName}</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((sec) => (
            <div key={sec.id} className="group flex items-center">
              <button
                onClick={() => { setActiveSection(sec.id); if (viewMode === "paper") setViewMode("edit"); }}
                className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all text-left ${
                  activeSection === sec.id && viewMode !== "paper"
                    ? "bg-accent/15 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sec.content.trim() ? "bg-emerald-500" : "bg-border"}`} />
                <span className="truncate">{sec.label}</span>
              </button>
              {sec.id.startsWith("custom-section-") && (
                <button
                  onClick={() => handleRemoveSection(sec.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddSection}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Section
          </button>
        </nav>

        {/* Sidebar footer stats */}
        <div className="border-t border-border p-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>{filledSections}/{sections.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${sections.length > 0 ? (filledSections / sections.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{wordCount.toLocaleString()} words</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <button onClick={() => setShowMobileSections(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Menu className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-[120px]">{currentSection?.label}</span>
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{filledSections}/{sections.length}</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleManualSave} disabled={isSaving || !reportId}>
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden md:flex border-b border-border bg-card px-4 sm:px-6 py-2 items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setViewMode("edit")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button
                onClick={() => setViewMode("paper")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === "paper" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <BookOpen className="h-3 w-3" /> Paper View
              </button>
            </div>
            <div className="h-5 w-px bg-border" />
            <button onClick={copySection} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Copy section">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Save status */}
            <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
              {isSaving ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
              ) : lastSaved ? (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Saved</>
              ) : null}
            </span>

            <Button variant="ghost" size="sm" className="gap-2 text-accent" onClick={handleCompleteEntireReport} disabled={isBusy}>
              {isCompletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isCompletingAll ? `Writing ${completingSection ? sections.find(s => s.id === completingSection)?.label : ""}...` : "Complete Report"}
            </Button>

            {canGenerate && viewMode !== "paper" && (
              <Button variant="ghost" size="sm" className="gap-2 text-accent" onClick={handleGenerateSection} disabled={isBusy}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "AI Generate"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleManualSave} disabled={isSaving || !reportId}>
              <Save className="h-4 w-4" /> Save
            </Button>

            {/* Export dropdown */}
            <div className="relative">
              <Button
                variant="hero" size="sm" className="gap-2"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                    <button
                      onClick={handleExportPDF}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-red-500 font-bold text-xs">PDF</span>
                      Download PDF
                    </button>
                    <button
                      onClick={handleExportWord}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-blue-500 font-bold text-xs">DOC</span>
                      Download Word
                    </button>
                    <button
                      onClick={handleExportText}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="text-gray-500 font-bold text-xs">TXT</span>
                      Download Text
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        {viewMode === "paper" ? renderPaperView() : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-6 px-4 sm:py-10 sm:px-8">
              <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {viewMode === "edit" ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <input
                        className="font-display text-2xl font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none transition-colors w-full mr-4"
                        value={currentSection?.label || ""}
                        onChange={(e) => {
                          if (currentSection) handleRenameSection(currentSection.id, e.target.value);
                        }}
                        placeholder="Section Title"
                      />
                      {isBusy && (
                        <span className="flex items-center gap-2 text-sm text-accent shrink-0">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isGenerating ? "AI is writing..." : "Writing..."}
                        </span>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="w-full min-h-[60vh] rounded-xl border border-input bg-card p-5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-body"
                      value={currentSection?.content || ""}
                      onChange={(e) => updateContent(e.target.value)}
                      placeholder={`Start writing your ${currentSection?.label || "section"} content here...`}
                      disabled={isBusy}
                    />
                  </>
                ) : (
                  /* Preview mode */
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2 className="font-display text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
                      {currentSection?.label}
                    </h2>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                      {!currentSection?.content ? (
                        <span className="text-muted-foreground italic">No content yet. Switch to Edit mode to start writing.</span>
                      ) : (
                        currentSection.content.split(/\n\s*\n/).filter(Boolean).map((para, i) => {
                          if (para.includes("```mermaid")) {
                            const code = para.match(/```mermaid\s*([\s\S]*?)```/i)?.[1]?.trim();
                            if (code) return <MermaidBlock key={i} code={code} />;
                          }
                          if (para.includes("|") && para.split("\n").some(l => l.includes("|"))) {
                            const rows = para.split("\n").filter(l => l.includes("|"));
                            if (rows.length > 1) {
                              return (
                                <div key={i} className="my-4 overflow-x-auto">
                                  <table className="w-full border-collapse border border-border text-sm text-left">
                                    <tbody>
                                      {rows.map((row, ri) => (
                                        <tr key={ri} className={ri === 0 ? "bg-muted font-bold border-b border-border" : "border-b border-border/50"}>
                                          {row.split("|").filter((c, ci, arr) => (ci > 0 && ci < arr.length - 1) || c.trim()).map((cell, ci) => (
                                            <td key={ci} className="px-3 py-2">{cell.trim()}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                          }
                          return <p key={i} className="mb-4">{para.replace(/```mermaid[\s\S]*?```/g, "")}</p>;
                        })
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile sections drawer */}
      <AnimatePresence>
        {showMobileSections && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileSections(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 md:hidden flex flex-col"
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <span className="font-display font-bold text-foreground text-sm">Sections</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{templateName}</span>
                </div>
                <button onClick={() => setShowMobileSections(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-2">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => { setActiveSection(sec.id); setShowMobileSections(false); }}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all text-left ${
                      activeSection === sec.id
                        ? "bg-accent/15 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sec.content.trim() ? "bg-emerald-500" : "bg-border"}`} />
                    <span className="truncate">{sec.label}</span>
                  </button>
                ))}
              </nav>
              <div className="border-t border-border p-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{filledSections}/{sections.length}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${sections.length > 0 ? (filledSections / sections.length) * 100 : 0}%` }} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
