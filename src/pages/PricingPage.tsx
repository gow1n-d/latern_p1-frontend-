import { motion } from "framer-motion";
import { BookOpen, Check, ArrowRight, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic features",
    icon: Sparkles,
    features: [
      "3 papers per month",
      "5 AI generations per day",
      "Basic templates (IEEE, Springer)",
      "Text export",
      "Community support",
    ],
    cta: "Current Plan",
    popular: false,
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$14.99",
    period: "/month",
    description: "For serious researchers",
    icon: Zap,
    features: [
      "Unlimited papers",
      "Unlimited AI generations",
      "All journal templates",
      "PDF & LaTeX export",
      "AI editing assistant",
      "Plagiarism check (coming soon)",
      "Priority support",
      "Format validation",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    disabled: false,
  },
  {
    id: "business",
    name: "Business",
    price: "$29.99",
    period: "/month",
    description: "For research teams & labs",
    icon: Crown,
    features: [
      "Everything in Pro",
      "5 team members",
      "Shared paper workspace",
      "Citation database access",
      "Research gap analysis",
      "AI reviewer simulation",
      "Dedicated support",
      "Custom journal templates",
    ],
    cta: "Start Business",
    popular: false,
    disabled: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">PaperForge</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as your research needs grow. All plans include our core AI writing engine.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-accent bg-card shadow-gold scale-[1.02]"
                  : "border-border bg-card shadow-card"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-6">
                <plan.icon className={`h-8 w-8 mb-3 ${plan.popular ? "text-accent" : "text-muted-foreground"}`} />
                <h2 className="font-display text-2xl font-bold text-card-foreground">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-card-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-card-foreground">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.popular ? "text-accent" : "text-success"}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full py-3 gap-2"
                disabled={plan.disabled}
                onClick={() => {
                  if (!plan.disabled) {
                    navigate("/auth");
                  }
                }}
              >
                {plan.cta} {!plan.disabled && <ArrowRight className="h-4 w-4" />}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Can I try before I buy?", a: "Yes! The free plan gives you 3 papers per month with 5 AI generations per day — no credit card required." },
              { q: "Which journals are supported?", a: "We support IEEE, Springer, Elsevier, ACM, and Scopus-indexed journal templates. Pro and Business plans unlock all templates." },
              { q: "Is my research data secure?", a: "Absolutely. All papers are encrypted and only accessible by you. We never share or use your research data for training." },
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period." },
              { q: "Do you support team collaboration?", a: "The Business plan includes team workspaces for up to 5 members with shared papers and collaborative editing." },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-card-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
