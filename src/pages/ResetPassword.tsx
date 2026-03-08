import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid reset link");
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); } else { setSuccess(true); }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6">
      <motion.div className="relative w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="font-display text-2xl font-bold text-primary-foreground">PaperForge</span>
        </Link>
        <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-lg">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-success mb-4" />
              <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">Password Updated</h1>
              <p className="text-muted-foreground text-sm mb-6">Your password has been successfully reset.</p>
              <Button variant="hero" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-card-foreground text-center mb-1">New Password</h1>
              <p className="text-muted-foreground text-center text-sm mb-8">Choose a strong password for your account</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Button variant="hero" className="w-full py-3 gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
