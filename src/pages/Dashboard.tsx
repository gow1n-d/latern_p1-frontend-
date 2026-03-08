import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, FileText, Clock, MoreVertical, Search, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Paper = {
  id: string;
  title: string;
  journal: string;
  status: "draft" | "in-progress" | "review" | "complete";
  updatedAt: string;
  sections: number;
  totalSections: number;
};

const mockPapers: Paper[] = [
  { id: "1", title: "Deep Learning Approaches for Medical Image Segmentation", journal: "IEEE", status: "in-progress", updatedAt: "2 hours ago", sections: 6, totalSections: 10 },
  { id: "2", title: "Blockchain-based Supply Chain Transparency Framework", journal: "Springer", status: "draft", updatedAt: "1 day ago", sections: 2, totalSections: 10 },
  { id: "3", title: "NLP Methods for Sentiment Analysis in Social Media", journal: "Elsevier", status: "complete", updatedAt: "3 days ago", sections: 10, totalSections: 10 },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-progress": "bg-accent/15 text-accent-foreground",
  review: "bg-warning/15 text-warning",
  complete: "bg-success/15 text-success",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [papers] = useState<Paper[]>(mockPapers);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent-foreground">
              R
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Papers</h1>
            <p className="text-muted-foreground mt-1">Manage and create your research papers</p>
          </div>
          <Button variant="hero" onClick={() => navigate("/editor/new")} className="gap-2">
            <Plus className="h-4 w-4" /> New Paper
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search papers..."
            />
          </div>
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        {/* Papers grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* New paper card */}
          <motion.button
            onClick={() => navigate("/editor/new")}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center transition-all hover:border-accent/50 hover:bg-accent/5 min-h-[220px]"
            whileHover={{ scale: 1.02 }}
          >
            <div className="mb-4 rounded-full bg-accent/10 p-4 group-hover:bg-accent/20 transition-colors">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <p className="font-semibold text-foreground">Create New Paper</p>
            <p className="mt-1 text-sm text-muted-foreground">Start with AI or from a template</p>
          </motion.button>

          {/* Paper cards */}
          {papers.map((paper, i) => (
            <motion.div
              key={paper.id}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover cursor-pointer"
              onClick={() => navigate(`/editor/${paper.id}`)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[paper.status]}`}>
                  {paper.status.replace("-", " ")}
                </span>
                <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground leading-snug line-clamp-2">
                {paper.title}
              </h3>
              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {paper.journal}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {paper.updatedAt}
                </span>
              </div>
              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{paper.sections}/{paper.totalSections} sections</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(paper.sections / paper.totalSections) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
