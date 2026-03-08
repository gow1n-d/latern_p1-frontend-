import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, FileText, Clock, MoreVertical, Search, Sparkles,
  Trash2, Loader2, LogOut, User, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePapers, useDeletePaper } from "@/hooks/usePapers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-progress": "bg-accent/15 text-accent-foreground",
  review: "bg-warning/15 text-foreground",
  complete: "bg-success/15 text-foreground",
};

const journalColors: Record<string, string> = {
  ieee: "bg-blue-500/10 text-blue-700",
  springer: "bg-emerald-500/10 text-emerald-700",
  elsevier: "bg-orange-500/10 text-orange-700",
  acm: "bg-violet-500/10 text-violet-700",
  scopus: "bg-rose-500/10 text-rose-700",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: papers, isLoading } = usePapers();
  const deletePaper = useDeletePaper();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPapers = (papers || []).filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePaper.mutate(id, {
      onSuccess: () => toast.success("Paper deleted"),
      onError: () => toast.error("Failed to delete paper"),
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getProgress = (paper: typeof filteredPapers[0]) => {
    const filled = paper.sections.filter((s) => s.content.trim()).length;
    return { filled, total: paper.sections.length };
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent-foreground">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2">
                  <User className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")} className="gap-2">
                  <Settings className="h-4 w-4" /> Upgrade Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Papers</h1>
            <p className="text-muted-foreground mt-1">
              {papers?.length || 0} paper{(papers?.length || 0) !== 1 ? "s" : ""} in your library
            </p>
          </div>
          <Button variant="hero" onClick={() => navigate("/editor/new")} className="gap-2">
            <Plus className="h-4 w-4" /> New Paper
          </Button>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            {filteredPapers.map((paper, i) => {
              const progress = getProgress(paper);
              return (
                <motion.div
                  key={paper.id}
                  className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover cursor-pointer"
                  onClick={() => navigate(`/editor/${paper.id}`)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[paper.status] || statusColors.draft}`}>
                        {paper.status.replace("-", " ")}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${journalColors[paper.journal] || ""}`}>
                        {paper.journal}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDelete(paper.id, e as unknown as React.MouseEvent)} className="gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-card-foreground leading-snug line-clamp-2">
                    {paper.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatDate(paper.updated_at)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progress.filled}/{progress.total} sections</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(progress.filled / progress.total) * 100}%` }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
