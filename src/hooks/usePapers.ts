import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";

export type SectionDiagram = {
  id?: string;
  type: "mermaid" | "image";
  code?: string;
  imageData?: string;
  svg?: string;
  caption: string;
  width?: string;
};

export type PaperSection = {
  id: string;
  label: string;
  content: string;
  diagram?: SectionDiagram;
  diagrams?: SectionDiagram[];
};

export type Paper = {
  id: string;
  user_id: string;
  title: string;
  journal: string;
  status: string;
  domain: string | null;
  methodology_summary: string | null;
  results_summary: string | null;
  sections: PaperSection[];
  created_at: string;
  updated_at: string;
};

const DEFAULT_SECTIONS: PaperSection[] = [
  { id: "title", label: "Title", content: "" },
  { id: "abstract", label: "Abstract", content: "" },
  { id: "keywords", label: "Keywords", content: "" },
  { id: "introduction", label: "Introduction", content: "" },
  { id: "literature", label: "Literature Review", content: "" },
  { id: "methodology", label: "Methodology", content: "" },
  { id: "results", label: "Results", content: "" },
  { id: "discussion", label: "Discussion", content: "" },
  { id: "conclusion", label: "Conclusion", content: "" },
  { id: "references", label: "References", content: "" },
];

// Format-specific section templates
const FORMAT_SECTIONS: Record<string, PaperSection[]> = {
  // === JOURNALS ===
  ieee: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Index Terms", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results and Analysis", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  springer: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  elsevier: [
    { id: "title", label: "Title", content: "" },
    { id: "highlights", label: "Highlights", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "coi", label: "Declaration of Competing Interest", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  acm: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "System Design / Methodology", content: "" },
    { id: "evaluation", label: "Evaluation", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  nature: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "methods", label: "Methods", content: "" },
    { id: "data-availability", label: "Data Availability", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  science: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "materials-methods", label: "Materials and Methods", content: "" },
    { id: "supplementary", label: "Supplementary Materials", content: "" },
    { id: "references", label: "References and Notes", content: "" },
  ],
  mdpi: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "funding", label: "Funding", content: "" },
    { id: "coi", label: "Conflicts of Interest", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  plos: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "supporting-info", label: "Supporting Information", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],

  // === CONFERENCES ===
  "ieee-conf": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Index Terms", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Approach", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion and Future Work", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "acm-conf": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Approach", content: "" },
    { id: "evaluation", label: "Evaluation", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  neurips: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background / Preliminaries", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "theoretical", label: "Theoretical Analysis", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "broader-impact", label: "Broader Impact", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  icml: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Preliminaries", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "theoretical", label: "Theoretical Analysis", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  cvpr: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Approach", content: "" },
    { id: "implementation", label: "Implementation Details", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "ablation", label: "Ablation Study", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  aaai: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "ethics", label: "Ethical Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  iclr: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "background", label: "Background", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results and Analysis", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "reproducibility", label: "Reproducibility Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  acl: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "experimental-setup", label: "Experimental Setup", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "analysis", label: "Analysis", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "limitations", label: "Limitations", content: "" },
    { id: "ethics", label: "Ethics Statement", content: "" },
    { id: "references", label: "References", content: "" },
  ],

  // === CITATION STANDARDS ===
  apa7: [
    { id: "title", label: "Title Page", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  chicago: [
    { id: "title", label: "Title Page", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "body", label: "Body", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "bibliography", label: "Bibliography", content: "" },
  ],
  mla: [
    { id: "title", label: "Title", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "body", label: "Body", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "works-cited", label: "Works Cited", content: "" },
  ],
  harvard: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "results", label: "Results / Findings", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "reference-list", label: "Reference List", content: "" },
  ],
  vancouver: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  turabian: [
    { id: "title", label: "Title Page", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "body", label: "Body", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "bibliography", label: "Bibliography", content: "" },
  ],

  // === ADDITIONAL JOURNALS ===
  frontiers: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "data-availability", label: "Data Availability Statement", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  bmc: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Background", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  hindawi: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results and Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "oxford-academic": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "cambridge-up": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "royal-society": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Material and Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "data-availability", label: "Data Accessibility", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "de-gruyter": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "emerald-insight": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Structured Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Literature Review", content: "" },
    { id: "methodology", label: "Research Methodology", content: "" },
    { id: "results", label: "Findings", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion and Implications", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "world-scientific": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "ios-press": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  // Medical
  lancet: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Summary", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Findings", content: "" },
    { id: "discussion", label: "Interpretation", content: "" },
    { id: "funding", label: "Funding", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  bmj: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  jama: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Key Points", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  nejm: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  cell: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Summary", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "methods", label: "STAR Methods", content: "" },
    { id: "data-availability", label: "Data and Code Availability", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  pnas: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "methodology", label: "Materials and Methods", content: "" },
    { id: "acknowledgements", label: "Acknowledgements", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  lippincott: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusions", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  karger: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  "thieme-medical": [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Methods", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "discussion", label: "Discussion", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  // Additional conferences
  interspeech: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  icassp: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "keywords", label: "Index Terms", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  miccai: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "experiments", label: "Experiments and Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  eccv: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  sigmod: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "System Design", content: "" },
    { id: "experiments", label: "Experimental Evaluation", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  vldb: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Approach", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  www: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  kdd: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "ccs-concepts", label: "CCS Concepts", content: "" },
    { id: "keywords", label: "Keywords", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  ijcai: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Proposed Method", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  coling: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "references", label: "References", content: "" },
  ],
  naacl: [
    { id: "title", label: "Title", content: "" },
    { id: "abstract", label: "Abstract", content: "" },
    { id: "introduction", label: "Introduction", content: "" },
    { id: "literature", label: "Related Work", content: "" },
    { id: "methodology", label: "Methodology", content: "" },
    { id: "experiments", label: "Experiments", content: "" },
    { id: "results", label: "Results", content: "" },
    { id: "conclusion", label: "Conclusion", content: "" },
    { id: "limitations", label: "Limitations", content: "" },
    { id: "references", label: "References", content: "" },
  ],
};

export function getSectionsForFormat(formatId: string): PaperSection[] {
  return (FORMAT_SECTIONS[formatId] || DEFAULT_SECTIONS).map(s => ({ ...s }));
}

function parseSections(raw: Json): PaperSection[] {
  if (Array.isArray(raw) && raw.length > 0) return raw as unknown as PaperSection[];
  return DEFAULT_SECTIONS;
}

const MOCK_USER_IDS = [
  "00000000-0000-0000-0000-000000000000", // admin@paperforge.com
  "11111111-1111-1111-1111-111111111111", // studentadmin@paperforge.com
];

function isMockUser(userId: string | undefined): boolean {
  return !!userId && MOCK_USER_IDS.includes(userId);
}

function getMockPapers(): Paper[] {
  const data = localStorage.getItem("pf_mock_papers");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveMockPapers(papers: Paper[]) {
  localStorage.setItem("pf_mock_papers", JSON.stringify(papers));
}

export function usePapers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["papers", user?.id],
    queryFn: async () => {
      if (isMockUser(user?.id)) {
        return getMockPapers();
      }
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p) => ({ ...p, sections: parseSections(p.sections) })) as Paper[];
    },
    enabled: !!user,
  });
}

export function usePaper(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paper", id],
    queryFn: async () => {
      if (!id || id === "new") return null;
      if (isMockUser(user?.id)) {
        const mock = getMockPapers().find(p => p.id === id);
        return mock || null;
      }
      const { data, error } = await supabase.from("papers").select("*").eq("id", id).single();
      if (error) throw error;
      return { ...data, sections: parseSections(data.sections) } as Paper;
    },
    enabled: !!user && !!id && id !== "new",
  });
}

export function useCreatePaper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { title: string; journal: string; domain?: string; methodology_summary?: string; results_summary?: string }) => {
      const formatSections = getSectionsForFormat(params.journal || "");
      const sections = formatSections.map((s) =>
        s.id === "title" ? { ...s, content: params.title } : s
      );
      
      if (isMockUser(user?.id)) {
        const newPaper: Paper = {
          id: Math.random().toString(36).substring(2, 15),
          user_id: user!.id,
          title: params.title,
          journal: params.journal,
          domain: params.domain || "",
          methodology_summary: params.methodology_summary || "",
          results_summary: params.results_summary || "",
          sections,
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const papers = getMockPapers();
        papers.unshift(newPaper);
        saveMockPapers(papers);
        return newPaper;
      }

      const { data, error } = await supabase
        .from("papers")
        .insert({
          user_id: user!.id,
          title: params.title,
          journal: params.journal,
          domain: params.domain || "",
          methodology_summary: params.methodology_summary || "",
          results_summary: params.results_summary || "",
          sections: sections as unknown as Json,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, sections: parseSections(data.sections) } as Paper;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["papers"] }),
  });
}

export function useUpdatePaper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Pick<Paper, "title" | "journal" | "status" | "domain" | "methodology_summary" | "results_summary" | "sections">> }) => {
      if (isMockUser(user?.id)) {
        const papers = getMockPapers();
        const idx = papers.findIndex(p => p.id === params.id);
        if (idx !== -1) {
          const updated = {
            ...papers[idx],
            ...params.updates,
            updated_at: new Date().toISOString()
          } as Paper;
          if (params.updates.sections) {
            const titleSection = params.updates.sections.find((s) => s.id === "title");
            if (titleSection?.content) updated.title = titleSection.content;
          }
          papers[idx] = updated;
          saveMockPapers(papers);
        }
        return;
      }

      const updateData: Record<string, unknown> = { ...params.updates };
      if (params.updates.sections) {
        updateData.sections = params.updates.sections as unknown as Json;
      }
      if (params.updates.sections) {
        const titleSection = params.updates.sections.find((s) => s.id === "title");
        if (titleSection?.content) updateData.title = titleSection.content;
      }
      const { error } = await supabase.from("papers").update(updateData).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["paper", vars.id] });
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
  });
}

export function useDeletePaper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isMockUser(user?.id)) {
        const papers = getMockPapers();
        const filtered = papers.filter(p => p.id !== id);
        saveMockPapers(filtered);
        return;
      }
      const { error } = await supabase.from("papers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["papers"] }),
  });
}

export { DEFAULT_SECTIONS };
