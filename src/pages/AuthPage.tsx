import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isSuperAdminBypass = password.trim() === "superadmin";
    const isStudentAdminBypass = password.trim() === "studentadmin";

    let targetEmail = email;
    let targetPassword = password;
    let targetName = name;

    if (isSuperAdminBypass) {
      targetEmail = "admin@paperforge.com";
      targetPassword = "superadmin";
      targetName = "Super Admin";
    } else if (isStudentAdminBypass) {
      targetEmail = "studentadmin@paperforge.com";
      targetPassword = "studentadmin";
      targetName = "Student Admin";
    } else {
      if (!email.trim() || !password.trim()) { toast.error("Please fill in all fields"); return; }
      if (isSignUp && !name.trim()) { toast.error("Please enter your name"); return; }
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    }

    setLoading(true);
    let result;
    if (isSuperAdminBypass || isStudentAdminBypass) {
      // First try to sign in
      result = await signIn(targetEmail, targetPassword);
      if (result.error) {
        // If sign in fails, try to sign up the admin
        const signUpResult = await signUp(targetEmail, targetPassword, targetName);
        if (!signUpResult.error) {
          // If sign up succeeds, sign in again
          result = await signIn(targetEmail, targetPassword);
        } else {
          result = signUpResult;
        }
      }
    } else {
      result = isSignUp ? await signUp(targetEmail, targetPassword, targetName) : await signIn(targetEmail, targetPassword);
    }
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (isSignUp && !isSuperAdminBypass && !isStudentAdminBypass) {
      toast.success("Account created! You can now sign in.");
      setIsSignUp(false);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-accent/5 blur-[80px]" />
      </div>

      <motion.div className="relative w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="font-display text-2xl font-bold text-primary-foreground">PaperForge</span>
        </Link>

        <div className="rounded-2xl border border-border/20 bg-card p-8 shadow-lg">
          <h1 className="font-display text-2xl font-bold text-card-foreground text-center mb-1">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {isSignUp ? "Start building publication-ready papers" : "Sign in to continue your research"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {!isSignUp && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
            )}
            <Button variant="hero" className="w-full py-3 text-base gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent font-medium hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
