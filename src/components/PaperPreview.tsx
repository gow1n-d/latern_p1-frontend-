import { useRef } from "react";
import type { PaperSection } from "@/hooks/usePapers";
import { stripMarkdown } from "@/lib/ai";

export type AuthorDetails = {
  authorNames: string[];
  department: string;
  institution: string;
  city: string;
  country?: string;
  email: string;
  // legacy compat
  authorName?: string;
  coAuthorName?: string;
};

type FormatConfig = {
  columns: 1 | 2;
  titleSize: number;
  bodySize: number;
  headingSize: number;
  headingStyle: "roman" | "numeric" | "plain";
  abstractStyle: "italic" | "normal";
  journalHeader?: string;
  lineSpacing: number;
};

const CONFIGS: Record<string, FormatConfig> = {
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
};

const DEFAULT_CONFIG: FormatConfig = {
  columns: 1, titleSize: 18, bodySize: 11, headingSize: 11, headingStyle: "numeric",
  abstractStyle: "normal", lineSpacing: 1.5,
};

const NON_BODY = ["title", "keywords", "references", "works-cited", "bibliography", "reference-list", "ccs-concepts", "highlights", "abstract"];

type Props = {
  sections: PaperSection[];
  journal: string;
  authorDetails?: AuthorDetails;
};

export default function PaperPreview({ sections, journal, authorDetails }: Props) {
  const config = CONFIGS[journal] || DEFAULT_CONFIG;
  const containerRef = useRef<HTMLDivElement>(null);

  const titleSection = sections.find((s) => s.id === "title");
  const abstractSection = sections.find((s) => s.id === "abstract");
  const keywordsSection = sections.find((s) => s.id === "keywords");
  const ccsSection = sections.find((s) => s.id === "ccs-concepts");
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && (s.content.trim() || s.diagram || (s.diagrams && s.diagrams.length > 0)));
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  const names = authorDetails?.authorNames?.filter(n => n.trim()) || [];
  const dept = authorDetails?.department || "";
  const inst = authorDetails?.institution || "";
  const city = authorDetails?.city || "";
  const email = authorDetails?.email || "";
  const hasAuthor = names.length > 0;

  const isTwoCol = config.columns === 2;
  const marginPx = isTwoCol ? 48 : 72;

  let sectionNum = 0;

  const makeHeading = (label: string) => {
    sectionNum++;
    const isRoman = config.headingStyle === "roman";
    const prefix = isRoman ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const text = isRoman ? label.toUpperCase() : label;
    return (
      <div style={{ marginTop: 10, marginBottom: 2 }}>
        <span style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: config.headingSize,
          fontWeight: 700,
          textTransform: isRoman ? "uppercase" as const : "none" as const,
          letterSpacing: isRoman ? 0.3 : 0,
        }}>
          {prefix}{text}
        </span>
      </div>
    );
  };

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

  let figureNum = 0;
  const renderSingleDiagram = (d: any) => {
    if (!d) return null;
    figureNum++;
    const widthStyle = d.width || "100%";
    return (
      <figure key={d.id} style={{ margin: "8px 0", breakInside: "avoid-column" as const, textAlign: "center" as const, width: "100%", maxWidth: "100%", overflow: "hidden" }}>
        {d.type === "mermaid" && d.svg ? (
          <div style={{ display: "flex", justifyContent: "center", maxWidth: "100%", width: widthStyle, margin: "0 auto", overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: d.svg.replace(/<svg /i, '<svg style="max-width:100%;height:auto;" ') }} />
        ) : d.imageData ? (
          <img src={d.imageData} alt={d.caption} style={{ maxWidth: "100%", width: widthStyle, height: "auto", objectFit: "contain" as const, borderRadius: 2, display: "block", margin: "0 auto" }} />
        ) : null}
        <figcaption style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: config.bodySize - 0.5,
          fontStyle: "italic" as const,
          marginTop: 4,
          textAlign: "center" as const,
        }}>
          Fig. {figureNum}. {d.caption}
        </figcaption>
      </figure>
    );
  };

  const paragraphs = (content: string, label: string, sectionDiagrams: any[]) => {
    let text = content;
    if (label) text = cleanSectionContent(text, label);
    
    // Split by paragraphs
    const blocks = text.split(/\n\s*\n/).filter(Boolean);
    const elements: React.ReactNode[] = [];

    blocks.forEach((block, i) => {
      // Check if this paragraph is exactly a diagram tag
      const diagramMatch = block.match(/^!\[Diagram:.*?\]\((.*?)\)$/);
      if (diagramMatch) {
        const diagId = diagramMatch[1];
        const diag = sectionDiagrams.find(d => d.id === diagId);
        if (diag) {
          elements.push(renderSingleDiagram(diag));
        }
      } else {
        // Strip other markdown but preserve the text
        const cleanP = stripMarkdown(block).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
        if (cleanP) {
          elements.push(
            <p key={`p-${i}`} style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: config.bodySize,
              lineHeight: config.lineSpacing,
              textAlign: "justify" as const,
              margin: 0,
              marginBottom: 3,
              textIndent: i > 0 ? 14 : 0,
            }}>{cleanP}</p>
          );
        }
      }
    });
    return elements;
  };

  // Build body + references
  const bodyElements = bodySections.map((s) => {
    const diags = s.diagrams || (s.diagram ? [s.diagram] : []);
    return (
      <div key={s.id} style={{ breakInside: "avoid-column" as const }}>
        {makeHeading(s.label)}
        {paragraphs(s.content, s.label, diags)}
      </div>
    );
  });

  if (refSection?.content.trim()) {
    const refLines = refSection.content.split("\n").filter(Boolean);
    bodyElements.push(
      <div key="__refs" style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 2 }}>
          <span style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: config.headingSize,
            fontWeight: 700,
            textTransform: config.headingStyle === "roman" ? "uppercase" as const : "none" as const,
            letterSpacing: config.headingStyle === "roman" ? 0.3 : 0,
          }}>
            {config.headingStyle === "roman" ? "REFERENCES" : "References"}
          </span>
        </div>
        {refLines.map((r, i) => (
          <p key={i} style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 8,
            lineHeight: 1.25,
            margin: 0,
            marginBottom: 1.5,
            paddingLeft: 12,
            textIndent: -12,
            textAlign: "justify" as const,
          }}>
            [{i + 1}] {stripMarkdown(r).replace(/^\[\d+\]\s*/, "")}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#d4d4d4", padding: "24px 12px" }}>
      {/* A4-like paper sheet */}
      <div
        ref={containerRef}
        style={{
          width: isTwoCol ? 680 : 595,
          margin: "0 auto",
          background: "#fff",
          boxShadow: "0 1px 12px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.1)",
          padding: `36px ${marginPx}px 48px`,
          minHeight: isTwoCol ? 880 : 842,
          position: "relative",
          color: "#000",
        }}
      >
        {/* Journal header bar */}
        {config.journalHeader && (
          <div style={{
            textAlign: "center" as const,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 7,
            letterSpacing: 2.5,
            color: "#888",
            marginBottom: 12,
            paddingBottom: 6,
            borderBottom: "0.4px solid #ccc",
            textTransform: "uppercase" as const,
          }}>
            {config.journalHeader}
          </div>
        )}

        {/* Title — only first line rendered as title, rest ignored */}
        <h1 style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: config.titleSize,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.18,
          margin: 0,
          marginBottom: 8,
          letterSpacing: -0.2,
        }}>
          {stripMarkdown(titleSection?.content || "Untitled Paper").split("\n")[0].slice(0, 300)}
        </h1>

        {/* Author block */}
        {hasAuthor ? (
          <div style={{ textAlign: "center" as const, marginBottom: 10 }}>
            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 10,
              margin: 0,
              fontStyle: "italic" as const,
            }}>
              {names.join(", ")}
            </p>
            {(dept || inst || city) && (
              <p style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 8.5,
                color: "#333",
                margin: 0,
                marginTop: 1,
                fontStyle: "italic" as const,
              }}>
                {[dept, inst, city].filter(Boolean).join(", ")}
              </p>
            )}
            {email && (
              <p style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 8,
                color: "#444",
                margin: 0,
                marginTop: 1,
              }}>
                {email}
              </p>
            )}
          </div>
        ) : (
          <p style={{
            textAlign: "center" as const,
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 9,
            color: "#aaa",
            fontStyle: "italic" as const,
            margin: 0,
            marginBottom: 10,
          }}>
            [Fill in Author Details from sidebar]
          </p>
        )}

        {/* Thin rule before columns start */}
        <hr style={{ border: "none", borderTop: "0.3px solid #ccc", margin: "6px 0 12px 0" }} />

        {/* Abstract — always full-width even in two-column papers */}
        {abstractSection?.content && (
          <div style={{ marginBottom: 6 }}>
            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: config.headingSize,
              fontWeight: 700,
              margin: 0,
              marginBottom: 2,
              fontStyle: config.headingStyle === "roman" ? "italic" as const : "normal" as const,
            }}>
              {config.headingStyle === "roman" ? "Abstract" : "Abstract"}
            </p>
            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: config.bodySize,
              lineHeight: config.lineSpacing,
              textAlign: "justify" as const,
              margin: 0,
              fontStyle: config.abstractStyle === "italic" ? "italic" as const : "normal" as const,
            }}>
              {stripMarkdown(cleanSectionContent(abstractSection.content, "Abstract"))}
            </p>
          </div>
        )}

        {/* Keywords */}
        {keywordsSection?.content && (
          <div style={{ marginBottom: 6 }}>
            <p style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: config.bodySize,
              lineHeight: 1.3,
              margin: 0,
            }}>
              <span style={{ fontWeight: 700, fontStyle: "italic" as const }}>
                {journal.startsWith("ieee") || journal === "icassp" ? "Index Terms" : "Keywords"}—
              </span>
              <span style={{ fontStyle: "italic" as const }}>{stripMarkdown(cleanSectionContent(keywordsSection.content, "Keywords"))}</span>
            </p>
          </div>
        )}

        {/* CCS Concepts (ACM) */}
        {ccsSection?.content && (
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: config.bodySize, fontWeight: 700, margin: 0 }}>CCS Concepts</p>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: config.bodySize, fontStyle: "italic" as const, margin: 0 }}>{stripMarkdown(ccsSection.content)}</p>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "0.3px solid #ccc", margin: "0 0 4px 0" }} />

        {/* Body content */}
        {isTwoCol ? (
          <div style={{
            columnCount: 2,
            columnGap: 16,
            columnRule: "0.3px solid #ddd",
          }}>
            {bodyElements}
          </div>
        ) : (
          <div>{bodyElements}</div>
        )}

        {/* Footer */}
        <div style={{
          position: "absolute" as const,
          bottom: 14,
          left: marginPx,
          right: marginPx,
          display: "flex",
          justifyContent: "space-between" as const,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 6.5,
          color: "#bbb",
        }}>
          <span>Manuscript — PaperForge</span>
          <span>1</span>
        </div>
      </div>
    </div>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [val, sym] of map) { while (n >= val) { result += sym; n -= val; } }
  return result;
}
