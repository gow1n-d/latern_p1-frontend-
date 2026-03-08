import { useRef, useEffect, useState } from "react";
import type { PaperSection } from "@/hooks/usePapers";

type FormatConfig = {
  columns: 1 | 2;
  titleSize: string;
  bodySize: string;
  headingStyle: "uppercase" | "numbered" | "bold";
  fontFamily: string;
  lineHeight: string;
  pageWidth: string;
  abstract?: "italic" | "normal";
  sectionNumbering?: boolean;
};

const FORMAT_CONFIGS: Record<string, FormatConfig> = {
  // Two-column formats
  ieee: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "uppercase", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", abstract: "italic", sectionNumbering: true },
  "ieee-conf": { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "uppercase", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", abstract: "italic", sectionNumbering: true },
  acm: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  "acm-conf": { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  cvpr: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  aaai: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  acl: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  jama: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]" },
  pnas: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]" },
  "world-scientific": { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  interspeech: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  icassp: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "uppercase", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", abstract: "italic", sectionNumbering: true },
  eccv: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  sigmod: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  vldb: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  www: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  kdd: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  ijcai: { columns: 2, titleSize: "text-[22px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.15]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  coling: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  naacl: { columns: 2, titleSize: "text-[20px]", bodySize: "text-[9.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.2]", pageWidth: "max-w-[680px]", sectionNumbering: true },
  // Single-column formats
  springer: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.35]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  elsevier: { columns: 1, titleSize: "text-[22px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  nature: { columns: 1, titleSize: "text-[24px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  science: { columns: 1, titleSize: "text-[22px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]" },
  neurips: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.35]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  icml: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.35]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  iclr: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.35]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  wiley: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  "taylor-francis": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  sage: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  mdpi: { columns: 1, titleSize: "text-[18px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-sans", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  plos: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  frontiers: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-sans", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  bmc: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  hindawi: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "oxford-academic": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  "cambridge-up": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "royal-society": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "de-gruyter": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "emerald-insight": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  "ios-press": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  lancet: { columns: 1, titleSize: "text-[22px]", bodySize: "text-[11px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  bmj: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  nejm: { columns: 1, titleSize: "text-[22px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]" },
  cell: { columns: 1, titleSize: "text-[22px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  lippincott: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]" },
  karger: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "thieme-medical": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.4]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  miccai: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[10.5px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.35]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  // Citation standards
  apa7: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[12px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[2]", pageWidth: "max-w-[520px]" },
  chicago: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[12px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[2]", pageWidth: "max-w-[520px]" },
  mla: { columns: 1, titleSize: "text-[14px]", bodySize: "text-[12px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[2]", pageWidth: "max-w-[520px]" },
  harvard: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[12px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]" },
  vancouver: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[12px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  turabian: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[12px]", headingStyle: "bold", fontFamily: "font-serif", lineHeight: "leading-[2]", pageWidth: "max-w-[520px]" },
  scopus: { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
  "web-of-science": { columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "numbered", fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]", sectionNumbering: true },
};

const DEFAULT_CONFIG: FormatConfig = {
  columns: 1, titleSize: "text-[20px]", bodySize: "text-[11px]", headingStyle: "bold",
  fontFamily: "font-serif", lineHeight: "leading-[1.5]", pageWidth: "max-w-[520px]",
};

const NON_BODY = ["title", "keywords", "references", "works-cited", "bibliography", "reference-list", "ccs-concepts", "highlights"];

// US Letter page height in px at ~96dpi scaled for preview (11in * 96dpi ≈ 1056px)
// We use a content height accounting for top/bottom padding (48px each)
const PAGE_CONTENT_HEIGHT = 960; // 1056 - 96 padding

export default function PaperPreview({ sections, journal }: { sections: PaperSection[]; journal: string }) {
  const config = FORMAT_CONFIGS[journal] || DEFAULT_CONFIG;
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const titleSection = sections.find((s) => s.id === "title");
  const abstractSection = sections.find((s) => s.id === "abstract");
  const keywordsSection = sections.find((s) => s.id === "keywords");
  const highlightsSection = sections.find((s) => s.id === "highlights");
  const ccsSection = sections.find((s) => s.id === "ccs-concepts");
  const bodySections = sections.filter((s) => !NON_BODY.includes(s.id) && s.id !== "abstract" && s.content.trim());

  let sectionCounter = 0;

  // Calculate page count after render
  useEffect(() => {
    if (contentRef.current) {
      const totalHeight = contentRef.current.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(totalHeight / PAGE_CONTENT_HEIGHT)));
    }
  }, [sections, journal]);

  const renderHeading = (label: string) => {
    sectionCounter++;
    switch (config.headingStyle) {
      case "uppercase":
        return <h3 className="font-bold text-[11px] tracking-wide mt-4 mb-1 uppercase">{config.sectionNumbering ? `${toRoman(sectionCounter)}. ` : ""}{label}</h3>;
      case "numbered":
        return <h3 className="font-bold text-[12px] mt-4 mb-1">{config.sectionNumbering ? `${sectionCounter}. ` : ""}{label}</h3>;
      default:
        return <h3 className="font-bold text-[12px] mt-4 mb-1">{label}</h3>;
    }
  };

  const renderParagraphs = (content: string) =>
    content.split("\n").filter(Boolean).map((p, i) => (
      <p key={i} className={`${config.bodySize} ${config.lineHeight} text-justify mb-1 indent-4 first:indent-0`}>{p}</p>
    ));

  return (
    <div className="flex-1 overflow-y-auto bg-muted/40 py-8 px-4">
      <div className={`mx-auto ${config.pageWidth} ${config.fontFamily} relative`}>
        {/* Continuous content rendered inside paged container */}
        <div className="relative">
          {/* Page backgrounds + borders + page numbers */}
          {Array.from({ length: pageCount }).map((_, i) => (
            <div key={`page-${i}`}>
              {/* The page "sheet" */}
              <div
                className="bg-white shadow-xl relative"
                style={{
                  height: `${PAGE_CONTENT_HEIGHT + 96}px`, // content + padding
                  marginBottom: i < pageCount - 1 ? 0 : undefined,
                }}
              >
                {/* Page number */}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[8px] text-gray-400">{i + 1}</span>
                </div>
              </div>

              {/* Page break indicator between pages */}
              {i < pageCount - 1 && (
                <div className="relative flex items-center justify-center py-2 my-0">
                  <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-accent/40" />
                  <span className="relative bg-muted/40 px-3 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground border border-border">
                    Page {i + 1} → {i + 2}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Content overlay — flows naturally over page backgrounds */}
          <div
            ref={contentRef}
            className="absolute top-0 left-0 right-0 text-black"
            style={{ padding: "48px 52px" }}
          >
            {/* Header / Title */}
            <div className="text-center mb-5">
              <h1 className={`${config.titleSize} font-bold ${config.lineHeight} mb-3 tracking-tight`}>
                {titleSection?.content || "Untitled Paper"}
              </h1>
              <p className="text-[10.5px] text-gray-700 mb-0.5 font-medium">Author Name<sup>1</sup>, Co-Author Name<sup>2</sup></p>
              <p className="text-[8.5px] text-gray-500 italic leading-relaxed">
                <sup>1</sup>Department of Computer Science, University Name, City, Country
              </p>
              <p className="text-[8.5px] text-gray-500 italic leading-relaxed">
                <sup>2</sup>Research Laboratory, Institution Name, City, Country
              </p>
              <p className="text-[8px] text-gray-400 mt-1">Correspondence: author@university.edu</p>
            </div>

            <hr className="border-gray-300 mb-3" />

            {/* Abstract */}
            {abstractSection?.content && (
              <div className="mb-3">
                <p className="font-bold text-[10px] tracking-wide uppercase mb-0.5">Abstract</p>
                <p className={`${config.bodySize} ${config.lineHeight} text-justify ${config.abstract === "italic" ? "italic" : ""}`}>
                  {abstractSection.content}
                </p>
              </div>
            )}

            {/* Keywords */}
            {keywordsSection?.content && (
              <div className="mb-3">
                <p className="text-[9.5px]">
                  <span className="font-bold italic">{journal.startsWith("ieee") ? "Index Terms" : "Keywords"}: </span>
                  <span className="italic">{keywordsSection.content}</span>
                </p>
              </div>
            )}

            {/* Highlights (Elsevier) */}
            {highlightsSection?.content && (
              <div className="mb-3 border border-gray-200 p-3 bg-gray-50 rounded">
                <p className="font-bold text-[10px] mb-1">Highlights</p>
                {highlightsSection.content.split("\n").filter(Boolean).map((h, i) => (
                  <p key={i} className="text-[9.5px] leading-[1.3]">• {h.replace(/^[•\-]\s*/, "")}</p>
                ))}
              </div>
            )}

            {/* CCS Concepts (ACM) */}
            {ccsSection?.content && (
              <div className="mb-3">
                <p className="font-bold text-[10px] mb-0.5">CCS Concepts</p>
                <p className="text-[9.5px] italic">{ccsSection.content}</p>
              </div>
            )}

            <hr className="border-gray-200 mb-2" />

            {/* Body */}
            {config.columns === 2 ? (
              <div className="columns-2 gap-5" style={{ columnRule: "0.5px solid #e5e7eb" }}>
                {bodySections.map((s) => (
                  <div key={s.id} className="break-inside-avoid mb-2">
                    {renderHeading(s.label)}
                    {renderParagraphs(s.content)}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {bodySections.map((s) => (
                  <div key={s.id} className="mb-2">
                    {renderHeading(s.label)}
                    {renderParagraphs(s.content)}
                  </div>
                ))}
              </div>
            )}

            {/* References */}
            {(() => {
              const refSection = sections.find((s) => ["references", "works-cited", "bibliography", "reference-list"].includes(s.id));
              if (!refSection?.content.trim()) return null;
              return (
                <div className="mt-4">
                  <h3 className="font-bold text-[11px] tracking-wide uppercase mb-1">{refSection.label}</h3>
                  {refSection.content.split("\n").filter(Boolean).map((r, i) => (
                    <p key={i} className="text-[8.5px] leading-[1.3] mb-0.5 pl-3 -indent-3">[{i + 1}] {r.replace(/^\[\d+\]\s*/, "")}</p>
                  ))}
                </div>
              );
            })()}

            {/* Footer */}
            <div className="mt-8 pt-2 border-t border-gray-200 text-center">
              <p className="text-[7px] text-gray-400">Generated by PaperForge</p>
            </div>
          </div>
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
