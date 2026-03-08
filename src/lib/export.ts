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
  titleSize: number;
  bodySize: number;
  headingSize: number;
  columns: 1 | 2;
  headingStyle: "roman" | "numeric" | "plain";
  abstractItalic: boolean;
  journalHeader?: string;
};

const journalConfigs: Record<string, JournalConfig> = {
  ieee:          { titleSize: 22, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "roman", abstractItalic: true, journalHeader: "IEEE TRANSACTIONS" },
  "ieee-conf":   { titleSize: 22, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "roman", abstractItalic: true, journalHeader: "IEEE CONFERENCE PROCEEDINGS" },
  acm:           { titleSize: 20, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false, journalHeader: "ACM" },
  "acm-conf":    { titleSize: 20, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false, journalHeader: "ACM CONFERENCE" },
  cvpr:          { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  aaai:          { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  acl:           { titleSize: 18, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  jama:          { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "plain", abstractItalic: false },
  pnas:          { titleSize: 20, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "plain", abstractItalic: false },
  "world-scientific": { titleSize: 18, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  interspeech:   { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  icassp:        { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "roman", abstractItalic: true },
  eccv:          { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  sigmod:        { titleSize: 18, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false },
  vldb:          { titleSize: 18, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false },
  www:           { titleSize: 18, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false },
  kdd:           { titleSize: 18, bodySize: 9, headingSize: 9, columns: 2, headingStyle: "numeric", abstractItalic: false },
  ijcai:         { titleSize: 20, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  coling:        { titleSize: 18, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  naacl:         { titleSize: 18, bodySize: 10, headingSize: 10, columns: 2, headingStyle: "numeric", abstractItalic: false },
  // Single-column
  springer:      { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  elsevier:      { titleSize: 20, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  nature:        { titleSize: 22, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  science:       { titleSize: 20, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  neurips:       { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  icml:          { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  iclr:          { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  wiley:         { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  "taylor-francis": { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  sage:          { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  mdpi:          { titleSize: 16, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  plos:          { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  frontiers:     { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  bmc:           { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  hindawi:       { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "oxford-academic": { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  "cambridge-up": { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "royal-society": { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "de-gruyter":  { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "emerald-insight": { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  "ios-press":   { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  lancet:        { titleSize: 20, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  bmj:           { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "plain", abstractItalic: false },
  nejm:          { titleSize: 20, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "plain", abstractItalic: false },
  cell:          { titleSize: 20, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "plain", abstractItalic: false },
  lippincott:    { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "plain", abstractItalic: false },
  karger:        { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "thieme-medical": { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  miccai:        { titleSize: 18, bodySize: 10, headingSize: 10, columns: 1, headingStyle: "numeric", abstractItalic: false },
  apa7:          { titleSize: 18, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "plain", abstractItalic: false },
  chicago:       { titleSize: 18, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "plain", abstractItalic: false },
  mla:           { titleSize: 16, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "plain", abstractItalic: false },
  harvard:       { titleSize: 18, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "plain", abstractItalic: false },
  vancouver:     { titleSize: 18, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "numeric", abstractItalic: false },
  turabian:      { titleSize: 18, bodySize: 12, headingSize: 12, columns: 1, headingStyle: "plain", abstractItalic: false },
  scopus:        { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
  "web-of-science": { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false },
};

const DEFAULT_CONFIG: JournalConfig = { titleSize: 18, bodySize: 11, headingSize: 11, columns: 1, headingStyle: "numeric", abstractItalic: false };

function getConfig(journal: string): JournalConfig {
  return journalConfigs[journal] || DEFAULT_CONFIG;
}

function toRoman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
  return result;
}

const NON_BODY = ["title", "abstract", "keywords", "references", "works-cited", "bibliography", "reference-list", "ccs-concepts", "highlights"];

export function exportToPDF(sections: PaperSection[], journal: string, paperTitle: string, author?: AuthorInfo) {
  const config = getConfig(journal);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  const margin = config.columns === 2 ? 15 : 25;
  const contentW = pw - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > ph - margin) addPage(); };

  // ── Journal header ──
  if (config.journalHeader) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130);
    doc.text(config.journalHeader, pw / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 5;
    doc.setDrawColor(180);
    doc.line(margin, y, pw - margin, y);
    y += 5;
  }

  // ── Title (first line only) ──
  const titleSection = sections.find((s) => s.id === "title");
  const titleText = (titleSection?.content || "Untitled").split("\n")[0].slice(0, 300);
  doc.setFontSize(config.titleSize);
  doc.setFont("times", "bold");
  const titleLines = doc.splitTextToSize(titleText, contentW * 0.85);
  checkSpace(titleLines.length * config.titleSize * 0.5);
  doc.text(titleLines, pw / 2, y, { align: "center" });
  y += titleLines.length * config.titleSize * 0.42 + 4;

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
      doc.setTextColor(60);
      doc.text(affiliation, pw / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 3.5;
    }
    if (author?.email) {
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.setTextColor(80);
      doc.text(author.email, pw / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 3.5;
    }
  }

  y += 2;
  doc.setDrawColor(120);
  doc.line(margin, y, pw - margin, y);
  y += 4;

  // ── Abstract (full-width always) ──
  const abstractSec = sections.find((s) => s.id === "abstract");
  if (abstractSec?.content.trim()) {
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    doc.text(config.headingStyle === "roman" ? "Abstract" : "Abstract", margin, y);
    y += 4;
    doc.setFontSize(config.bodySize);
    doc.setFont("times", config.abstractItalic ? "italic" : "normal");
    const absLines = doc.splitTextToSize(abstractSec.content, contentW);
    for (const line of absLines) {
      checkSpace(4);
      doc.text(line, margin, y);
      y += config.bodySize * 0.4;
    }
    y += 3;
  }

  // ── Keywords ──
  const kwSec = sections.find((s) => s.id === "keywords");
  if (kwSec?.content.trim()) {
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "bolditalic");
    const kwLabel = journal.startsWith("ieee") ? "Index Terms" : "Keywords";
    doc.text(`${kwLabel}—`, margin, y);
    const labelW = doc.getTextWidth(`${kwLabel}—`);
    doc.setFont("times", "italic");
    const kwLines = doc.splitTextToSize(kwSec.content, contentW - labelW);
    doc.text(kwLines[0], margin + labelW, y);
    y += config.bodySize * 0.4;
    for (let i = 1; i < kwLines.length; i++) {
      doc.text(kwLines[i], margin, y);
      y += config.bodySize * 0.4;
    }
    y += 3;
  }

  doc.setDrawColor(200);
  doc.line(margin, y, pw - margin, y);
  y += 3;

  // ── Body sections ──
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.content.trim());
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  if (config.columns === 2) {
    renderTwoColumn(doc, bodySections, refSection, config, margin, pw, ph, y);
  } else {
    let sectionNum = 0;
    for (const section of bodySections) {
      sectionNum++;
      checkSpace(12);
      doc.setFontSize(config.headingSize);
      doc.setFont("times", "bold");
      const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                     config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
      const headText = config.headingStyle === "roman" ? section.label.toUpperCase() : section.label;
      doc.text(`${prefix}${headText}`, margin, y);
      y += 5;

      doc.setFontSize(config.bodySize);
      doc.setFont("times", "normal");
      const lines = doc.splitTextToSize(section.content, contentW);
      for (const line of lines) {
        checkSpace(4);
        doc.text(line, margin, y);
        y += config.bodySize * 0.4;
      }
      y += 4;
    }

    // References (single-column)
    if (refSection?.content.trim()) {
      checkSpace(12);
      doc.setFontSize(config.headingSize);
      doc.setFont("times", "bold");
      doc.text(config.headingStyle === "roman" ? "REFERENCES" : "References", margin, y);
      y += 5;
      const refLines = refSection.content.split("\n").filter(Boolean);
      doc.setFontSize(config.bodySize - 1);
      doc.setFont("times", "normal");
      refLines.forEach((r, i) => {
        checkSpace(4);
        const cleaned = r.replace(/^\[\d+\]\s*/, "");
        const refText = `[${i + 1}] ${cleaned}`;
        const wrapped = doc.splitTextToSize(refText, contentW);
        for (const wl of wrapped) {
          checkSpace(4);
          doc.text(wl, margin, y);
          y += (config.bodySize - 1) * 0.4;
        }
        y += 1;
      });
    }
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170);
    doc.text(`${i}`, pw / 2, ph - 8, { align: "center" });
    doc.setTextColor(0);
  }

  const filename = (paperTitle || "research-paper").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
  doc.save(`${filename}.pdf`);
}

function renderTwoColumn(
  doc: jsPDF,
  bodySections: PaperSection[],
  refSection: PaperSection | undefined,
  config: JournalConfig,
  margin: number,
  pw: number,
  ph: number,
  startY: number
) {
  const gap = 5;
  const colW = (pw - margin * 2 - gap) / 2;
  let col = 0;
  let y = startY;

  const getX = () => margin + col * (colW + gap);

  const nextCol = () => {
    if (col === 0) { col = 1; y = startY; }
    else { doc.addPage(); col = 0; y = margin; startY = margin; }
  };

  const checkCol = (needed: number) => {
    if (y + needed > ph - margin) nextCol();
  };

  let sectionNum = 0;

  // Body sections
  for (const section of bodySections) {
    sectionNum++;
    checkCol(10);
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const headText = config.headingStyle === "roman" ? section.label.toUpperCase() : section.label;
    doc.text(`${prefix}${headText}`, getX(), y);
    y += 4;

    doc.setFontSize(config.bodySize);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(section.content, colW);
    for (const line of lines) {
      checkCol(3.5);
      doc.text(line, getX(), y);
      y += config.bodySize * 0.38;
    }
    y += 3;
  }

  // References
  if (refSection?.content.trim()) {
    checkCol(10);
    doc.setFontSize(config.headingSize);
    doc.setFont("times", "bold");
    doc.text(config.headingStyle === "roman" ? "REFERENCES" : "References", getX(), y);
    y += 4;

    const refLines = refSection.content.split("\n").filter(Boolean);
    doc.setFontSize(config.bodySize - 1);
    doc.setFont("times", "normal");
    refLines.forEach((r, i) => {
      const cleaned = r.replace(/^\[\d+\]\s*/, "");
      const refText = `[${i + 1}] ${cleaned}`;
      const wrapped = doc.splitTextToSize(refText, colW);
      for (const wl of wrapped) {
        checkCol(3);
        doc.text(wl, getX(), y);
        y += (config.bodySize - 1) * 0.36;
      }
      y += 0.8;
    });
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

  const columnStyle = config.columns === 2 ? `mso-columns: 2; column-count: 2; column-gap: 0.3in;` : "";

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
  body { font-family: 'Times New Roman', Times, serif; font-size: ${config.bodySize}pt; line-height: 1.4; margin: 1in; }
  h1 { font-size: ${config.titleSize * 0.75}pt; text-align: center; margin-bottom: 4pt; font-family: 'Times New Roman'; }
  h2 { font-size: ${config.headingSize}pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; font-family: 'Times New Roman'; }
  p { text-align: justify; margin-bottom: 4pt; }
  .author { text-align: center; font-style: italic; font-size: 10pt; margin-bottom: 2pt; }
  .affil { text-align: center; font-style: italic; font-size: 8.5pt; color: #444; margin-bottom: 2pt; }
  .email { text-align: center; font-family: 'Courier New'; font-size: 8pt; color: #555; margin-bottom: 8pt; }
  .abstract-label { font-weight: bold; font-size: ${config.headingSize}pt; }
  .kw-label { font-weight: bold; font-style: italic; }
  .ref { font-size: ${config.bodySize - 1}pt; padding-left: 14pt; text-indent: -14pt; }
  .content-body { ${columnStyle} }
</style></head>
<body>
  ${config.journalHeader ? `<p style="text-align:center;font-size:7pt;letter-spacing:2px;color:#888;text-transform:uppercase;">${config.journalHeader}</p><hr/>` : ""}
  <h1>${escapeHtml(title)}</h1>
  ${names.length > 0 ? `<p class="author">${escapeHtml(names.join(", "))}</p>` : ""}
  ${affiliation ? `<p class="affil">${escapeHtml(affiliation)}</p>` : ""}
  ${author?.email ? `<p class="email">${escapeHtml(author.email)}</p>` : ""}
  <hr/>
  ${abstractSec?.content.trim() ? `<p class="abstract-label">Abstract</p><p${config.abstractItalic ? ' style="font-style:italic;"' : ""}>${escapeHtml(abstractSec.content)}</p>` : ""}
  ${kwSec?.content.trim() ? `<p><span class="kw-label">${journal.startsWith("ieee") ? "Index Terms" : "Keywords"}—</span><i>${escapeHtml(kwSec.content)}</i></p>` : ""}
  <hr/>
  <div class="content-body">
  ${bodySections.map((s) => `<h2>${escapeHtml(makeHeading(s.label))}</h2>${s.content.split("\n").filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}`).join("")}
  ${refSection?.content.trim() ? `<h2>${config.headingStyle === "roman" ? "REFERENCES" : "References"}</h2>${refSection.content.split("\n").filter(Boolean).map((r, i) => `<p class="ref">[${i + 1}] ${escapeHtml(r.replace(/^\[\d+\]\s*/, ""))}</p>`).join("")}` : ""}
  </div>
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
