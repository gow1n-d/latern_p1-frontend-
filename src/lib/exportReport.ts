import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";
import type { ReportSection } from "@/hooks/useReports";
import { ensurePng } from "./export";

function extractMermaidFromContent(content: string): string | null {
  const match = content.match(/```mermaid\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

const parseMarkdownTable = (block: string): { headers: string[]; rows: string[][] } | null => {
  const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const isPipeTable = lines.every(l => (l.match(/\|/g) || []).length >= 2);
  if (!isPipeTable) return null;

  const parsePipeRow = (line: string): string[] =>
    line.split("|").map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length);

  let headerIdx = 0;
  let sepIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    if (/^\|[\s\-:|\+]+\|$/.test(lines[i]) || /^[\s\-:|\+]+$/.test(lines[i])) {
      sepIdx = i;
      headerIdx = Math.max(0, i - 1);
      break;
    }
  }

  if (sepIdx === -1) return null;

  const headers = parsePipeRow(lines[headerIdx]);
  if (headers.length < 2) return null;
  const dataLines = lines.slice(sepIdx + 1);
  const dataRows = dataLines.map(l => {
    const cells = parsePipeRow(l);
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  }).filter(r => r.some(c => c.length > 0));

  if (dataRows.length === 0) return null;
  return { headers, rows: dataRows };
};

export async function exportReportToPDF(sections: ReportSection[], templateName: string): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pw - margin * 2;
  const bodySize = 11;
  const headingSize = 13;
  const lineSpacing = 1.5;
  const lh = bodySize * 0.3528 * lineSpacing;
  const headLh = headingSize * 0.3528 * 1.2;
  let y = margin;
  const bottomMargin = ph - margin;
  
  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > bottomMargin) addPage(); };

  // Pre-render mermaids
  const sectionDiagramPngs: Record<string, string | null> = {};
  for (const s of sections) {
    if (!s.content.trim()) continue;
    const code = extractMermaidFromContent(s.content);
    if (code) {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false });
        const { svg } = await mermaid.render(`export-pdf-report-${s.id}`, code);
        const png = await ensurePng({ type: "mermaid", svg });
        sectionDiagramPngs[s.id] = png;
      } catch (e) {
        console.error("Failed to render mermaid for PDF report:", e);
      }
    }
  }

  // Title page
  const titleSec = sections.find(s => s.id === "title");
  const title = titleSec?.content || "Untitled Report";
  y = ph * 0.35;
  doc.setFontSize(26);
  doc.setFont("times", "bold");
  const titleLines = doc.splitTextToSize(title, contentW * 0.8);
  const titleLh2 = 26 * 0.3528 * 1.2;
  for (const line of titleLines) {
    doc.text(line, pw / 2, y, { align: "center" });
    y += titleLh2;
  }
  y += 10;
  doc.setFontSize(12);
  doc.setFont("times", "normal");
  doc.setTextColor(100);
  doc.text(templateName, pw / 2, y, { align: "center" });
  y += 8;
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pw / 2, y, { align: "center" });
  doc.setTextColor(0);

  // Sections
  for (const sec of sections) {
    if (sec.id === "title") continue;
    if (!sec.content.trim()) continue;

    addPage();
    doc.setFontSize(headingSize);
    doc.setFont("times", "bold");
    doc.text(sec.label.toUpperCase(), margin, y);
    y += headLh + 3;

    doc.setFontSize(bodySize);
    doc.setFont("times", "normal");
    
    // Split content by paragraphs
    const paras = sec.content.split(/\n\s*\n/).filter(Boolean);
    for (const para of paras) {
      if (para.includes("```mermaid")) {
        const pngData = sectionDiagramPngs[sec.id];
        if (pngData) {
          checkSpace(80);
          try {
            const props = doc.getImageProperties(pngData);
            const imgRatio = props.height / props.width;
            const targetW = Math.min(contentW * 0.9, 140);
            const targetH = targetW * imgRatio;
            const dx = (pw - targetW) / 2;
            doc.addImage(pngData, "PNG", dx, y, targetW, targetH);
            y += targetH + lh;
          } catch (e) {
            console.error("Failed to add image to PDF:", e);
          }
        }
        continue;
      }

      const table = parseMarkdownTable(para);
      if (table) {
        checkSpace(10 + table.rows.length * lh);
        doc.setFont("times", "bold");
        let thX = margin;
        const colW = contentW / table.headers.length;
        for (const th of table.headers) {
          doc.text(doc.splitTextToSize(th, colW - 2)[0], thX, y);
          thX += colW;
        }
        y += lh;
        doc.setFont("times", "normal");
        for (const row of table.rows) {
          let trX = margin;
          let maxLines = 1;
          const rowLines = row.map(td => {
            const lines = doc.splitTextToSize(td, colW - 2);
            if (lines.length > maxLines) maxLines = lines.length;
            return lines;
          });
          checkSpace(maxLines * lh);
          for (let i = 0; i < row.length; i++) {
            doc.text(rowLines[i], trX, y);
            trX += colW;
          }
          y += maxLines * lh;
        }
        y += lh * 0.5;
        continue;
      }

      // Regular text
      const clean = para.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
      if (!clean) continue;
      const lines = doc.splitTextToSize(clean, contentW);
      for (const line of lines) {
        checkSpace(lh);
        doc.text(line, margin, y);
        y += lh;
      }
      y += lh * 0.5;
    }
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`${i}`, pw / 2, ph - 10, { align: "center" });
    doc.setTextColor(0);
  }

  return doc.output("blob");
}

export async function exportReportToWord(sections: ReportSection[], templateName: string): Promise<Blob> {
  const title = sections.find(s => s.id === "title")?.content || "Untitled Report";
  const children: any[] = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 52, font: "Times New Roman" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: templateName, size: 24, font: "Times New Roman", color: "666666" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));
  
  children.push(new Paragraph({
    children: [new TextRun({
      text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      size: 22, font: "Times New Roman", color: "666666"
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
  }));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  for (const sec of sections) {
    if (sec.id === "title") continue;
    if (!sec.content.trim()) continue;

    children.push(new Paragraph({
      children: [new TextRun({ text: sec.label.toUpperCase(), bold: true, size: 26, font: "Times New Roman" })],
      spacing: { before: 400, after: 200 },
    }));

    const paras = sec.content.split(/\n\s*\n/).filter(Boolean);
    for (const para of paras) {
      if (para.includes("```mermaid")) {
        const code = extractMermaidFromContent(para);
        if (code) {
          try {
            const mermaid = (await import("mermaid")).default;
            mermaid.initialize({ startOnLoad: false });
            const { svg } = await mermaid.render(`export-word-report-${sec.id}`, code);
            const pngDataUrl = await ensurePng({ type: "mermaid", svg });
            if (pngDataUrl) {
              const base64Data = pngDataUrl.split(",")[1];
              children.push(new Paragraph({
                children: [
                  new ImageRun({
                    data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)),
                    transformation: { width: 500, height: 350 },
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 }
              }));
            }
          } catch (e) {
            console.error("Failed to render mermaid for word report", e);
          }
        }
        continue;
      }

      const table = parseMarkdownTable(para);
      if (table) {
        const tableRows = [];
        tableRows.push(new TableRow({
          children: table.headers.map(th => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: th, bold: true, font: "Times New Roman", size: 20 })] })],
            shading: { fill: "f0f0f0" },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }))
        }));
        for (const row of table.rows) {
          tableRows.push(new TableRow({
            children: row.map(td => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: td, font: "Times New Roman", size: 20 })] })],
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }))
          }));
        }
        children.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" }
          }
        }));
        children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
        continue;
      }

      const clean = para.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
      if (!clean) continue;
      children.push(new Paragraph({
        children: [new TextRun({ text: clean, size: 22, font: "Times New Roman" })],
        spacing: { after: 160 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    }
  }

  const wordDoc = new Document({
    sections: [{ properties: {}, children }],
  });

  return await Packer.toBlob(wordDoc);
}
