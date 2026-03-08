import jsPDF from "jspdf";
import type { PaperSection } from "@/hooks/usePapers";

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
  ieee:          { columns: 2, titleSize: 22, bodySize: 9.5, headingSize: 9.5, headingStyle: "roman", abstractStyle: "italic", journalHeader: "IEEE TRANSACTIONS", lineSpacing: 1.12 },
  "ieee-conf":   { columns: 2, titleSize: 22, bodySize: 9.5, headingSize: 9.5, headingStyle: "roman", abstractStyle: "italic", journalHeader: "IEEE CONFERENCE PROCEEDINGS", lineSpacing: 1.12 },
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

// ── PDF line height: converts pt fontSize + lineSpacing ratio to mm advance ──
function lineH(fontSize: number, lineSpacing: number): number {
  // 1 pt = 0.3528 mm; lineSpacing is a multiplier (e.g. 1.12)
  return fontSize * 0.3528 * lineSpacing;
}

export function exportToPDF(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo) {
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
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.content.trim());
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  if (config.columns === 2) {
    renderTwoColumn(doc, bodySections, refSection, config, margin, pw, ph, y);
  } else {
    renderSingleColumn(doc, bodySections, refSection, config, margin, contentW, pw, ph, y);
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

  const filename = (paperTitle || "research-paper").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
  doc.save(`${filename}.pdf`);
}

function renderSingleColumn(
  doc: jsPDF, bodySections: PaperSection[], refSection: PaperSection | undefined,
  config: JournalConfig, margin: number, contentW: number, pw: number, ph: number, y: number
) {
  const lh = lineH(config.bodySize, config.lineSpacing);
  const headLhVal = lineH(config.headingSize, 1.2);
  const bottomLimit = ph - margin;
  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > bottomLimit) addPage(); };

  let sectionNum = 0;
  for (const section of bodySections) {
    sectionNum++;
    // Ensure heading + at least 2 lines of body stay together (no orphan headings)
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
    const paras = section.content.split("\n").filter(Boolean);
    for (let pi = 0; pi < paras.length; pi++) {
      const indent = pi > 0 ? 5 : 0;
      const lines = doc.splitTextToSize(paras[pi], contentW - indent);
      for (let li = 0; li < lines.length; li++) {
        checkSpace(lh);
        doc.text(lines[li], margin + (li === 0 ? indent : 0), y);
        y += lh;
      }
      // Keep at least 2 lines of a paragraph together (avoid widows)
      y += 1;
    }
    y += 2;
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
      // Keep entire reference entry together
      const refEntryH = wrapped.length * refLh + 0.5;
      checkSpace(Math.min(refEntryH, lh * 3)); // at least keep first 3 lines together
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
  config: JournalConfig, margin: number, pw: number, ph: number, startY: number
) {
  const gap = 5;
  const colW = (pw - margin * 2 - gap) / 2;
  const lh = lineH(config.bodySize, config.lineSpacing);
  const headLhVal = lineH(config.headingSize, 1.2);
  const bottomLimit = ph - margin;

  // Collect all text blocks into a flat list of "items"
  type Item = { type: "heading"; text: string } | { type: "body"; text: string } | { type: "gap"; h: number };
  const items: Item[] = [];

  let sectionNum = 0;
  for (const section of bodySections) {
    sectionNum++;
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const headText = config.headingStyle === "roman" ? section.label.toUpperCase() : section.label;
    items.push({ type: "gap", h: 3 });
    items.push({ type: "heading", text: `${prefix}${headText}` });
    const paras = section.content.split("\n").filter(Boolean);
    for (const p of paras) {
      items.push({ type: "body", text: p });
    }
  }

  // References
  if (refSection?.content.trim()) {
    items.push({ type: "gap", h: 3 });
    items.push({ type: "heading", text: config.headingStyle === "roman" ? "REFERENCES" : "References" });
    const refLines = refSection.content.split("\n").filter(Boolean);
    refLines.forEach((r, i) => {
      const cleaned = r.replace(/^\[\d+\]\s*/, "");
      items.push({ type: "body", text: `[${i + 1}] ${cleaned}` });
    });
  }

  // Render items flowing across two columns
  let col = 0; // 0 = left, 1 = right
  let y = startY;
  const colYStart = [startY, startY]; // track where each column starts on current page

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

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (item.type === "gap") {
      // Don't add gap if it would push us near bottom with nothing after
      if (y + item.h < bottomLimit) {
        y += item.h;
      }
      continue;
    }

    if (item.type === "heading") {
      // Keep heading + at least 2 lines of following body together
      const followBodyH = lh * 2;
      checkCol(headLhVal + 0.5 + followBodyH);
      doc.setFontSize(config.headingSize);
      doc.setFont("times", "bold");
      doc.text(item.text, getX(), y);
      y += headLhVal + 0.5;
      continue;
    }

    // body text
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(item.text, colW);
    // Keep at least first 2 lines of a paragraph together
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

// ── Text export ──
export function exportToText(sections: PaperSection[], paperTitle: string) {
  const text = sections
    .filter((s) => s.content.trim())
    .map((s) => `\n${"=".repeat(60)}\n${s.label.toUpperCase()}\n${"=".repeat(60)}\n\n${s.content}`)
    .join("\n\n");
  downloadBlob(new Blob([text], { type: "text/plain" }), paperTitle, "txt");
}

// ── Word export ──
export function exportToWord(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo) {
  const config = getConfig(journal);
  const title = (sections.find((s) => s.id === "title")?.content || "Untitled").split("\n")[0];
  const abstractSec = sections.find((s) => s.id === "abstract");
  const kwSec = sections.find((s) => s.id === "keywords");
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.content.trim());
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  const names = author?.authorNames?.filter(n => n.trim()) || [];
  const affiliation = [author?.department, author?.institution, author?.city].filter(Boolean).join(", ");

  const columnStyle = config.columns === 2 ? `mso-columns: 2; column-count: 2; column-gap: 0.2in;` : "";
  const bodyLineHeight = config.lineSpacing;

  let sectionNum = 0;
  const makeHeading = (label: string) => {
    sectionNum++;
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const text = config.headingStyle === "roman" ? label.toUpperCase() : label;
    return `${prefix}${text}`;
  };

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { margin: ${config.columns === 2 ? '0.6in' : '0.8in'}; }
  body { font-family: 'Times New Roman', Times, serif; font-size: ${config.bodySize}pt; line-height: ${bodyLineHeight}; margin: 0; }
  h1 { font-size: ${config.titleSize * 0.75}pt; text-align: center; margin-bottom: 4pt; font-family: 'Times New Roman'; line-height: 1.18; }
  h2 { font-size: ${config.headingSize}pt; font-weight: bold; margin-top: 10pt; margin-bottom: 2pt; font-family: 'Times New Roman'; }
  p { text-align: justify; margin-bottom: 2pt; margin-top: 0; }
  .author { text-align: center; font-style: italic; font-size: 10pt; margin-bottom: 2pt; }
  .affil { text-align: center; font-style: italic; font-size: 8.5pt; color: #333; margin-bottom: 2pt; }
  .email { text-align: center; font-family: 'Courier New'; font-size: 8pt; color: #444; margin-bottom: 8pt; }
  .journal-header { text-align: center; font-size: 7pt; letter-spacing: 2.5px; color: #888; text-transform: uppercase; font-family: Helvetica, Arial, sans-serif; }
  .abstract-label { font-weight: bold; font-size: ${config.headingSize}pt; margin-bottom: 2pt; }
  .kw-label { font-weight: bold; font-style: italic; }
  .ref { font-size: ${Math.max(config.bodySize - 1, 8)}pt; padding-left: 14pt; text-indent: -14pt; line-height: 1.25; margin-bottom: 1pt; }
  .content-body { ${columnStyle} }
  .body-para { text-indent: 14pt; }
  .body-para-first { text-indent: 0; }
</style></head>
<body>
  ${config.journalHeader ? `<p class="journal-header">${config.journalHeader}</p><hr style="border:none;border-top:0.4px solid #ccc;"/>` : ""}
  <h1>${escapeHtml(title)}</h1>
  ${names.length > 0 ? `<p class="author">${escapeHtml(names.join(", "))}</p>` : ""}
  ${affiliation ? `<p class="affil">${escapeHtml(affiliation)}</p>` : ""}
  ${author?.email ? `<p class="email">${escapeHtml(author.email)}</p>` : ""}
  <hr style="border:none;border-top:0.4px solid #666;"/>
  ${abstractSec?.content.trim() ? `<p class="abstract-label">Abstract</p><p${config.abstractStyle === "italic" ? ' style="font-style:italic;"' : ""}>${escapeHtml(abstractSec.content)}</p>` : ""}
  ${kwSec?.content.trim() ? `<p><span class="kw-label">${journal.startsWith("ieee") || journal === "icassp" ? "Index Terms" : "Keywords"}—</span><i>${escapeHtml(kwSec.content)}</i></p>` : ""}
  <hr style="border:none;border-top:0.3px solid #ccc;"/>
  <div class="content-body">
  ${bodySections.map((s) => {
    const paras = s.content.split("\n").filter(Boolean);
    const parasHtml = paras.map((p, i) => `<p class="${i === 0 ? 'body-para-first' : 'body-para'}">${escapeHtml(p)}</p>`).join("");
    return `<h2>${escapeHtml(makeHeading(s.label))}</h2>${parasHtml}`;
  }).join("")}
  ${refSection?.content.trim() ? `<h2>${config.headingStyle === "roman" ? "REFERENCES" : "References"}</h2>${refSection.content.split("\n").filter(Boolean).map((r, i) => `<p class="ref">[${i + 1}] ${escapeHtml(r.replace(/^\[\d+\]\s*/, ""))}</p>`).join("")}` : ""}
  </div>
  <div style="text-align:center;font-size:6.5pt;color:#bbb;font-family:Helvetica,Arial,sans-serif;margin-top:24pt;">Manuscript — PaperForge</div>
</body></html>`;

  downloadBlob(new Blob(["\ufeff" + htmlContent], { type: "application/msword" }), paperTitle, "doc");
}

// ── LaTeX export ──
export function exportToLaTeX(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo) {
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
    latex += `\\section{${escapeLatex(section.label)}}\n${escapeLatex(section.content)}\n\n`;
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
