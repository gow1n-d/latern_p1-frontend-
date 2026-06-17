import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Clock, MoreVertical, Search, Sparkles,
  Trash2, Loader2, LogOut, User, Settings, Crown, FileText, Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePapers, useDeletePaper } from "@/hooks/usePapers";
import { useReports, useDeleteReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
  wiley: "bg-cyan-500/10 text-cyan-700",
  "taylor-francis": "bg-pink-500/10 text-pink-700",
  sage: "bg-amber-500/10 text-amber-700",
  mdpi: "bg-teal-500/10 text-teal-700",
  plos: "bg-yellow-500/10 text-yellow-700",
  nature: "bg-red-500/10 text-red-700",
  science: "bg-indigo-500/10 text-indigo-700",
  "ieee-conf": "bg-blue-500/10 text-blue-700",
  "acm-conf": "bg-violet-500/10 text-violet-700",
  neurips: "bg-fuchsia-500/10 text-fuchsia-700",
  icml: "bg-sky-500/10 text-sky-700",
  cvpr: "bg-lime-500/10 text-lime-700",
  aaai: "bg-orange-500/10 text-orange-700",
  iclr: "bg-emerald-500/10 text-emerald-700",
  acl: "bg-rose-500/10 text-rose-700",
  "web-of-science": "bg-slate-500/10 text-slate-700",
  apa7: "bg-blue-500/10 text-blue-700",
  chicago: "bg-stone-500/10 text-stone-700",
  mla: "bg-purple-500/10 text-purple-700",
  harvard: "bg-red-500/10 text-red-700",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isPro } = useUserRole();
  const [activeTab, setActiveTab] = useState<"papers" | "reports">("papers");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: papers, isLoading: loadingPapers } = usePapers();
  const deletePaper = useDeletePaper();

  const { data: reports, isLoading: loadingReports } = useReports();
  const deleteReport = useDeleteReport();

  const isLoading = loadingPapers || loadingReports;

  const filteredPapers = (papers || []).filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = (reports || []).filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePaper = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePaper.mutate(id, {
      onSuccess: () => toast.success("Paper deleted"),
      onError: () => toast.error("Failed to delete paper"),
    });
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteReport.mutate(id, {
      onSuccess: () => toast.success("Report deleted"),
      onError: () => toast.error("Failed to delete report"),
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getProgress = (item: { sections: any[] }) => {
    const filled = item.sections.filter((s) => s.content && s.content.trim()).length;
    return { filled, total: item.sections.length };
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
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                <Crown className="h-3 w-3" /> SUPERADMIN
              </span>
            )}
            {!isAdmin && isPro && (
              <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                <Crown className="h-3 w-3" /> PRO
              </span>
            )}
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
                {!isPro && (
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="gap-2">
                    <Settings className="h-4 w-4" /> Upgrade Plan
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Library</h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === "papers" 
                ? `${papers?.length || 0} paper${(papers?.length || 0) !== 1 ? "s" : ""} in your library` 
                : `${reports?.length || 0} report${(reports?.length || 0) !== 1 ? "s" : ""} in your library`}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <Button variant="outline" onClick={() => navigate("/literature-review")} className="gap-2 flex-1 sm:flex-none">
              <Library className="h-4 w-4" /> Literature Review
            </Button>
            <Button variant="outline" onClick={() => navigate("/report/new")} className="gap-2 flex-1 sm:flex-none">
              <FileText className="h-4 w-4" /> New Report
            </Button>
            <Button variant="hero" onClick={() => navigate("/editor/new")} className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> New Paper
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-between">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("papers")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "papers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Papers
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "reports" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Reports
            </button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`Search ${activeTab}...`}
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {activeTab === "papers" ? (
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
            ) : (
              <motion.button
                onClick={() => navigate("/report/new")}
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center transition-all hover:border-accent/50 hover:bg-accent/5 min-h-[220px]"
                whileHover={{ scale: 1.02 }}
              >
                <div className="mb-4 rounded-full bg-accent/10 p-4 group-hover:bg-accent/20 transition-colors">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <p className="font-semibold text-foreground">Create New Report</p>
                <p className="mt-1 text-sm text-muted-foreground">Choose from multiple report templates</p>
              </motion.button>
            )}

            {activeTab === "papers" && filteredPapers.map((paper, i) => {
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
                        <DropdownMenuItem onClick={(e) => handleDeletePaper(paper.id, e as unknown as React.MouseEvent)} className="gap-2 text-destructive">
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

            {activeTab === "reports" && filteredReports.map((report, i) => {
              const progress = getProgress(report);
              return (
                <motion.div
                  key={report.id}
                  className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover cursor-pointer"
                  onClick={() => navigate(`/report/${report.id}`)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[report.status] || statusColors.draft}`}>
                        {report.status.replace("-", " ")}
                      </span>
                      <span className="rounded-md bg-accent/10 text-accent px-2 py-0.5 text-xs font-semibold uppercase">
                        {report.template_name}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDeleteReport(report.id, e as unknown as React.MouseEvent)} className="gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-card-foreground leading-snug line-clamp-2">
                    {report.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatDate(report.updated_at)}
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
