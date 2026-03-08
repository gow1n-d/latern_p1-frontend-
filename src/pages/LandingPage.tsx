import { motion } from "framer-motion";
import { BookOpen, Sparkles, Shield, FileText, ArrowRight, CheckCircle2, Zap, Search, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const journals = ["IEEE", "Springer", "Elsevier", "Scopus", "ACM"];

const features = [
  {
    icon: FileText,
    title: "Journal Templates",
    description: "Pre-loaded templates for IEEE, Springer, Elsevier, ACM and more. Auto-format your paper to submission standards.",
  },
  {
    icon: Sparkles,
    title: "AI Paper Generation",
    description: "Generate abstracts, introductions, literature reviews, and conclusions in academic writing style.",
  },
  {
    icon: Search,
    title: "Novelty Detection",
    description: "Check if your research idea already exists. Get similarity scores and discover research gaps.",
  },
  {
    icon: Shield,
    title: "Plagiarism Check",
    description: "Semantic plagiarism detection with source identification and similarity percentage reports.",
  },
  {
    icon: Zap,
    title: "Format Validator",
    description: "Validate fonts, margins, citations, figures, and column format against journal requirements.",
  },
  {
    icon: Quote,
    title: "Auto Citations",
    description: "Input DOI or paper title — get instant formatted citations in IEEE, APA, MLA, or Chicago style.",
  },
];

const steps = [
  { step: "01", title: "Select Journal", desc: "Choose your target journal and load the template" },
  { step: "02", title: "Input Research", desc: "Enter your title, domain, methodology and results" },
  { step: "03", title: "AI Generates", desc: "AI writes your paper in academic style" },
  { step: "04", title: "Review & Edit", desc: "Edit in our Google Docs-style editor" },
  { step: "05", title: "Check & Export", desc: "Validate formatting, check plagiarism, export" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Button variant="nav" size="sm">Features</Button>
            <Button variant="nav" size="sm">Pricing</Button>
            <Button variant="nav" size="sm">About</Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Sign In</Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/dashboard")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-20">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent blur-[100px]" />
          <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-accent blur-[80px]" />
        </div>

        <div className="container relative mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
              <Sparkles className="h-4 w-4" />
              AI-Powered Academic Writing
            </div>
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
              Build Publication-Ready
              <span className="text-gradient-gold block">Research Papers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/70">
              Select your journal. Input your research. Let AI generate, format, and validate your paper
              for IEEE, Springer, Elsevier, and more — ready to submit.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/dashboard")}>
                Start Writing <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Journal badges */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {journals.map((j) => (
              <span
                key={j}
                className="rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-sm font-medium text-primary-foreground/80"
              >
                {j}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground">Everything You Need to Publish</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From idea to submission — our AI pipeline handles every step of the research paper workflow.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-3 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Five steps from idea to submission-ready paper</p>
          </div>
          <div className="grid gap-8 md:grid-cols-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">
                  {s.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl bg-hero p-12 text-center md:p-20">
            <h2 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
              Ready to Write Your Next Paper?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70 text-lg">
              Join thousands of researchers who publish faster with AI-powered paper generation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/dashboard")}>
                Start Free <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-primary-foreground/60">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> 3 free papers</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> All templates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-foreground">PaperForge</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 PaperForge. Built for researchers, by researchers.</p>
        </div>
      </footer>
    </div>
  );
}
