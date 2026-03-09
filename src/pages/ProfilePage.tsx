import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, User, Building2, Save, Loader2, LogOut, ArrowLeft, Mail, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isPro } = useUserRole();
  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setDisplayName(data.display_name || "");
        setInstitution(data.institution || "");
      }
      setFetching(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      institution,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground mb-10">Manage your account and preferences</p>

          {/* Profile Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <div className="flex items-center gap-2 rounded-lg border border-input bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" placeholder="Your name" value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Institution</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" placeholder="University or Organization" value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
            <Button variant="hero" className="mt-6 gap-2" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>

          {/* Subscription Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
            <h2 className="font-display text-lg font-semibold text-card-foreground mb-2">Subscription</h2>
            {isAdmin ? (
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  You're a <span className="font-bold text-accent">Superadmin</span> with full access to all Pro features
                </p>
              </div>
            ) : isPro ? (
              <p className="text-sm text-muted-foreground mb-4">
                You're on the <span className="font-semibold text-foreground">Pro Plan</span>
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  You're on the <span className="font-semibold text-foreground">Free Plan</span>
                </p>
                <Button variant="outline" onClick={() => navigate("/pricing")} className="gap-2">
                  Upgrade to Pro
                </Button>
              </>
            )}
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/20 bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-destructive mb-2">Account Actions</h2>
            <p className="text-sm text-muted-foreground mb-4">Sign out of your account</p>
            <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
