import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronLeft, Save, Download, Sparkles, Check,
  MessageSquare, AlertTriangle, FileText, X, Send, Bold, Italic,
  Underline, AlignLeft, List, Quote, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

const journalOptions = [
  { id: "ieee", name: "IEEE", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  { id: "springer", name: "Springer", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  { id: "elsevier", name: "Elsevier", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  { id: "acm", name: "ACM", color: "bg-violet-500/10 text-violet-700 border-violet-200" },
  { id: "scopus", name: "Scopus", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
];

const defaultSections = [
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

const sampleContent: Record<string, string> = {
  title: "Deep Learning Approaches for Medical Image Segmentation: A Comprehensive Survey",
  abstract: "This paper presents a comprehensive survey of deep learning methods applied to medical image segmentation. We review convolutional neural network architectures, transformer-based models, and hybrid approaches that have achieved state-of-the-art performance across various medical imaging modalities including CT, MRI, and X-ray. Our analysis covers 150+ papers published between 2019-2025, categorizing methods by architecture type, loss function design, and data augmentation strategies. We identify key challenges including limited annotated data, class imbalance, and domain shift, while proposing future research directions.",
  keywords: "Deep Learning, Medical Image Segmentation, Convolutional Neural Networks, U-Net, Transformer, Transfer Learning",
  introduction: "Medical image segmentation is a fundamental task in computer-aided diagnosis and treatment planning. The accurate delineation of anatomical structures and pathological regions from medical images enables clinicians to make informed decisions about patient care.\n\nRecent advances in deep learning have revolutionized this field, with methods consistently outperforming traditional approaches based on thresholding, region growing, and atlas-based techniques. The introduction of U-Net by Ronneberger et al. (2015) marked a paradigm shift, demonstrating that encoder-decoder architectures with skip connections could achieve remarkable segmentation accuracy even with limited training data.",
};

export default function PaperEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";

  const [selectedJournal, setSelectedJournal] = useState(isNew ? "" : "ieee");
  const [sections, setSections] = useState(
    defaultSections.map((s) => ({
      ...s,
      content: isNew ? "" : (sampleContent[s.id] || ""),
    }))
  );
  const [activeSection, setActiveSection] = useState("title");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [showJournalPicker, setShowJournalPicker] = useState(isNew);

  const currentSection = sections.find((s) => s.id === activeSection);

  const updateContent = (content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === activeSection ? { ...s, content } : s))
    );
  };

  const filledSections = sections.filter((s) => s.content.trim()).length;

  if (showJournalPicker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          className="max-w-2xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-8 text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Create New Paper</h1>
          <p className="text-muted-foreground text-lg mb-10">Select your target journal to load the correct template and formatting rules.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {journalOptions.map((j) => (
              <button
                key={j.id}
                onClick={() => {
                  setSelectedJournal(j.id);
                  setShowJournalPicker(false);
                }}
                className={`group rounded-xl border-2 p-6 text-left transition-all hover:shadow-card-hover ${
                  selectedJournal === j.id
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-accent/30"
                }`}
              >
                <span className={`inline-block rounded-md border px-3 py-1 text-sm font-semibold ${j.color}`}>
                  {j.name}
                </span>
                <p className="mt-3 text-sm text-muted-foreground">
                  {j.name} formatted template with proper citation style, margins, and section structure.
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left sidebar - sections */}
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

        {/* Journal badge */}
        <div className="px-4 pt-4 pb-2">
          <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
            journalOptions.find((j) => j.id === selectedJournal)?.color || ""
          }`}>
            {journalOptions.find((j) => j.id === selectedJournal)?.name || "Journal"}
          </span>
          <div className="mt-2 text-xs text-muted-foreground">
            {filledSections}/{sections.length} sections
          </div>
          <div className="mt-1 h-1 rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(filledSections / sections.length) * 100}%` }} />
          </div>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors mb-0.5 ${
                activeSection === s.id
                  ? "bg-accent/10 text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.content.trim() ? (
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
              )}
              {s.label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
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
        <div className="border-b border-border bg-card px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[Bold, Italic, Underline, AlignLeft, List, Quote, Type].map((Icon, i) => (
              <button key={i} className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowAiPanel(!showAiPanel)}>
              <Sparkles className="h-4 w-4 text-accent" /> AI Assistant
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="hero" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-10 px-8">
              <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  {currentSection?.label}
                </h2>
                <textarea
                  className="w-full min-h-[400px] resize-none bg-transparent text-foreground leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 font-body"
                  placeholder={`Start writing your ${currentSection?.label.toLowerCase()}...`}
                  value={currentSection?.content || ""}
                  onChange={(e) => updateContent(e.target.value)}
                />
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
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Quick Actions</p>
                    {["Generate this section", "Improve writing style", "Add citations", "Make more concise", "Expand with details"].map((action) => (
                      <button
                        key={action}
                        className="block w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent/10 hover:text-accent-foreground transition-colors mt-1"
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-sm">
                    <p className="text-accent-foreground font-medium flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> AI Chat
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Ask me to rewrite, improve, or generate content for your paper.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Ask AI..."
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                    />
                    <Button variant="hero" size="icon" className="shrink-0 h-9 w-9">
                      <Send className="h-4 w-4" />
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
