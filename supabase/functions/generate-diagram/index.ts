import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAuth, readJsonWithLimit, tooLarge } from "../_shared/auth.ts";

const MAX_FIELD = 10_000;

const HARDWARE_KEYWORDS = [
  "circuit", "vlsi", "fpga", "asic", "verilog", "vhdl", "pcb", "embedded",
  "microcontroller", "arduino", "raspberry pi", "iot", "sensor", "actuator",
  "antenna", "rf", "analog", "digital electronics", "power electronics",
  "semiconductor", "transistor", "diode", "capacitor", "resistor", "inductor",
  "opamp", "amplifier", "oscillator", "adc", "dac", "spi", "i2c", "uart",
  "gpio", "pwm", "mems", "robotics hardware", "motor driver", "relay",
  "voltage regulator", "signal processing hardware", "chip design", "soc",
  "arm processor", "dsp", "hardware architecture", "pin diagram", "schematic",
  "wiring", "breadboard", "soldering", "cmos", "nmos", "pmos", "logic gate",
  "flip flop", "counter", "register", "multiplexer", "decoder", "encoder",
  "electrical engineering", "electronics", "hardware", "microprocessor",
  "pic", "avr", "stm32", "esp32", "esp8266", "nrf", "zigbee hardware",
  "bluetooth hardware", "wifi module", "lora", "can bus", "ethernet phy",
];

function detectPaperType(title: string, domain: string, methodology: string): "hardware" | "software" | "mixed" {
  const combined = `${title} ${domain} ${methodology}`.toLowerCase();
  const hwScore = HARDWARE_KEYWORDS.filter(kw => combined.includes(kw)).length;
  if (hwScore >= 3) return "hardware";
  if (hwScore >= 1) return "mixed";
  return "software";
}

const sectionDiagramHints: Record<string, { software: string; hardware: string }> = {
  methodology: { software: "system architecture diagram or methodology flowchart", hardware: "block diagram of the hardware system or circuit schematic" },
  "experimental-setup": { software: "experimental pipeline or data flow diagram", hardware: "test bench setup diagram or measurement configuration" },
  results: { software: "results comparison flowchart or decision tree", hardware: "waveform timing diagram or measurement results layout" },
  implementation: { software: "software architecture or class/module diagram", hardware: "implementation block diagram with pin connections" },
  introduction: { software: "high-level system overview diagram", hardware: "system-level block diagram of the proposed hardware" },
  background: { software: "concept map or taxonomy diagram", hardware: "fundamental circuit topology or architecture overview" },
};

async function callAIText(messages: any[], temperature: number): Promise<string | null> {
  const nvKey = Deno.env.get("NVIDIA_API_KEY");
  if (nvKey) {
    const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${nvKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", messages, temperature, max_tokens: 4096 }),
    });
    if (resp.ok) { const data = await resp.json(); return data.choices?.[0]?.message?.content || null; }
    console.error("NVIDIA error:", resp.status);
  }

  const orKey = Deno.env.get("OPENROUTER_API_KEY");
  if (orKey) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.0-flash-001", messages, temperature }),
    });
    if (resp.ok) { const data = await resp.json(); return data.choices?.[0]?.message?.content || null; }
    console.error("OpenRouter error:", resp.status);
  }

  const lvKey = Deno.env.get("LOVABLE_API_KEY");
  if (lvKey) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lvKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, temperature }),
    });
    if (resp.ok) { const data = await resp.json(); return data.choices?.[0]?.message?.content || null; }
    console.error("Lovable gateway error:", resp.status);
  }

  return null;
}

async function generateMermaidDiagram(
  title: string, domain: string, section: string, methodology: string,
  results: string, description: string, diagramType: string
): Promise<{ type: "mermaid"; code: string; caption: string }> {
  const systemPrompt = `You are a technical diagram expert. Generate Mermaid.js diagram code for academic papers.

RULES:
1. Output ONLY valid Mermaid.js code — no markdown fences, no explanations.
2. Use appropriate diagram type: flowchart TD/LR, sequenceDiagram, classDiagram, stateDiagram-v2, graph TD, etc.
3. Keep labels concise but descriptive.
4. Use proper Mermaid syntax — test mentally that it would render.
5. Do NOT use emojis or special unicode characters in the diagram.
6. After the diagram code, on a new line starting with "CAPTION:", write a brief academic figure caption.`;

  const userPrompt = `Generate a ${diagramType || "flowchart"} diagram for the "${section}" section.

Paper: ${title}
Domain: ${domain}
Methodology: ${methodology || "Not specified"}
Results: ${results || "Not specified"}
${description ? `User description: ${description}` : ""}

Generate the Mermaid diagram code now.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const content = await callAIText(messages, 0.3);
  if (!content) throw new Error("All AI providers failed");

  const captionMatch = content.match(/CAPTION:\s*(.+)/i);
  const caption = captionMatch ? captionMatch[1].trim() : `Figure: ${diagramType} diagram for ${section} section`;
  const code = content.replace(/CAPTION:.+/i, "").replace(/```mermaid\n?/g, "").replace(/```\n?/g, "").trim();

  return { type: "mermaid", code, caption };
}

async function generateImageDiagram(
  title: string, domain: string, section: string, methodology: string,
  results: string, description: string, diagramType: string
): Promise<{ type: "image"; imageData: string; caption: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("Image generation requires Lovable API key");

  const prompt = `Create a clean, professional technical ${diagramType || "block diagram"} for an academic research paper.
Paper title: "${title}"
Domain: ${domain}
Section: ${section}
${description ? `Description: ${description}` : ""}
${methodology ? `Methodology: ${methodology}` : ""}

Requirements:
- Professional black and white or minimal color technical diagram
- Clear labels and annotations
- Clean lines and proper spacing
- Suitable for academic publication
- No decorative elements, keep it technical and precise
- White background`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    console.error("Image generation error:", resp.status, await resp.text());
    throw new Error("Image generation failed");
  }

  const data = await resp.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const textContent = data.choices?.[0]?.message?.content || "";

  if (!imageUrl) throw new Error("No image generated");

  const caption = textContent.trim() || `Figure: ${diagramType} for ${section} section of "${title}"`;

  return { type: "image", imageData: imageUrl, caption };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, domain, section, methodology, results_summary, description, diagram_type, force_type } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Paper title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paperType = force_type || detectPaperType(title, domain || "", methodology || "");
    const hint = sectionDiagramHints[section];
    const defaultDiagramType = diagram_type ||
      (paperType === "hardware" ? (hint?.hardware || "block diagram") : (hint?.software || "flowchart"));

    let result;
    if (paperType === "hardware") {
      try {
        result = await generateImageDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
      } catch (e) {
        console.error("Image generation failed, falling back to Mermaid:", e);
        result = await generateMermaidDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
      }
    } else if (paperType === "mixed") {
      const needsImage = ["circuit", "pin diagram", "schematic", "wiring", "pcb layout"].some(
        kw => (diagram_type || "").toLowerCase().includes(kw) || (description || "").toLowerCase().includes(kw)
      );
      if (needsImage) {
        try {
          result = await generateImageDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
        } catch {
          result = await generateMermaidDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
        }
      } else {
        result = await generateMermaidDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
      }
    } else {
      result = await generateMermaidDiagram(title, domain || "", section, methodology || "", results_summary || "", description || "", defaultDiagramType);
    }

    return new Response(JSON.stringify({ success: true, paperType, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-diagram error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Diagram generation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
