import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Image, Code, Download, Copy, RefreshCw, Cpu, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDiagram, type DiagramResult } from "@/lib/ai";
import { toast } from "sonner";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
});

type DiagramGeneratorProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  domain: string;
  section: string;
  sectionLabel: string;
  methodology: string;
  results_summary: string;
  onDiagramGenerated?: (section: string, data: { type: "mermaid" | "image"; code?: string; imageData?: string; caption: string; svg?: string }) => void;
};

const DIAGRAM_TYPES_SOFTWARE = [
  "Flowchart", "Architecture Diagram", "Sequence Diagram", "Class Diagram",
  "State Diagram", "Data Flow Diagram", "Activity Diagram", "Use Case Diagram",
];

const DIAGRAM_TYPES_HARDWARE = [
  "Block Diagram", "Circuit Diagram", "Pin Diagram", "Schematic",
  "Timing Diagram", "State Machine", "Wiring Diagram", "PCB Layout",
];

export default function DiagramGenerator({
  show, onClose, title, domain, section, sectionLabel,
  methodology, results_summary, onDiagramGenerated,
}: DiagramGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<DiagramResult | null>(null);
  const [description, setDescription] = useState("");
  const [diagramType, setDiagramType] = useState("");
  const [forceType, setForceType] = useState<"hardware" | "software" | "mixed" | "">("");
  const [renderedSvg, setRenderedSvg] = useState("");
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Render mermaid when result changes
  useEffect(() => {
    if (result?.type === "mermaid" && result.code) {
      renderMermaid(result.code);
    }
  }, [result]);

  async function renderMermaid(code: string) {
    try {
      const { svg } = await mermaid.render("diagram-" + Date.now(), code);
      setRenderedSvg(svg);
    } catch (e) {
      console.error("Mermaid render error:", e);
      setRenderedSvg("");
      toast.error("Diagram rendering failed. Trying to fix...");
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error("Paper title is required"); return; }
    setIsGenerating(true);
    setResult(null);
    setRenderedSvg("");

    try {
      const res = await generateDiagram({
        title, domain, section, methodology, results_summary,
        description: description || undefined,
        diagram_type: diagramType || undefined,
        force_type: forceType || undefined,
      });
      setResult(res);
      toast.success(`${res.paperType} diagram generated!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Diagram generation failed");
    }
    setIsGenerating(false);
  };

  const handleCopyMermaid = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      toast.success("Mermaid code copied!");
    }
  };

  const handleDownload = () => {
    if (result?.type === "image" && result.imageData) {
      const link = document.createElement("a");
      link.href = result.imageData;
      link.download = `diagram-${section}.png`;
      link.click();
    } else if (renderedSvg) {
      const blob = new Blob([renderedSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diagram-${section}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const detectedType = result?.paperType;
  const diagramOptions = forceType === "hardware" ? DIAGRAM_TYPES_HARDWARE
    : forceType === "software" ? DIAGRAM_TYPES_SOFTWARE
    : [...DIAGRAM_TYPES_SOFTWARE, ...DIAGRAM_TYPES_HARDWARE];

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card rounded-2xl border border-border shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Image className="h-5 w-5 text-accent" /> Generate Diagram — {sectionLabel}
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Paper type override */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Paper Type</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: "", label: "Auto-Detect", icon: RefreshCw },
                  { value: "software", label: "Software", icon: Monitor },
                  { value: "hardware", label: "Hardware", icon: Cpu },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setForceType(value as any)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      forceType === value
                        ? "border-accent bg-accent/10 text-accent-foreground font-medium"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagram type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Diagram Type</label>
              <div className="flex gap-2 flex-wrap">
                {diagramOptions.map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDiagramType(dt === diagramType ? "" : dt)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      diagramType === dt
                        ? "border-accent bg-accent/10 text-accent-foreground font-medium"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
              <textarea
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                placeholder="Describe what the diagram should show... e.g., 'Data flow from input preprocessing through the CNN layers to final classification output'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Generate button */}
            <Button variant="hero" className="w-full gap-2" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
              {isGenerating ? "Generating Diagram..." : "Generate Diagram"}
            </Button>

            {/* Result */}
            {result && (
              <div className="space-y-3">
                {/* Detected type badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    detectedType === "hardware" ? "bg-orange-500/10 text-orange-700 border-orange-200"
                    : detectedType === "software" ? "bg-blue-500/10 text-blue-700 border-blue-200"
                    : "bg-purple-500/10 text-purple-700 border-purple-200"
                  }`}>
                    {detectedType === "hardware" ? <Cpu className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {detectedType} paper
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    result.type === "mermaid" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                    : "bg-violet-500/10 text-violet-700 border-violet-200"
                  }`}>
                    {result.type === "mermaid" ? <Code className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                    {result.type === "mermaid" ? "Mermaid Diagram" : "AI Image"}
                  </span>
                </div>

                {/* Diagram display */}
                <div className="rounded-xl border border-border bg-background p-4 overflow-auto">
                  {result.type === "mermaid" && renderedSvg ? (
                    <div
                      ref={mermaidRef}
                      className="flex justify-center"
                      dangerouslySetInnerHTML={{ __html: renderedSvg }}
                    />
                  ) : result.type === "mermaid" && result.code ? (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{result.code}</pre>
                  ) : result.type === "image" && result.imageData ? (
                    <img src={result.imageData} alt={result.caption} className="max-w-full mx-auto rounded-lg" />
                  ) : null}
                </div>

                {/* Caption */}
                <p className="text-sm text-muted-foreground italic text-center">{result.caption}</p>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  {result.type === "mermaid" && result.code && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyMermaid}>
                      <Copy className="h-3.5 w-3.5" /> Copy Code
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleGenerate} disabled={isGenerating}>
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
