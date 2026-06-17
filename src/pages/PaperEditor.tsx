import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronLeft, Save, Download, Sparkles, Check,
  MessageSquare, AlertTriangle, FileText, X, Send, Bold, Italic,
  Underline, AlignLeft, List, Quote, Type, Loader2, CheckCircle2,
  Copy, RotateCcw, Eye, Edit3, Search, Shield, User, GraduationCap,
  Moon, Sun, Wand2, Image as ImageIcon, Menu, ChevronRight, PanelLeftClose, Upload, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useParams } from "react-router-dom";
import { generateSection, aiAssist, agenticAiAssist, humanizeText, enhanceUserData, stripMarkdown, validateFormat, checkPlagiarism, searchScholar, generateDiagram, type ValidationResult, type PlagiarismResult, type ScholarResult, type DiagramResult } from "@/lib/ai";
import { exportToPDF, exportToText, exportToLaTeX, exportToWord, buildTextContent, buildLaTeXContent, preCacheDiagramPng } from "@/lib/export";
import { usePaper, useCreatePaper, useUpdatePaper, DEFAULT_SECTIONS, type PaperSection, type SectionDiagram, getSectionsForFormat } from "@/hooks/usePapers";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sectionDiagrams, setSectionDiagrams] = useState<Record<string, SectionDiagram[]>>({});

  // Client-side image compression and resizing using Canvas
  const optimizeImage = useCallback((dataUrl: string, maxDim = 1000, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => {
        reject(err);
      };
    });
  }, []);

  // Client-side Mermaid SVG to PNG converter for instant caching
  const convertSvgToPng = useCallback((svgString: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const cleanSvg = svgString.trim();
        const blob = new Blob([cleanSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const w = 800;
          const h = 500;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            const pngData = canvas.toDataURL("image/png");
            URL.revokeObjectURL(url);
            resolve(pngData);
          } else {
            URL.revokeObjectURL(url);
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const [aiMessage, setAiMessage] = useState("");
  const [chatHistoryBySection, setChatHistoryBySection] = useState<Record<string, { sender: "user" | "ai"; message: string }[]>>({});
  const chatHistory = chatHistoryBySection[activeSection] || [
    { sender: "ai", message: "Hello! I am your section-specific AI co-author. Tell me to edit this section, resize images, or summarize the content!" }
  ];
  
  const setChatHistory = useCallback((updateFn: React.SetStateAction<{ sender: "user" | "ai"; message: string }[]>) => {
    setChatHistoryBySection(prev => {
      const current = prev[activeSection] || [
        { sender: "ai", message: "Hello! I am your section-specific AI co-author. Tell me to edit this section, resize images, or summarize the content!" }
      ];
      const next = typeof updateFn === "function" ? updateFn(current) : updateFn;
      return { ...prev, [activeSection]: next };
    });
  }, [activeSection]);
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
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCursorPos = useRef<number | null>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [journalSearch, setJournalSearch] = useState("");
  const [authorDetails, setAuthorDetails] = useState({
    authors: [{ name: "", department: "", institution: "", city: "", country: "", email: "" }]
  });
  const [isFixingValidation, setIsFixingValidation] = useState(false);
  const [isFixingPlagiarism, setIsFixingPlagiarism] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showMobileSections, setShowMobileSections] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [exportState, setExportState] = useState<{
    active: boolean;
    step: number;
    format: string;
    paperTitle: string;
    ready?: boolean;
    blob?: Blob;
    ext?: string;
  } | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load existing paper
  useEffect(() => {
    if (existingPaper) {
      setSections(existingPaper.sections);
      // Hydrate diagrams from persisted sections
      const diagMap: Record<string, SectionDiagram[]> = {};
      for (const s of existingPaper.sections) {
        if (s.diagrams && s.diagrams.length > 0) {
          diagMap[s.id] = s.diagrams;
        } else if (s.diagram) {
          diagMap[s.id] = [{ ...s.diagram, id: s.diagram.id || Math.random().toString(36).substring(2, 9) }];
        } else {
          diagMap[s.id] = [];
        }
      }
      setSectionDiagrams(diagMap);
      setSelectedJournal(existingPaper.journal);
      setPaperMeta({
        domain: existingPaper.domain || "",
        methodology: existingPaper.methodology_summary || "",
        results_summary: existingPaper.results_summary || "",
      });
      setShowJournalPicker(false);
      setPaperId(existingPaper.id);

      // Hydrate author details from localStorage if they exist
      const cachedAuthors = localStorage.getItem(`pf_author_details_${existingPaper.id}`);
      if (cachedAuthors) {
        try {
          const parsed = JSON.parse(cachedAuthors);
          if (parsed.authorNames) {
            setAuthorDetails({
              authors: parsed.authorNames.map((name: string) => ({
                name,
                department: parsed.department || "",
                institution: parsed.institution || "",
                city: parsed.city || "",
                country: parsed.country || "",
                email: parsed.email || ""
              }))
            });
          } else {
            setAuthorDetails(parsed);
          }
        } catch {}
      }
    }
  }, [existingPaper]);

  // Save author details to localStorage whenever they change
  useEffect(() => {
    if (paperId && authorDetails) {
      localStorage.setItem(`pf_author_details_${paperId}`, JSON.stringify(authorDetails));
    }
  }, [paperId, authorDetails]);

  // Chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isAssisting]);

  // Word count
  useEffect(() => {
    const total = sections.reduce((acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0);
    setWordCount(total);
  }, [sections]);

  // Auto-save
  const autoSave = useCallback((updatedSections: PaperSection[], updatedMeta = paperMeta) => {
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
          updates: {
            sections: updatedSections,
            status,
            domain: updatedMeta.domain,
            methodology_summary: updatedMeta.methodology,
            results_summary: updatedMeta.results_summary,
          },
        });
        setLastSaved(new Date());
      } catch {
        // silent fail for auto-save
      }
      setIsSaving(false);
    }, 2000);
  }, [paperId, updatePaper, paperMeta]);

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
    const id = `custom-section-${Date.now()}`;
    const newSection: PaperSection = {
      id,
      label: "New Section",
      content: "",
    };
    setSections((prev) => {
      const updated = [...prev, newSection];
      autoSave(updated);
      return updated;
    });
    setActiveSection(id);
    toast.success("New section added. You can rename it by clicking its title.");
  }, [autoSave]);

  const handleRemoveSection = useCallback((idToRemove: string) => {
    if (idToRemove === "title") {
      toast.error("The title section is required and cannot be removed.");
      return;
    }
    setSections((prev) => {
      const updated = prev.filter(s => s.id !== idToRemove);
      autoSave(updated);
      return updated;
    });
    if (activeSection === idToRemove) {
      setActiveSection(sections[0]?.id || "title");
    }
    toast.success("Section removed");
  }, [activeSection, sections, autoSave]);

  const handleRenameSection = useCallback((idToRename: string, newLabel: string) => {
    setSections((prev) => {
      const updated = prev.map(s => s.id === idToRename ? { ...s, label: newLabel } : s);
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const applyFormatting = useCallback((formatType: "bold" | "italic" | "underline" | "align" | "list" | "quote" | "code") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formatted = "";
    let cursorOffset = 0;

    switch (formatType) {
      case "bold":
        formatted = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case "italic":
        formatted = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case "underline":
        formatted = `<u>${selectedText}</u>`;
        cursorOffset = selectedText ? 0 : 4;
        break;
      case "align":
        formatted = `<p align="left">${selectedText}</p>`;
        cursorOffset = selectedText ? 0 : 16;
        break;
      case "list":
        if (selectedText.includes("\n")) {
          formatted = selectedText.split("\n").map(line => line.startsWith("- ") ? line : `- ${line}`).join("\n");
        } else {
          formatted = `- ${selectedText}`;
        }
        break;
      case "quote":
        if (selectedText.includes("\n")) {
          formatted = selectedText.split("\n").map(line => line.startsWith("> ") ? line : `> ${line}`).join("\n");
        } else {
          formatted = `> ${selectedText}`;
        }
        break;
      case "code":
        if (selectedText.includes("\n")) {
          formatted = `\`\`\`\n${selectedText}\n\`\`\``;
          cursorOffset = selectedText ? 0 : 4;
        } else {
          formatted = `\`${selectedText}\``;
          cursorOffset = selectedText ? 0 : 1;
        }
        break;
    }

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    updateContent(newContent);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formatted.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [activeSection, updateContent]);

  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          applyFormatting("bold");
          break;
        case "i":
          e.preventDefault();
          applyFormatting("italic");
          break;
        case "u":
          e.preventDefault();
          applyFormatting("underline");
          break;
      }
    }
  }, [applyFormatting]);

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

  const handleGenerateDiagram = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a paper title first"); return; }
    
    setIsGeneratingDiagram(true);
    toast.info("Generating diagram...");
    try {
      const result = await generateDiagram({
        title: titleContent,
        domain: paperMeta.domain,
        section: currentSection?.label || activeSection,
        methodology: paperMeta.methodology,
        results_summary: paperMeta.results_summary,
        description: currentSection?.content || ""
      });
      if (result.success) {
        let diagId = Math.random().toString(36).substring(2, 9);
        const newDiag: SectionDiagram = {
          id: diagId,
          type: result.type,
          code: result.code,
          imageData: result.imageData,
          caption: result.caption || "Generated Diagram",
          width: "100%"
        };
        
        setSectionDiagrams(prev => {
          const currentList = prev[activeSection] || [];
          return { ...prev, [activeSection]: [...currentList, newDiag] };
        });

        setSections(prevSecs => {
          const updatedSecs = prevSecs.map(s => {
            if (s.id === activeSection) {
              const currentList = s.diagrams || [];
              const updatedList = [...currentList, newDiag];
              const textarea = textareaRef.current;
              let newContent = s.content;
              const cursorPos = lastCursorPos.current ?? textarea?.selectionStart;
              if (cursorPos !== undefined && cursorPos !== null) {
                newContent = s.content.substring(0, cursorPos) + `\n\n![Diagram: ${newDiag.caption}](${newDiag.id})\n\n` + s.content.substring(cursorPos);
              } else {
                newContent = s.content + `\n\n![Diagram: ${newDiag.caption}](${newDiag.id})\n\n`;
              }
              return { 
                ...s, 
                content: newContent,
                diagram: updatedList[0],
                diagrams: updatedList
              };
            }
            return s;
          });
          autoSave(updatedSecs);
          return updatedSecs;
        });
        toast.success("Diagram generated successfully!");
      } else {
        toast.error("Failed to generate diagram");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate diagram");
    } finally {
      setIsGeneratingDiagram(false);
    }
  }, [activeSection, sections, currentSection, paperMeta, autoSave]);

  const handleGenerateSection = useCallback(async () => {
    const titleContent = sections.find((s) => s.id === "title")?.content || "";
    if (!titleContent.trim()) { toast.error("Please add a paper title first"); return; }

    const previousContent = currentSection?.content || "";
    setIsGenerating(true);
    let accumulated = "";
    setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: "" } : s)));

    await generateSection(
      {
        section: currentSection?.label || activeSection,
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
          const current = stripMarkdown(accumulated);
          setSections((prev) => prev.map((s) => (s.id === activeSection ? { ...s, content: current } : s)));
        },
        onDone: () => {
          setIsGenerating(false);
          toast.success(`${currentSection?.label} generated!`);
          setSections((prev) => {
            autoSave(prev);
            return prev;
          });
        },
        onError: (err) => {
          setIsGenerating(false);
          setSections((prev) => prev.map((s) => (
            s.id === activeSection ? { ...s, content: accumulated || previousContent } : s
          )));
          toast.error(err);
        },
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
            section: sec.label,
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
              const current = stripMarkdown(accumulated);
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

  // ── File upload handler with client-side Canvas Optimization ──
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Reset input so re-uploading same file triggers change
    e.target.value = "";

    const titleContent = sections.find(s => s.id === "title")?.content || "";
    const journalName = journalOptions.find(j => j.id === selectedJournal)?.name || "IEEE";

    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    const textFiles = files.filter(f => !f.type.startsWith("image/"));

    // Process Image Files
    for (const file of imageFiles) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) { toast.error(`Failed to read image ${file.name}.`); resolve(); return; }

          toast.info(`Optimizing and compressing image ${file.name}...`);
          try {
            const optimizedDataUrl = await optimizeImage(dataUrl, 1000, 0.75);
            const caption = `Imported: ${file.name}`;
            const newDiag: SectionDiagram = {
              id: Math.random().toString(36).substring(2, 9),
              type: "image",
              imageData: optimizedDataUrl,
              caption,
              width: "100%"
            };

            setSectionDiagrams(prev => {
              const currentList = prev[activeSection] || [];
              const updatedList = [...currentList, newDiag];
              return { ...prev, [activeSection]: updatedList };
            });

            setSections(prevSecs => {
              const updatedSecs = prevSecs.map(s => {
                if (s.id === activeSection) {
                  const currentList = s.diagrams || [];
                  const updatedList = [...currentList, newDiag];
                  const textarea = textareaRef.current;
                  let newContent = s.content;
                  const cursorPos = lastCursorPos.current ?? textarea?.selectionStart;
                  if (cursorPos !== undefined && cursorPos !== null) {
                    newContent = s.content.substring(0, cursorPos) + `\n\n![Diagram: ${newDiag.caption}](${newDiag.id})\n\n` + s.content.substring(cursorPos);
                  } else {
                    newContent = s.content + `\n\n![Diagram: ${newDiag.caption}](${newDiag.id})\n\n`;
                  }
                  return { 
                    ...s, 
                    content: newContent,
                    diagram: updatedList[0],
                    diagrams: updatedList
                  };
                }
                return s;
              });
              autoSave(updatedSecs);
              return updatedSecs;
            });

            toast.success(`Image "${file.name}" optimized and added to ${currentSection?.label || "section"}!`);
          } catch (err) {
            toast.error(`Failed to optimize image ${file.name}`);
          }
          resolve();
        };
        reader.onerror = () => { toast.error(`Failed to read image file ${file.name}.`); resolve(); };
        reader.readAsDataURL(file);
      });
    }

    // Process Text Files
    if (textFiles.length > 0) {
      const textTypes = [
        "text/plain", "text/csv", "text/tab-separated-values",
        "application/json", "text/markdown", "text/html",
        "application/xml", "text/xml"
      ];
      
      let combinedText = "";
      let validTextFilesCount = 0;

      for (const file of textFiles) {
        const isText = textTypes.includes(file.type) ||
          file.name.match(/\.(txt|csv|tsv|json|md|log|dat|xml|yaml|yml|ini|cfg|conf|tex|bib|py|r|m|sql)$/i);

        if (!isText) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }

        const text = await file.text();
        if (text.trim()) {
          combinedText += `\n\n--- File: ${file.name} ---\n${text}`;
          validTextFilesCount++;
        }
      }

      if (validTextFilesCount > 0 && combinedText.trim()) {
        toast.info(`Enhancing data from ${validTextFilesCount} file(s)...`);
        setIsAssisting(true);
        let accumulated = "";

        await enhanceUserData(
          {
            rawData: combinedText,
            section: currentSection?.label || activeSection,
            journal: journalName,
            title: titleContent,
          },
          {
            onDelta: (chunk) => {
              accumulated += chunk;
              const current = stripMarkdown(accumulated);
              setSections(prev => prev.map(s => s.id === activeSection ? { ...s, content: current } : s));
            },
            onDone: () => {
              setIsAssisting(false);
              toast.success(`Data from ${validTextFilesCount} file(s) enhanced and added!`);
              setSections(prev => { autoSave(prev); return prev; });
            },
            onError: (err) => {
              setIsAssisting(false);
              toast.error(err);
            },
          }
        );
      }
    }
  }, [activeSection, currentSection, sections, selectedJournal, autoSave, optimizeImage]);

  // Sizing change handler
  const handleResizeDiagram = useCallback((sectionId: string, diagId: string, width: string) => {
    setSectionDiagrams(prev => {
      const currentList = prev[sectionId] || [];
      const updatedList = currentList.map(d => d.id === diagId ? { ...d, width } : d);
      return { ...prev, [sectionId]: updatedList };
    });

    setSections(prevSecs => {
      const updatedSecs = prevSecs.map(s => {
        if (s.id === sectionId) {
          const currentList = s.diagrams || [];
          const updatedList = currentList.map(d => d.id === diagId ? { ...d, width } : d);
          return { ...s, diagram: updatedList[0], diagrams: updatedList };
        }
        return s;
      });
      autoSave(updatedSecs);
      return updatedSecs;
    });

    toast.success("Image size updated!");
  }, [autoSave]);

  // Caption update handler
  const handleUpdateCaption = useCallback((sectionId: string, diagId: string, caption: string) => {
    setSectionDiagrams(prev => {
      const currentList = prev[sectionId] || [];
      const updatedList = currentList.map(d => d.id === diagId ? { ...d, caption } : d);
      return { ...prev, [sectionId]: updatedList };
    });

    setSections(prevSecs => {
      const updatedSecs = prevSecs.map(s =>
        s.id === sectionId
          ? { ...s, diagram: (s.diagrams?.map(d => d.id === diagId ? { ...d, caption } : d) || [])[0], diagrams: s.diagrams?.map(d => d.id === diagId ? { ...d, caption } : d) }
          : s
      );
      autoSave(updatedSecs);
      return updatedSecs;
    });

    toast.success("Caption updated!");
  }, [autoSave]);

  // Diagram cancellation handler
  const handleRemoveDiagram = useCallback((sectionId: string, diagId: string) => {
    setSectionDiagrams(prev => {
      const currentList = prev[sectionId] || [];
      const updatedList = currentList.filter(d => d.id !== diagId);
      return { ...prev, [sectionId]: updatedList };
    });

    setSections(prevSecs => {
      const updatedSecs = prevSecs.map(s => {
        if (s.id === sectionId) {
          const currentList = s.diagrams || [];
          const updatedList = currentList.filter(d => d.id !== diagId);
          return { 
            ...s, 
            diagram: updatedList.length > 0 ? updatedList[0] : undefined, 
            diagrams: updatedList 
          };
        }
        return s;
      });
      autoSave(updatedSecs);
      return updatedSecs;
    });

    toast.success("Diagram/image removed!");
  }, [autoSave]);

  // Manual optimization handler
  const handleOptimizeDiagramImage = useCallback(async (sectionId: string, diagId: string) => {
    toast.info("Optimizing and compressing image...");
    let targetDiag: SectionDiagram | undefined;
    setSectionDiagrams(prev => {
      const currentList = prev[sectionId] || [];
      targetDiag = currentList.find(d => d.id === diagId);
      return prev;
    });

    if (!targetDiag || !targetDiag.imageData) {
      toast.error("No image data to optimize");
      return;
    }

    try {
      const optimizedDataUrl = await optimizeImage(targetDiag.imageData, 800, 0.6);
      setSectionDiagrams(prev => {
        const currentList = prev[sectionId] || [];
        const updatedList = currentList.map(d => d.id === diagId ? { ...d, imageData: optimizedDataUrl, width: "70%" } : d);
        return { ...prev, [sectionId]: updatedList };
      });

      setSections(prevSecs => {
        const updatedSecs = prevSecs.map(s => {
          if (s.id === sectionId) {
            const currentList = s.diagrams || [];
            const updatedList = currentList.map(d => d.id === diagId ? { ...d, imageData: optimizedDataUrl, width: "70%" } : d);
            return { ...s, diagram: updatedList[0], diagrams: updatedList };
          }
          return s;
        });
        autoSave(updatedSecs);
        return updatedSecs;
      });

      toast.success("Image optimized and compressed!");
    } catch (err) {
      toast.error("Failed to optimize image");
    }
  }, [autoSave, optimizeImage]);

  // Agentic AI Chat Assist
  const handleAgenticAiAssist = useCallback(async (instruction: string) => {
    if (!instruction.trim()) return;
    
    // Add user message to history
    setChatHistory(prev => [...prev, { sender: "user", message: instruction }]);
    setAiMessage("");
    setIsAssisting(true);

    // Intercept instructions to minimize, maximize, optimize, or remove diagrams locally for ultra-fast response
    const lowerInstruction = instruction.toLowerCase();
    if (
      lowerInstruction.includes("minimize") || 
      lowerInstruction.includes("maximize") || 
      lowerInstruction.includes("optimize") ||
      lowerInstruction.includes("remove") ||
      lowerInstruction.includes("delete")
    ) {
      let targetSectionId = activeSection;
      for (const s of sections) {
        if (lowerInstruction.includes(s.label.toLowerCase()) || lowerInstruction.includes(s.id.toLowerCase())) {
          targetSectionId = s.id;
          break;
        }
      }

      const sectionDiags = sectionDiagrams[targetSectionId] || [];

      if (sectionDiags.length > 0) {
        const targetDiag = sectionDiags[0];
        const diagId = targetDiag.id || "";
        const label = sections.find(s => s.id === targetSectionId)?.label || targetSectionId;

        if (lowerInstruction.includes("minimize")) {
          handleResizeDiagram(targetSectionId, diagId, "40%");
          setChatHistory(prev => [...prev, { sender: "ai", message: `I have successfully minimized the diagram in the "${label}" section to a compact 40% width.` }]);
          setIsAssisting(false);
          setAiMessage("");
          return;
        }
        if (lowerInstruction.includes("maximize")) {
          handleResizeDiagram(targetSectionId, diagId, "100%");
          setChatHistory(prev => [...prev, { sender: "ai", message: `I have successfully maximized the diagram in the "${label}" section to 100% full width.` }]);
          setIsAssisting(false);
          setAiMessage("");
          return;
        }
        if (lowerInstruction.includes("remove") || lowerInstruction.includes("delete")) {
          handleRemoveDiagram(targetSectionId, diagId);
          setChatHistory(prev => [...prev, { sender: "ai", message: `I have successfully removed the diagram/image in the "${label}" section.` }]);
          setIsAssisting(false);
          setAiMessage("");
          return;
        }
        if (lowerInstruction.includes("optimize")) {
          if (targetDiag.type === "image" && targetDiag.imageData) {
            try {
              await handleOptimizeDiagramImage(targetSectionId, diagId);
              setChatHistory(prev => [...prev, { sender: "ai", message: `I have successfully compressed and optimized the uploaded image in the "${label}" section!` }]);
            } catch {
              setChatHistory(prev => [...prev, { sender: "ai", message: `I encountered an issue compressing the image in the "${label}" section.` }]);
            }
          } else {
            handleResizeDiagram(targetSectionId, diagId, "70%");
            setChatHistory(prev => [...prev, { sender: "ai", message: `I have optimized the scale of the diagram in the "${label}" section to a balanced 70% width.` }]);
          }
          setIsAssisting(false);
          setAiMessage("");
          return;
        }
      }
    }
    
    const journalName = journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE";
    
    toast.info("Agent is analyzing and alter-editing your paper...");
    
    try {
      const response = await agenticAiAssist({
        instruction,
        sections,
        paperMeta,
        authorDetails,
        journal: journalName,
        activeSectionId: activeSection
      });
      
      // Add AI reply to history
      setChatHistory(prev => [...prev, { sender: "ai", message: response.message }]);
      
      // Execute each action sequentially
      if (response.actions && response.actions.length > 0) {
        toast.info(`Executing ${response.actions.length} agentic operations...`);
        
        response.actions.forEach((action) => {
          switch (action.type) {
            case "UPDATE_SECTION_CONTENT": {
              setSections(prev => {
                const updated = prev.map(s => s.id === action.payload.sectionId ? { ...s, content: stripMarkdown(action.payload.content) } : s);
                autoSave(updated);
                return updated;
              });
              toast.success(`Updated content in: ${action.payload.sectionId}`);
              break;
            }
            case "UPDATE_METADATA": {
              setPaperMeta(prev => {
                const updated = {
                  ...prev,
                  domain: action.payload.domain !== undefined ? action.payload.domain : prev.domain,
                  methodology: action.payload.methodology !== undefined ? action.payload.methodology : prev.methodology,
                  results_summary: action.payload.results_summary !== undefined ? action.payload.results_summary : prev.results_summary,
                };
                // Automatically auto-save updated metadata
                autoSave(sections, updated);
                return updated;
              });
              toast.success("Updated paper research details!");
              break;
            }
            case "UPDATE_AUTHOR_DETAILS": {
              // Agent logic may try to update the old structure, or we can just leave it for now.
              // We'll update the agentic logic in ai.ts later, but for now we ignore or adapt it.
              toast.success("Updated author affiliations! (Agent support pending)");
              break;
            }
            case "RESIZE_DIAGRAM": {
              handleResizeDiagram(action.payload.sectionId, action.payload.diagramId, action.payload.width);
              break;
            }
            case "REMOVE_DIAGRAM": {
              handleRemoveDiagram(action.payload.sectionId, action.payload.diagramId);
              break;
            }
            default:
              console.warn("Unhandled agentic action type:", (action as any).type);
          }
        });
      }
    } catch (e) {
      console.error("Agentic AI assist failed:", e);
      toast.error("Failed to execute agentic command.");
      setChatHistory(prev => [...prev, { sender: "ai", message: "Apologies, I encountered an issue modifying the document. Please let me know how to try again!" }]);
    } finally {
      setIsAssisting(false);
    }
  }, [sections, paperMeta, authorDetails, selectedJournal, autoSave, handleResizeDiagram, handleRemoveDiagram, activeSection, sectionDiagrams, handleOptimizeDiagramImage]);

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

  const handleExportLaTeX = () => {
    const cleanSections = sections.map(s => ({ ...s, content: stripMarkdown(s.content) }));
    const title = cleanSections.find((s) => s.id === "title")?.content || "paper";
    setShowExportMenu(false);
    setExportState({ active: true, step: 1, format: "LaTeX (.tex)", paperTitle: title });

    // Run synchronously — LaTeX generation is instant, no need for artificial delays
    requestAnimationFrame(() => {
      setExportState(prev => prev ? { ...prev, step: 3 } : null);
      requestAnimationFrame(() => {
        // Build LaTeX content directly as a blob instead of auto-downloading
        const latexContent = buildLaTeXContent(cleanSections, selectedJournal, title, authorDetails);
        const latexBlob = new Blob([latexContent], { type: "text/plain" });
        setExportState({
          active: true,
          step: 5,
          format: "LaTeX (.tex)",
          paperTitle: title,
          ready: true,
          blob: latexBlob,
          ext: "tex"
        });
        toast.success("LaTeX exported successfully!");
      });
    });
  };

  const handleExportWord = async () => {
    const cleanSections = sections.map(s => ({ ...s, content: stripMarkdown(s.content) }));
    const title = cleanSections.find((s) => s.id === "title")?.content || "paper";
    setShowExportMenu(false);
    setExportState({ active: true, step: 1, format: "Word (.docx)", paperTitle: title });
    try {
      const wordBlob = await exportToWord(cleanSections, selectedJournal, title, authorDetails, (step) => {
        setExportState((prev) => prev ? { ...prev, step } : null);
      });
      setExportState({
        active: true,
        step: 5,
        format: "Word (.docx)",
        paperTitle: title,
        ready: true,
        blob: wordBlob,
        ext: "docx"
      });
      toast.success("Word document compilation complete!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Word document.");
      setExportState(null);
    }
  };
  const handleExportPDF = async () => {
    const cleanSections = sections.map(s => ({ ...s, content: stripMarkdown(s.content) }));
    const title = cleanSections.find((s) => s.id === "title")?.content || "paper";
    setShowExportMenu(false);
    setExportState({ active: true, step: 1, format: "PDF Document (.pdf)", paperTitle: title });
    try {
      const pdfBlob = await exportToPDF(cleanSections, selectedJournal, title, authorDetails, (step) => {
        setExportState((prev) => prev ? { ...prev, step } : null);
      });
      setExportState({
        active: true,
        step: 5,
        format: "PDF Document (.pdf)",
        paperTitle: title,
        ready: true,
        blob: pdfBlob,
        ext: "pdf"
      });
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
      setExportState(null);
    }
  };

  const copySection = () => {
    if (currentSection?.content) {
      navigator.clipboard.writeText(currentSection.content);
      toast.success("Copied to clipboard!");
    }
  };

  // Humanize text
  const handleHumanize = useCallback(async () => {
    const sectionsToHumanize = sections.filter(s => s.content.trim() && !["title", "keywords", "references"].includes(s.id));
    if (sectionsToHumanize.length === 0) { toast.error("No content to humanize. Write or generate content first."); return; }
    
    setIsHumanizing(true);
    
    try {
      await Promise.all(sectionsToHumanize.map(async (sec) => {
        let accumulated = "";
        await humanizeText(
          { content: sec.content, journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE", domain: paperMeta.domain },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = stripMarkdown(accumulated);
              setSections((prev) => prev.map((s) => (s.id === sec.id ? { ...s, content: current } : s)));
            },
            onDone: () => {},
            onError: (err) => console.error(err),
          }
        );
      }));
      toast.success("Entire paper humanized successfully!");
      setSections((prev) => { autoSave(prev); return prev; });
    } catch (err) {
      toast.error("Failed to humanize some sections.");
    } finally {
      setIsHumanizing(false);
    }
  }, [sections, selectedJournal, autoSave]);

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

  // AI Fix for validation issues
  const handleAiFixValidation = useCallback(async () => {
    if (!validationResult || validationResult.issues.length === 0) return;
    setIsFixingValidation(true);

    // Group issues by type for targeted fixing
    const errorIssues = validationResult.issues.filter(i => i.type === "error");
    const warningIssues = validationResult.issues.filter(i => i.type === "warning");
    const allIssues = [...errorIssues, ...warningIssues];
    const issueDescriptions = allIssues.map(i => i.message).join("; ");

    // Handle missing section errors by generating content for empty required sections
    const missingSections = errorIssues
      .filter(i => i.message.toLowerCase().includes("missing"))
      .map(i => {
        const match = i.message.match(/missing (?:required|essential) section:\s*(.+)/i);
        return match ? match[1].trim().toLowerCase().replace(/\s+/g, "-") : null;
      })
      .filter(Boolean);

    const titleContent = sections.find(s => s.id === "title")?.content || "";

    // Generate missing sections first
    for (const missingId of missingSections) {
      const sec = sections.find(s => s.id === missingId || s.id.includes(missingId as string));
      if (sec && !sec.content.trim()) {
        let accumulated = "";
        await generateSection(
          {
            section: sec.label,
            title: titleContent,
            domain: paperMeta.domain,
            methodology: paperMeta.methodology,
            results_summary: paperMeta.results_summary,
            journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE",
            existing_content: sections.filter(s => s.content.trim() && s.id !== sec.id).map(s => `${s.label}: ${s.content.slice(0, 500)}`).join("\n"),
          },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = stripMarkdown(accumulated);
              setSections((prev) => prev.map((s) => s.id === sec.id ? { ...s, content: current } : s));
            },
            onDone: () => {},
            onError: (err) => toast.error(err),
          }
        );
      }
    }

    // Fix existing sections with content issues (length, structure warnings)
    if (warningIssues.length > 0) {
      for (const sec of sections.filter(s => s.content.trim() && !NON_GENERATABLE.includes(s.id))) {
        // Check if this section is relevant to any warning
        const relevantWarnings = warningIssues.filter(w =>
          w.message.toLowerCase().includes(sec.label.toLowerCase()) ||
          w.message.toLowerCase().includes(sec.id.toLowerCase()) ||
          w.message.toLowerCase().includes("abstract") && sec.id === "abstract" ||
          w.message.toLowerCase().includes("keyword") && sec.id === "keywords" ||
          w.message.toLowerCase().includes("title") && sec.id === "title" ||
          w.message.toLowerCase().includes("reference") && sec.id === "references" ||
          w.message.toLowerCase().includes("short") && sec.id !== "title"
        );
        if (relevantWarnings.length === 0) continue;

        setActiveSection(sec.id);
        let accumulated = "";
        const specificIssues = relevantWarnings.map(w => w.message).join("; ");
        await aiAssist(
          {
            instruction: `Fix ONLY these specific issues in this section: ${specificIssues}. Do NOT change content that doesn't relate to these issues. Preserve all facts and data exactly.`,
            content: sec.content,
            journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE",
          },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = stripMarkdown(accumulated);
              setSections((prev) => prev.map((s) => (s.id === sec.id ? { ...s, content: current } : s)));
            },
            onDone: () => {},
            onError: (err) => toast.error(err),
          }
        );
      }
    }

    // Auto-rescan after fixing
    toast.info("Re-validating format...");
    try {
      const latestSections = sections.map(s => {
        const el = document.querySelector(`[data-section-id="${s.id}"]`);
        return el ? s : s;
      });
      setSections(prev => {
        const result = validateFormat({ sections: prev, journal: selectedJournal });
        result.then(res => {
          setValidationResult(res);
          if (res.issues.filter(i => i.type === "error" || i.type === "warning").length === 0) {
            toast.success("All format issues resolved! ✅");
          } else {
            toast.success("Format improved! Some minor issues remain.");
          }
        }).catch(() => {});
        return prev;
      });
    } catch {}

    setIsFixingValidation(false);
    setSections((prev) => { autoSave(prev); return prev; });
  }, [validationResult, sections, selectedJournal, autoSave, paperMeta]);

  // AI Fix for plagiarism issues
  const handleAiFixPlagiarism = useCallback(async () => {
    if (!plagiarismResult) return;
    setIsFixingPlagiarism(true);
    let targetSections = plagiarismResult.sections.filter(s => s.ai_likelihood > 40 || s.originality < 70);

    // If no specific sections are flagged but user clicked fix, humanize all sections just to be safe
    if (targetSections.length === 0) {
      targetSections = plagiarismResult.sections;
    }

    if (targetSections.length === 0) {
      setIsFixingPlagiarism(false);
      return;
    }

    try {
      // Run in parallel for ultra-fast fixing
      await Promise.all(targetSections.map(async (flagged) => {
        const sec = sections.find(s => s.label === flagged.name);
        if (!sec || !sec.content.trim() || ["title", "keywords", "references"].includes(sec.id)) return;
        
        let accumulated = "";
        await humanizeText(
          { content: sec.content, journal: journalOptions.find((j) => j.id === selectedJournal)?.name || "IEEE", domain: paperMeta.domain },
          {
            onDelta: (text) => {
              accumulated += text;
              const current = stripMarkdown(accumulated);
              setSections((prev) => prev.map((s) => (s.id === sec.id ? { ...s, content: current } : s)));
            },
            onDone: () => {},
            onError: (err) => console.error(err),
          }
        );
      }));

      // Auto-rescan after fixing
      toast.info("Re-checking plagiarism & AI detection...");
      setSections(prev => {
        const result = checkPlagiarism({ sections: prev, journal: selectedJournal });
        result.then(res => {
          setPlagiarismResult(res);
          if (res.originality_score >= 70 && res.ai_detection_score <= 40) {
            toast.success("All plagiarism/AI issues resolved! ✅");
          } else {
            toast.success("Content improved! Run again for further refinement.");
          }
        }).catch(() => {});
        return prev;
      });
    } catch (err) {
      toast.error("Failed to fix some sections.");
    } finally {
      setIsFixingPlagiarism(false);
      setSections((prev) => { autoSave(prev); return prev; });
    }
  }, [plagiarismResult, sections, selectedJournal, autoSave]);

  if (loadingPaper && !isNew) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Journal picker with search
  if (showJournalPicker) {
    const searchLower = journalSearch.toLowerCase();
    const filteredCategories = formatCategories.map((cat) => ({
      ...cat,
      formats: cat.formats.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.desc.toLowerCase().includes(searchLower) ||
          f.id.toLowerCase().includes(searchLower)
      ),
    })).filter((cat) => cat.formats.length > 0);

    const totalResults = filteredCategories.reduce((a, c) => a + c.formats.length, 0);

    return (
      <div className="min-h-screen bg-background overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 text-sm">
              <ChevronLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">Create New Paper</h1>
              </div>
              <p className="text-muted-foreground text-base sm:text-lg ml-[52px]">Select your target journal or conference format.</p>
            </div>

            {/* Search bar */}
            <div className="relative mb-8 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search journals, conferences, standards..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                autoFocus
              />
              {journalSearch && (
                <button onClick={() => setJournalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              {journalSearch && (
                <p className="text-xs text-muted-foreground mt-2">{totalResults} format{totalResults !== 1 ? "s" : ""} found</p>
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No formats match "{journalSearch}"</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Try a different keyword or browse all formats</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setJournalSearch("")}>Clear Search</Button>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.label} className="mb-6 sm:mb-8">
                  <h2 className="font-display text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat.label}</h2>
                  <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.formats.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedJournal(f.id);
                          setSections(getSectionsForFormat(f.id));
                          setShowJournalPicker(false);
                          setShowMetaForm(true);
                          setJournalSearch("");
                        }}
                        className={`group rounded-xl border-2 p-4 sm:p-5 text-left transition-all hover:shadow-card-hover hover:scale-[1.01] ${
                          selectedJournal === f.id ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/30"
                        }`}
                      >
                        <span className={`inline-block rounded-md border px-3 py-1 text-xs font-semibold ${f.color}`}>{f.name}</span>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Meta form
  if (showMetaForm) {
    const inputClass = "w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div className="max-w-2xl w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Paper Details</h1>
          </div>
          <p className="text-muted-foreground mb-8 ml-[52px]">Provide context so AI can generate better content.</p>

          {/* Paper info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Paper Title *</label>
              <input className={inputClass}
                placeholder="e.g., Deep Learning for Medical Image Segmentation"
                value={sections.find((s) => s.id === "title")?.content || ""}
                onChange={(e) => setSections((prev) => prev.map((s) => s.id === "title" ? { ...s, content: e.target.value } : s))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Research Domain</label>
              <input className={inputClass}
                placeholder="e.g., Computer Vision, NLP, Cybersecurity" value={paperMeta.domain}
                onChange={(e) => setPaperMeta((p) => ({ ...p, domain: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Methodology Summary</label>
                <textarea className={`${inputClass} resize-none h-20`}
                  placeholder="Briefly describe your approach" value={paperMeta.methodology}
                  onChange={(e) => setPaperMeta((p) => ({ ...p, methodology: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Key Results</label>
                <textarea className={`${inputClass} resize-none h-20`}
                  placeholder="Summarize your main findings" value={paperMeta.results_summary}
                  onChange={(e) => setPaperMeta((p) => ({ ...p, results_summary: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Author details */}
          <div className="border-t border-border pt-6 mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-accent" /> Author Details
            </h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Authors ({authorDetails.authors.length})</label>
                <Button variant="outline" size="sm" onClick={() => setAuthorDetails(p => ({ authors: [...p.authors, { name: "", department: "", institution: "", city: "", country: "", email: "" }] }))}>
                  + Add Author
                </Button>
              </div>

              {authorDetails.authors.map((author, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Author {i + 1}</span>
                    {authorDetails.authors.length > 1 && (
                      <button className="text-muted-foreground hover:text-destructive text-xs" onClick={() => setAuthorDetails(p => ({ authors: p.authors.filter((_, j) => j !== i) }))}>Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                      <input className={inputClass} placeholder="e.g., John Doe"
                        value={author.name}
                        onChange={(e) => setAuthorDetails(p => {
                          const updated = [...p.authors];
                          updated[i] = { ...updated[i], name: e.target.value };
                          return { authors: updated };
                        })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Department</label>
                      <input className={inputClass} placeholder="e.g., Computer Science"
                        value={author.department}
                        onChange={(e) => setAuthorDetails(p => {
                          const updated = [...p.authors];
                          updated[i] = { ...updated[i], department: e.target.value };
                          return { authors: updated };
                        })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Institution</label>
                      <input className={inputClass} placeholder="e.g., MIT"
                        value={author.institution}
                        onChange={(e) => setAuthorDetails(p => {
                          const updated = [...p.authors];
                          updated[i] = { ...updated[i], institution: e.target.value };
                          return { authors: updated };
                        })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">City, Country</label>
                      <input className={inputClass} placeholder="e.g., Cambridge, USA"
                        value={author.city}
                        onChange={(e) => setAuthorDetails(p => {
                          const updated = [...p.authors];
                          updated[i] = { ...updated[i], city: e.target.value };
                          return { authors: updated };
                        })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                      <input className={inputClass} placeholder="e.g., author@uni.edu" type="email"
                        value={author.email}
                        onChange={(e) => setAuthorDetails(p => {
                          const updated = [...p.authors];
                          updated[i] = { ...updated[i], email: e.target.value };
                          return { authors: updated };
                        })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
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
  const isBusy = isGenerating || isAssisting || isCompletingAll || isHumanizing || isGeneratingDiagram;

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-background overflow-hidden">
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
            <div key={s.id} className="relative group">
              <button
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors mb-0.5 ${
                  activeSection === s.id ? "bg-accent/10 text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${s.id !== "title" ? "pr-8" : ""}`}
              >
                {s.content.trim() ? <Check className="h-3.5 w-3.5 text-success shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />}
                <span className="truncate">{s.label}</span>
              </button>
              {s.id !== "title" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveSection(s.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mt-2 text-muted-foreground hover:text-foreground" onClick={handleAddSection}>
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={handleValidateFormat} disabled={isValidating}>
            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />} Validate Format
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={handleCheckPlagiarism} disabled={isCheckingPlagiarism}>
            {isCheckingPlagiarism ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Check Plagiarism
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => setShowScholar(true)}>
            <GraduationCap className="h-4 w-4" /> Google Scholar
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => setShowAuthorModal(true)}>
            <User className="h-4 w-4" /> Author Details
          </Button>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main editor */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile header - only shown on small screens */}
        <div className="md:hidden flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <button
            onClick={() => setShowMobileSections(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            <Menu className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-[100px]">{currentSection?.label}</span>
          </button>
          <div className="flex items-center gap-1">
            {/* Mobile view mode toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setViewMode("edit")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${viewMode === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${viewMode === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Eye className="h-3 w-3" /> Paper
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{filledSections}/{sections.length}</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleManualSave} disabled={isSaving || !paperId}>
              <Save className="h-3 w-3" />
            </Button>
            <div className="relative">
              <Button variant="hero" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download className="h-3 w-3" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                  <button onClick={handleExportWord} className="w-full text-left px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as Word</button>
                  <button onClick={handleExportLaTeX} className="w-full text-left px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as LaTeX</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Toolbar - hidden on mobile */}
        <div className="hidden md:flex border-b border-border bg-card px-4 sm:px-6 py-2 items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {[
              { Icon: Bold, type: "bold" as const, title: "Bold (Ctrl+B)" },
              { Icon: Italic, type: "italic" as const, title: "Italic (Ctrl+I)" },
              { Icon: Underline, type: "underline" as const, title: "Underline (Ctrl+U)" },
              { Icon: AlignLeft, type: "align" as const, title: "Align Left" },
              { Icon: List, type: "list" as const, title: "Bullet List" },
              { Icon: Quote, type: "quote" as const, title: "Blockquote" },
              { Icon: Type, type: "code" as const, title: "Monospace Code" }
            ].map(({ Icon, type, title }, i) => (
              <button
                key={i}
                onClick={() => applyFormatting(type)}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={title}
              >
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
            {activeSection === "methodology" && (
              <Button variant="ghost" size="sm" className="gap-2 text-blue-500" onClick={handleGenerateDiagram} disabled={isBusy}>
                {isGeneratingDiagram ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {isGeneratingDiagram ? "Generating..." : "Generate Diagram"}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-2 text-emerald-600" onClick={handleHumanize} disabled={isBusy}>
              {isHumanizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              {isHumanizing ? "Humanizing..." : "Humanize"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleManualSave} disabled={isSaving || !paperId}>
              <Save className="h-4 w-4" /> Save
            </Button>
            <div className="relative">
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download className="h-4 w-4" /> Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                  <button onClick={handleExportWord} className="w-full text-left px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as Word</button>
                  <button onClick={handleExportLaTeX} className="w-full text-left px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors">📝 Export as LaTeX</button>
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
              <div className={`mx-auto py-6 px-4 sm:py-10 sm:px-8 ${viewMode === "split" ? "max-w-none" : "max-w-3xl"}`}>
                <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
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
                      <span className="flex items-center gap-2 text-sm text-accent">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isGenerating ? "AI is writing..." : "Improving..."}
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={textareaRef}
                    onKeyDown={handleTextareaKeyDown}
                    onBlur={(e) => { lastCursorPos.current = e.target.selectionStart; }}
                    onSelect={(e) => { lastCursorPos.current = e.currentTarget.selectionStart; }}
                    className="w-full min-h-[300px] sm:min-h-[500px] resize-none bg-transparent text-foreground leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 font-body text-sm sm:text-base"
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

                  {/* Inline Diagram Section */}
                  {activeSection !== "title" && activeSection !== "abstract" && activeSection !== "keywords" && (
                    <div className="mt-6 border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-accent" /> Section Diagrams ({sectionDiagrams[activeSection]?.length || 0})
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => fileUploadRef.current?.click()}>
                            + Upload Image
                          </Button>
                        </div>
                      </div>

                      {sectionDiagrams[activeSection] && sectionDiagrams[activeSection].length > 0 ? (
                        <div className="space-y-6">
                          {sectionDiagrams[activeSection].map((diag, index) => {
                            const diagId = diag.id || `diag-${index}`;
                            const isMermaid = diag.type === "mermaid";
                            const widthVal = diag.width || "100%";
                            
                            return (
                              <div key={diagId} className="border border-border rounded-xl p-4 bg-card shadow-sm space-y-3 relative group">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Figure {index + 1}: {isMermaid ? "AI Diagram" : "Uploaded Image"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {/* Sizing Controls */}
                                    <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 text-[11px]">
                                      {[
                                        { label: "Min (40%)", value: "40%" },
                                        { label: "Balanced (70%)", value: "70%" },
                                        { label: "Max (100%)", value: "100%" }
                                      ].map((sizeOpt) => (
                                        <button
                                          key={sizeOpt.value}
                                          onClick={() => handleResizeDiagram(activeSection, diagId, sizeOpt.value)}
                                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                                            widthVal === sizeOpt.value ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                                          }`}
                                        >
                                          {sizeOpt.label}
                                        </button>
                                      ))}
                                    </div>
                                    
                                    {/* Optimize button for manual compression */}
                                    {!isMermaid && diag.imageData && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-6 text-xs px-2 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                                        onClick={() => handleOptimizeDiagramImage(activeSection, diagId)}
                                      >
                                        Optimize
                                      </Button>
                                    )}

                                    {/* Remove / Cancel button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg animate-pulse"
                                      onClick={() => handleRemoveDiagram(activeSection, diagId)}
                                      title="Remove Diagram"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="rounded-lg border border-border bg-muted/20 p-4 overflow-auto flex justify-center">
                                  {isMermaid && diag.svg ? (
                                    <div 
                                      style={{ width: widthVal, maxWidth: "100%" }}
                                      className="flex justify-center" 
                                      dangerouslySetInnerHTML={{ __html: diag.svg.replace(/<svg /i, '<svg style="max-width:100%;height:auto;" ') }} 
                                    />
                                  ) : diag.imageData ? (
                                    <img 
                                      src={diag.imageData} 
                                      alt={diag.caption} 
                                      style={{ width: widthVal, height: "auto" }}
                                      className="max-w-full rounded-lg object-contain mx-auto shadow-sm" 
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No image source</span>
                                  )}
                                </div>

                                <div className="flex gap-2 items-center">
                                  <span className="text-xs text-muted-foreground shrink-0">Caption:</span>
                                  <input
                                    type="text"
                                    className="flex-1 text-xs bg-transparent border-b border-border focus:border-accent outline-none text-foreground py-0.5"
                                    value={diag.caption}
                                    onChange={(e) => handleUpdateCaption(activeSection, diagId, e.target.value)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : currentSection?.content.trim() ? (
                        <div className="flex gap-4">
                          <button
                            onClick={() => fileUploadRef.current?.click()}
                            className="flex-1 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 text-center hover:bg-accent/10 hover:border-accent/50 transition-colors group"
                          >
                            <Upload className="h-6 w-6 text-accent/60 group-hover:text-accent mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground">Upload File(s)</p>
                            <p className="text-xs text-muted-foreground mt-1">Supports images or data files (multiple allowed)</p>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}


                  {/* Section-Specific AI Assistant */}
                  <div className="mt-8 border border-accent/20 rounded-xl overflow-hidden bg-accent/5 shadow-sm">
                    <div className="bg-accent/10 px-4 py-2 border-b border-accent/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-sm text-accent-foreground">Section AI Assistant</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Editing: {currentSection?.label}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {chatHistory.length > 0 && (
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                          {chatHistory.map((chat, idx) => {
                            const isAi = chat.sender === "ai";
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                  isAi 
                                    ? "bg-card text-foreground self-start rounded-tl-none border border-border" 
                                    : "bg-accent text-accent-foreground self-end rounded-tr-none shadow-sm ml-auto"
                                }`}
                              >
                                <span className="font-semibold text-[10px] opacity-70 mb-0.5 tracking-wider uppercase">
                                  {isAi ? "🤖 Agentic Co-Author" : "👤 You"}
                                </span>
                                <span className="whitespace-pre-wrap">{chat.message}</span>
                              </motion.div>
                            );
                          })}
                          {isAssisting && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-1.5 text-xs text-accent bg-background self-start px-3 py-2 rounded-2xl border border-accent/20"
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Agent alter-editing section...</span>
                            </motion.div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-1.5">
                        {quickActions.map((action) => (
                          <button 
                            key={action} 
                            onClick={() => handleAgenticAiAssist(action)} 
                            disabled={isBusy}
                            className="text-[11px] bg-background text-muted-foreground hover:bg-accent/10 hover:text-accent border border-border/60 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40 shadow-sm"
                          >
                            {action}
                          </button>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="flex gap-2 relative">
                        <input
                          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent shadow-sm"
                          placeholder={`Instruct agent to edit ${currentSection?.label.toLowerCase()}...`}
                          value={aiMessage}
                          onChange={(e) => setAiMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && aiMessage.trim()) handleAgenticAiAssist(aiMessage); }}
                          disabled={isBusy}
                        />
                        <button
                          className="absolute right-2 top-1.5 p-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                          onClick={() => { if (aiMessage.trim()) handleAgenticAiAssist(aiMessage); }}
                          disabled={isBusy || !aiMessage.trim()}
                        >
                          {isAssisting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Preview pane — shown in preview and split modes */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div className={viewMode === "split" ? "w-1/2 overflow-y-auto" : "flex-1 overflow-y-auto"}>
              <PaperPreview sections={sections} journal={selectedJournal} authorDetails={authorDetails} />
            </div>
          )}
        </div>

        {/* Mobile bottom action bar */}
        <div className="md:hidden border-t border-border bg-card px-1 py-1.5 shrink-0 safe-area-bottom">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {canGenerate && (
              <button
                onClick={handleGenerateSection}
                disabled={isBusy}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-accent hover:bg-accent/10 transition-colors disabled:opacity-40 shrink-0"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="text-[10px] font-medium">Generate</span>
              </button>
            )}
            <button
              onClick={handleHumanize}
              disabled={isBusy}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-40 shrink-0"
            >
              {isHumanizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              <span className="text-[10px] font-medium">Humanize</span>
            </button>
            <button
              onClick={handleCompleteEntirePaper}
              disabled={isBusy}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-accent hover:bg-accent/10 transition-colors disabled:opacity-40 shrink-0"
            >
              {isCompletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="text-[10px] font-medium">Complete</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Section Drawer */}
      <AnimatePresence>
        {showMobileSections && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSections(false)} />
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <span className="font-display font-bold text-foreground">Sections</span>
                </div>
                <button onClick={() => setShowMobileSections(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-2">
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
                  <div key={s.id} className="relative group flex items-center">
                    <button
                      onClick={() => { setActiveSection(s.id); setShowMobileSections(false); }}
                      className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors mb-0.5 ${
                        activeSection === s.id ? "bg-accent/10 text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {s.content.trim() ? <Check className="h-3.5 w-3.5 text-success shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />}
                      <span className="truncate">{s.label}</span>
                    </button>
                    {s.id !== "title" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSection(s.id); }}
                        className="p-2 text-muted-foreground hover:text-destructive"
                        title="Remove Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mt-2 text-muted-foreground hover:text-foreground" onClick={handleAddSection}>
                  <Plus className="h-4 w-4" /> Add Section
                </Button>
              </nav>

              <div className="border-t border-border p-3 space-y-2">
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { setShowMobileSections(false); handleValidateFormat(); }} disabled={isValidating}>
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />} Validate Format
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { setShowMobileSections(false); handleCheckPlagiarism(); }} disabled={isCheckingPlagiarism}>
                  {isCheckingPlagiarism ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Check Plagiarism
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { setShowMobileSections(false); setShowScholar(true); }}>
                  <GraduationCap className="h-4 w-4" /> Google Scholar
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { setShowMobileSections(false); setShowAuthorModal(true); }}>
                  <User className="h-4 w-4" /> Author Details
                </Button>
                <div className="flex items-center justify-between pt-1 pb-1">
                  <span className="text-xs text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <button onClick={() => { setShowMobileSections(false); navigate("/dashboard"); }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Modal */}
      <AnimatePresence>
        {showValidation && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl border border-border shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" /> Format Validation
                </h3>
                <button onClick={() => setShowValidation(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5">
                {isValidating ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
                ) : validationResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-foreground">{validationResult.score}%</div>
                        <div className="text-sm text-muted-foreground">Format Score</div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{validationResult.totalWords.toLocaleString()} words</div>
                        <div>~{validationResult.estimatedPages} pages</div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${validationResult.score >= 80 ? "bg-green-500" : validationResult.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${validationResult.score}%` }} />
                    </div>
                    <div className="space-y-2">
                      {validationResult.issues.map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                          issue.type === "error" ? "bg-red-500/10 text-red-700" :
                          issue.type === "warning" ? "bg-yellow-500/10 text-yellow-700" :
                          "bg-blue-500/10 text-blue-700"
                        }`}>
                          <span className="shrink-0 mt-0.5">{issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️"}</span>
                          {issue.message}
                        </div>
                      ))}
                      {validationResult.issues.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">✅ No issues found. Your paper looks great!</div>
                      )}
                    </div>
                    {validationResult.issues.length > 0 && (
                      <Button variant="hero" className="w-full gap-2 mt-4" onClick={handleAiFixValidation} disabled={isFixingValidation}>
                        {isFixingValidation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        {isFixingValidation ? "AI is fixing issues..." : "AI Fix All Issues"}
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plagiarism Modal */}
      <AnimatePresence>
        {showPlagiarism && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl border border-border shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" /> Plagiarism & AI Detection
                </h3>
                <button onClick={() => setShowPlagiarism(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5">
                {isCheckingPlagiarism ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-sm text-muted-foreground">Analyzing your paper...</p>
                  </div>
                ) : plagiarismResult ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="rounded-xl border border-border p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{plagiarismResult.originality_score}%</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Originality</div>
                      </div>
                      <div className="rounded-xl border border-border p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{plagiarismResult.ai_detection_score}%</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">AI Likelihood</div>
                      </div>
                      <div className="rounded-xl border border-border p-4 text-center">
                        <div className={`text-xl sm:text-2xl font-bold ${plagiarismResult.overall_risk === "low" ? "text-green-600" : plagiarismResult.overall_risk === "medium" ? "text-yellow-600" : "text-red-600"}`}>
                          {plagiarismResult.overall_risk.toUpperCase()}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Risk Level</div>
                      </div>
                    </div>

                    {plagiarismResult.sections.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Section Analysis</h4>
                        <div className="space-y-2">
                          {plagiarismResult.sections.map((sec, i) => (
                            <div key={i} className="rounded-lg border border-border p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm text-foreground">{sec.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Originality: {sec.originality}% | AI: {sec.ai_likelihood}%
                                </span>
                              </div>
                              {sec.flags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sec.flags.map((f, j) => (
                                    <span key={j} className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-0.5 rounded">{f}</span>
                                  ))}
                                </div>
                              )}
                              {sec.suggestions.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {sec.suggestions.map((s, j) => (
                                    <li key={j} className="text-xs text-muted-foreground">• {s}</li>
                                  ))}
                                </ul>
                              )}
                              {sec.matches && sec.matches.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  <div className="text-xs font-semibold text-foreground">Matched sources:</div>
                                  {sec.matches.map((m, k) => (
                                    <a key={k} href={m.url} target="_blank" rel="noopener noreferrer" className="block rounded border border-border bg-muted/30 p-2 hover:bg-muted/60 transition-colors">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-foreground line-clamp-1">{m.title || m.url}</span>
                                        <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-mono">{m.similarity}%</span>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">{m.source} • {new URL(m.url).hostname}</div>
                                      <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 italic">"{m.snippet}"</div>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {plagiarismResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {plagiarismResult.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-accent mt-0.5">•</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button variant="hero" className="w-full gap-2 mt-2" onClick={handleAiFixPlagiarism} disabled={isFixingPlagiarism}>
                      {isFixingPlagiarism ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      {isFixingPlagiarism ? "AI is humanizing sections..." : "Humanize & Re-check Paper"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Scholar Modal */}
      <AnimatePresence>
        {showScholar && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl border border-border shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" /> Google Scholar Search
                </h3>
                <button onClick={() => { setShowScholar(false); setScholarResults([]); setScholarQuery(""); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  <input
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search for papers, topics, or keywords..."
                    value={scholarQuery}
                    onChange={(e) => setScholarQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleScholarSearch(); }}
                  />
                  <Button variant="hero" onClick={handleScholarSearch} disabled={isSearchingScholar || !scholarQuery.trim()}>
                    {isSearchingScholar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {isSearchingScholar && (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
                )}

                {scholarResults.length > 0 && (
                  <div className="space-y-3">
                    {scholarResults.map((ref, i) => (
                      <div key={i} className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground leading-snug">{ref.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{ref.authors} — {ref.year}</p>
                            <p className="text-xs text-muted-foreground italic">{ref.venue}</p>
                            {ref.abstract && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ref.abstract}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {ref.citations > 0 && <span>📊 {ref.citations} citations</span>}
                              {ref.relevance > 0 && <span>🎯 {ref.relevance}% relevant</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => addReferenceFromScholar(ref)}>
                            + Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearchingScholar && scholarResults.length === 0 && scholarQuery && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No results yet. Try searching for a topic.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Author Details Modal */}
      <AnimatePresence>
        {showAuthorModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl border border-border shadow-lg max-w-lg w-full"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" /> Author Details
                </h3>
                <button onClick={() => setShowAuthorModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Authors ({authorDetails.authors.length})</label>
                  <Button variant="outline" size="sm" onClick={() => setAuthorDetails(p => ({ authors: [...p.authors, { name: "", department: "", institution: "", city: "", country: "", email: "" }] }))}>+ Add Author</Button>
                </div>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {authorDetails.authors.map((author, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Author {i + 1}</span>
                        {authorDetails.authors.length > 1 && (
                          <button className="text-muted-foreground hover:text-destructive text-xs" onClick={() => setAuthorDetails(p => ({ authors: p.authors.filter((_, j) => j !== i) }))}>Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., John Doe"
                            value={author.name}
                            onChange={(e) => setAuthorDetails(p => {
                              const updated = [...p.authors];
                              updated[i] = { ...updated[i], name: e.target.value };
                              return { authors: updated };
                            })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Department</label>
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Computer Science"
                            value={author.department}
                            onChange={(e) => setAuthorDetails(p => {
                              const updated = [...p.authors];
                              updated[i] = { ...updated[i], department: e.target.value };
                              return { authors: updated };
                            })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Institution</label>
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., MIT"
                            value={author.institution}
                            onChange={(e) => setAuthorDetails(p => {
                              const updated = [...p.authors];
                              updated[i] = { ...updated[i], institution: e.target.value };
                              return { authors: updated };
                            })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">City, Country</label>
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Cambridge, USA"
                            value={author.city}
                            onChange={(e) => setAuthorDetails(p => {
                              const updated = [...p.authors];
                              updated[i] = { ...updated[i], city: e.target.value };
                              return { authors: updated };
                            })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., author@uni.edu" type="email"
                            value={author.email}
                            onChange={(e) => setAuthorDetails(p => {
                              const updated = [...p.authors];
                              updated[i] = { ...updated[i], email: e.target.value };
                              return { authors: updated };
                            })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="hero" className="w-full mt-4" onClick={() => setShowAuthorModal(false)}>
                  Save Author Details
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {exportState?.active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card/90 border border-border/80 shadow-2xl rounded-2xl max-w-md w-full p-8 text-center relative overflow-hidden"
              style={{ backdropFilter: "blur(12px)" }}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
            >
              {/* Premium Background Ambient Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

              {/* Close / Cancel Button */}
              <button
                onClick={() => setExportState(null)}
                className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Conditionally Rendered Header / Loader */}
              {exportState.ready ? (
                <div className="flex justify-center mb-6 relative">
                  <div className="w-20 h-20 rounded-full bg-success/20 border-4 border-success/40 flex items-center justify-center relative overflow-hidden animate-bounce">
                    <Check className="h-10 w-10 text-success stroke-[3]" />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mb-6 relative">
                  <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-accent animate-spin" />
                    <FileText className="h-8 w-8 text-accent animate-bounce" />
                  </div>
                </div>
              )}

              <h3 className="font-display text-xl font-bold text-foreground mb-1">
                {exportState.ready ? "Compilation Successful! 🎉" : "Compiling Document"}
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                {exportState.ready ? (
                  "Your document is formatted and ready for download"
                ) : (
                  <>
                    Exporting{" "}
                    <span className="font-semibold text-accent">
                      {exportState.paperTitle && exportState.paperTitle.length > 60
                        ? `${exportState.paperTitle.slice(0, 60).trim()}...`
                        : (exportState.paperTitle || "research paper")}
                    </span>{" "}
                    as {exportState.format}
                  </>
                )}
              </p>

              {/* Conditionally Rendered Body */}
              {exportState.ready ? (
                <div className="space-y-4">
                  <Button
                    variant="hero"
                    className="w-full gap-2 bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 py-6 text-base font-bold animate-pulse"
                    onClick={() => {
                      if (exportState.blob && exportState.ext) {
                        const compiledBlob = exportState.blob;
                        const url = URL.createObjectURL(compiledBlob);
                        const a = document.createElement("a");
                        a.href = url;
                        const filename = (exportState.paperTitle || "research-paper").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
                        a.download = `${filename}.${exportState.ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }
                      setExportState(null);
                    }}
                  >
                    <Download className="h-5 w-5" /> Save File to Device
                  </Button>
                  <button
                    onClick={() => setExportState(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Glowing Premium Progress Bar */}
                  <div className="max-w-xs mx-auto text-left">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-semibold">
                      <span>Download Progress</span>
                      <span className="text-accent">{exportState.step * 25}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden relative border border-border/50">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 shadow-lg shadow-accent/20"
                        initial={{ width: "0%" }}
                        animate={{ width: `${exportState.step * 25}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Progress Milestones */}
                  <div className="space-y-3.5 text-left max-w-xs mx-auto">
                  {[
                    { id: 1, text: "Analyzing document structure" },
                    { id: 2, text: "Rendering diagrams & images" },
                    { id: 3, text: "Laying out pages & formatting" },
                    { id: 4, text: "Generating and saving file" }
                  ].map((s) => {
                    const isDone = exportState.step > s.id;
                    const isActive = exportState.step === s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-3.5 transition-all duration-300">
                        {isDone ? (
                          <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0 scale-110 transition-transform duration-300">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                            <span className="text-[10px] font-bold">{s.id}</span>
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center text-muted-foreground text-[10px] font-semibold shrink-0">
                            {s.id}
                          </div>
                        )}
                        <span className={`text-sm transition-colors duration-300 ${
                          isDone ? "text-success/90 font-medium" :
                          isActive ? "text-foreground font-semibold" :
                          "text-muted-foreground/60"
                        }`}>
                          {s.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                </div>
              )}

              {/* Premium Footer Animation */}
              <div className="mt-8 pt-4 border-t border-border/50 text-[10px] text-muted-foreground/50 tracking-wider uppercase font-semibold">
                PaperForge Scientific Compiler
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        ref={fileUploadRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.txt,.csv,.tsv,.json,.md,.log,.dat,.xml,.yaml,.yml,.tex,.bib,.py,.r,.m,.sql"
        onChange={handleFileUpload}
      />

    </div>
  );
}
