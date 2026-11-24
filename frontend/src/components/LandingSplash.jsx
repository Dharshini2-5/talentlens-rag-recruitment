import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  FileSearch,
  GitBranch,
  Layers,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import {
  BlurText,
  BorderBeam,
  CountUp,
  GlareHover,
  GradientText,
  Magnet,
  Orb,
  Particles,
  RotatingText,
  ShinyText,
  SplitText,
  SpotlightCard,
  StarBorder,
  TiltedCard,
  TrueFocus,
} from "./reactbits";

const TRUSTED_TEAMS = [
  { name: "SynthMind Labs", tag: "AI Research" },
  { name: "PayGrid Cloud", tag: "FinTech Scale" },
  { name: "VertexScale AI", tag: "ML Infra" },
  { name: "CampusForge", tag: "University Hiring" },
  { name: "Northstar Bio", tag: "Life Sciences" },
  { name: "CloudLoom", tag: "DevTools" },
  { name: "Aether Robotics", tag: "Autonomous" },
  { name: "FinPulse Global", tag: "Enterprise" },
];

const PRICING_TIERS = [
  {
    id: "starter",
    name: "Recruiter Starter",
    tagline: "For early-stage teams validating automated resume screening.",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Start Free in Studio",
    highlighted: false,
    features: [
      "Up to 50 NLP resume parses / month",
      "PDF, DOCX & TXT pure-Python extraction",
      "3 active job requisitions & Kanban board",
      "Core BM25 + TF-IDF RAG FAQ chatbot",
      "Standard candidate CSV export",
    ],
  },
  {
    id: "growth",
    name: "Growth Hiring",
    tagline: "Full-velocity AI recruiting & citation-backed RAG for scaling teams.",
    monthlyPrice: 49,
    annualPrice: 39,
    badge: "Most Popular",
    cta: "Launch Growth Studio",
    highlighted: true,
    features: [
      "Unlimited NLP parses & 135+ skills taxonomy",
      "Hybrid RAG across policies, roles & dossiers",
      "Live Knowledge Base real-time chunk indexing",
      "4-Pillar Skill-Gap Radar & Auto-Shortlist Top N",
      "ATS Webhooks, Developer API keys & JSON snapshots",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise ATS",
    tagline: "Zero-leakage governance, SSO & custom RAG corpora at global scale.",
    monthlyPrice: 199,
    annualPrice: 159,
    cta: "Configure Enterprise Tier",
    highlighted: false,
    features: [
      "Custom private RAG corpus & isolated database",
      "SAML 2.0 SSO, RBAC & tamper-evident audit logs",
      "Bias-audited customizable 4-pillar match weights",
      "Signed ATS webhooks with 99.95% uptime SLA",
      "Dedicated onboarding & GDPR archive tooling",
    ],
  },
];

const FAQS = [
  {
    q: "How does Pure-Python Zero-Leakage RAG keep candidate & HR data private?",
    a: "TalentLens AI runs its entire NLP entity parser and Hybrid BM25 + TF-IDF cosine retrieval engine natively inside your Django backend. Resumes, salary bands, and HR policies never leave your server for third-party model training.",
  },
  {
    q: "Which resume file formats are supported by the NLP Parser?",
    a: "Upload native .PDF (parsed via pypdf), .DOCX (zero-dependency pure-Python XML extraction), .TXT, or raw pasted text. Every upload automatically extracts 135+ categorized skills, CGPA, projects, ATS diagnostics, and immediately evaluates fit against all open roles.",
  },
  {
    q: "How transparent is the 4-Pillar Skill-to-Role Matching score?",
    a: "Every candidate-role score is 100% explainable and bias-audited: 45% Required Skills Match (with alias canonicalization), 20% Preferred Skills, 15% Experience & CGPA Readiness, and 20% Assessment & ATS Quality — visualized on an interactive Skill-Gap Radar.",
  },
  {
    q: "Can recruiters add new HR policies to the RAG Chatbot without restarting?",
    a: "Yes. Inside the RAG Smart Chatbot studio, adding any HR policy, interview rubric, or stipend FAQ chunks and indexes it immediately into the live retrieval store with expandable source citations and relevance scores.",
  },
  {
    q: "Can we export all candidate pipelines and evaluations for compliance or ATS sync?",
    a: "Yes. Use the Workspace Settings or Ctrl+K Command Palette to trigger instant 1-click CSV exports of Candidates and Skill Matches, or download a complete GDPR-ready JSON Talent Snapshot directly from live Django endpoints.",
  },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II Ready",
    desc: "Scoped API keys & session governance trail",
  },
  {
    icon: Scale,
    title: "Bias-Audited Scoring",
    desc: "Explainable 4-pillar deterministic rationales",
  },
  {
    icon: Lock,
    title: "Zero-Leakage Python RAG",
    desc: "Local BM25 + TF-IDF retrieval — no data exfil",
  },
  {
    icon: Database,
    title: "1-Click GDPR Exports",
    desc: "Portable CSV & full JSON workspace snapshots",
  },
];

export function LandingSplash({
  overview,
  backendOnline = true,
  apiLatencyMs = null,
  onLaunchStudio,
  onOpenChatbot,
  onSelectPlan,
}) {
  const { isLight } = useTheme();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const kpis = overview?.kpis || {
    total_candidates: 8,
    open_roles: 5,
    total_openings: 17,
    avg_ats_score: 88.4,
    indexed_rag_chunks: 45,
    strong_matches: 7,
  };

  const pillars = [
    {
      title: "NLP Resume Parser & Profiler",
      subtitle: "Pure-Python Entity & ATS Engine",
      description:
        "Ingests PDF, DOCX, TXT, or pasted resumes to extract 135+ categorized skills, CGPA, experience durations, projects, ATS quality feedback, and instant role matches.",
      icon: FileSearch,
      accent: "from-violet-600 to-indigo-600",
      tags: ["PDF / DOCX / TXT", "135+ Skills Taxonomy", "ATS Quality Score"],
      actionTab: "parser",
    },
    {
      title: "Hybrid RAG Smart Chatbot",
      subtitle: "BM25 + TF-IDF Cosine Retrieval",
      description:
        "Answers applicant FAQs and recruiter talent queries with live citations from HR policies, open job specs, and parsed candidate dossiers — with real-time doc indexing.",
      icon: Bot,
      accent: "from-fuchsia-600 to-pink-500",
      tags: ["Live Citations", "Applicant + Recruiter Mode", "Live KB Indexing"],
      actionTab: "chatbot",
    },
    {
      title: "Skill-to-Role Shortlisting",
      subtitle: "4-Pillar Weighted Matching Pipeline",
      description:
        "Normalizes technical aliases, visualizes candidate skill-gap radars, auto-shortlists top talent, and drives candidates across an interactive hiring pipeline board.",
      icon: GitBranch,
      accent: "from-sky-500 to-cyan-500",
      tags: ["Synonym Normalization", "Skill-Gap Radar", "Auto-Shortlist"],
      actionTab: "matching",
    },
  ];

  const architectureStages = [
    {
      step: "01",
      title: "Multi-Format Ingestion",
      desc: "Native PDF, DOCX XML & raw text extraction normalized through custom tokenizers & synonym maps.",
      icon: FileSearch,
    },
    {
      step: "02",
      title: "Hybrid BM25 + TF-IDF Index",
      desc: "Overlapping chunks across HR policies, open roles & candidate profiles indexed live with intent boosting.",
      icon: Cpu,
    },
    {
      step: "03",
      title: "Explainable 4-Pillar Fit",
      desc: "Deterministic weighted scoring across required skills, bonus stack, CGPA/exp & ATS completeness.",
      icon: GitBranch,
    },
    {
      step: "04",
      title: "ATS Pipeline & Webhooks",
      desc: "Auto-shortlisting, interactive 6-stage Kanban, Ctrl+K search, API keys & instant CSV/JSON exports.",
      icon: Zap,
    },
  ];

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-clip transition-colors duration-300 ${
        isLight
          ? "bg-[#F7F6FC] text-slate-900"
          : "bg-[#070614] text-slate-100"
      }`}
    >
      {/* Interactive Neural Constellation Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Particles particleCount={60} connectionDistance={135} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 cosmic-grid opacity-45" />

      {/* Subtle Aurora Ambient Blurs */}
      <div
        className={`pointer-events-none absolute -top-32 left-1/4 h-[460px] w-[460px] rounded-full blur-[130px] ${
          isLight ? "bg-violet-400/20" : "bg-violet-600/20"
        }`}
      />
      <div
        className={`pointer-events-none absolute top-1/4 -right-24 h-[420px] w-[420px] rounded-full blur-[130px] ${
          isLight ? "bg-pink-400/18" : "bg-fuchsia-600/18"
        }`}
      />
      <div
        className={`pointer-events-none absolute bottom-1/3 left-1/3 h-[340px] w-[480px] rounded-full blur-[120px] ${
          isLight ? "bg-sky-400/16" : "bg-sky-500/12"
        }`}
      />

      {/* Sticky Frosted SaaS Top Navbar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          isLight
            ? "border-slate-900/[0.08] bg-white/80"
            : "border-violet-500/20 bg-[#070614]/80"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          {/* Brand */}
          <a href="#top" className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 text-white shadow-[0_6px_20px_rgba(124,58,237,0.4)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <div
                className={`font-display text-lg font-bold tracking-tight ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                TalentLens <GradientText>AI</GradientText>
              </div>
              <div
                className={`hidden sm:block text-[10px] font-mono ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                RECRUITING ATS · HYBRID RAG STUDIO
              </div>
            </div>
          </a>

          {/* Smooth-scroll SaaS Nav Links */}
          <nav
            className={`hidden lg:flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${
              isLight
                ? "border-slate-900/[0.08] bg-slate-100/80 text-slate-600"
                : "border-white/10 bg-white/[0.03] text-slate-300"
            }`}
          >
            {[
              { href: "#capabilities", label: "Capabilities" },
              { href: "#architecture", label: "RAG Architecture" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 transition ${
                  isLight
                    ? "hover:bg-white hover:text-violet-700 hover:shadow-xs"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls: Status + ThemeToggle + Launch CTA */}
          <div className="flex items-center gap-2.5">
            <div
              className={`hidden xl:flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono ${
                isLight
                  ? "border-slate-900/10 bg-white text-slate-600 shadow-xs"
                  : "border-violet-500/25 bg-white/[0.03] text-slate-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline
                    ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    : "bg-rose-500"
                }`}
              />
              <span>
                {backendOnline
                  ? apiLatencyMs
                    ? `API :8002 · ${apiLatencyMs}ms`
                    : "API :8002 LIVE"
                  : "DEMO MODE"}
              </span>
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => onLaunchStudio("overview")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(124,58,237,0.55)] transition hover:brightness-110 cursor-pointer"
            >
              <span>Launch Hiring Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="relative z-10 mx-auto max-w-7xl px-5 pt-10 pb-20 sm:px-6">
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-md ${
                isLight
                  ? "border-violet-300/80 bg-white/90 shadow-xs"
                  : "border-fuchsia-500/35 bg-fuchsia-500/10"
              }`}
            >
              <Zap
                className={`h-3.5 w-3.5 ${
                  isLight ? "text-fuchsia-600" : "text-fuchsia-400"
                }`}
              />
              <ShinyText text="AI-DRIVEN RECRUITMENT INTELLIGENCE PLATFORM" />
            </motion.div>

            <h1
              className={`font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              <SplitText text="Automate Hiring with" delay={0.04} />
              <br />
              <GradientText className="inline-block mt-1">
                <RotatingText
                  texts={[
                    "NLP Resume Parsing",
                    "RAG Intelligence",
                    "Skill-to-Role Matching",
                  ]}
                  intervalMs={2700}
                />
              </GradientText>
            </h1>

            <p
              className={`mt-5 max-w-2xl mx-auto lg:mx-0 text-base md:text-lg leading-relaxed ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              <BlurText
                text="Screen resumes in seconds, ground candidate & recruiter answers in verified HR policies via hybrid BM25 + TF-IDF retrieval, and shortlist top talent with explainable skill-gap precision."
                delay={0.02}
              />
            </p>

            {/* TrueFocus Capability Strip */}
            <div className="mt-6 flex justify-center lg:justify-start">
              <TrueFocus
                words={[
                  "Resume Profiling",
                  "RAG Chatbot",
                  "Skill-Gap Radar",
                  "Auto-Shortlisting",
                ]}
              />
            </div>

            {/* Magnetic StarBorder CTAs */}
            <div className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Magnet strength={0.22}>
                <StarBorder
                  onClick={() => onLaunchStudio("overview")}
                  color="#EC4899"
                  secondaryColor="#38BDF8"
                  innerClassName="px-6 py-3.5 text-sm md:text-base bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 text-white"
                >
                  <span>Launch Hiring Studio</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </StarBorder>
              </Magnet>

              <Magnet strength={0.22}>
                <button
                  type="button"
                  onClick={onOpenChatbot}
                  className={`inline-flex items-center gap-2.5 rounded-xl border px-6 py-3.5 text-sm md:text-base font-semibold backdrop-blur-md transition cursor-pointer ${
                    isLight
                      ? "border-slate-900/12 bg-white/90 text-slate-800 shadow-sm hover:border-violet-500/45 hover:text-violet-700 hover:shadow-md"
                      : "border-sky-400/35 bg-sky-500/10 text-sky-100 hover:border-sky-300/60 hover:bg-sky-500/20 hover:shadow-[0_0_28px_rgba(56,189,248,0.28)]"
                  }`}
                >
                  <Bot
                    className={`h-4 w-4 ${
                      isLight ? "text-violet-600" : "text-sky-300"
                    }`}
                  />
                  <span>Try Live RAG Chatbot</span>
                </button>
              </Magnet>
            </div>
          </div>

          {/* Right Centerpiece Luminous AI Orb Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <TiltedCard maxTilt={7} className="w-full max-w-md">
              <div className="relative glass-panel rounded-2xl p-6 text-center">
                <BorderBeam duration={8} />
                <div
                  className={`flex items-center justify-between text-xs font-mono mb-2 ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    TALENTLENS CORE v2.5
                  </span>
                  <span
                    className={
                      isLight
                        ? "font-semibold text-sky-700"
                        : "text-sky-300"
                    }
                  >
                    PURE-PYTHON NLP + RAG
                  </span>
                </div>

                <div className="my-2 flex justify-center">
                  <Orb size={215} active={true} />
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2.5 text-left">
                  {[
                    {
                      label: "Skills DB",
                      content: "135+",
                      color: isLight ? "text-violet-700" : "text-violet-300",
                    },
                    {
                      label: "Retrieval",
                      content: "BM25+TF",
                      color: isLight ? "text-fuchsia-700" : "text-fuchsia-300",
                    },
                    {
                      label: "Avg ATS",
                      content: (
                        <CountUp
                          to={kpis.avg_ats_score || 88}
                          decimals={1}
                          suffix="%"
                        />
                      ),
                      color: isLight ? "text-sky-700" : "text-sky-300",
                    },
                  ].map((cell) => (
                    <div
                      key={cell.label}
                      className={`rounded-xl border p-2.5 ${
                        isLight
                          ? "border-slate-900/10 bg-slate-50/90"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono uppercase ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {cell.label}
                      </div>
                      <div
                        className={`mt-0.5 font-display text-lg font-bold ${cell.color}`}
                      >
                        {cell.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TiltedCard>
          </div>
        </section>

        {/* TRUSTED-BY TALENT TEAMS MARQUEE */}
        <section className="mt-14">
          <div
            className={`mb-4 text-center text-[11px] font-mono uppercase tracking-[0.2em] ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Built for High-Velocity Engineering &amp; Campus Recruiting Teams
          </div>
          <div
            className={`relative overflow-hidden rounded-2xl border py-3.5 ${
              isLight
                ? "border-slate-900/[0.08] bg-white/80 shadow-xs"
                : "border-violet-500/20 bg-white/[0.02]"
            }`}
          >
            <div className="animate-tl-marquee gap-4">
              {[...TRUSTED_TEAMS, ...TRUSTED_TEAMS].map((team, idx) => (
                <div
                  key={`${team.name}-${idx}`}
                  className={`mx-2 flex items-center gap-2.5 rounded-xl border px-4 py-2 shrink-0 ${
                    isLight
                      ? "border-slate-900/[0.07] bg-[#F7F6FC]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  <span
                    className={`font-display text-sm font-bold ${
                      isLight ? "text-slate-800" : "text-slate-100"
                    }`}
                  >
                    {team.name}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                      isLight
                        ? "bg-violet-100/80 text-violet-700"
                        : "bg-violet-500/15 text-violet-300"
                    }`}
                  >
                    {team.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE PLATFORM METRICS BAR */}
        <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Parsed Candidates",
              value: kpis.total_candidates,
              icon: Users,
              color: isLight ? "text-violet-700" : "text-violet-300",
            },
            {
              label: "Active Job Openings",
              value: kpis.total_openings,
              icon: Briefcase,
              color: isLight ? "text-fuchsia-700" : "text-fuchsia-300",
            },
            {
              label: "Strong Role Matches",
              value: kpis.strong_matches,
              icon: ShieldCheck,
              color: isLight ? "text-sky-700" : "text-sky-300",
            },
            {
              label: "Indexed RAG Chunks",
              value: kpis.indexed_rag_chunks,
              icon: Layers,
              color: isLight ? "text-emerald-700" : "text-emerald-300",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <SpotlightCard key={stat.label} className="p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {stat.label}
                  </span>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div
                  className={`mt-2 font-display text-3xl font-extrabold ${stat.color}`}
                >
                  <CountUp to={stat.value || 0} />
                </div>
              </SpotlightCard>
            );
          })}
        </section>

        {/* CAPABILITIES BENTO SHOWCASE */}
        <section id="capabilities" className="scroll-mt-24 pt-16">
          <div className="mb-8 text-center">
            <div
              className={`text-xs font-mono uppercase tracking-[0.18em] ${
                isLight ? "text-violet-700" : "text-fuchsia-300"
              }`}
            >
              Core Intelligence Modules
            </div>
            <h2
              className={`mt-2 font-display text-3xl md:text-4xl font-extrabold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Three Engines, One <GradientText>Unified Hiring Studio</GradientText>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <TiltedCard key={pillar.title} maxTilt={6}>
                  <GlareHover className="h-full rounded-2xl">
                    <SpotlightCard
                      onClick={() => onLaunchStudio(pillar.actionTab)}
                      className="h-full p-6 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.accent} text-white shadow-lg`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isLight ? "text-violet-700" : "text-slate-400"
                          }`}
                        >
                          EXPLORE →
                        </span>
                      </div>
                      <h3
                        className={`mt-4 font-display text-xl font-bold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {pillar.title}
                      </h3>
                      <div
                        className={`mt-0.5 text-xs font-semibold ${
                          isLight ? "text-fuchsia-700" : "text-fuchsia-300"
                        }`}
                      >
                        {pillar.subtitle}
                      </div>
                      <p
                        className={`mt-3 text-sm leading-relaxed ${
                          isLight ? "text-slate-600" : "text-slate-300"
                        }`}
                      >
                        {pillar.description}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {pillar.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-md border px-2.5 py-1 text-[11px] font-mono ${
                              isLight
                                ? "border-violet-200 bg-violet-50 text-violet-800"
                                : "border-violet-400/25 bg-violet-500/10 text-violet-200"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </SpotlightCard>
                  </GlareHover>
                </TiltedCard>
              );
            })}
          </div>
        </section>

        {/* HYBRID RAG ARCHITECTURE & ENTERPRISE TRUST */}
        <section id="architecture" className="scroll-mt-24 pt-20">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div
                className={`text-xs font-mono uppercase tracking-[0.18em] ${
                  isLight ? "text-sky-700" : "text-sky-300"
                }`}
              >
                Zero-Leakage Pipeline Architecture
              </div>
              <h2
                className={`mt-1.5 font-display text-3xl md:text-4xl font-extrabold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Built for <GradientText>Explainable RAG &amp; Precision</GradientText>
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenChatbot}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? "text-violet-700 hover:text-fuchsia-600"
                  : "text-violet-300 hover:text-fuchsia-300"
              }`}
            >
              Inspect Live RAG Citations in Studio →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {architectureStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <SpotlightCard key={stage.step} className="p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isLight ? "text-violet-700" : "text-fuchsia-300"
                      }`}
                    >
                      STAGE {stage.step}
                    </span>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isLight
                          ? "bg-violet-100 text-violet-700"
                          : "bg-violet-500/15 text-violet-300"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <h3
                    className={`mt-3 font-display text-base font-bold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {stage.title}
                  </h3>
                  <p
                    className={`mt-1.5 text-xs leading-relaxed ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {stage.desc}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>

          {/* Enterprise Trust Strip */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_BADGES.map((tb) => {
              const Icon = tb.icon;
              return (
                <div
                  key={tb.title}
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${
                    isLight
                      ? "border-slate-900/[0.08] bg-white/90 shadow-xs"
                      : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isLight
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {tb.title}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {tb.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SAAS PRICING SECTION */}
        <section id="pricing" className="scroll-mt-24 pt-20">
          <div className="text-center">
            <div
              className={`text-xs font-mono uppercase tracking-[0.18em] ${
                isLight ? "text-violet-700" : "text-violet-300"
              }`}
            >
              Transparent SaaS Pricing
            </div>
            <h2
              className={`mt-2 font-display text-3xl md:text-4xl font-extrabold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Scale Your <GradientText>Hiring Velocity</GradientText>
            </h2>
            <p
              className={`mx-auto mt-2 max-w-xl text-sm ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              Start free with live NLP resume parsing, or unlock unlimited hybrid RAG indexing, webhooks, and enterprise ATS governance.
            </p>

            {/* Animated Monthly / Annual Toggle */}
            <div className="mt-6 flex items-center justify-center">
              <div
                className={`relative inline-flex items-center gap-1 rounded-full border p-1 ${
                  isLight
                    ? "border-slate-900/10 bg-white shadow-sm"
                    : "border-violet-500/30 bg-[#100d26]"
                }`}
              >
                {[
                  { id: false, label: "Monthly" },
                  { id: true, label: "Annual", badge: "Save 20%" },
                ].map((opt) => {
                  const active = annualBilling === opt.id;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setAnnualBilling(opt.id)}
                      className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        active
                          ? "text-white"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="landing-billing-pill"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 30,
                          }}
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow"
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                      {opt.badge && (
                        <span
                          className={`relative z-10 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                            active
                              ? "bg-white/20 text-white"
                              : isLight
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => {
              const price = annualBilling
                ? tier.annualPrice
                : tier.monthlyPrice;
              return (
                <SpotlightCard
                  key={tier.id}
                  className={`relative flex flex-col justify-between p-6 ${
                    tier.highlighted
                      ? isLight
                        ? "ring-2 ring-violet-500/50 shadow-[0_20px_50px_-15px_rgba(124,58,237,0.22)]"
                        : "ring-1 ring-fuchsia-400/50 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.35)]"
                      : ""
                  }`}
                >
                  {tier.highlighted && <BorderBeam duration={7} />}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-display text-xl font-bold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {tier.name}
                      </h3>
                      {tier.badge && (
                        <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1.5 text-xs leading-relaxed ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {tier.tagline}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span
                        className={`font-display text-4xl font-extrabold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        ${price}
                      </span>
                      <span
                        className={`text-xs ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        / month{annualBilling && price > 0 ? " · billed annually" : ""}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-xs">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckCircle2
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              tier.highlighted
                                ? isLight
                                  ? "text-violet-600"
                                  : "text-fuchsia-400"
                                : "text-emerald-500"
                            }`}
                          />
                          <span
                            className={
                              isLight ? "text-slate-700" : "text-slate-200"
                            }
                          >
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlan?.(tier.id);
                      onLaunchStudio("overview");
                    }}
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition cursor-pointer ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:brightness-110"
                        : isLight
                        ? "border border-slate-900/12 bg-slate-900 text-white hover:bg-violet-700"
                        : "border border-violet-400/35 bg-white/[0.06] text-white hover:bg-violet-500/25"
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </SpotlightCard>
              );
            })}
          </div>
        </section>

        {/* INTERACTIVE FAQ ACCORDION */}
        <section id="faq" className="scroll-mt-24 pt-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <div
                className={`text-xs font-mono uppercase tracking-[0.18em] ${
                  isLight ? "text-violet-700" : "text-sky-300"
                }`}
              >
                Frequently Asked Questions
              </div>
              <h2
                className={`mt-2 font-display text-3xl font-extrabold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Everything Teams Ask About <GradientText>TalentLens AI</GradientText>
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={item.q}
                    className={`overflow-hidden rounded-2xl border transition-colors ${
                      isLight
                        ? isOpen
                          ? "border-violet-400/60 bg-white shadow-md"
                          : "border-slate-900/[0.09] bg-white/85 hover:border-violet-300"
                        : isOpen
                        ? "border-violet-400/45 bg-[#120e2b]/90"
                        : "border-white/10 bg-[#100d26]/65 hover:border-violet-500/35"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                    >
                      <span
                        className={`font-display text-sm md:text-base font-bold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-violet-500" : "text-slate-400"
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          <div
                            className={`border-t px-5 py-3.5 text-xs md:text-sm leading-relaxed ${
                              isLight
                                ? "border-slate-100 text-slate-600"
                                : "border-white/5 text-slate-300"
                            }`}
                          >
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* POLISHED SAAS FOOTER */}
        <footer
          className={`mt-20 border-t pt-10 ${
            isLight ? "border-slate-900/10" : "border-violet-500/20"
          }`}
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span
                  className={`font-display text-base font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  TalentLens <GradientText>AI</GradientText>
                </span>
              </div>
              <p
                className={`mt-3 max-w-sm text-xs leading-relaxed ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                End-to-end AI recruitment intelligence studio pairing Pure-Python NLP resume profiling, Hybrid BM25 + TF-IDF RAG Q&amp;A, and 4-pillar explainable candidate matching.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <div
                className={`font-mono font-semibold uppercase ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Hiring Studio
              </div>
              {[
                { label: "Overview & Funnel", tab: "overview" },
                { label: "NLP Resume Parser", tab: "parser" },
                { label: "Matching & Kanban Pipeline", tab: "matching" },
                { label: "RAG Smart Chatbot", tab: "chatbot" },
                { label: "Workspace, Billing & API", tab: "settings" },
              ].map((l) => (
                <button
                  key={l.tab}
                  type="button"
                  onClick={() => onLaunchStudio(l.tab)}
                  className={`block transition cursor-pointer ${
                    isLight
                      ? "text-slate-600 hover:text-violet-700"
                      : "text-slate-400 hover:text-violet-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="md:col-span-4 space-y-2 text-xs">
              <div
                className={`font-mono font-semibold uppercase ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Engineering Stack
              </div>
              <p className={isLight ? "text-slate-600" : "text-slate-400"}>
                Django 6 · DRF · Pure-Python NLP &amp; BM25/TF-IDF Hybrid RAG · React 19 · Vite · Tailwind CSS v4 · Recharts · Framer Motion · ReactBits
              </p>
              <div
                className={`pt-2 text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Built by{" "}
                <span
                  className={`font-semibold ${
                    isLight ? "text-slate-900" : "text-slate-200"
                  }`}
                >
                  Dharshini A
                </span>{" "}
                · TalentLens AI Platform
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
