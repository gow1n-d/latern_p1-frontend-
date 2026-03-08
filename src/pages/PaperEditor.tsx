import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronLeft, Save, Download, Sparkles, Check,
  MessageSquare, AlertTriangle, FileText, X, Send, Bold, Italic,
  Underline, AlignLeft, List, Quote, Type, Loader2, CheckCircle2,
  Copy, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { generateSection, aiAssist } from "@/lib/ai";
import { exportToPDF, exportToText, exportToLaTeX } from "@/lib/export";
import { usePaper, useCreatePaper, useUpdatePaper, DEFAULT_SECTIONS, type PaperSection } from "@/hooks/usePapers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const journalOptions = [
  { id: "ieee", name: "IEEE", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "springer", name: "Springer", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  { id: "elsevier", name: "Elsevier", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  { id: "acm", name: "ACM", color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  { id: "scopus", name: "Scopus", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
];

const AI_GENERATABLE = ["abstract", "keywords", "introduction", "literature", "methodology", "results", "discussion", "conclusion"];

const quickActions = [
  "Improve writing style",
  "Make more concise",
  "Expand with details",
  "Add academic tone",
  "Fix grammar & punctuation",
  "Add transition sentences",
  "Strengthen argumentation",
];

export default function PaperEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";
  const { user } = useAuth();

  const { data: existingPaper, isLoading: loadingPaper } = usePaper(id);
  const createPaper = useCreatePaper();
  const updatePaper = useUpdatePaper();

  const [selectedJournal, setSelectedJournal] = useState("");
  const [sections, setSections] = useState<PaperSection[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState("title");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [showJournalPicker, setShowJournalPicker] = useState(isNew);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssisting, setIsAssisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [paperId, setPaperId] = useState<string | null>(isNew ? null : id || null);
  const [wordCount, setWordCount] = useState(0);

  const [paperMeta, setPaperMeta] = useState({ domain: "", methodology: "", results_summary: "" });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load existing paper
  useEffect(() => {
    if (existingPaper) {
      setSections(existingPaper.sections);
      setSelectedJournal(existingPaper.journal);
      setPaperMeta({
        domain: existingPaper.domain || "",
        methodology: existingPaper.methodology_summary || "",
        results_summary: existingPaper.results_summary || "",
      });
      setShowJournalPicker(false);
      setPaperId(existingPaper.id);
    }
  }, [existingPaper]);

  // Word count
  useEffect(() => {
    const total = sections.reduce((acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0);
    setWordCount(total);
  }, [sections]);

  // Auto-save
  const autoSave = useCallback((updatedSections: PaperSection[]) => {
    if (!paperId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const filledCount = updatedSections.filter((s) => s.content.trim()).length;
      let status = "draft";
      if (filledCount >= updatedSections.length) status = "complete";
      else if (filledCount >= 3) status = "in-progress";

      try {
        await updatePaper.mutateAsync({
          id: paperId,
          updates: { sections: updatedSections, status },
        });
        setLastSaved(new Date());
      } catch {
        // silent fail for auto-save
      }
      setIsSaving(false);
    }, 2000);
  }, [paperId, updatePaper]);

  const currentSection = sections.find((s) => s.id === activeSection);
  const filledSections = sections.filter((s) => s.content.trim()).length;

  const updateContent = useCallback((content: string) => {
    setSections((prev) => {
      const updated = prev.map((s) => (s.id === activeSection ? { ...s, content } : s));
      autoSave(updated);
      return updated;
    });
  }, [activeSection, autoSave]);

  const handleManualSave = async () => {
    if (!paperId) return;
    setIsSaving(true);
    try {
      const filledCount = sections.filter((s) => s.content.trim()).length;
      let status = "draft";
      if (filledCount >= sections.length) status = "complete";
      else if (filledCount >= 3) status = "in-progress";

      await updatePaper.mutateAsync({ id: paperId, updates: { sections, status } });
      setLastSaved(new Date());
      toast.success("Paper saved!");
    } catch {
      toast.error("Failed to save");
    }
    setIsSaving(false);
  };

  const handleGenerateSection = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a paper title first"); return; }

    setIsGenerating(true);
    let accumulated = "";
    setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: "" } : s)));

    await generateSection(
      {
        section: activeSection,
        title: titleContent,
        domain: paperMeta.domain,
        methodology: paperMeta.methodology,
        results_summary: paperMeta.results_summary,
        journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE",
        existing_content: sections
          .filter((s) => s.content.trim() && s.id !== activeSection)
          .map((s) => `${s.label}: ${s.content.slice(0, 500)}`)
          .join("\n"),
      },
      {
        onDelta: (text) => {
          accumulated += text;
          const current = accumulated;
          setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: current } : s)));
        },
        onDone: () => {
          setIsGenerating(false);
          toast.success(`${currentSection?.label} generated!`);
          // trigger auto-save
          setSections((prev) => {
            autoSave(prev);
            return prev;
          });
        },
        onError: (err) => { setIsGenerating(false); toast.error(err); },
      }
    );
  }, [activeSection, sections, selectedJournal, paperMeta, currentSection, autoSave]);

  const handleAiAssist = useCallback(async (instruction: string) => {
    const content = currentSection?.content || "";
    if (!content.trim()) { toast.error("No content to improve. Write or generate content first."); return; }

    setIsAssisting(true);
    let accumulated = "";

    await aiAssist(
      { instruction, content, journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE" },
      {
        onDelta: (text) => {
          accumulated += text;
          const current = accumulated;
          setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: current } : s)));
        },
        onDone: () => {
          setIsAssisting(false);
          setAiMessage("");
          toast.success("Content improved!");
          setSections((prev) => { autoSave(prev); return prev; });
        },
        onError: (err) => { setIsAssisting(false); toast.error(err); },
      }
    );
  }, [activeSection, currentSection, selectedJournal, autoSave]);

  const handleCreatePaper = async () => {
    const title = sections.find((s) => s.id === "title")?.content || "Untitled Paper";
    try {
      const paper = await createPaper.mutateAsync({
        title,
        journal: selectedJournal,
        domain: paperMeta.domain,
        methodology_summary: paperMeta.methodology,
        results_summary: paperMeta.results_summary,
      });
      setPaperId(paper.id);
      navigate(`/editor/${paper.id}`, { replace: true });
      toast.success("Paper created!");
    } catch {
      toast.error("Failed to create paper");
    }
  };

  const handleExport = () => {
    const text = sections
      .filter((s) => s.content.trim())
      .map((s) => `\n${"=".repeat(40)}\n${s.label.toUpperCase()}\n${"=".repeat(40)}\n\n${s.content}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sections.find((s) => s.id === "title")?.content || "paper"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Paper exported!");
  };

  const copySection = () => {
    if (currentSection?.content) {
      navigator.clipboard.writeText(currentSection.content);
      toast.success("Copied to clipboard!");
    }
  };

  if (loadingPaper && !isNew) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Journal picker
  if (showJournalPicker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="max-w-2xl w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-8 text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Create New Paper</h1>
          <p className="text-muted-foreground text-lg mb-10">Select your target journal to load the correct template.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {journalOptions.map((j) => (
              <button
                key={j.id}
                onClick={() => { setSelectedJournal(j.id); setShowJournalPicker(false); setShowMetaForm(true); }}
                className={`group rounded-xl border-2 p-6 text-left transition-all hover:shadow-card-hover ${
                  selectedJournal === j.id ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/30"
                }`}
              >
                <span className={`inline-block rounded-md border px-3 py-1 text-sm font-semibold ${j.color}`}>{j.name}</span>
                <p className="mt-3 text-sm text-muted-foreground">{j.name} formatted template with proper citation style and structure.</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Meta form
  if (showMetaForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="max-w-xl w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Paper Details</h1>
          <p className="text-muted-foreground mb-8">Provide context so AI can generate better content.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Paper Title *</label>
              <input
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Deep Learning for Medical Image Segmentation"
                value={sections.find((s) => s.id === "title")?.content || ""}
                onChange={(e) => setSections((prev) => prev.map((s) => s.id === "title" ? { ...s, content: e.target.value } : s))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Research Domain</label>
              <input className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Computer Vision, NLP, Cybersecurity" value={paperMeta.domain}
                onChange={(e) => setPaperMeta((p) => ({ ...p, domain: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Methodology Summary</label>
              <textarea className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                placeholder="Briefly describe your approach" value={paperMeta.methodology}
                onChange={(e) => setPaperMeta((p) => ({ ...p, methodology: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Key Results</label>
              <textarea className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                placeholder="Summarize your main findings" value={paperMeta.results_summary}
                onChange={(e) => setPaperMeta((p) => ({ ...p, results_summary: e.target.value }))} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => { setShowMetaForm(false); handleCreatePaper(); }}>Skip</Button>
            <Button variant="hero" onClick={() => { setShowMetaForm(false); handleCreatePaper(); }} className="flex-1" disabled={createPaper.isPending}>
              {createPaper.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Start Writing <Sparkles className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const canGenerate = AI_GENERATABLE.includes(activeSection);
  const isBusy = isGenerating || isAssisting;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-foreground">PaperForge</span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${journalOptions.find((j) => j.id === selectedJournal)?.color || ""}`}>
            {journalOptions.find((j) => j.id === selectedJournal)?.name || "Journal"}
          </span>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{filledSections}/{sections.length} sections</span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(filledSections / sections.length) * 100}%` }} />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors mb-0.5 ${
                activeSection === s.id ? "bg-accent/10 text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.content.trim() ? <Check className="h-3.5 w-3.5 text-success shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />}
              {s.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <AlertTriangle className="h-4 w-4" /> Validate Format
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <FileText className="h-4 w-4" /> Check Plagiarism
          </Button>
        </div>
      </aside>

      {/* Main editor */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b border-border bg-card px-4 sm:px-6 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {[Bold, Italic, Underline, AlignLeft, List, Quote, Type].map((Icon, i) => (
              <button key={i} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="h-5 w-px bg-border mx-1" />
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
                <><CheckCircle2 className="h-3 w-3 text-success" /> Saved</>
              ) : null}
            </span>

            {canGenerate && (
              <Button variant="ghost" size="sm" className="gap-2 text-accent" onClick={handleGenerateSection} disabled={isBusy}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "AI Generate"}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowAiPanel(!showAiPanel)}>
              <MessageSquare className="h-4 w-4 text-accent" /> AI Assist
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleManualSave} disabled={isSaving || !paperId}>
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="hero" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-10 px-8">
              <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">{currentSection?.label}</h2>
                  {isBusy && (
                    <span className="flex items-center gap-2 text-sm text-accent">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isGenerating ? "AI is writing..." : "Improving..."}
                    </span>
                  )}
                </div>
                <textarea
                  className="w-full min-h-[500px] resize-none bg-transparent text-foreground leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 font-body text-base"
                  placeholder={`Start writing your ${currentSection?.label.toLowerCase()}... ${canGenerate ? 'or click "AI Generate" above' : ""}`}
                  value={currentSection?.content || ""}
                  onChange={(e) => updateContent(e.target.value)}
                  disabled={isBusy}
                />
                {currentSection?.content && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {currentSection.content.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAiPanel && (
              <motion.div
                className="w-80 border-l border-border bg-card flex flex-col shrink-0"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="font-semibold text-sm text-foreground">AI Assistant</span>
                  </div>
                  <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {canGenerate && (
                    <button onClick={handleGenerateSection} disabled={isBusy}
                      className="w-full rounded-lg bg-accent/10 border border-accent/20 p-3 text-sm text-left hover:bg-accent/20 transition-colors disabled:opacity-50">
                      <p className="font-medium text-accent-foreground flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Generate {currentSection?.label}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">AI writes this entire section using your paper context</p>
                    </button>
                  )}
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium text-foreground mb-2">Quick Improvements</p>
                    {quickActions.map((action) => (
                      <button key={action} onClick={() => handleAiAssist(action)} disabled={isBusy}
                        className="block w-full text-left rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground transition-colors mt-0.5 disabled:opacity-50">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Custom instruction..."
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && aiMessage.trim()) handleAiAssist(aiMessage); }}
                      disabled={isBusy}
                    />
                    <Button variant="hero" size="icon" className="shrink-0 h-9 w-9"
                      onClick={() => { if (aiMessage.trim()) handleAiAssist(aiMessage); }} disabled={isBusy || !aiMessage.trim()}>
                      {isAssisting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
