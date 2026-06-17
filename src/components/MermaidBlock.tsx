import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default", suppressErrorRendering: true });

let idCounter = 0;

export default function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const id = useRef(`mermaid-${Date.now()}-${idCounter++}`);

  useEffect(() => {
    let mounted = true;
    const renderDiagram = async () => {
      try {
        setError(false);
        // Sanitize common AI mistakes
        let cleanCode = code.trim();
        if (cleanCode.toLowerCase().startsWith("mermaid")) {
          cleanCode = cleanCode.substring(7).trim();
        }
        
        const { svg } = await mermaid.render(id.current, cleanCode);
        
        // Mermaid sometimes still returns an error SVG instead of throwing
        if (svg.includes("Syntax error") || svg.includes("mermaid-error")) {
          throw new Error("Mermaid returned an error SVG");
        }
        
        if (mounted) setSvg(svg);
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (mounted) setError(true);
      }
    };
    renderDiagram();
    return () => { mounted = false; };
  }, [code]);

  if (error) {
    return (
      <div className="p-4 my-6 flex flex-col items-center justify-center text-sm text-destructive bg-destructive/5 rounded-xl border border-dashed border-destructive/30">
        <span className="font-semibold mb-1 text-destructive">Diagram Render Error</span>
        <span className="text-xs text-muted-foreground text-center max-w-md">The AI generated an invalid diagram syntax.</span>
        <details className="mt-3 w-full max-w-2xl">
          <summary className="text-[10px] cursor-pointer text-muted-foreground hover:text-foreground">View Code</summary>
          <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-left text-[10px] overflow-auto text-foreground font-mono">{code}</pre>
        </details>
      </div>
    );
  }

  if (!svg) return <div className="p-4 my-6 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded border border-dashed border-border/50 animate-pulse">Generating diagram...</div>;

  return (
    <div
      className="flex justify-center my-6 max-w-full overflow-hidden"
      dangerouslySetInnerHTML={{ __html: svg.replace(/<svg /i, '<svg style="max-width:100%;height:auto;" ') }}
    />
  );
}
