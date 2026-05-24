import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Shield, FileText, ArrowRight, CheckCircle2, Zap, Search, Quote,
  Star, Users, Award, BarChart3, Check, Crown, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const journals = ["IEEE", "Springer", "Elsevier", "Scopus", "ACM"];

const features = [
  { icon: FileText, title: "Journal Templates", description: "Pre-loaded templates for IEEE, Springer, Elsevier, ACM and more. Auto-format to submission standards." },
  { icon: Sparkles, title: "AI Paper Generation", description: "Generate abstracts, introductions, literature reviews, and conclusions in academic writing style." },
  { icon: Search, title: "Novelty Detection", description: "Check if your research idea already exists. Get similarity scores and discover research gaps." },
  { icon: Shield, title: "Plagiarism Check", description: "Semantic plagiarism detection with source identification and similarity percentage reports." },
  { icon: Zap, title: "Format Validator", description: "Validate fonts, margins, citations, figures, and column format against journal requirements." },
  { icon: Quote, title: "Auto Citations", description: "Input DOI or paper title — get instant formatted citations in IEEE, APA, MLA, or Chicago style." },
];

const steps = [
  { step: "01", title: "Select Journal", desc: "Choose your target journal and load the template" },
  { step: "02", title: "Input Research", desc: "Enter your title, domain, methodology and results" },
  { step: "03", title: "AI Generates", desc: "AI writes your paper in academic style" },
  { step: "04", title: "Review & Edit", desc: "Edit in our Google Docs-style editor" },
  { step: "05", title: "Check & Export", desc: "Validate formatting, check plagiarism, export" },
];

const stats = [
  { value: "10,000+", label: "Papers Generated" },
  { value: "5,000+", label: "Researchers" },
  { value: "50+", label: "Journal Templates" },
  { value: "98%", label: "Format Accuracy" },
];

const testimonials = [
  { name: "Dr. Sarah Chen", role: "Computer Science, MIT", text: "PaperForge cut my paper preparation time in half. The AI-generated literature review was remarkably thorough and well-structured.", rating: 5 },
  { name: "Prof. Ahmed Hassan", role: "Electrical Engineering, Stanford", text: "The journal template system is brilliant. No more manual formatting — it just works perfectly with IEEE standards.", rating: 5 },
  { name: "Dr. Maria Rodriguez", role: "Data Science, Oxford", text: "As a non-native English speaker, the AI writing assistant has been invaluable for producing publication-quality prose.", rating: 5 },
];

const plans = [
  { id: "free", name: "Free", price: "$0", period: "forever", features: ["3 papers/month", "5 AI generations/day", "Basic templates", "Text export"], popular: false },
  { id: "pro", name: "Pro", price: "$14.99", period: "/month", features: ["Unlimited papers", "Unlimited AI", "All templates", "PDF & LaTeX export", "AI editing", "Format validation"], popular: true },
  { id: "business", name: "Business", price: "$29.99", period: "/month", features: ["Everything in Pro", "5 team members", "Shared workspace", "Priority support", "Custom templates"], popular: false },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">Sign In</Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">Get Started Free</Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">How It Works</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Pricing</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Reviews</a>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button variant="ghost" size="sm" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="flex-1">Sign In</Button>
                  <Button variant="hero" size="sm" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="flex-1">Get Started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent blur-[100px]" />
          <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-accent blur-[80px]" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
              <Sparkles className="h-4 w-4" /> AI-Powered Academic Writing Platform
            </div>
            <h1 className="mx-auto max-w-4xl font-display text-3xl sm:text-5xl font-bold leading-tight text-primary-foreground md:text-7xl">
              Build Publication-Ready
              <span className="text-gradient-gold block">Research Papers</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-primary-foreground/70 px-2">
              Select your journal. Input your research. Let AI generate, format, and validate your paper
              for IEEE, Springer, Elsevier, and more — ready to submit.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/auth")}>
                Start Writing Free <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6" onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}>
                See How It Works
              </Button>
            </div>
          </motion.div>
          <motion.div className="mt-16 flex flex-wrap justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
            {journals.map((j) => (
              <span key={j} className="rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-sm font-medium text-primary-foreground/80">{j}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-12 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">Everything You Need to Publish</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">From idea to submission — our AI pipeline handles every step of the research paper workflow.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
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
      <section id="how-it-works" className="py-16 sm:py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">Five steps from idea to submission-ready paper</p>
          </div>
          <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {steps.map((s, i) => (
              <motion.div key={s.step} className={`text-center ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">{s.step}</div>
                <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">Trusted by Researchers</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">See what academics say about PaperForge</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} className="rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.id}
                className={`relative rounded-2xl border p-8 ${plan.popular ? "border-accent bg-card shadow-gold" : "border-border bg-card shadow-card"}`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>}
                <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="font-display text-3xl font-bold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-card-foreground">
                      <Check className="h-4 w-4 text-accent shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? "hero" : "outline"} className="w-full" onClick={() => navigate("/pricing")}>
                  {plan.id === "free" ? "Get Started" : "Choose Plan"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-hero p-8 sm:p-12 text-center md:p-20">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-primary-foreground md:text-5xl">Ready to Write Your Next Paper?</h2>
            <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-primary-foreground/70 text-base sm:text-lg">Join thousands of researchers who publish faster with AI-powered paper generation.</p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="text-base px-8 py-6 w-full sm:w-auto" onClick={() => navigate("/auth")}>
                Start Free <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-primary-foreground/60">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> 3 free papers</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> All templates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-accent" />
                <span className="font-display font-bold text-foreground">PaperForge</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered academic paper writing platform for researchers worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Templates</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 PaperForge. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Built for researchers, by researchers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
