import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Brain,
  Zap,
  GitBranch,
  MessageSquare,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { EtherealShadow } from "@/components/ui/etheral-shadow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelAI — Memory-Driven DevOps Intelligence" },
      {
        name: "description",
        content:
          "SentinelAI remembers every deployment, incident, and pattern — so your pipeline gets smarter every single day.",
      },
      { property: "og:title", content: "SentinelAI — Memory-Driven DevOps Intelligence" },
      {
        property: "og:description",
        content: "Deploy with confidence. Learn from every failure.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-black/80 backdrop-blur-md transition-colors ${
        scrolled ? "border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-[15px] font-semibold tracking-tight text-white">
          SentinelAI
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/signin"
            className="rounded-md px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:text-white sm:px-3"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition-transform hover:scale-[0.98] active:scale-95 sm:px-3.5"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-black px-4 sm:px-6">
      <div className="absolute inset-0 z-0">
        <EtherealShadow
          color="rgba(99, 102, 241, 0.35)"
          animation={{ scale: 60, speed: 70 }}
          noise={{ opacity: 0.35, scale: 1.2 }}
          sizing="fill"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-black/30 to-black" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/60 backdrop-blur sm:text-xs"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Memory-Driven DevOps Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-[34px] font-bold leading-[1.05] tracking-tight text-white sm:text-[52px] md:text-[64px]"
        >
          Deploy with confidence.
          <br />
          <span className="text-white/60">Learn from every failure.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-md text-[15px] leading-relaxed text-white/50 sm:text-base"
        >
          SentinelAI remembers every deployment, incident, and pattern — so your pipeline gets smarter every single day.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            to="/signup"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[0.98] active:scale-95 sm:w-auto"
          >
            Start Monitoring <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/signin"
            className="inline-flex w-full items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white sm:w-auto"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features() {
  const items = [
    { Icon: Shield, t: "Risk Analysis Before Deploy", d: "Analyzes every deployment for red flags before you ship to production." },
    { Icon: Brain, t: "Memory-Driven Intelligence", d: "Recalls past incidents and patterns to inform every risk decision." },
    { Icon: Zap, t: "Real-Time Incident Detection", d: "Spots anomalies and predicts incidents before they impact users." },
    { Icon: GitBranch, t: "GitHub Actions Integration", d: "One workflow file connects your entire pipeline. Zero friction setup." },
    { Icon: MessageSquare, t: "Agent Chat Interface", d: "Ask SentinelAI anything about your pipeline in plain English." },
    { Icon: BookOpen, t: "Lessons Learned Engine", d: "Every resolved incident teaches the agent. It never repeats the same mistake." },
  ];
  return (
    <section className="bg-black px-4 py-20 sm:px-6 sm:py-24">
      <SectionHeading label="FEATURES" title="Built for teams that ship fast" />
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ Icon, t, d }, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="bg-black p-6 transition-colors hover:bg-white/[0.02]"
          >
            <Icon className="h-5 w-5 text-white/70" />
            <h3 className="mt-4 text-[15px] font-medium text-white">{t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">{d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How It Works ---------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Sign up & create your workspace",
      d: "Create your SentinelAI account in seconds. Your workspace is provisioned instantly with zero configuration.",
      code: `# Sign up at sentinelai.dev
# Verify email → workspace ready`,
    },
    {
      n: "02",
      t: "Drop in the GitHub Actions workflow",
      d: "Add a single workflow file to your repo. SentinelAI hooks into every push and deploy event automatically.",
      code: `# .github/workflows/sentinelai.yml
name: SentinelAI
on: [push, deployment]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: sentinelai/action@v1
        with:
          token: \${{ secrets.SENTINEL_TOKEN }}`,
    },
    {
      n: "03",
      t: "Ship & let the memory grow",
      d: "Every deploy is analyzed against past incidents. Review risk scores in your dashboard or ask the agent directly.",
      code: `$ git push origin main
→ Risk analyzed · 3 memories recalled
→ View report → sentinelai.dev/dashboard`,
    },
  ];
  return (
    <section className="bg-[#050505] px-4 py-20 sm:px-6 sm:py-24">
      <SectionHeading
        label="GET STARTED"
        title="Three steps to plug it in"
        subtitle="From signup to your first analyzed deploy in under five minutes."
      />
      <div className="mx-auto mt-14 max-w-3xl space-y-12 sm:space-y-16">
        {steps.map(({ n, t, d, code }, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-[auto,1fr] sm:gap-8"
          >
            <div className="flex sm:block">
              <div className="font-mono text-xs tracking-wider text-white/30">STEP</div>
              <div className="ml-2 text-2xl font-bold tabular-nums text-white sm:ml-0 sm:mt-1 sm:text-3xl">
                {n}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white sm:text-xl">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-[15px]">{d}</p>
              <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black p-4 text-[12px] leading-relaxed text-white/70 font-mono">
                {code}
              </pre>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  return (
    <section className="bg-black px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-12 text-center sm:px-12 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to remember every deploy?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/50 sm:text-base">
          Free to use. No credit card required.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[0.98] active:scale-95 sm:w-auto"
          >
            Start Monitoring <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/signin"
            className="inline-flex w-full items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold text-white">SentinelAI</div>
            <div className="mt-1 text-xs text-white/40">Memory-driven DevOps intelligence</div>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/signin" className="text-white/60 hover:text-white">
              Sign In
            </Link>
            <Link to="/signup" className="text-white/60 hover:text-white">
              Get Started
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-white/20">
          Built for HackBaroda 2025
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Shared ---------------- */
function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">{label}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-white/50 sm:text-base">{subtitle}</p>}
    </div>
  );
}
