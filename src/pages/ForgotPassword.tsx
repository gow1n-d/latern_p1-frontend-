import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { toast.error(error); } else { setSent(true); }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6">
      <motion.div className="relative w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="font-display text-2xl font-bold text-primary-foreground">PaperForge</span>
        </Link>
        <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-lg">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Mail className="h-8 w-8 text-accent" />
              </div>
              <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">Check Your Email</h1>
              <p className="text-muted-foreground text-sm mb-6">We've sent a password reset link to <strong>{email}</strong></p>
              <Link to="/auth"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Sign In</Button></Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-card-foreground text-center mb-1">Reset Password</h1>
              <p className="text-muted-foreground text-center text-sm mb-8">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Button variant="hero" className="w-full py-3 gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/auth" className="text-sm text-accent hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
