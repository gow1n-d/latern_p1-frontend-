import { useRef, useEffect, useState } from "react";
import type { PaperSection } from "@/hooks/usePapers";

export type AuthorDetails = {
  authorName: string;
  coAuthorName: string;
  department: string;
  institution: string;
  city: string;
  country?: string;
  email: string;
};

type FormatConfig = {
  columns: 1 | 2;
  titleSize: number;
  bodySize: number;
  headingSize: number;
  headingStyle: "roman" | "numeric" | "plain";
  fontFamily: string;
  lineHeight: number;
  abstractStyle: "italic" | "normal";
  journalHeader?: string;
};

const CONFIGS: Record<string, FormatConfig> = {
  // Two-column
  ieee: { columns: 2, titleSize: 24, bodySize: 10, headingSize: 10, headingStyle: "roman", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "italic", journalHeader: "IEEE TRANSACTIONS" },
  "ieee-conf": { columns: 2, titleSize: 24, bodySize: 10, headingSize: 10, headingStyle: "roman", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "italic", journalHeader: "IEEE CONFERENCE PROCEEDINGS" },
  acm: { columns: 2, titleSize: 22, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal", journalHeader: "ACM" },
  "acm-conf": { columns: 2, titleSize: 22, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal", journalHeader: "ACM CONFERENCE" },
  cvpr: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal", journalHeader: "CVPR" },
  aaai: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal", journalHeader: "AAAI" },
  acl: { columns: 2, titleSize: 20, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal", journalHeader: "ACL ANTHOLOGY" },
  jama: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "plain", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal", journalHeader: "JAMA" },
  pnas: { columns: 2, titleSize: 22, bodySize: 9, headingSize: 10, headingStyle: "plain", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal", journalHeader: "PNAS" },
  "world-scientific": { columns: 2, titleSize: 20, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal" },
  interspeech: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal" },
  icassp: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "roman", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "italic", journalHeader: "ICASSP" },
  eccv: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal" },
  sigmod: { columns: 2, titleSize: 20, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
  vldb: { columns: 2, titleSize: 20, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
  www: { columns: 2, titleSize: 20, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
  kdd: { columns: 2, titleSize: 20, bodySize: 9, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
  ijcai: { columns: 2, titleSize: 22, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.15, abstractStyle: "normal" },
  coling: { columns: 2, titleSize: 20, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
  naacl: { columns: 2, titleSize: 20, bodySize: 10, headingSize: 10, headingStyle: "numeric", fontFamily: "Times", lineHeight: 1.2, abstractStyle: "normal" },
};

const DEFAULT_CONFIG: FormatConfig = {
  columns: 1, titleSize: 20, bodySize: 11, headingSize: 12, headingStyle: "numeric",
  fontFamily: "Times", lineHeight: 1.5, abstractStyle: "normal",
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
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.content.trim());
  const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));

  const authorName = authorDetails?.authorName || "";
  const coAuthor = authorDetails?.coAuthorName || "";
  const dept = authorDetails?.department || "";
  const inst = authorDetails?.institution || "";
  const city = authorDetails?.city || "";
  const email = authorDetails?.email || "";

  const hasAuthor = authorName.trim().length > 0;

  const isTwoCol = config.columns === 2;
  const pageW = isTwoCol ? 720 : 612; // points roughly
  const marginX = isTwoCol ? 42 : 72;
  const contentW = pageW - marginX * 2;
  const colGap = 18;
  const colW = isTwoCol ? (contentW - colGap) / 2 : contentW;

  let sectionNum = 0;

  const heading = (label: string) => {
    sectionNum++;
    const prefix = config.headingStyle === "roman" ? `${toRoman(sectionNum)}. ` :
                   config.headingStyle === "numeric" ? `${sectionNum}. ` : "";
    const isUpper = config.headingStyle === "roman";
    return (
      <div style={{ marginTop: 14, marginBottom: 4 }}>
        <span style={{
          fontFamily: config.fontFamily,
          fontSize: config.headingSize,
          fontWeight: 700,
          textTransform: isUpper ? "uppercase" : "none",
          letterSpacing: isUpper ? 0.5 : 0,
        }}>
          {prefix}{isUpper ? label.toUpperCase() : label}
        </span>
      </div>
    );
  };

  const renderParagraphs = (content: string) =>
    content.split("\n").filter(Boolean).map((p, i) => (
      <p key={i} style={{
        fontFamily: config.fontFamily,
        fontSize: config.bodySize,
        lineHeight: config.lineHeight,
        textAlign: "justify",
        marginBottom: 4,
        textIndent: i > 0 ? 18 : 0,
        hyphens: "auto",
        wordBreak: "break-word",
      }}>{p}</p>
    ));

  const renderBody = () => {
    const allSections = bodySections.map((s) => (
      <div key={s.id} style={{ breakInside: "avoid-column" }}>
        {heading(s.label)}
        {renderParagraphs(s.content)}
      </div>
    ));

    // References
    if (refSection?.content.trim()) {
      const refLines = refSection.content.split("\n").filter(Boolean);
      allSections.push(
        <div key="refs" style={{ breakInside: "avoid-column", marginTop: 14 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontFamily: config.fontFamily,
              fontSize: config.headingSize,
              fontWeight: 700,
              textTransform: config.headingStyle === "roman" ? "uppercase" : "none",
            }}>
              {config.headingStyle === "roman" ? "REFERENCES" : "References"}
            </span>
          </div>
          {refLines.map((r, i) => (
            <p key={i} style={{
              fontFamily: config.fontFamily,
              fontSize: config.bodySize - 1,
              lineHeight: 1.3,
              marginBottom: 2,
              paddingLeft: 14,
              textIndent: -14,
            }}>
              [{i + 1}] {r.replace(/^\[\d+\]\s*/, "")}
            </p>
          ))}
        </div>
      );
    }

    if (isTwoCol) {
      return (
        <div style={{
          columnCount: 2,
          columnGap: colGap,
          columnRule: "0.5px solid #d1d5db",
        }}>
          {allSections}
        </div>
      );
    }
    return <>{allSections}</>;
  };

  return (
    <div className="flex-1 overflow-y-auto py-8 px-4" style={{ background: "#e8e8e8" }}>
      {/* Paper sheet */}
      <div
        ref={containerRef}
        style={{
          width: pageW,
          margin: "0 auto",
          background: "#fff",
          boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
          padding: `48px ${marginX}px 60px`,
          minHeight: 900,
          position: "relative",
          color: "#000",
        }}
      >
        {/* Top rule */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#1a1a1a" }} />

        {/* Journal header */}
        {config.journalHeader && (
          <div style={{
            textAlign: "center",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 8,
            letterSpacing: 2,
            color: "#666",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            {config.journalHeader}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: config.fontFamily,
          fontSize: config.titleSize,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: hasAuthor ? 12 : 16,
          letterSpacing: -0.3,
        }}>
          {titleSection?.content || "Untitled Paper"}
        </h1>

        {/* Authors */}
        {hasAuthor && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <p style={{
              fontFamily: config.fontFamily,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 0.3,
            }}>
              {authorName}
              {coAuthor && `, ${coAuthor}`}
            </p>
            {(dept || inst) && (
              <p style={{
                fontFamily: config.fontFamily,
                fontSize: 9,
                fontStyle: "italic",
                color: "#444",
                marginTop: 2,
              }}>
                {[dept, inst, city].filter(Boolean).join(", ")}
              </p>
            )}
            {email && (
              <p style={{
                fontFamily: "Courier, monospace",
                fontSize: 8.5,
                color: "#555",
                marginTop: 2,
              }}>
                {email}
              </p>
            )}
          </div>
        )}

        {!hasAuthor && (
          <p style={{
            textAlign: "center",
            fontFamily: config.fontFamily,
            fontSize: 10,
            color: "#999",
            fontStyle: "italic",
            marginBottom: 14,
          }}>
            [Author details not provided — fill in Author Details form]
          </p>
        )}

        {/* Separator */}
        <hr style={{ border: "none", borderTop: "0.5px solid #999", marginBottom: 12 }} />

        {/* Abstract */}
        {abstractSection?.content && (
          <div style={{ marginBottom: 10 }}>
            <p style={{
              fontFamily: config.fontFamily,
              fontSize: config.headingSize - 1,
              fontWeight: 700,
              marginBottom: 3,
              letterSpacing: config.headingStyle === "roman" ? 0.5 : 0,
            }}>
              {config.headingStyle === "roman" ? "ABSTRACT" : "Abstract"}
            </p>
            <p style={{
              fontFamily: config.fontFamily,
              fontSize: config.bodySize,
              lineHeight: config.lineHeight,
              textAlign: "justify",
              fontStyle: config.abstractStyle === "italic" ? "italic" : "normal",
            }}>
              {abstractSection.content}
            </p>
          </div>
        )}

        {/* Keywords */}
        {keywordsSection?.content && (
          <div style={{ marginBottom: 10 }}>
            <p style={{
              fontFamily: config.fontFamily,
              fontSize: config.bodySize,
              lineHeight: 1.4,
            }}>
              <span style={{ fontWeight: 700, fontStyle: "italic" }}>
                {journal.startsWith("ieee") ? "Index Terms" : "Keywords"}—
              </span>
              <span style={{ fontStyle: "italic" }}>{keywordsSection.content}</span>
            </p>
          </div>
        )}

        {/* CCS Concepts */}
        {ccsSection?.content && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontFamily: config.fontFamily, fontSize: config.bodySize, fontWeight: 700 }}>CCS Concepts</p>
            <p style={{ fontFamily: config.fontFamily, fontSize: config.bodySize, fontStyle: "italic" }}>{ccsSection.content}</p>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "0.5px solid #ccc", marginBottom: 8 }} />

        {/* Body content */}
        {renderBody()}

        {/* Footer */}
        <div style={{
          position: "absolute",
          bottom: 16,
          left: marginX,
          right: marginX,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 7,
          color: "#aaa",
        }}>
          <span>Manuscript prepared with PaperForge</span>
          <span>Page 1</span>
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
