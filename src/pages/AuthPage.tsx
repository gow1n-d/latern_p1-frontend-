import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error("Please fill in both email and password.");
      return;
    }

    if (isSignUp && !cleanName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (cleanPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    let result: { error: string | null };

    if (isSignUp) {
      result = await signUp(cleanEmail, cleanPassword, cleanName);
    } else {
      result = await signIn(cleanEmail, cleanPassword);
    }
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isSignUp ? "Account created successfully! Welcome to PaperForge." : "Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    const result = await signIn(demoEmail, demoPass);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Signed in with demo profile!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute bottom-10 right-20 h-64 w-64 rounded-full bg-accent/5 blur-[80px]" />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 group-hover:scale-105 transition-transform">
            <BookOpen className="h-7 w-7 text-accent" />
          </div>
          <span className="font-display text-2xl font-bold text-primary-foreground tracking-tight">PaperForge</span>
        </Link>

        <div className="rounded-2xl border border-border/40 bg-card/95 backdrop-blur-md p-8 shadow-2xl space-y-6">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex rounded-xl bg-muted p-1 border border-border/50">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isSignUp
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isSignUp
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isSignUp
                ? "Start drafting and indexing publication-grade research papers"
                : "Sign in to access your papers, literature reviews, and reports"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full Name (e.g., Dr. Jane Doe)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-input bg-background pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-muted-foreground">Always works offline & online</span>
                <Link to="/forgot-password" className="text-accent hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button variant="hero" className="w-full py-3 text-sm font-semibold gap-2 shadow-md" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Register & Enter Dashboard" : "Sign In to Workspace"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground text-center font-semibold mb-2.5">
              1-Click Demo Profiles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@paperforge.com", "superadmin")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 transition-all text-center group"
                title="Sign in as Super Admin"
              >
                <ShieldCheck className="h-4 w-4 text-accent mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-foreground">Admin</span>
                <span className="text-[9px] text-muted-foreground">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("researcher@paperforge.com", "researcher123")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 transition-all text-center group"
                title="Sign in as Lead Researcher"
              >
                <Sparkles className="h-4 w-4 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-foreground">Researcher</span>
                <span className="text-[9px] text-muted-foreground">Pro Tier</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("studentadmin@paperforge.com", "studentadmin")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-accent/10 hover:border-accent/40 transition-all text-center group"
                title="Sign in as Student Admin"
              >
                <GraduationCap className="h-4 w-4 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-foreground">Student</span>
                <span className="text-[9px] text-muted-foreground">Standard</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
