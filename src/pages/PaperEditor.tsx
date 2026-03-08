import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronLeft, Save, Download, Sparkles, Check,
  MessageSquare, AlertTriangle, FileText, X, Send, Bold, Italic,
  Underline, AlignLeft, List, Quote, Type, Loader2, CheckCircle2,
  Copy, RotateCcw, Eye, Edit3, Search, Shield, User, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { generateSection, aiAssist, humanizeText, validateFormat, checkPlagiarism, searchScholar, type ValidationResult, type PlagiarismResult, type ScholarResult } from "@/lib/ai";
import { exportToPDF, exportToText, exportToLaTeX, exportToWord } from "@/lib/export";
import { usePaper, useCreatePaper, useUpdatePaper, DEFAULT_SECTIONS, type PaperSection, getSectionsForFormat } from "@/hooks/usePapers";
import PaperPreview from "@/components/PaperPreview";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const formatCategories = [
  {
    label: "Journals",
    formats: [
      { id: "ieee", name: "IEEE", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "IEEE Transactions & Journals — double-column, Times Roman" },
      { id: "springer", name: "Springer", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", desc: "Springer Nature journals — single-column, structured abstract" },
      { id: "elsevier", name: "Elsevier", color: "bg-orange-500/10 text-orange-700 border-orange-200", desc: "Elsevier journals — single-column, graphical abstract support" },
      { id: "acm", name: "ACM", color: "bg-violet-500/10 text-violet-700 border-violet-200", desc: "ACM Transactions & Journals — double-column, CCS concepts" },
      { id: "wiley", name: "Wiley", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200", desc: "Wiley journals — single-column, author-date citations" },
      { id: "taylor-francis", name: "Taylor & Francis", color: "bg-pink-500/10 text-pink-700 border-pink-200", desc: "T&F journals — flexible format, numbered references" },
      { id: "sage", name: "SAGE", color: "bg-amber-500/10 text-amber-700 border-amber-200", desc: "SAGE journals — single-column, APA-style citations" },
      { id: "mdpi", name: "MDPI", color: "bg-teal-500/10 text-teal-700 border-teal-200", desc: "MDPI open-access journals — single-column, structured sections" },
      { id: "plos", name: "PLOS ONE", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", desc: "PLOS ONE open-access — single-column, Vancouver citations" },
      { id: "nature", name: "Nature", color: "bg-red-500/10 text-red-700 border-red-200", desc: "Nature journals — concise format, numbered references" },
      { id: "science", name: "Science (AAAS)", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", desc: "Science magazine — brief reports, numbered citations" },
      { id: "frontiers", name: "Frontiers", color: "bg-sky-500/10 text-sky-700 border-sky-200", desc: "Frontiers open-access — single-column, structured format" },
      { id: "bmc", name: "BMC", color: "bg-green-500/10 text-green-700 border-green-200", desc: "BioMed Central — open-access, IMRAD format" },
      { id: "hindawi", name: "Hindawi", color: "bg-purple-500/10 text-purple-700 border-purple-200", desc: "Hindawi open-access — single-column, numbered refs" },
      { id: "oxford-academic", name: "Oxford Academic", color: "bg-stone-500/10 text-stone-700 border-stone-200", desc: "Oxford University Press journals — structured format" },
      { id: "cambridge-up", name: "Cambridge UP", color: "bg-slate-500/10 text-slate-700 border-slate-200", desc: "Cambridge University Press — scholarly standard" },
      { id: "royal-society", name: "Royal Society", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "Royal Society Publishing — UK science journals" },
      { id: "de-gruyter", name: "De Gruyter", color: "bg-rose-500/10 text-rose-700 border-rose-200", desc: "De Gruyter — European academic publishing" },
      { id: "emerald-insight", name: "Emerald Insight", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", desc: "Emerald — business, management, social sciences" },
      { id: "world-scientific", name: "World Scientific", color: "bg-amber-500/10 text-amber-700 border-amber-200", desc: "World Scientific — double-column, Asian academic publisher" },
      { id: "ios-press", name: "IOS Press", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200", desc: "IOS Press — European scholarly publisher" },
    ],
  },
  {
    label: "Medical & Life Sciences",
    formats: [
      { id: "lancet", name: "The Lancet", color: "bg-red-500/10 text-red-700 border-red-200", desc: "The Lancet — leading medical journal, structured abstract" },
      { id: "bmj", name: "BMJ", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "British Medical Journal — IMRAD format" },
      { id: "jama", name: "JAMA", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", desc: "Journal of the American Medical Association — double-column" },
      { id: "nejm", name: "NEJM", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", desc: "New England Journal of Medicine — concise format" },
      { id: "cell", name: "Cell", color: "bg-violet-500/10 text-violet-700 border-violet-200", desc: "Cell Press — life sciences, STAR Methods" },
      { id: "pnas", name: "PNAS", color: "bg-orange-500/10 text-orange-700 border-orange-200", desc: "Proceedings of the National Academy of Sciences — double-column" },
      { id: "lippincott", name: "Lippincott", color: "bg-teal-500/10 text-teal-700 border-teal-200", desc: "Lippincott Williams & Wilkins — medical publisher" },
      { id: "karger", name: "Karger", color: "bg-pink-500/10 text-pink-700 border-pink-200", desc: "Karger — biomedical publisher, structured sections" },
      { id: "thieme-medical", name: "Thieme Medical", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", desc: "Thieme — medical and science publisher" },
    ],
  },
  {
    label: "Conferences",
    formats: [
      { id: "ieee-conf", name: "IEEE Conference", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "IEEE conference proceedings — 6-8 pages, double-column" },
      { id: "acm-conf", name: "ACM Conference", color: "bg-violet-500/10 text-violet-700 border-violet-200", desc: "ACM SIGCHI/SIGPLAN proceedings — double-column, CCS concepts" },
      { id: "neurips", name: "NeurIPS", color: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200", desc: "NeurIPS proceedings — single-column, 9 pages + refs" },
      { id: "icml", name: "ICML", color: "bg-sky-500/10 text-sky-700 border-sky-200", desc: "ICML proceedings — single-column, PMLR format" },
      { id: "cvpr", name: "CVPR/ICCV/ECCV", color: "bg-lime-500/10 text-lime-700 border-lime-200", desc: "Computer vision conferences — double-column, 8 pages" },
      { id: "aaai", name: "AAAI", color: "bg-orange-500/10 text-orange-700 border-orange-200", desc: "AAAI conference proceedings — double-column, 7 pages" },
      { id: "iclr", name: "ICLR", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", desc: "ICLR submissions — single-column, OpenReview format" },
      { id: "acl", name: "ACL/EMNLP", color: "bg-rose-500/10 text-rose-700 border-rose-200", desc: "ACL Anthology format — double-column, 8 pages + refs" },
      { id: "interspeech", name: "Interspeech", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200", desc: "Interspeech — double-column, speech/audio research" },
      { id: "icassp", name: "ICASSP", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "IEEE ICASSP — signal processing, double-column" },
      { id: "miccai", name: "MICCAI", color: "bg-teal-500/10 text-teal-700 border-teal-200", desc: "MICCAI — medical image computing, LNCS format" },
      { id: "eccv", name: "ECCV", color: "bg-amber-500/10 text-amber-700 border-amber-200", desc: "ECCV — computer vision, double-column" },
      { id: "sigmod", name: "SIGMOD", color: "bg-violet-500/10 text-violet-700 border-violet-200", desc: "ACM SIGMOD — databases, double-column" },
      { id: "vldb", name: "VLDB", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", desc: "VLDB — very large databases, double-column" },
      { id: "www", name: "WWW/WebConf", color: "bg-pink-500/10 text-pink-700 border-pink-200", desc: "The Web Conference — double-column" },
      { id: "kdd", name: "KDD", color: "bg-orange-500/10 text-orange-700 border-orange-200", desc: "ACM KDD — data mining, double-column" },
      { id: "ijcai", name: "IJCAI", color: "bg-red-500/10 text-red-700 border-red-200", desc: "IJCAI — artificial intelligence, double-column" },
      { id: "coling", name: "COLING", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", desc: "COLING — computational linguistics, double-column" },
      { id: "naacl", name: "NAACL", color: "bg-sky-500/10 text-sky-700 border-sky-200", desc: "NAACL — NLP, ACL Anthology format" },
    ],
  },
  {
    label: "Indexing & Citation Standards",
    formats: [
      { id: "scopus", name: "Scopus", color: "bg-rose-500/10 text-rose-700 border-rose-200", desc: "Scopus-indexed journal standard format" },
      { id: "web-of-science", name: "Web of Science", color: "bg-slate-500/10 text-slate-700 border-slate-200", desc: "WoS-indexed journal standard format" },
      { id: "apa7", name: "APA 7th Edition", color: "bg-blue-500/10 text-blue-700 border-blue-200", desc: "APA 7th — social sciences, psychology, education" },
      { id: "chicago", name: "Chicago/Turabian", color: "bg-stone-500/10 text-stone-700 border-stone-200", desc: "Chicago Manual of Style — humanities, history" },
      { id: "mla", name: "MLA", color: "bg-purple-500/10 text-purple-700 border-purple-200", desc: "MLA format — literature, arts, humanities" },
      { id: "harvard", name: "Harvard", color: "bg-red-500/10 text-red-700 border-red-200", desc: "Harvard referencing — widely used in UK/Australia" },
      { id: "vancouver", name: "Vancouver", color: "bg-teal-500/10 text-teal-700 border-teal-200", desc: "Vancouver style — biomedical, numbered references" },
      { id: "turabian", name: "Turabian", color: "bg-amber-500/10 text-amber-700 border-amber-200", desc: "Turabian — student research papers, thesis format" },
    ],
  },
];

const journalOptions = formatCategories.flatMap((cat) =>
  cat.formats.map((f) => ({ id: f.id, name: f.name, color: f.color }))
);

const NON_GENERATABLE = ["title", "references", "works-cited", "bibliography", "reference-list"];

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
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [completingSection, setCompletingSection] = useState<string | null>(null);
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
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
  const [isHumanizing, setIsHumanizing] = useState(false);

  // Modal states
  const [showValidation, setShowValidation] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [showPlagiarism, setShowPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);

  const [showScholar, setShowScholar] = useState(false);
  const [scholarQuery, setScholarQuery] = useState("");
  const [scholarResults, setScholarResults] = useState<ScholarResult[]>([]);
  const [isSearchingScholar, setIsSearchingScholar] = useState(false);

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

  const handleCompleteEntirePaper = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a paper title first"); return; }

    setIsCompletingAll(true);
    const generatableSections = sections.filter((s) => !NON_GENERATABLE.includes(s.id) && !s.content.trim());

    if (generatableSections.length === 0) {
      toast.info("All sections already have content!");
      setIsCompletingAll(false);
      return;
    }

    toast.info(`Generating ${generatableSections.length} empty sections...`);
    let latestSections = [...sections];

    for (const sec of generatableSections) {
      setCompletingSection(sec.id);
      setActiveSection(sec.id);
      let accumulated = "";

      await new Promise<void>((resolve) => {
        generateSection(
          {
            section: sec.id,
            title: titleContent,
            domain: paperMeta.domain,
            methodology: paperMeta.methodology,
            results_summary: paperMeta.results_summary,
            journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE",
            existing_content: latestSections
              .filter((s) => s.content.trim() && s.id !== sec.id)
              .map((s) => `${s.label}: ${s.content.slice(0, 500)}`)
              .join("\n"),
          },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = accumulated;
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
    toast.success("Paper completed! 🎉");
    setSections((prev) => { autoSave(prev); return prev; });
  }, [sections, selectedJournal, paperMeta, autoSave]);

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

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportPDF = () => {
    const title = sections.find((s) => s.id === "title")?.content || "paper";
    exportToPDF(sections, selectedJournal, title);
    setShowExportMenu(false);
    toast.success("PDF exported!");
  };

  const handleExportLaTeX = () => {
    const title = sections.find((s) => s.id === "title")?.content || "paper";
    exportToLaTeX(sections, selectedJournal, title);
    setShowExportMenu(false);
    toast.success("LaTeX exported!");
  };

  const handleExportText = () => {
    const title = sections.find((s) => s.id === "title")?.content || "paper";
    exportToText(sections, title);
    setShowExportMenu(false);
    toast.success("Text exported!");
  };

  const handleExportWord = () => {
    const title = sections.find((s) => s.id === "title")?.content || "paper";
    exportToWord(sections, selectedJournal, title);
    setShowExportMenu(false);
    toast.success("Word document exported!");
  };

  const copySection = () => {
    if (currentSection?.content) {
      navigator.clipboard.writeText(currentSection.content);
      toast.success("Copied to clipboard!");
    }
  };

  // Humanize text
  const handleHumanize = useCallback(async () => {
    const content = currentSection?.content || "";
    if (!content.trim()) { toast.error("No content to humanize. Write or generate content first."); return; }
    setIsHumanizing(true);
    let accumulated = "";
    await humanizeText(
      { content, journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE" },
      {
        onDelta: (text) => {
          accumulated += text;
          const current = accumulated;
          setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: current } : s)));
        },
        onDone: () => {
          setIsHumanizing(false);
          toast.success("Content humanized!");
          setSections((prev) => { autoSave(prev); return prev; });
        },
        onError: (err) => { setIsHumanizing(false); toast.error(err); },
      }
    );
  }, [activeSection, currentSection, selectedJournal, autoSave]);

  // Validate format
  const handleValidateFormat = async () => {
    setIsValidating(true);
    setShowValidation(true);
    setValidationResult(null);
    try {
      const result = await validateFormat({ sections, journal: selectedJournal });
      setValidationResult(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
      setShowValidation(false);
    }
    setIsValidating(false);
  };

  // Plagiarism check
  const handleCheckPlagiarism = async () => {
    const hasContent = sections.some(s => s.content.trim() && !["title", "keywords"].includes(s.id));
    if (!hasContent) { toast.error("Write some content first before checking plagiarism."); return; }
    setIsCheckingPlagiarism(true);
    setShowPlagiarism(true);
    setPlagiarismResult(null);
    try {
      const result = await checkPlagiarism({ sections, journal: selectedJournal });
      setPlagiarismResult(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Plagiarism check failed");
      setShowPlagiarism(false);
    }
    setIsCheckingPlagiarism(false);
  };

  // Google Scholar search
  const handleScholarSearch = async () => {
    if (!scholarQuery.trim()) return;
    setIsSearchingScholar(true);
    try {
      const title = sections.find(s => s.id === "title")?.content;
      const result = await searchScholar({ query: scholarQuery, journal: selectedJournal, paperTitle: title });
      setScholarResults(result.results || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scholar search failed");
    }
    setIsSearchingScholar(false);
  };

  const addReferenceFromScholar = (ref: ScholarResult) => {
    const formattedKey = Object.keys(ref).find(k => k.startsWith("formatted_"));
    const formatted = formattedKey ? ref[formattedKey] : `${ref.authors}, "${ref.title}," ${ref.venue}, ${ref.year}.`;
    const refSectionId = sections.find(s => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id))?.id;
    if (!refSectionId) { toast.error("No references section found"); return; }
    setSections(prev => {
      const updated = prev.map(s => s.id === refSectionId ? { ...s, content: s.content ? s.content + "\n" + formatted : formatted } : s);
      autoSave(updated);
      return updated;
    });
    toast.success("Reference added!");
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
      <div className="min-h-screen bg-background overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 text-sm">
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-2">Create New Paper</h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-10">Select your target format to load the correct template.</p>

            {formatCategories.map((cat) => (
              <div key={cat.label} className="mb-6 sm:mb-8">
                <h2 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3">{cat.label}</h2>
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cat.formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedJournal(f.id);
                        setSections(getSectionsForFormat(f.id));
                        setShowJournalPicker(false);
                        setShowMetaForm(true);
                      }}
                      className={`group rounded-xl border-2 p-5 text-left transition-all hover:shadow-card-hover ${
                        selectedJournal === f.id ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/30"
                      }`}
                    >
                      <span className={`inline-block rounded-md border px-3 py-1 text-xs font-semibold ${f.color}`}>{f.name}</span>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
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

  const canGenerate = !NON_GENERATABLE.includes(activeSection);
  const isBusy = isGenerating || isAssisting || isCompletingAll;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0">
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
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
              {(["edit", "split", "preview"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {mode === "edit" && <><Edit3 className="h-3 w-3" /> Edit</>}
                  {mode === "split" && <><BookOpen className="h-3 w-3" /> Split</>}
                  {mode === "preview" && <><Eye className="h-3 w-3" /> Paper View</>}
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-border" />
            {/* Save status */}
            <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
              {isSaving ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
              ) : lastSaved ? (
                <><CheckCircle2 className="h-3 w-3 text-success" /> Saved</>
              ) : null}
            </span>

            <Button variant="ghost" size="sm" className="gap-2 text-accent" onClick={handleCompleteEntirePaper} disabled={isBusy}>
              {isCompletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isCompletingAll ? `Writing ${completingSection ? sections.find(s => s.id === completingSection)?.label : ''}...` : "Complete Paper"}
            </Button>

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
            <div className="relative">
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download className="h-4 w-4" /> Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">📄 Export as PDF</button>
                  <button onClick={handleExportLaTeX} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as LaTeX</button>
                  <button onClick={handleExportText} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">📋 Export as Text</button>
                  <button onClick={handleExportWord} className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as Word (.doc)</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane — shown in edit and split modes */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div className={`overflow-y-auto ${viewMode === "split" ? "w-1/2 border-r border-border" : "flex-1"}`}>
              <div className={`mx-auto py-10 px-8 ${viewMode === "split" ? "max-w-none" : "max-w-3xl"}`}>
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
          )}

          {/* Preview pane — shown in preview and split modes */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div className={viewMode === "split" ? "w-1/2 overflow-y-auto" : "flex-1"}>
              <PaperPreview sections={sections} journal={selectedJournal} />
            </div>
          )}

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
