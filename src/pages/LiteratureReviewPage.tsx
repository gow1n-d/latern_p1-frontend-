import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronLeft, Download, Sparkles, FileText,
  X, Loader2, Upload, FileUp, Copy, Trash2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { generateSection, stripMarkdown } from "@/lib/ai";

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || "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";
const NVIDIA_BASE_URL = "/api/nvidia/v1";

type StreamOptions = {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
};

async function generateLiteratureReview(
  params: {
    topic: string;
    domain: string;
    instructions: string;
    reference_papers: { name: string; content: string }[];
  },
  opts: StreamOptions
) {
  try {
    let refsCtx = "";
    if (params.reference_papers.length > 0) {
      refsCtx = `\n\n## Uploaded Reference Papers:\nThe user has uploaded the following reference papers. You MUST thoroughly analyze each paper and synthesize their findings, methodologies, contributions, and limitations into a cohesive, well-structured literature review.\n\n`;
      params.reference_papers.forEach((p, i) => {
        refsCtx += `--- Source ${i + 1}: ${p.name} ---\n${p.content.slice(0, 12000)}\n\n`;
      });
    }

    const systemPrompt = `You are an elite academic writer specializing in comprehensive literature reviews. You produce publication-quality literature reviews that are:
1. Well-structured with clear thematic or chronological organization
2. Critically analytical — not just summarizing but comparing, contrasting, and synthesizing findings
3. Written in formal academic prose with proper citation references
4. Identifying research gaps, trends, and future directions
5. Using proper transition sentences between paragraphs and themes

Structure the literature review with clear subsections. Use bracketed citation references [1], [2], etc. that correspond to the uploaded papers. End with a synthesis paragraph identifying gaps and future directions.

Do NOT use markdown formatting like bold (**), italics (*), or hash headings (###). Use plain text section headers on their own line.`;

    const prompt = `Write a comprehensive, publication-quality literature review on the topic: "${params.topic}"
Domain/Field: ${params.domain || "General"}
${params.instructions ? `\nSpecific Instructions: ${params.instructions}` : ""}
${refsCtx}

Write a thorough, well-cited academic literature review. Synthesize across all provided sources. Be analytical, not just descriptive.`;

    const resp = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LiteratureReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("");
  const [instructions, setInstructions] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [generatedReview, setGeneratedReview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  // File upload handler — multi-file
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";

    Array.from(files).forEach((file) => {
      const textTypes = [
        "text/plain", "text/csv", "text/tab-separated-values",
        "application/json", "text/markdown", "text/html",
        "application/xml", "text/xml"
      ];
      const isText = textTypes.includes(file.type) ||
        file.name.match(/\.(txt|csv|tsv|json|md|log|dat|xml|yaml|yml|ini|cfg|conf|tex|bib|py|r|m|sql)$/i);

      if (!isText) {
        toast.error(`"${file.name}" is not a supported text file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (!content?.trim()) {
          toast.error(`"${file.name}" is empty.`);
          return;
        }
        setUploadedFiles(prev => [...prev, { name: file.name, content }]);
        toast.success(`"${file.name}" uploaded successfully.`);
      };
      reader.onerror = () => toast.error(`Failed to read "${file.name}".`);
      reader.readAsText(file);
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Generate literature review
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error("Please enter a research topic"); return; }
    if (uploadedFiles.length === 0) { toast.error("Please upload at least one reference paper"); return; }

    setIsGenerating(true);
    setGeneratedReview("");
    setIsGenerated(false);
    let accumulated = "";

    await generateLiteratureReview(
      { topic, domain, instructions, reference_papers: uploadedFiles },
      {
        onDelta: (text) => {
          accumulated += text;
          setGeneratedReview(stripMarkdown(accumulated));
        },
        onDone: () => {
          setIsGenerating(false);
          setIsGenerated(true);
          toast.success("Literature review generated!");
        },
        onError: (err) => {
          setIsGenerating(false);
          if (accumulated) setIsGenerated(true);
          toast.error(err);
        },
      }
    );
  }, [topic, domain, instructions, uploadedFiles]);

  // Export handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReview);
    toast.success("Copied to clipboard!");
  };

  const handleExportText = () => {
    const blob = new Blob([generatedReview], { type: "text/plain" });
    const safeName = topic.replace(/[^a-z0-9]/gi, "_").slice(0, 50) || "literature_review";
    downloadBlob(blob, `${safeName}_Literature_Review.txt`);
    toast.success("Exported as text file!");
  };

  const handleExportWord = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");
      const paragraphs: any[] = [];

      // Title
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: "Literature Review", bold: true, size: 32, font: "Times New Roman" })],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: topic, size: 26, font: "Times New Roman", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }));
      // Separator
      paragraphs.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" } },
        spacing: { after: 300 },
      }));

      // Content
      const lines = generatedReview.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
          continue;
        }
        // Detect section headers (lines that are all uppercase or very short standalone lines)
        const isHeader = trimmed.length < 80 && (trimmed === trimmed.toUpperCase() || /^[A-Z]/.test(trimmed)) && !trimmed.includes(".") && !trimmed.includes(",") && trimmed.split(" ").length <= 8;
        if (isHeader && trimmed.length > 2) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 24, font: "Times New Roman" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }));
        } else {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmed, size: 24, font: "Times New Roman" })],
            spacing: { after: 120, line: 360 },
            alignment: AlignmentType.JUSTIFIED,
          }));
        }
      }

      // References section
      if (uploadedFiles.length > 0) {
        paragraphs.push(new Paragraph({ spacing: { before: 400 } }));
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "REFERENCES", bold: true, size: 24, font: "Times New Roman" })],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 150 },
        }));
        uploadedFiles.forEach((f, i) => {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `[${i + 1}] ${f.name}`, size: 22, font: "Times New Roman" })],
            spacing: { after: 80 },
          }));
        });
      }

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      });
      const blob = await Packer.toBlob(doc);
      const safeName = topic.replace(/[^a-z0-9]/gi, "_").slice(0, 50) || "literature_review";
      downloadBlob(blob, `${safeName}_Literature_Review.docx`);
      toast.success("Exported as Word document!");
    } catch (err) {
      toast.error("Word export failed. Try text export instead.");
    }
  };

  const wordCount = generatedReview.trim() ? generatedReview.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="font-display text-lg font-bold text-foreground">Literature Review Generator</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left Panel — Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Research Topic *</label>
                <input
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  placeholder="e.g., Machine Learning for Battery State-of-Health Prediction"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Domain / Field</label>
                <input
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  placeholder="e.g., Electrical Engineering, Computer Science"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Additional Instructions</label>
                <textarea
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none h-24"
                  placeholder="e.g., Focus on deep learning approaches published after 2020. Include comparison tables."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div className="border border-blue-500/20 rounded-xl overflow-hidden bg-blue-500/5">
                <div className="bg-blue-500/10 px-4 py-2.5 border-b border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm text-foreground">Reference Papers *</span>
                    {uploadedFiles.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5">
                        {uploadedFiles.length}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3" /> Add Files
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {uploadedFiles.map((file, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">({(file.content.length / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Remove">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 p-6 text-center hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors group"
                    >
                      <FileUp className="h-8 w-8 text-blue-500/50 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-foreground">Upload Reference Papers</p>
                      <p className="text-xs text-muted-foreground mt-1">Select multiple .txt, .md, .tex, .bib, .csv files</p>
                    </button>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                variant="hero"
                className="w-full gap-2 py-6 text-base font-semibold"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || uploadedFiles.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Literature Review...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Literature Review
                  </>
                )}
              </Button>

            </motion.div>
          </div>

          {/* Right Panel — Output */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-border rounded-xl bg-card shadow-sm overflow-hidden h-full flex flex-col"
            >
              {/* Output header */}
              <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm text-foreground">Generated Literature Review</span>
                  {isGenerated && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  )}
                </div>
                {generatedReview && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{wordCount} words</span>
                    <div className="h-4 w-px bg-border" />
                    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Output content */}
              <div className="flex-1 overflow-y-auto p-6">
                {generatedReview ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-body" style={{ fontFamily: "'Times New Roman', Georgia, serif", lineHeight: "1.8" }}>
                      {generatedReview}
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    </div>
                    <p className="text-foreground font-medium">Analyzing your reference papers...</p>
                    <p className="text-sm text-muted-foreground mt-1">Synthesizing findings into a comprehensive literature review</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-foreground font-medium">Your literature review will appear here</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload reference papers and click Generate to start</p>
                  </div>
                )}
              </div>

              {/* Export bar */}
              {isGenerated && generatedReview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between"
                >
                  <span className="text-xs text-muted-foreground font-medium">Export your literature review</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportText}>
                      <Download className="h-3.5 w-3.5" /> .txt
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportWord}>
                      <Download className="h-3.5 w-3.5" /> .docx
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".txt,.csv,.tsv,.json,.md,.log,.dat,.xml,.yaml,.yml,.ini,.cfg,.conf,.tex,.bib,.py,.r,.m,.sql"
        onChange={handleFileUpload}
      />
    </div>
  );
}
