import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, SectionType, ImageRun, convertInchesToTwip } from "docx";
import type { PaperSection } from "@/hooks/usePapers";
import mermaid from "mermaid";

type AuthorInfo = {
  authorNames?: string[];
  department?: string;
  institution?: string;
  city?: string;
  email?: string;
};

type JournalConfig = {
  columns: 1 | 2;
  titleSize: number;
  bodySize: number;
  headingSize: number;
  headingStyle: "roman" | "numeric" | "plain";
  abstractStyle: "italic" | "normal";
  journalHeader?: string;
  lineSpacing: number;
};

// ── Unified config — IDENTICAL to PaperPreview.tsx ──
const CONFIGS: Record<string, JournalConfig> = {
  ieee:          { columns: 2, titleSize: 22, bodySize: 9.5, headingSize: 9.5, headingStyle: "roman", abstractStyle: "italic", lineSpacing: 1.12 },
  "ieee-conf":   { columns: 2, titleSize: 22, bodySize: 9.5, headingSize: 9.5, headingStyle: "roman", abstractStyle: "italic", lineSpacing: 1.12 },
  acm:           { columns: 2, titleSize: 20, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", journalHeader: "ACM", lineSpacing: 1.15 },
  "acm-conf":    { columns: 2, titleSize: 20, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", journalHeader: "ACM CONFERENCE", lineSpacing: 1.15 },
  cvpr:          { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", journalHeader: "CVPR", lineSpacing: 1.12 },
  aaai:          { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", journalHeader: "AAAI", lineSpacing: 1.12 },
  acl:           { columns: 2, titleSize: 18, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", journalHeader: "ACL ANTHOLOGY", lineSpacing: 1.15 },
  jama:          { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "plain", abstractStyle: "normal", journalHeader: "JAMA", lineSpacing: 1.12 },
  pnas:          { columns: 2, titleSize: 20, bodySize: 9, headingSize: 9, headingStyle: "plain", abstractStyle: "normal", journalHeader: "PNAS", lineSpacing: 1.12 },
  "world-scientific": { columns: 2, titleSize: 18, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.12 },
  interspeech:   { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.12 },
  icassp:        { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "roman", abstractStyle: "italic", journalHeader: "ICASSP", lineSpacing: 1.12 },
  eccv:          { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.12 },
  sigmod:        { columns: 2, titleSize: 18, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  vldb:          { columns: 2, titleSize: 18, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  www:           { columns: 2, titleSize: 18, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  kdd:           { columns: 2, titleSize: 18, bodySize: 9, headingSize: 9, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  ijcai:         { columns: 2, titleSize: 20, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.12 },
  coling:        { columns: 2, titleSize: 18, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  naacl:         { columns: 2, titleSize: 18, bodySize: 9.5, headingSize: 9.5, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.15 },
  // Single-column formats
  springer:      { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  elsevier:      { columns: 1, titleSize: 20, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  nature:        { columns: 1, titleSize: 22, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  science:       { columns: 1, titleSize: 20, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  neurips:       { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  icml:          { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  iclr:          { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  wiley:         { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  "taylor-francis": { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  sage:          { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  mdpi:          { columns: 1, titleSize: 16, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  plos:          { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  frontiers:     { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  bmc:           { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  hindawi:       { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "oxford-academic": { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  "cambridge-up": { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "royal-society": { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "de-gruyter":  { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "emerald-insight": { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  "ios-press":   { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  lancet:        { columns: 1, titleSize: 20, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  bmj:           { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  nejm:          { columns: 1, titleSize: 20, bodySize: 10, headingSize: 10, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  cell:          { columns: 1, titleSize: 20, bodySize: 11, headingSize: 11, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  lippincott:    { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  karger:        { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "thieme-medical": { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  miccai:        { columns: 1, titleSize: 18, bodySize: 10, headingSize: 10, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  apa7:          { columns: 1, titleSize: 18, bodySize: 12, headingSize: 12, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  chicago:       { columns: 1, titleSize: 18, bodySize: 12, headingSize: 12, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  mla:           { columns: 1, titleSize: 16, bodySize: 12, headingSize: 12, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  harvard:       { columns: 1, titleSize: 18, bodySize: 12, headingSize: 12, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  vancouver:     { columns: 1, titleSize: 18, bodySize: 12, headingSize: 12, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  turabian:      { columns: 1, titleSize: 18, bodySize: 12, headingSize: 12, headingStyle: "plain", abstractStyle: "normal", lineSpacing: 1.5 },
  scopus:        { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
  "web-of-science": { columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric", abstractStyle: "normal", lineSpacing: 1.5 },
};

const DEFAULT_CONFIG: JournalConfig = {
  columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric",
  abstractStyle: "normal", lineSpacing: 1.5,
};

function getConfig(journal: string): JournalConfig {
  return CONFIGS[journal] || DEFAULT_CONFIG;
}

function toRoman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
  return result;
}

const NON_BODY = ["title", "abstract", "keywords", "references", "works-cited", "bibliography", "reference-list", "ccs-concepts", "highlights"];

// Global image/diagram PNG cache — shared across exports
const pngCache = new Map<string, string>();

/** Extract width/height from a base64 PNG/JPEG data URL. Returns default if unable to parse. */
function getImageDimensions(dataUrl: string): { w: number; h: number } {
  try {
    // Try to decode from the PNG IHDR chunk (bytes 16-23 contain width and height as 4-byte big-endian)
    const raw = atob(dataUrl.split(",")[1] || "");
    if (raw.length > 24 && raw.charCodeAt(1) === 0x50 /* P */ && raw.charCodeAt(2) === 0x4E /* N */ && raw.charCodeAt(3) === 0x47 /* G */) {
      const w = (raw.charCodeAt(16) << 24) | (raw.charCodeAt(17) << 16) | (raw.charCodeAt(18) << 8) | raw.charCodeAt(19);
      const h = (raw.charCodeAt(20) << 24) | (raw.charCodeAt(21) << 16) | (raw.charCodeAt(22) << 8) | raw.charCodeAt(23);
      if (w > 0 && w < 10000 && h > 0 && h < 10000) return { w, h };
    }
  } catch {}
  return { w: 800, h: 500 }; // Safe default — roughly 1.6:1 landscape
}

/** Pre-cache a diagram PNG so exports are instant. Call this when a diagram is first generated. */
export async function preCacheDiagramPng(diagram: { type: "mermaid" | "image"; svg?: string; imageData?: string; code?: string }): Promise<void> {
  try {
    await ensurePng(diagram);
  } catch {
    // Silently ignore — cache miss at export time will retry
  }
}

// ── PDF line height ──
function lineH(fontSize: number, lineSpacing: number): number {
  return fontSize * 0.3528 * lineSpacing;
}

// ── SVG/Image Helper Functions ──
function extractMermaidFromContent(content: string): string | null {
  const match = content.match(/```mermaid\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

async function getDiagramForSection(s: PaperSection): Promise<{ type: "mermaid" | "image"; svg?: string; imageData?: string; caption: string; width?: string } | null> {
  if (s.diagram) return { ...s.diagram, width: s.diagram.width };
  
  const mermaidCode = extractMermaidFromContent(s.content);
  if (mermaidCode) {
    try {
      const uniqueId = `export-inline-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, mermaidCode);
      return { type: "mermaid", svg, caption: `Figure for ${s.label}` };
    } catch (e) {
      console.error("Failed to render inline export mermaid:", e);
    }
  }
  
  const imgMatch = s.content.match(/!\[(.*?)\]\((.*?)\)/);
  if (imgMatch) {
    return { type: "image", imageData: imgMatch[2], caption: imgMatch[1] || `Figure for ${s.label}` };
  }
  
  return null;
}

function svgToPng(svgString: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const cleanSvg = svgString.trim();
      const blob = new Blob([cleanSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const widthMatch = cleanSvg.match(/width=["'](\d+(?:\.\d+)?)px["']/i) || cleanSvg.match(/width=["'](\d+(?:\.\d+)?)["']/i);
        const heightMatch = cleanSvg.match(/height=["'](\d+(?:\.\d+)?)px["']/i) || cleanSvg.match(/height=["'](\d+(?:\.\d+)?)["']/i);
        const w = Math.min(widthMatch ? parseFloat(widthMatch[1]) : 600, 800);
        const h = Math.min(heightMatch ? parseFloat(heightMatch[1]) : 400, 600);
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngData = canvas.toDataURL("image/png", 0.92);
          URL.revokeObjectURL(url);
          resolve(pngData);
        } else {
          URL.revokeObjectURL(url);
          reject(new Error("Could not get canvas context"));
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
}

function imageUrlToPng(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Image load timed out after 800ms"));
    }, 800);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context failed"));
      }
    };
    img.onerror = (e) => {
      clearTimeout(timer);
      reject(e);
    };
    img.src = url;
  });
}

async function ensurePng(diagram: { type: "mermaid" | "image"; svg?: string; imageData?: string }): Promise<string | null> {
  const cacheKey = diagram.type === "mermaid" ? diagram.svg || "" : diagram.imageData || "";
  if (!cacheKey) return null;

  if (pngCache.has(cacheKey)) {
    return pngCache.get(cacheKey)!;
  }

  let pngData: string | null = null;
  if (diagram.type === "mermaid" && diagram.svg) {
    try {
      pngData = await svgToPng(diagram.svg);
    } catch (e) {
      console.error("Failed to convert Mermaid SVG to PNG:", e);
    }
  } else if (diagram.type === "image" && diagram.imageData) {
    if (diagram.imageData.startsWith("data:")) {
      pngData = diagram.imageData;
    } else {
      try {
        pngData = await imageUrlToPng(diagram.imageData);
      } catch (e) {
        console.error("Failed to convert image URL to PNG:", e);
      }
    }
  }

  if (pngData) {
    pngCache.set(cacheKey, pngData);
  }
  return pngData;
}

// ── PDF export ──
export async function exportToPDF(
  sections: PaperSection[],
  journal: string,
  paperTitle: string,
  author?: AuthorInfo,
  onProgress?: (step: number) => void,
  skipDiagrams?: boolean
): Promise<Blob> {
  onProgress?.(1); // Step 1: Analyzing document structure
  const config = getConfig(journal);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();  // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  const margin = config.columns === 2 ? 15 : 20;
  const contentW = pw - margin * 2;
  const lh = lineH(config.bodySize, config.lineSpacing);
  const headLh = lineH(config.headingSize, 1.2);
  let y = margin;

  const bottomMargin = ph - margin;
  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > bottomMargin) addPage(); };

  // ── Journal header ──
  if (config.journalHeader) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(136);
    doc.text(config.journalHeader, pw / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 4;
    doc.setDrawColor(204);
    doc.line(margin, y, pw - margin, y);
    y += 4;
  }

  // ── Title ──
  const titleSection = sections.find((s) => s.id === "title");
  const titleText = (titleSection?.content || "Untitled").split("\n")[0].slice(0, 300);
  doc.setFontSize(config.titleSize);
  doc.setFont("times", "bold");
  const titleLines = doc.splitTextToSize(titleText, contentW * 0.85);
  const titleLh = lineH(config.titleSize, 1.18);
  checkSpace(titleLines.length * titleLh + 4);
  for (let i = 0; i < titleLines.length; i++) {
    doc.text(titleLines[i], pw / 2, y, { align: "center" });
    y += titleLh;
  }
  y += 3;

  // ── Authors ──
  const names = author?.authorNames?.filter(n => n.trim()) || [];
  if (names.length > 0) {
    doc.setFontSize(10);
    doc.setFont("times", "italic");
    doc.text(names.join(", "), pw / 2, y, { align: "center" });
    y += 4;
    const affiliation = [author?.department, author?.institution, author?.city].filter(Boolean).join(", ");
    if (affiliation) {
      doc.setFontSize(8.5);
      doc.setFont("times", "italic");
      doc.setTextColor(51);
      doc.text(affiliation, pw / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 3.5;
    }
    if (author?.email) {
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.setTextColor(68);
      doc.text(author.email, pw / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 3.5;
    }
  }

  y += 2;
  doc.setDrawColor(102);
  doc.line(margin, y, pw - margin, y);
  y += 3;

  // ── Abstract (full-width always) ──
  const abstractSec = sections.find((s) => s.id === "abstract");
  if (abstractSec?.content.trim()) {
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    doc.text("Abstract", margin, y);
    y += headLh + 1;
    doc.setFontSize(config.bodySize);
    doc.setFont("times", config.abstractStyle === "italic" ? "italic" : "normal");
    const absLines = doc.splitTextToSize(abstractSec.content, contentW);
    for (const line of absLines) {
      checkSpace(lh);
      doc.text(line, margin, y);
      y += lh;
    }
    y += 2;
  }

  // ── Keywords ──
  const kwSec = sections.find((s) => s.id === "keywords");
  if (kwSec?.content.trim()) {
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "bolditalic");
    const kwLabel = journal.startsWith("ieee") || journal === "icassp" ? "Index Terms" : "Keywords";
    doc.text(`${kwLabel}—`, margin, y);
    const labelW = doc.getTextWidth(`${kwLabel}—`);
    doc.setFont("times", "italic");
    const kwLines = doc.splitTextToSize(kwSec.content, contentW - labelW);
    doc.text(kwLines[0], margin + labelW, y);
    y += lh;
    for (let i = 1; i < kwLines.length; i++) {
      doc.text(kwLines[i], margin, y);
      y += lh;
    }
    y += 2;
  }

  doc.setDrawColor(204);
  doc.line(margin, y, pw - margin, y);
  y += 3;

  // ── Body sections ──
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && (s.content.trim() || s.diagram || (s.diagrams && s.diagrams.length > 0)));
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  onProgress?.(2); // Step 2: Rendering diagrams & images
  const sectionDiagramPngs: Record<string, (string | null)[]> = {};
  const sectionDiagramInfos: Record<string, any[]> = {};
  if (!skipDiagrams) {
    const promises = bodySections.map(async (s) => {
      const diags = s.diagrams || (s.diagram ? [s.diagram] : []);
      if (diags.length > 0) {
        sectionDiagramInfos[s.id] = diags;
        const pngs = await Promise.all(diags.map(async (d) => {
          if (d.imageData && d.imageData.startsWith("data:")) return d.imageData;
          return ensurePng(d);
        }));
        sectionDiagramPngs[s.id] = pngs;
      }
    });
    await Promise.all(promises);
  }

  onProgress?.(3); // Step 3: Laying out pages
  if (config.columns === 2) {
    renderTwoColumn(doc, bodySections, refSection, config, margin, pw, ph, y, sectionDiagramPngs, sectionDiagramInfos);
  } else {
    renderSingleColumn(doc, bodySections, refSection, config, margin, contentW, pw, ph, y, sectionDiagramPngs, sectionDiagramInfos);
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(187);
    doc.text("Manuscript — PaperForge", margin, ph - 8);
    doc.text(`${i}`, pw - margin, ph - 8, { align: "right" });
    doc.setTextColor(0);
  }

  onProgress?.(4); // Step 4: Generating & saving file
  return doc.output("blob");
}

function renderSingleColumn(
  doc: jsPDF, bodySections: PaperSection[], refSection: PaperSection | undefined,
  config: JournalConfig, margin: number, contentW: number, pw: number, ph: number, y: number,
  sectionDiagramPngs: Record<string, (string | null)[]>, sectionDiagramInfos: Record<string, any[]>
) {
  const lh = lineH(config.bodySize, config.lineSpacing);
  const headLhVal = lineH(config.headingSize, 1.2);
  const bottomLimit = ph - margin;
  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > bottomLimit) addPage(); };

  let sectionNum = 0;
  let figureNum = 0;
  for (const section of bodySections) {
    sectionNum++;
    const minKeepTogether = headLhVal + 1 + lh * 2;
    checkSpace(minKeepTogether);

    // Heading
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const headText = config.headingStyle === "roman" ? section.label.toUpperCase() : section.label;
    doc.text(`${prefix}${headText}`, margin, y);
    y += headLhVal + 1;

    // Body paragraphs
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "normal");
    const cleanContent = section.content.replace(/```mermaid[\s\S]*?```/g, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
    const paras = cleanContent.split(/\n\s*\n/).filter(Boolean).map(p => p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim());
    for (let pi = 0; pi < paras.length; pi++) {
      const indent = pi > 0 ? 5 : 0;
      const lines = doc.splitTextToSize(paras[pi], contentW - indent);
      for (let li = 0; li < lines.length; li++) {
        checkSpace(lh);
        doc.text(lines[li], margin + (li === 0 ? indent : 0), y);
        y += lh;
      }
      y += 1.5;
    }

    // Add diagrams in layout flow
    const pngs = sectionDiagramPngs[section.id];
    const diags = sectionDiagramInfos[section.id];
    if (pngs && diags) {
      for (let i = 0; i < pngs.length; i++) {
        const pngData = pngs[i];
        const diagram = diags[i];
        if (pngData && diagram) {
          figureNum++;
          const dims = getImageDimensions(pngData);
          const aspectRatio = dims.h / dims.w;
          const widthPercent = diagram.width ? parseFloat(diagram.width) / 100 : 0.85;
          const imgW = contentW * Math.min(widthPercent, 1.0);
          const imgH = Math.min(imgW * aspectRatio, (ph - margin * 2) * 0.45);
          checkSpace(imgH + 10);
          try {
            doc.addImage(pngData, "PNG", margin + (contentW - imgW) / 2, y, imgW, imgH);
            y += imgH + 2.5;
            
            doc.setFontSize(config.bodySize - 1);
            doc.setFont("times", "italic");
            const captionText = `Fig. ${figureNum}. ${diagram.caption || `${section.label} diagram`}`;
            const captionLines = doc.splitTextToSize(captionText, contentW);
            for (const line of captionLines) {
              checkSpace(lh);
              doc.text(line, pw / 2, y, { align: "center" });
              y += lh;
            }
            y += 4;
          } catch (e) {
            console.error("Failed to add image to PDF:", e);
          }
        }
      }
    }
    y += 2.5;
  }

  // References
  if (refSection?.content.trim()) {
    const refHeadKeep = headLhVal + 1 + lineH(config.bodySize - 1, 1.25) * 2;
    checkSpace(refHeadKeep);
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    doc.text(config.headingStyle === "roman" ? "REFERENCES" : "References", margin, y);
    y += headLhVal + 1;

    const refLh = lineH(config.bodySize - 1, 1.25);
    const refLines = refSection.content.split("\n").filter(Boolean);
    doc.setFontSize(config.bodySize - 1);
    doc.setFont("times", "normal");
    refLines.forEach((r, i) => {
      const cleaned = r.replace(/^\[\d+\]\s*/, "");
      const refText = `[${i + 1}] ${cleaned}`;
      const wrapped = doc.splitTextToSize(refText, contentW - 5);
      const refEntryH = wrapped.length * refLh + 0.5;
      checkSpace(Math.min(refEntryH, lh * 3));
      for (let li = 0; li < wrapped.length; li++) {
        checkSpace(refLh);
        doc.text(wrapped[li], margin + (li === 0 ? 0 : 5), y);
        y += refLh;
      }
      y += 0.5;
    });
  }
}

function renderTwoColumn(
  doc: jsPDF, bodySections: PaperSection[], refSection: PaperSection | undefined,
  config: JournalConfig, margin: number, pw: number, ph: number, startY: number,
  sectionDiagramPngs: Record<string, (string | null)[]>, sectionDiagramInfos: Record<string, any[]>
) {
  const gap = 5;
  const colW = (pw - margin * 2 - gap) / 2;
  const lh = lineH(config.bodySize, config.lineSpacing);
  const headLhVal = lineH(config.headingSize, 1.2);
  const bottomLimit = ph - margin;

  type Item = 
    | { type: "heading"; text: string } 
    | { type: "body"; text: string } 
    | { type: "gap"; h: number }
    | { type: "diagram"; diagram: any; pngData: string; sectionId: string };

  const items: Item[] = [];

  let sectionNum = 0;
  for (const section of bodySections) {
    sectionNum++;
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const headText = config.headingStyle === "roman" ? section.label.toUpperCase() : section.label;
    items.push({ type: "gap", h: 3 });
    items.push({ type: "heading", text: `${prefix}${headText}` });
    
    const cleanContent = section.content.replace(/```mermaid[\s\S]*?```/g, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
    const paras = cleanContent.split(/\n\s*\n/).filter(Boolean).map(p => p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim());
    for (const p of paras) {
      items.push({ type: "body", text: p });
    }

    const pngs = sectionDiagramPngs[section.id];
    const diags = sectionDiagramInfos[section.id];
    if (pngs && diags) {
      for (let i = 0; i < pngs.length; i++) {
        if (pngs[i] && diags[i]) {
          items.push({ type: "diagram", diagram: diags[i], pngData: pngs[i]!, sectionId: section.id });
        }
      }
    }
  }

  if (refSection?.content.trim()) {
    items.push({ type: "gap", h: 3 });
    items.push({ type: "heading", text: config.headingStyle === "roman" ? "REFERENCES" : "References" });
    const refLines = refSection.content.split("\n").filter(Boolean);
    refLines.forEach((r, i) => {
      const cleaned = r.replace(/^\[\d+\]\s*/, "");
      items.push({ type: "body", text: `[${i + 1}] ${cleaned}` });
    });
  }

  let col = 0;
  let y = startY;
  const colYStart = [startY, startY];

  const getX = () => margin + col * (colW + gap);

  const nextCol = () => {
    if (col === 0) {
      col = 1;
      y = colYStart[1];
    } else {
      doc.addPage();
      col = 0;
      y = margin;
      colYStart[0] = margin;
      colYStart[1] = margin;
    }
  };

  const checkCol = (needed: number) => {
    if (y + needed > bottomLimit) nextCol();
  };

  let figIndex = 0;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (item.type === "gap") {
      if (y + item.h < bottomLimit) {
        y += item.h;
      }
      continue;
    }

    if (item.type === "heading") {
      const followBodyH = lh * 2;
      checkCol(headLhVal + 0.5 + followBodyH);
      doc.setFontSize(config.headingSize);
      doc.setFont("times", "bold");
      doc.text(item.text, getX(), y);
      y += headLhVal + 0.5;
      continue;
    }

    if (item.type === "diagram") {
      const pngData = item.pngData;
      if (pngData) {
        figIndex++;
        const dims = getImageDimensions(pngData);
        const aspectRatio = dims.h / dims.w;
        // Use the width percentage from the editor (40%, 70%, 100%) instead of full column width
        const widthPercent = item.diagram.width ? parseFloat(item.diagram.width) / 100 : 1.0;
        const imgW = colW * Math.min(widthPercent, 1.0);
        const imgH = Math.min(imgW * aspectRatio, (bottomLimit - margin) * 0.4); // cap at 40% column height
        const imgX = getX() + (colW - imgW) / 2; // center the image within the column
        checkCol(imgH + 10);
        try {
          doc.addImage(pngData, "PNG", imgX, y, imgW, imgH);
          y += imgH + 2;
          
          doc.setFontSize(config.bodySize - 1);
          doc.setFont("times", "italic");
          const captionText = `Fig. ${figIndex}. ${item.diagram.caption || "Section diagram"}`;
          const captionLines = doc.splitTextToSize(captionText, colW);
          for (const line of captionLines) {
            checkCol(lh);
            doc.text(line, getX() + colW / 2, y, { align: "center" });
            y += lh;
          }
          y += 1.5;
        } catch (imgErr) {
          console.error("jsPDF addImage twoColumn error:", imgErr);
        }
      }
      continue;
    }

    // body text
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(item.text, colW);
    if (lines.length >= 2) {
      checkCol(lh * 2);
    }
    for (const line of lines) {
      checkCol(lh);
      doc.text(line, getX(), y);
      y += lh;
    }
    y += 0.3;
  }
}

// ── Text export (builds string only — no download) ──
export function buildTextContent(sections: PaperSection[]): string {
  return sections
    .filter((s) => s.content.trim())
    .map((s) => {
      let cleanContent = s.content.replace(/```mermaid[\s\S]*?```/g, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
      let sectionText = `\n${"=".repeat(60)}\n${s.label.toUpperCase()}\n${"=".repeat(60)}\n\n${cleanContent}`;
      
      const mermaidCode = extractMermaidFromContent(s.content);
      if (s.diagram) {
        if (s.diagram.type === "mermaid" && s.diagram.code) {
          sectionText += `\n\n[DIAGRAM: ${s.diagram.caption}]\n\`\`\`mermaid\n${s.diagram.code}\n\`\`\`\n`;
        } else {
          sectionText += `\n\n[IMAGE DIAGRAM: ${s.diagram.caption}]\nSource: ${s.diagram.imageData?.slice(0, 150)}...\n`;
        }
      } else if (mermaidCode) {
        sectionText += `\n\n[DIAGRAM]\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`;
      }
      return sectionText;
    })
    .join("\n\n");
}

export function exportToText(sections: PaperSection[], paperTitle: string) {
  const text = buildTextContent(sections);
  downloadBlob(new Blob([text], { type: "text/plain" }), paperTitle, "txt");
}

// ── Word export ──
function base64ToUint8Array(base64: string) {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function exportToWord(
  sections: PaperSection[],
  journal: string,
  paperTitle: string,
  author?: AuthorInfo,
  onProgress?: (step: number) => void,
  skipDiagrams?: boolean
): Promise<Blob> {
  onProgress?.(1);
  const config = getConfig(journal);
  const title = (sections.find((s) => s.id === "title")?.content || "Untitled").split("\n")[0];
  const abstractSec = sections.find((s) => s.id === "abstract");
  const kwSec = sections.find((s) => s.id === "keywords");
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && (s.content.trim() || s.diagram || (s.diagrams && s.diagrams.length > 0)));
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  const names = author?.authorNames?.filter(n => n.trim()) || [];
  const affiliation = [author?.department, author?.institution, author?.city].filter(Boolean).join(", ");

  const cleanSectionContent = (content: string, label: string) => {
    let clean = content.trim();
    const lines = clean.split('\n');
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const strippedFirst = firstLine.replace(/[*#]/g, '').trim();
      const labelClean = label.replace(/[*#]/g, '').trim();
      const normalize = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normalize(strippedFirst).includes(normalize(labelClean))) {
        if (strippedFirst.split(' ').length < labelClean.split(' ').length + 6) {
          lines.shift();
          clean = lines.join('\n').trim();
        }
      }
    }
    return clean;
  };

  let sectionNum = 0;
  const makeHeading = (label: string) => {
    sectionNum++;
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const text = config.headingStyle === "roman" ? label.toUpperCase() : label;
    return `${prefix}${text}`;
  };

  onProgress?.(2);
  const sectionDiagramPngs: Record<string, (string | null)[]> = {};
  const sectionDiagramInfos: Record<string, any[]> = {};
  if (!skipDiagrams) {
    const promises = bodySections.map(async (s) => {
      const diags = s.diagrams || (s.diagram ? [s.diagram] : []);
      if (diags.length > 0) {
        sectionDiagramInfos[s.id] = diags;
        const pngs = await Promise.all(diags.map(async (d) => {
          if (d.imageData && d.imageData.startsWith("data:")) return d.imageData;
          return ensurePng(d);
        }));
        sectionDiagramPngs[s.id] = pngs;
      }
    });
    await Promise.all(promises);
  }

  onProgress?.(3);
  let figureNum = 0;

  const titleChildren: any[] = [];
  if (config.journalHeader) {
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: config.journalHeader, color: "888888", size: 14, font: "Helvetica" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }
  titleChildren.push(new Paragraph({
    children: [new TextRun({ text: title, size: config.titleSize * 2, font: "Times New Roman" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }));
  if (names.length > 0) {
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: names.join(", "), italics: true, size: 20, font: "Times New Roman" })],
      alignment: AlignmentType.CENTER,
    }));
  }
  if (affiliation) {
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: affiliation, italics: true, size: 17, color: "333333", font: "Times New Roman" })],
      alignment: AlignmentType.CENTER,
    }));
  }
  if (author?.email) {
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: author.email, font: "Courier New", size: 16, color: "444444" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }

  if (abstractSec?.content.trim()) {
    titleChildren.push(new Paragraph({
      children: [
        new TextRun({ text: "Abstract", bold: true, size: config.headingSize * 2, font: "Times New Roman" }),
      ],
      spacing: { before: 200, after: 100 }
    }));
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: cleanSectionContent(abstractSec.content, "Abstract"), italics: config.abstractStyle === "italic", size: config.bodySize * 2, font: "Times New Roman" })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  if (kwSec?.content.trim()) {
    titleChildren.push(new Paragraph({
      children: [
        new TextRun({ text: (journal.startsWith("ieee") || journal === "icassp" ? "Index Terms" : "Keywords") + "—", bold: true, italics: true, size: config.bodySize * 2, font: "Times New Roman" }),
        new TextRun({ text: cleanSectionContent(kwSec.content, "Keywords"), italics: true, size: config.bodySize * 2, font: "Times New Roman" })
      ],
      spacing: { after: 200 }
    }));
  }

  const bodyChildren: any[] = [];
  bodySections.forEach((s) => {
    let cleanContent = s.content.replace(/```mermaid[\s\S]*?```/g, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
    cleanContent = cleanSectionContent(cleanContent, s.label);
    const paras = cleanContent.split(/\n\s*\n/).filter(Boolean).map(p => p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim());
    
    bodyChildren.push(new Paragraph({
      children: [new TextRun({ text: makeHeading(s.label), bold: true, size: config.headingSize * 2, font: "Times New Roman" })],
      spacing: { before: 200, after: 100 }
    }));

    paras.forEach((p, i) => {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: p, size: config.bodySize * 2, font: "Times New Roman" })],
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: i === 0 ? 0 : convertInchesToTwip(0.25) },
        spacing: { line: config.lineSpacing * 240 }
      }));
    });

    const diags = sectionDiagramInfos[s.id] || [];
    const pngs = sectionDiagramPngs[s.id] || [];
    diags.forEach((diagram, dIdx) => {
      const imgData = pngs[dIdx] || diagram.imageData;
      if (imgData) {
        figureNum++;
        let widthPercent = 0.85;
        if (diagram.width === "40%") widthPercent = 0.40;
        else if (diagram.width === "70%") widthPercent = 0.70;
        else if (diagram.width === "100%") widthPercent = 0.95;
        else if (diagram.width) widthPercent = parseFloat(diagram.width) / 100 || 0.85;

        try {
          let dims = { w: 400, h: 300 }; // Fallback dimensions
          try {
            dims = getImageDimensions(imgData);
          } catch (e) {
            console.warn("Failed to get image dimensions, using fallback");
          }
          
          const maxColWidthPx = config.columns === 2 ? 300 : 600;
          const explicitWidthPx = Math.round(maxColWidthPx * widthPercent);
          const h = Math.round(explicitWidthPx * (dims.h / dims.w));

          bodyChildren.push(new Paragraph({
            children: [
              new ImageRun({
                data: base64ToUint8Array(imgData),
                transformation: {
                  width: explicitWidthPx,
                  height: h
                },
                type: "png"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          }));

          bodyChildren.push(new Paragraph({
            children: [new TextRun({ text: `Fig. ${figureNum}. ${diagram.caption || "Generated diagram representation."}`, italics: true, size: Math.max((config.bodySize - 1) * 2, 16), color: "444444", font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }));
        } catch (e) {
          console.error("Failed to add image to word document:", e);
        }
      } else {
        figureNum++;
        bodyChildren.push(new Paragraph({
          children: [new TextRun({ text: `[Diagram rendering failed: Fig. ${figureNum}. ${diagram.caption}]`, italics: true, size: Math.max((config.bodySize - 1) * 2, 16), color: "FF0000", font: "Times New Roman" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }));
      }
    });
  });

  if (refSection?.content.trim()) {
    bodyChildren.push(new Paragraph({
      children: [new TextRun({ text: config.headingStyle === "roman" ? "REFERENCES" : "References", bold: true, size: config.headingSize * 2, font: "Times New Roman" })],
      spacing: { before: 200, after: 100 }
    }));

    refSection.content.split("\n").filter(Boolean).forEach((r, i) => {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: `[${i + 1}] ${r.replace(/^\[\d+\]\s*/, "")}`, size: Math.max(config.bodySize - 1, 8.5) * 2, font: "Times New Roman" })],
        indent: { left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.2) },
        spacing: { after: 60 }
      }));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          column: { space: convertInchesToTwip(0.25), count: 1, equalWidth: true }
        },
        children: titleChildren
      },
      {
        properties: {
          column: config.columns === 2 ? { space: convertInchesToTwip(0.25), count: 2, equalWidth: true } : undefined
        },
        children: bodyChildren
      }
    ]
  });

  onProgress?.(4);
  const wordBlob = await Packer.toBlob(doc);
  return wordBlob;
}

// ── LaTeX export (builds string only — no download) ──
export function buildLaTeXContent(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo): string {
  const title = (sections.find((s) => s.id === "title")?.content || "Untitled").split("\n")[0];
  const abstract = sections.find((s) => s.id === "abstract")?.content || "";
  const keywords = sections.find((s) => s.id === "keywords")?.content || "";
  const names = author?.authorNames?.filter(n => n.trim()) || [];

  const docClassMap: Record<string, string> = {
    ieee: "IEEEtran", "ieee-conf": "IEEEtran", acm: "acmart", "acm-conf": "acmart",
    neurips: "article", icml: "article", cvpr: "IEEEtran", aaai: "aaai",
    iclr: "article", acl: "acl", apa7: "apa7", mla: "article",
  };
  const docClass = docClassMap[journal] || "article";
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.content.trim());
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  let latex = `\\documentclass{${docClass}}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{amsmath}

\\title{${escapeLatex(title)}}
\\author{${names.length > 0 ? names.map(n => escapeLatex(n)).join(" \\and ") : "Author Name"}}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
${escapeLatex(abstract)}
\\end{abstract}

\\textbf{Keywords:} ${escapeLatex(keywords)}

`;

  for (const section of bodySections) {
    const cleanContent = section.content.replace(/```mermaid[\s\S]*?```/g, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
    latex += `\\section{${escapeLatex(section.label)}}\n${escapeLatex(cleanContent)}\n\n`;

    const diags = section.diagrams || (section.diagram ? [section.diagram] : []);
    diags.forEach((diagram, dIdx) => {
      latex += `\\begin{figure}[htbp]\n`;
      latex += `\\centering\n`;
      let widthStyle = "0.85";
      if (diagram.width === "40%") widthStyle = "0.40";
      else if (diagram.width === "70%") widthStyle = "0.70";
      else if (diagram.width === "100%") widthStyle = "0.95";
      else if (diagram.width && diagram.width.endsWith("%")) {
        const p = parseFloat(diagram.width);
        if (!isNaN(p)) widthStyle = (p / 100).toFixed(2);
      }
      latex += `\\includegraphics[width=${widthStyle}\\textwidth]{diagram-${section.id}-${dIdx}.png}\n`;
      const caption = diagram.caption || `Generated diagram for ${section.label}`;
      latex += `\\caption{${escapeLatex(caption)}}\n`;
      latex += `\\label{fig:${section.id}-${dIdx}}\n`;
      latex += `\\end{figure}\n\n`;
    });
  }

  if (refSection?.content.trim()) {
    latex += `\\begin{thebibliography}{99}\n`;
    refSection.content.split("\n").filter(Boolean).forEach((r) => {
      const cleaned = r.replace(/^\[\d+\]\s*/, "");
      latex += `\\bibitem{} ${escapeLatex(cleaned)}\n`;
    });
    latex += `\\end{thebibliography}\n`;
  }

  latex += `\\end{document}\n`;
  return latex;
}

export function exportToLaTeX(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo) {
  const latex = buildLaTeXContent(sections, journal, paperTitle, author);
  downloadBlob(new Blob([latex], { type: "text/plain" }), paperTitle, "tex");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, (m) => `\\${m}`)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function downloadBlob(blob: Blob, title: string, ext: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = (title || "research-paper").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
  a.download = `${filename}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}


