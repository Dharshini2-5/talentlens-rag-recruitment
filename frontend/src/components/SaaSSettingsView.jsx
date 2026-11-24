import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Database,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import {
  exportCandidatesCsv,
  exportMatchesCsv,
  exportTalentSnapshotJson,
} from "../utils/exportUtils";
import { BorderBeam, GradientText, PillNav, SpotlightCard } from "./reactbits";

const PLANS = [
  {
    id: "starter",
    name: "Recruiter Starter",
    monthly: 0,
    annual: 0,
    badge: "Free Forever",
    parseLimit: 50,
    chunkLimit: 250,
    roleLimit: 3,
    features: [
      "Up to 50 NLP resume parses / mo",
      "3 active job requisitions",
      "Core BM25 + TF-IDF RAG FAQ bot",
      "Standard CSV candidate exports",
    ],
  },
  {
    id: "growth",
    name: "Growth Hiring",
    monthly: 49,
    annual: 39,
    badge: "Active Plan",
    recommended: true,
    parseLimit: 500,
    chunkLimit: 2500,
    roleLimit: 25,
    features: [
      "Unlimited NLP PDF / DOCX parses",
      "Hybrid RAG across policies, roles & dossiers",
      "4-Pillar Skill-Gap Radar & Auto-Shortlist",
      "Live ATS Webhooks + Full JSON/CSV exports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise ATS",
    monthly: 199,
    annual: 159,
    badge: "Scale & SSO",
    parseLimit: 10000,
    chunkLimit: 50000,
    roleLimit: 500,
    features: [
      "Custom private RAG corpus & isolated DB",
      "SAML 2.0 SSO, RBAC & SOC 2 audit logs",
      "Dedicated webhook retries & 99.95% SLA",
      "Custom scoring weights & bias audit exports",
    ],
  },
];

const INITIAL_INVOICES = [
  {
    id: "INV-2026-1102",
    date: "Nov 01, 2026",
    plan: "Growth Hiring (Monthly)",
    amount: "$49.00",
    status: "Paid",
  },
  {
    id: "INV-2026-1002",
    date: "Oct 01, 2026",
    plan: "Growth Hiring (Monthly)",
    amount: "$49.00",
    status: "Paid",
  },
  {
    id: "INV-2026-0902",
    date: "Sep 01, 2026",
    plan: "Growth Hiring (Monthly)",
    amount: "$49.00",
    status: "Paid",
  },
];

function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return `tl_live_${token}`;
}

export function SaaSSettingsView({
  initialSubTab = "appearance",
  overview,
  jobs = [],
  candidates = [],
  knowledgeDocs = [],
  activeWorkspace,
  onWorkspaceRename,
  showDock,
  onToggleDock,
  shortlistThreshold,
  onShortlistThresholdChange,
  activePlanId,
  onPlanChange,
  auditTrail = [],
  onLogAudit,
  notify,
  apiLatencyMs,
  onPingHealth,
}) {
  const { theme, isLight, setTheme } = useTheme();
  const [subTab, setSubTab] = useState(initialSubTab);

  // Appearance & Org State
  const [orgName, setOrgName] = useState(
    activeWorkspace?.name || "TalentLens HQ — Engineering"
  );
  const [hiringCycle, setHiringCycle] = useState("Q4 2026 · Engineering & AI");
  const [recruiterSig, setRecruiterSig] = useState("Dharshini A · Lead Talent Architect");

  // Billing State
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false);
  const [billingCycle, setBillingCycle] = useState("annual");

  // API Keys & Webhooks State
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem("talentlens_api_keys");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: "key-prod",
        name: "Production ATS Sync",
        key: "tl_live_9f8a4c2d7e1b6f3a8d5c2e9a4b7f1c6d",
        created: "Nov 12, 2026",
        lastUsed: "2 mins ago",
      },
      {
        id: "key-rag",
        name: "Slack RAG Bot Connector",
        key: "tl_live_3c7e1a9d5b2f8e4a6c1d9f3b5e7a2c8f",
        created: "Oct 28, 2026",
        lastUsed: "41 mins ago",
      },
    ];
  });
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKeyIds, setRevealedKeyIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [healthSnapshot, setHealthSnapshot] = useState(null);

  const [webhookUrl, setWebhookUrl] = useState(
    "https://hooks.talentlens.internal/ats-events"
  );
  const [webhooks, setWebhooks] = useState([
    {
      event: "candidate.parsed",
      label: "Candidate Resume Parsed",
      desc: "Fires when NLP parser extracts skills, ATS score & saves candidate",
      enabled: true,
    },
    {
      event: "candidate.shortlisted",
      label: "Candidate Auto-Shortlisted",
      desc: "Fires when auto-shortlist promotes top matches above threshold",
      enabled: true,
    },
    {
      event: "rag.doc_indexed",
      label: "RAG Document Indexed",
      desc: "Fires when a new HR policy or FAQ doc is chunked into live KB",
      enabled: true,
    },
    {
      event: "candidate.stage_changed",
      label: "Kanban Stage Transition",
      desc: "Fires whenever a candidate moves across pipeline stages",
      enabled: false,
    },
  ]);

  const [exportingType, setExportingType] = useState(null);

  const kpis = overview?.kpis || {};
  const activePlan = PLANS.find((p) => p.id === activePlanId) || PLANS[1];

  const persistKeys = (next) => {
    setApiKeys(next);
    try {
      localStorage.setItem("talentlens_api_keys", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleCreateKey = (e) => {
    e.preventDefault();
    const label = newKeyName.trim() || `API Key #${apiKeys.length + 1}`;
    const created = {
      id: `key-${Date.now()}`,
      name: label,
      key: generateApiKey(),
      created: "Just now",
      lastUsed: "Never",
    };
    persistKeys([created, ...apiKeys]);
    setRevealedKeyIds((prev) => ({ ...prev, [created.id]: true }));
    setNewKeyName("");
    onLogAudit?.("api.key_created", `Generated API key "${label}"`);
    notify?.(`Created live API key "${label}"`);
  };

  const handleRevokeKey = (item) => {
    persistKeys(apiKeys.filter((k) => k.id !== item.id));
    onLogAudit?.("api.key_revoked", `Revoked API key "${item.name}"`);
    notify?.(`Revoked API key "${item.name}"`, "info");
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
      notify?.("Copied API key to clipboard");
    } catch {
      notify?.("Clipboard access blocked by browser", "error");
    }
  };

  const runLivePing = async () => {
    setPinging(true);
    try {
      const start = performance.now();
      const res = await api.getHealth();
      const ms = Math.max(1, Math.round(performance.now() - start));
      setHealthSnapshot({ ...res, latencyMs: ms, checkedAt: new Date().toLocaleTimeString() });
      onPingHealth?.();
      onLogAudit?.("api.health_ping", `Django API :8002 responded OK in ${ms}ms`);
      notify?.(`Django NLP/RAG Engine healthy — ${ms}ms round-trip`);
    } catch (err) {
      notify?.(`API Health check failed: ${err.message}`, "error");
    } finally {
      setPinging(false);
    }
  };

  const handleTestWebhook = (hook) => {
    onLogAudit?.(
      "webhook.test_dispatched",
      `Dispatched test ${hook.event} payload to ${webhookUrl}`
    );
    notify?.(`Sent test webhook event "${hook.event}" (HTTP 200 OK)`);
  };

  const handleExportCandidates = () => {
    setExportingType("candidates");
    try {
      const res = exportCandidatesCsv(candidates);
      onLogAudit?.("export.candidates_csv", `Exported ${res.count} candidates (${res.filename})`);
      notify?.(`Downloaded ${res.filename} (${res.count} candidates)`);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportMatches = async () => {
    setExportingType("matches");
    try {
      const allMatches = await api.getMatches();
      const res = exportMatchesCsv(allMatches || []);
      onLogAudit?.("export.matches_csv", `Exported ${res.count} skill matches (${res.filename})`);
      notify?.(`Downloaded ${res.filename} (${res.count} skill matches)`);
    } catch (err) {
      notify?.(`Failed to export matches: ${err.message}`, "error");
    } finally {
      setExportingType(null);
    }
  };

  const handleExportSnapshot = async () => {
    setExportingType("snapshot");
    try {
      const allMatches = await api.getMatches().catch(() => overview?.top_matches || []);
      const res = exportTalentSnapshotJson({
        workspace: activeWorkspace,
        overview,
        jobs,
        candidates,
        matches: allMatches || [],
        knowledgeDocs,
      });
      onLogAudit?.(
        "export.snapshot_json",
        `Exported full JSON snapshot (${res.counts.candidates} candidates, ${res.counts.jobs} roles)`
      );
      notify?.(`Downloaded full workspace snapshot ${res.filename}`);
    } finally {
      setExportingType(null);
    }
  };

  const handleSaveOrg = (e) => {
    e.preventDefault();
    onWorkspaceRename?.(orgName.trim() || "TalentLens HQ");
    onLogAudit?.("workspace.updated", `Updated hiring org profile "${orgName}"`);
    notify?.("Saved workspace branding & default screening configuration");
  };

  const meteredMetrics = [
    {
      label: "Parsed Candidates",
      used: kpis.total_candidates ?? candidates.length,
      limit: activePlan.parseLimit,
      unit: "resumes",
      bar: "from-violet-600 to-fuchsia-500",
    },
    {
      label: "Active Job Roles",
      used: kpis.open_roles ?? jobs.length,
      limit: activePlan.roleLimit,
      unit: "open roles",
      bar: "from-fuchsia-600 to-pink-500",
    },
    {
      label: "Evaluated Skill Matches",
      used: (kpis.total_candidates ?? candidates.length) * Math.max(1, kpis.open_roles ?? jobs.length),
      limit: activePlan.id === "starter" ? 150 : 2500,
      unit: "pairings",
      bar: "from-sky-500 to-cyan-400",
    },
    {
      label: "Indexed RAG Chunks",
      used: kpis.indexed_rag_chunks ?? 0,
      limit: activePlan.chunkLimit,
      unit: "live chunks",
      bar: "from-emerald-500 to-teal-400",
    },
  ];

  const inputCls = isLight
    ? "w-full rounded-xl border border-slate-900/12 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
    : "w-full rounded-xl border border-violet-500/30 bg-[#0b081d] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none";

  const wellCls = isLight
    ? "rounded-xl border border-slate-900/10 bg-[#F4F2FB]"
    : "rounded-xl border border-white/10 bg-white/[0.03]";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isLight ? "text-violet-700" : "text-violet-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Platform Administration &amp; Governance
          </div>
          <h2
            className={`mt-1 font-display text-2xl md:text-3xl font-bold ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            Workspace, Billing &amp; <GradientText>Developer API</GradientText>
          </h2>
          <p
            className={`mt-1 text-sm ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Customize Dark/Light studio experience, inspect live metered RAG usage, manage ATS webhooks, and export GDPR-ready datasets.
          </p>
        </div>

        <PillNav
          layoutId="saas-settings-pill"
          activeId={subTab}
          onChange={setSubTab}
          items={[
            { id: "appearance", label: "Appearance & Org", icon: Palette },
            { id: "billing", label: "Plan & Usage", icon: CreditCard },
            { id: "api", label: "API & Webhooks", icon: KeyRound },
            { id: "exports", label: "Exports & Audit", icon: Download },
          ]}
        />
      </div>

      {/* SUB-TAB 1: APPEARANCE & HIRING ORG */}
      {subTab === "appearance" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Theme Switcher Visual Cards */}
          <SpotlightCard className="p-6 lg:col-span-7 space-y-5">
            <div>
              <h3
                className={`font-display text-lg font-bold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Studio Appearance &amp; Theme Mode
              </h3>
              <p
                className={`mt-1 text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Switch instantly across every view, ReactBits shader, Kanban board, modal, and Recharts visualization. Persisted in local storage.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Dark Mode Preview Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  onLogAudit?.("appearance.theme", "Switched studio theme to Cosmic Dark");
                }}
                className={`group rounded-2xl border p-4 text-left transition cursor-pointer ${
                  theme === "dark"
                    ? "border-violet-500 ring-2 ring-violet-500/35 bg-violet-500/10"
                    : isLight
                    ? "border-slate-200 bg-white hover:border-violet-300"
                    : "border-white/10 bg-white/[0.02] hover:border-violet-400/40"
                }`}
              >
                {/* Mini Preview */}
                <div className="mb-3 h-24 overflow-hidden rounded-xl border border-violet-500/30 bg-[#070614] p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                    </div>
                    <span className="h-2 w-10 rounded-full bg-violet-500/40" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="h-10 rounded-lg border border-violet-500/25 bg-[#120e2b]" />
                    <div className="h-10 rounded-lg border border-fuchsia-500/25 bg-[#120e2b]" />
                    <div className="h-10 rounded-lg border border-sky-500/25 bg-[#120e2b]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold">
                    <Moon className="h-4 w-4 text-violet-500" />
                    Cosmic Dark
                  </span>
                  {theme === "dark" && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Deep obsidian canvas with luminous violet-fuchsia plasma accents
                </p>
              </button>

              {/* Light Mode Preview Card */}
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  onLogAudit?.("appearance.theme", "Switched studio theme to Editorial Light");
                }}
                className={`group rounded-2xl border p-4 text-left transition cursor-pointer ${
                  theme === "light"
                    ? "border-violet-600 ring-2 ring-violet-500/30 bg-violet-50/70"
                    : isLight
                    ? "border-slate-200 bg-white hover:border-violet-300"
                    : "border-white/10 bg-white/[0.02] hover:border-violet-400/40"
                }`}
              >
                {/* Mini Preview */}
                <div className="mb-3 h-24 overflow-hidden rounded-xl border border-slate-200 bg-[#F7F6FC] p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-violet-600" />
                      <span className="h-2 w-2 rounded-full bg-pink-600" />
                      <span className="h-2 w-2 rounded-full bg-sky-600" />
                    </div>
                    <span className="h-2 w-10 rounded-full bg-violet-300" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="h-10 rounded-lg border border-slate-200 bg-white shadow-xs" />
                    <div className="h-10 rounded-lg border border-slate-200 bg-white shadow-xs" />
                    <div className="h-10 rounded-lg border border-slate-200 bg-white shadow-xs" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Editorial Light
                  </span>
                  {theme === "light" && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Crisp lavender-snow Linear studio palette with pure white glass
                </p>
              </button>
            </div>

            {/* Floating ReactBits Dock Preference */}
            <div className={`flex items-center justify-between gap-4 p-4 ${wellCls}`}>
              <div>
                <div className="text-sm font-semibold">
                  Floating ReactBits Magnifying Dock
                </div>
                <p
                  className={`mt-0.5 text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Show the quick-jump macOS-style floating dock at the bottom alongside the collapsible SaaS sidebar.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showDock}
                onClick={() => {
                  onToggleDock?.();
                  notify?.(
                    showDock
                      ? "Floating bottom Dock hidden (sidebar remains active)"
                      : "Floating ReactBits Dock enabled"
                  );
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  showDock
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                    : isLight
                    ? "bg-slate-300"
                    : "bg-white/15"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    showDock ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </SpotlightCard>

          {/* Hiring Org Branding & Default Screening Threshold */}
          <SpotlightCard className="p-6 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Building2
                className={`h-5 w-5 ${
                  isLight ? "text-violet-600" : "text-violet-400"
                }`}
              />
              <h3
                className={`font-display text-lg font-bold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Hiring Organization Profile
              </h3>
            </div>
            <p
              className={`mt-1 text-xs ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Configure workspace branding and default auto-shortlist score threshold.
            </p>

            <form onSubmit={handleSaveOrg} className="mt-4 space-y-4">
              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Active Workspace Name
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Active Hiring Cycle
                </label>
                <input
                  value={hiringCycle}
                  onChange={(e) => setHiringCycle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Recruiter Lead Signature
                </label>
                <input
                  value={recruiterSig}
                  onChange={(e) => setRecruiterSig(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className={`p-3.5 ${wellCls}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Default Auto-Shortlist Threshold</span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono font-bold ${
                      isLight
                        ? "bg-violet-100 text-violet-700"
                        : "bg-violet-500/20 text-violet-200"
                    }`}
                  >
                    {shortlistThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={1}
                  value={shortlistThreshold}
                  onChange={(e) =>
                    onShortlistThresholdChange?.(Number(e.target.value))
                  }
                  className="mt-2.5 w-full accent-violet-600 cursor-pointer"
                />
                <div
                  className={`mt-1 flex justify-between text-[10px] font-mono ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  <span>50% (Broad)</span>
                  <span>68% (Balanced)</span>
                  <span>90% (Strict)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:brightness-110 cursor-pointer"
              >
                Save Organization Settings
              </button>
            </form>
          </SpotlightCard>
        </div>
      )}

      {/* SUB-TAB 2: PLAN & METERED USAGE */}
      {subTab === "billing" && (
        <div className="space-y-6">
          {/* Active Plan Banner */}
          <SpotlightCard className="relative p-6">
            <BorderBeam duration={9} />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-0.5 text-[11px] font-bold text-white">
                    ACTIVE SAAS TIER
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono ${
                      isLight
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    ● Healthy Billing
                  </span>
                </div>
                <h3
                  className={`mt-2 font-display text-2xl font-extrabold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {activePlan.name}{" "}
                  <span
                    className={`text-lg font-semibold ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    · ${activePlan.monthly}/mo
                  </span>
                </h3>
                <p
                  className={`mt-1 text-xs ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  Metered quotas below update live from Django <code className="font-mono">/api/overview/</code>. Next renewal on Dec 01, 2026.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUpgradeDrawer(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:brightness-110 cursor-pointer"
                >
                  <Zap className="h-4 w-4" />
                  Compare &amp; Upgrade Plan
                </button>
              </div>
            </div>

            {/* Live Metered Usage Bars */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {meteredMetrics.map((m) => {
                const pct = Math.min(
                  100,
                  Math.max(4, Math.round((m.used / m.limit) * 100))
                );
                return (
                  <div key={m.label} className={`p-4 ${wellCls}`}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{m.label}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          isLight ? "text-violet-700" : "text-sky-300"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-2 font-display text-2xl font-extrabold">
                      {m.used}{" "}
                      <span
                        className={`text-xs font-mono font-normal ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        / {m.limit.toLocaleString()} {m.unit}
                      </span>
                    </div>
                    <div
                      className={`mt-2.5 h-2 w-full overflow-hidden rounded-full ${
                        isLight ? "bg-slate-200" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${m.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>

          {/* Invoices Table */}
          <SpotlightCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3
                  className={`font-display text-lg font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  Billing History &amp; Invoices
                </h3>
                <p
                  className={`text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Monthly SaaS subscription statements for {orgName}
                </p>
              </div>
              <span
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                Visa •••• 4242
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b font-mono uppercase text-[10px] ${
                      isLight
                        ? "border-slate-200 text-slate-500"
                        : "border-white/10 text-slate-400"
                    }`}
                  >
                    <th className="py-2.5 pr-4">Invoice</th>
                    <th className="py-2.5 pr-4">Date</th>
                    <th className="py-2.5 pr-4">Subscription</th>
                    <th className="py-2.5 pr-4">Amount</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-slate-100" : "divide-white/5"
                  }`}
                >
                  {INITIAL_INVOICES.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-mono font-semibold">
                        {inv.id}
                      </td>
                      <td
                        className={`py-3 pr-4 ${
                          isLight ? "text-slate-600" : "text-slate-300"
                        }`}
                      >
                        {inv.date}
                      </td>
                      <td className="py-3 pr-4 font-medium">{inv.plan}</td>
                      <td className="py-3 pr-4 font-mono font-semibold">
                        {inv.amount}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                            isLight
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            notify?.(`Prepared PDF receipt for ${inv.id}`)
                          }
                          className={`font-semibold transition cursor-pointer ${
                            isLight
                              ? "text-violet-700 hover:text-fuchsia-600"
                              : "text-violet-300 hover:text-fuchsia-300"
                          }`}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* SUB-TAB 3: API KEYS & ATS WEBHOOKS */}
      {subTab === "api" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Live Diagnostic + API Keys */}
          <div className="space-y-6 lg:col-span-7">
            {/* Live Django API Diagnostic */}
            <SpotlightCard className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">
                      Live Django NLP / RAG Engine Diagnostic
                    </h3>
                    <p
                      className={`text-xs font-mono ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Endpoint: http://localhost:8002/api/health/ · Last Ping:{" "}
                      <span
                        className={
                          isLight
                            ? "font-bold text-emerald-700"
                            : "font-bold text-emerald-300"
                        }
                      >
                        {healthSnapshot?.latencyMs ?? apiLatencyMs ?? "--"}ms
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pinging}
                  onClick={runLivePing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${pinging ? "animate-spin" : ""}`}
                  />
                  Run Live Ping
                </button>
              </div>

              {healthSnapshot && (
                <div className={`mt-4 grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 ${wellCls}`}>
                  {[
                    ["Status", healthSnapshot.status?.toUpperCase() || "OK"],
                    ["Jobs", healthSnapshot.counts?.jobs ?? jobs.length],
                    ["Candidates", healthSnapshot.counts?.candidates ?? candidates.length],
                    ["KB Docs", healthSnapshot.counts?.knowledge_docs ?? knowledgeDocs.length],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div
                        className={`text-[10px] font-mono uppercase ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {k}
                      </div>
                      <div className="font-display text-base font-bold">{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </SpotlightCard>

            {/* API Keys Manager */}
            <SpotlightCard className="p-5 space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold">
                  Developer API Keys
                </h3>
                <p
                  className={`text-xs ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Use scoped <code className="font-mono">tl_live_</code> tokens to authenticate resume parsing and RAG chatbot integrations.
                </p>
              </div>

              <form onSubmit={handleCreateKey} className="flex gap-2">
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="New key label (e.g., Greenhouse ATS Sync)"
                  className={inputCls}
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Generate
                </button>
              </form>

              <div className="space-y-2.5">
                {apiKeys.map((item) => {
                  const revealed = !!revealedKeyIds[item.id];
                  const masked = `${item.key.slice(0, 12)}••••••••••••••••${item.key.slice(-4)}`;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between ${wellCls}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.name}</span>
                          <span
                            className={`text-[10px] font-mono ${
                              isLight ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Created {item.created}
                          </span>
                        </div>
                        <div
                          className={`mt-1 truncate font-mono text-xs ${
                            isLight ? "text-violet-700" : "text-sky-300"
                          }`}
                        >
                          {revealed ? item.key : masked}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedKeyIds((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          title={revealed ? "Hide key" : "Reveal key"}
                          className={`rounded-lg border p-2 transition cursor-pointer ${
                            isLight
                              ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                              : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          {revealed ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.key)}
                          title="Copy key"
                          className={`rounded-lg border p-2 transition cursor-pointer ${
                            isLight
                              ? "border-slate-200 bg-white text-slate-600 hover:text-violet-700"
                              : "border-white/10 bg-white/5 text-slate-300 hover:text-violet-200"
                          }`}
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(item)}
                          title="Revoke key"
                          className={`rounded-lg border p-2 transition cursor-pointer ${
                            isLight
                              ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              : "border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>
          </div>

          {/* Right: ATS Webhook Triggers */}
          <SpotlightCard className="p-5 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Webhook
                className={`h-5 w-5 ${
                  isLight ? "text-fuchsia-600" : "text-fuchsia-400"
                }`}
              />
              <h3 className="font-display text-lg font-bold">
                ATS Webhook Triggers
              </h3>
            </div>
            <p
              className={`text-xs ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Deliver signed JSON payloads to Slack, Greenhouse, Lever, or internal automation pipelines.
            </p>

            <div>
              <label
                className={`mb-1 block text-xs font-semibold ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                Destination Endpoint URL
              </label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className={`${inputCls} font-mono text-xs`}
              />
            </div>

            <div className="space-y-2.5">
              {webhooks.map((hook, idx) => (
                <div key={hook.event} className={`p-3.5 ${wellCls}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <code
                        className={`rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold ${
                          isLight
                            ? "bg-violet-100 text-violet-800"
                            : "bg-violet-500/20 text-violet-200"
                        }`}
                      >
                        {hook.event}
                      </code>
                      <div className="mt-1 text-xs font-semibold">
                        {hook.label}
                      </div>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {hook.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={hook.enabled}
                      onClick={() =>
                        setWebhooks((prev) =>
                          prev.map((w, i) =>
                            i === idx ? { ...w, enabled: !w.enabled } : w
                          )
                        )
                      }
                      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        hook.enabled
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                          : isLight
                          ? "bg-slate-300"
                          : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          hook.enabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleTestWebhook(hook)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                        isLight
                          ? "text-violet-700 hover:text-fuchsia-600"
                          : "text-sky-300 hover:text-fuchsia-300"
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      Send Test Payload
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* SUB-TAB 4: DATA EXPORTS & AUDIT TRAIL */}
      {subTab === "exports" && (
        <div className="space-y-6">
          {/* 1-Click Live Exports */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SpotlightCard className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">
                  Export Candidates CSV
                </h3>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Download all {candidates.length} live parsed candidates with contact info, CGPA, ATS scores, pipeline stages, and extracted skills.
                </p>
              </div>
              <button
                type="button"
                disabled={exportingType === "candidates"}
                onClick={handleExportCandidates}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-xs font-semibold text-white shadow transition hover:brightness-110 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Candidates CSV
              </button>
            </SpotlightCard>

            <SpotlightCard className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-500 text-white shadow">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">
                  Export Skill Matches CSV
                </h3>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Fetch live 4-pillar match evaluations from Django <code className="font-mono">/api/matches/</code> including required match %, gaps, and hiring rationale.
                </p>
              </div>
              <button
                type="button"
                disabled={exportingType === "matches"}
                onClick={handleExportMatches}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 py-2.5 text-xs font-semibold text-white shadow transition hover:brightness-110 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                {exportingType === "matches"
                  ? "Fetching Live Matches..."
                  : "Download Matches CSV"}
              </button>
            </SpotlightCard>

            <SpotlightCard className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow">
                  <FileJson className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">
                  Full Talent Snapshot JSON
                </h3>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  GDPR-compliant structured archive bundling overview KPIs, {jobs.length} roles, {candidates.length} candidates, matches, and {knowledgeDocs.length} KB docs.
                </p>
              </div>
              <button
                type="button"
                disabled={exportingType === "snapshot"}
                onClick={handleExportSnapshot}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-2.5 text-xs font-semibold text-white shadow transition hover:brightness-110 cursor-pointer"
              >
                <FileJson className="h-4 w-4" />
                {exportingType === "snapshot"
                  ? "Building Archive..."
                  : "Export Full JSON Snapshot"}
              </button>
            </SpotlightCard>
          </div>

          {/* Session Audit Trail */}
          <SpotlightCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`h-5 w-5 ${
                    isLight ? "text-emerald-600" : "text-emerald-400"
                  }`}
                />
                <div>
                  <h3 className="font-display text-lg font-bold">
                    Session Governance &amp; Audit Trail
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Real-time tamper-evident log of workspace actions, exports, and API operations
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-mono ${
                  isLight
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {auditTrail.length} events recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b font-mono uppercase text-[10px] ${
                      isLight
                        ? "border-slate-200 text-slate-500"
                        : "border-white/10 text-slate-400"
                    }`}
                  >
                    <th className="py-2.5 pr-4">Time</th>
                    <th className="py-2.5 pr-4">Event</th>
                    <th className="py-2.5 pr-4">Workspace</th>
                    <th className="py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-slate-100" : "divide-white/5"
                  }`}
                >
                  {auditTrail.map((entry) => (
                    <tr key={entry.id}>
                      <td
                        className={`py-2.5 pr-4 font-mono whitespace-nowrap ${
                          isLight ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {entry.time}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <code
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                            isLight
                              ? "bg-violet-100 text-violet-800"
                              : "bg-violet-500/20 text-violet-200"
                          }`}
                        >
                          {entry.event}
                        </code>
                      </td>
                      <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                        {entry.workspace}
                      </td>
                      <td
                        className={`py-2.5 ${
                          isLight ? "text-slate-600" : "text-slate-300"
                        }`}
                      >
                        {entry.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Plan Upgrade Drawer Modal */}
      <AnimatePresence>
        {showUpgradeDrawer && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeDrawer(false)}
              className={`fixed inset-0 backdrop-blur-sm ${
                isLight ? "bg-slate-900/35" : "bg-black/75"
              }`}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`relative z-10 w-full max-w-4xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isLight
                  ? "border-slate-900/10 bg-white text-slate-900"
                  : "border-violet-400/35 bg-[#100d27] text-slate-100"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold">
                    Switch TalentLens AI SaaS Plan
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Instant quota scaling with zero downtime on your Django database
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex rounded-xl border p-1 text-xs font-semibold ${
                      isLight
                        ? "border-slate-200 bg-slate-100"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {["monthly", "annual"].map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        className={`rounded-lg px-3 py-1 capitalize transition cursor-pointer ${
                          billingCycle === cycle
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                            : isLight
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        {cycle === "annual" ? "Annual (-20%)" : "Monthly"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUpgradeDrawer(false)}
                    className={`rounded-lg p-1.5 cursor-pointer ${
                      isLight
                        ? "text-slate-400 hover:bg-slate-100"
                        : "text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === activePlanId;
                  const price =
                    billingCycle === "annual" ? plan.annual : plan.monthly;
                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 ${
                        plan.recommended
                          ? isLight
                            ? "border-violet-500 bg-violet-50/50 shadow-md"
                            : "border-fuchsia-400/55 bg-violet-500/12"
                          : isLight
                          ? "border-slate-200 bg-white"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-bold">
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="font-display text-3xl font-extrabold">
                            ${price}
                          </span>
                          <span
                            className={`text-xs ${
                              isLight ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            / month
                          </span>
                        </div>
                        <ul className="mt-4 space-y-2 text-xs">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          onPlanChange?.(plan.id);
                          onLogAudit?.(
                            "billing.plan_changed",
                            `Switched subscription to ${plan.name} (${billingCycle})`
                          );
                          notify?.(`Workspace upgraded to ${plan.name}!`);
                          setShowUpgradeDrawer(false);
                        }}
                        className={`mt-6 w-full rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${
                          isCurrent
                            ? isLight
                              ? "bg-slate-100 text-slate-400 cursor-default"
                              : "bg-white/10 text-slate-400 cursor-default"
                            : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110"
                        }`}
                      >
                        {isCurrent ? "Active Plan" : `Select ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
