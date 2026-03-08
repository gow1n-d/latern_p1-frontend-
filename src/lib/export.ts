import jsPDF from "jspdf";
import type { PaperSection } from "@/hooks/usePapers";

type JournalConfig = {
  titleSize: number;
  bodySize: number;
  columns: 1 | 2;
};

const journalFonts: Record<string, JournalConfig> = {
  // Journals
  ieee: { titleSize: 24, bodySize: 10, columns: 2 },
  springer: { titleSize: 20, bodySize: 11, columns: 1 },
  elsevier: { titleSize: 22, bodySize: 10, columns: 1 },
  acm: { titleSize: 22, bodySize: 9, columns: 2 },
  wiley: { titleSize: 20, bodySize: 11, columns: 1 },
  "taylor-francis": { titleSize: 20, bodySize: 11, columns: 1 },
  sage: { titleSize: 20, bodySize: 11, columns: 1 },
  mdpi: { titleSize: 18, bodySize: 10, columns: 1 },
  plos: { titleSize: 20, bodySize: 10, columns: 1 },
  nature: { titleSize: 22, bodySize: 10, columns: 1 },
  science: { titleSize: 22, bodySize: 10, columns: 1 },
  frontiers: { titleSize: 20, bodySize: 11, columns: 1 },
  "royal-society": { titleSize: 20, bodySize: 10, columns: 1 },
  "oxford-academic": { titleSize: 20, bodySize: 11, columns: 1 },
  "cambridge-up": { titleSize: 20, bodySize: 11, columns: 1 },
  "de-gruyter": { titleSize: 20, bodySize: 11, columns: 1 },
  bmc: { titleSize: 20, bodySize: 11, columns: 1 },
  hindawi: { titleSize: 20, bodySize: 10, columns: 1 },
  "ios-press": { titleSize: 20, bodySize: 11, columns: 1 },
  karger: { titleSize: 20, bodySize: 10, columns: 1 },
  "world-scientific": { titleSize: 20, bodySize: 10, columns: 2 },
  "emerald-insight": { titleSize: 20, bodySize: 11, columns: 1 },
  lippincott: { titleSize: 20, bodySize: 10, columns: 1 },
  "thieme-medical": { titleSize: 20, bodySize: 10, columns: 1 },
  lancet: { titleSize: 22, bodySize: 10, columns: 1 },
  bmj: { titleSize: 20, bodySize: 10, columns: 1 },
  jama: { titleSize: 22, bodySize: 10, columns: 2 },
  nejm: { titleSize: 22, bodySize: 10, columns: 1 },
  cell: { titleSize: 22, bodySize: 10, columns: 1 },
  pnas: { titleSize: 22, bodySize: 9, columns: 2 },
  // Conferences
  "ieee-conf": { titleSize: 24, bodySize: 10, columns: 2 },
  "acm-conf": { titleSize: 22, bodySize: 9, columns: 2 },
  neurips: { titleSize: 20, bodySize: 10, columns: 1 },
  icml: { titleSize: 20, bodySize: 10, columns: 1 },
  cvpr: { titleSize: 24, bodySize: 10, columns: 2 },
  aaai: { titleSize: 24, bodySize: 10, columns: 2 },
  iclr: { titleSize: 20, bodySize: 10, columns: 1 },
  acl: { titleSize: 22, bodySize: 10, columns: 2 },
  interspeech: { titleSize: 22, bodySize: 10, columns: 2 },
  icassp: { titleSize: 24, bodySize: 10, columns: 2 },
  miccai: { titleSize: 20, bodySize: 10, columns: 1 },
  eccv: { titleSize: 24, bodySize: 10, columns: 2 },
  sigmod: { titleSize: 22, bodySize: 9, columns: 2 },
  vldb: { titleSize: 22, bodySize: 9, columns: 2 },
  www: { titleSize: 22, bodySize: 9, columns: 2 },
  kdd: { titleSize: 22, bodySize: 9, columns: 2 },
  ijcai: { titleSize: 22, bodySize: 10, columns: 2 },
  coling: { titleSize: 22, bodySize: 10, columns: 2 },
  naacl: { titleSize: 22, bodySize: 10, columns: 2 },
  // Standards
  scopus: { titleSize: 20, bodySize: 11, columns: 1 },
  "web-of-science": { titleSize: 20, bodySize: 11, columns: 1 },
  apa7: { titleSize: 20, bodySize: 12, columns: 1 },
  chicago: { titleSize: 20, bodySize: 12, columns: 1 },
  mla: { titleSize: 20, bodySize: 12, columns: 1 },
  harvard: { titleSize: 20, bodySize: 12, columns: 1 },
  vancouver: { titleSize: 20, bodySize: 12, columns: 1 },
  turabian: { titleSize: 20, bodySize: 12, columns: 1 },
};

function getConfig(journal: string): JournalConfig {
  return journalFonts[journal] || journalFonts.ieee;
}

export function exportToPDF(sections: PaperSection[], journal: string, paperTitle: string) {
  const config = getConfig(journal);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > pageHeight - margin) addPage(); };

  // Title
  const titleSection = sections.find((s) => s.id === "title");
  if (titleSection?.content) {
    doc.setFontSize(config.titleSize);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(titleSection.content, contentWidth);
    checkSpace(titleLines.length * config.titleSize * 0.5);
    doc.text(titleLines, pageWidth / 2, y, { align: "center" });
    y += titleLines.length * config.titleSize * 0.45 + 8;
  }

  // Authors
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Author(s)", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Content sections
  const contentSections = sections.filter((s) => s.id !== "title" && s.content.trim());

  if (config.columns === 2) {
    renderTwoColumn(doc, contentSections, config, margin, pageWidth, pageHeight);
  } else {
    for (const section of contentSections) {
      checkSpace(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const heading = section.id === "references" ? "REFERENCES" : section.label.toUpperCase();
      doc.text(heading, margin, y);
      y += 6;

      doc.setFontSize(config.bodySize);
      doc.setFont("times", "normal");
      const lines = doc.splitTextToSize(section.content, contentWidth);
      for (const line of lines) {
        checkSpace(5);
        doc.text(line, margin, y);
        y += config.bodySize * 0.42;
      }
      y += 6;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Generated by PaperForge`, pageWidth - margin, pageHeight - 10, { align: "right" });
    doc.setTextColor(0);
  }

  const filename = (paperTitle || "research-paper").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
  doc.save(`${filename}.pdf`);
}

function renderTwoColumn(
  doc: jsPDF,
  sections: PaperSection[],
  config: JournalConfig,
  margin: number,
  pageWidth: number,
  pageHeight: number
) {
  const gap = 6;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;

  // Start y after title/author/hr area
  let currentY = margin + 40;
  let currentCol = 0;
  let firstPage = true;

  const getX = () => margin + currentCol * (colWidth + gap);

  for (const section of sections) {
    // Section heading
    const spaceForHeading = 10;
    if (currentY + spaceForHeading > pageHeight - margin) {
      if (currentCol === 0 && firstPage) {
        currentCol = 1;
        currentY = margin + 40;
      } else if (currentCol === 0) {
        currentCol = 1;
        currentY = margin;
      } else {
        doc.addPage();
        currentCol = 0;
        currentY = margin;
        firstPage = false;
      }
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const heading = section.id === "references" ? "REFERENCES" : section.label.toUpperCase();
    doc.text(heading, getX(), currentY);
    currentY += 5;

    // Section body
    doc.setFontSize(config.bodySize);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(section.content, colWidth);

    for (const line of lines) {
      if (currentY + 4 > pageHeight - margin) {
        if (currentCol === 0 && firstPage) {
          currentCol = 1;
          currentY = y;
        } else if (currentCol === 0) {
          currentCol = 1;
          currentY = margin;
        } else {
          doc.addPage();
          currentCol = 0;
          currentY = margin;
          firstPage = false;
        }
      }
      doc.text(line, getX(), currentY);
      currentY += config.bodySize * 0.42;
    }
    currentY += 4;
  }
}

export function exportToText(sections: PaperSection[], paperTitle: string) {
  const text = sections
    .filter((s) => s.content.trim())
    .map((s) => `\n${"=".repeat(60)}\n${s.label.toUpperCase()}\n${"=".repeat(60)}\n\n${s.content}`)
    .join("\n\n");

  downloadBlob(new Blob([text], { type: "text/plain" }), paperTitle, "txt");
}

export function exportToWord(sections: PaperSection[], journal: string, paperTitle: string) {
  const config = getConfig(journal);
  const title = sections.find((s) => s.id === "title")?.content || "Untitled";
  const contentSections = sections.filter((s) => s.id !== "title" && s.content.trim());

  const columnStyle = config.columns === 2
    ? `mso-columns: 2; column-count: 2; column-gap: 0.3in;`
    : "";

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: ${config.bodySize}pt; line-height: 1.5; margin: 1in; }
  h1 { font-size: ${config.titleSize * 0.75}pt; text-align: center; margin-bottom: 6pt; }
  h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
  p { text-align: justify; margin-bottom: 6pt; text-indent: 0.5in; }
  .author { text-align: center; font-size: 12pt; margin-bottom: 12pt; }
  .no-indent { text-indent: 0; }
  .content-body { ${columnStyle} }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="author no-indent">Author(s)</p>
  <hr/>
  <div class="content-body">
  ${contentSections.map((s) => `<h2>${escapeHtml(s.label.toUpperCase())}</h2>${s.content.split("\n").filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("")}`).join("")}
  </div>
</body></html>`;

  downloadBlob(new Blob(["\ufeff" + htmlContent], { type: "application/msword" }), paperTitle, "doc");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportToLaTeX(sections: PaperSection[], journal: string, paperTitle: string) {
  const title = sections.find((s) => s.id === "title")?.content || "Untitled";
  const abstract = sections.find((s) => s.id === "abstract")?.content || "";
  const keywords = sections.find((s) => s.id === "keywords")?.content || "";

  const docClassMap: Record<string, string> = {
    ieee: "IEEEtran", "ieee-conf": "IEEEtran", acm: "acmart", "acm-conf": "acmart",
    neurips: "article", icml: "article", cvpr: "IEEEtran", aaai: "aaai",
    iclr: "article", acl: "acl", apa7: "apa7", mla: "article",
  };
  const docClass = docClassMap[journal] || "article";
  const contentSections = sections.filter((s) => !["title", "abstract", "keywords"].includes(s.id) && s.content.trim());

  let latex = `\\documentclass{${docClass}}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{amsmath}

\\title{${escapeLatex(title)}}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
${escapeLatex(abstract)}
\\end{abstract}

\\textbf{Keywords:} ${escapeLatex(keywords)}

`;

  for (const section of contentSections) {
    latex += `\\section{${escapeLatex(section.label)}}\n${escapeLatex(section.content)}\n\n`;
  }

  latex += `\\end{document}\n`;

  downloadBlob(new Blob([latex], { type: "text/plain" }), paperTitle, "tex");
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
