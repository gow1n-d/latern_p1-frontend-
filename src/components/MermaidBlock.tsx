import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

let idCounter = 0;

export default function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const id = useRef(`mermaid-${Date.now()}-${idCounter++}`);

  useEffect(() => {
    let mounted = true;
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(id.current, code);
        if (mounted) setSvg(svg);
      } catch (err) {
        console.error("Mermaid render error:", err);
      }
    };
    renderDiagram();
    return () => { mounted = false; };
  }, [code]);

  if (!svg) return <div className="p-4 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded border border-dashed border-border/50 animate-pulse">Generating diagram...</div>;

  return (
    <div
      className="flex justify-center my-6 max-w-full overflow-hidden"
      dangerouslySetInnerHTML={{ __html: svg.replace(/<svg /i, '<svg style="max-width:100%;height:auto;" ') }}
    />
  );
}
