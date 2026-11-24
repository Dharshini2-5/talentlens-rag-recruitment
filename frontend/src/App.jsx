import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  GitBranch,
  Home,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "./api/client";
import { useTheme } from "./context/ThemeContext";
import { BootSplash } from "./components/BootSplash";
import { CommandPalette } from "./components/CommandPalette";
import { LandingSplash } from "./components/LandingSplash";
import { MatchingPipelineView } from "./components/MatchingPipelineView";
import {
  NotificationsDrawer,
  ToastStack,
} from "./components/NotificationsDrawer";
import { OverviewView } from "./components/OverviewView";
import { RagChatbotView } from "./components/RagChatbotView";
import { ResumeParserView } from "./components/ResumeParserView";
import { SaaSSettingsView } from "./components/SaaSSettingsView";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  ClickSpark,
  Dock,
  GradientText,
  Particles,
} from "./components/reactbits";
import {
  exportCandidatesCsv,
  exportTalentSnapshotJson,
} from "./utils/exportUtils";

const INITIAL_WORKSPACES = [
  {
    id: "ws-hq",
    name: "TalentLens HQ — Engineering",
    short: "HQ",
    badge: "Core ATS",
    gradient: "from-violet-600 to-fuchsia-600",
  },
  {
    id: "ws-campus",
    name: "Campus Hiring 2026–27",
    short: "CH",
    badge: "University",
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    id: "ws-ai",
    name: "AI Research Recruiting",
    short: "AI",
    badge: "R&D Labs",
    gradient: "from-fuchsia-600 to-pink-500",
  },
];

const PLAN_LABELS = {
  starter: { name: "Recruiter Starter", parseLimit: 50, chunkLimit: 250 },
  growth: { name: "Growth Hiring", parseLimit: 500, chunkLimit: 2500 },
  enterprise: { name: "Enterprise ATS", parseLimit: 10000, chunkLimit: 50000 },
};

const TAB_TITLES = {
  overview: "Overview & Funnel",
  parser: "NLP Resume Parser",
  matching: "Matching & Shortlist Pipeline",
  chatbot: "RAG Smart Chatbot",
  settings: "Workspace, Billing & API",
};

export default function App() {
  const { isLight } = useTheme();
  const [booting, setBooting] = useState(true);
  const [viewMode, setViewMode] = useState("splash"); // "splash" | "studio"
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsSubTab, setSettingsSubTab] = useState("appearance");
  const [focusedJobId, setFocusedJobId] = useState(null);

  // SaaS Shell State
  const [workspaces, setWorkspaces] = useState(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("ws-hq");
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [showDock, setShowDock] = useState(() => {
    try {
      const saved = localStorage.getItem("talentlens_show_dock");
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });
  const [shortlistThreshold, setShortlistThreshold] = useState(68);
  const [activePlanId, setActivePlanId] = useState("growth");

  // Live Backend Data
  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [apiLatencyMs, setApiLatencyMs] = useState(null);

  // Notifications, Toasts & Audit Trail
  const [toasts, setToasts] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [readIds, setReadIds] = useState({});
  const [auditTrail, setAuditTrail] = useState([
    {
      id: "aud-init",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      event: "session.initialized",
      workspace: "TalentLens HQ — Engineering",
      detail: "Connected to Django NLP & Hybrid RAG engine on :8002",
    },
  ]);

  const activeWorkspace = useMemo(
    () =>
      workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const logAudit = useCallback(
    (event, detail) => {
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setAuditTrail((prev) => [
        {
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: now,
          event,
          workspace: activeWorkspace?.name || "TalentLens HQ",
          detail,
        },
        ...prev.slice(0, 39),
      ]);
    },
    [activeWorkspace]
  );

  const notify = useCallback((message, type = "success", meta = null) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    if (type !== "error") {
      const lower = message.toLowerCase();
      const category =
        meta?.category ||
        (lower.includes("parsed")
          ? "parser"
          : lower.includes("indexed") || lower.includes("rag")
          ? "rag"
          : lower.includes("shortlist") || lower.includes("match")
          ? "match"
          : "pipeline");
      const targetTab =
        meta?.targetTab ||
        (category === "parser"
          ? "parser"
          : category === "rag"
          ? "chatbot"
          : category === "match"
          ? "matching"
          : null);

      setLiveEvents((prev) => [
        {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title:
            category === "parser"
              ? "Resume Parsed & Profiled"
              : category === "rag"
              ? "RAG Knowledge Updated"
              : category === "match"
              ? "Skill Matching Updated"
              : "Workspace Activity",
          description: message,
          category,
          targetTab,
          time: "Just now",
        },
        ...prev.slice(0, 15),
      ]);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pingHealth = useCallback(async () => {
    const start = performance.now();
    try {
      await api.getHealth();
      const ms = Math.max(1, Math.round(performance.now() - start));
      setApiLatencyMs(ms);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      setApiLatencyMs(null);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const [ov, jb, cd, kb] = await Promise.all([
        api.getOverview(),
        api.getJobs(),
        api.getCandidates(),
        api.getKnowledge(),
      ]);
      const ms = Math.max(1, Math.round(performance.now() - start));
      setOverview(ov);
      setJobs(jb || []);
      setCandidates(cd || []);
      setKnowledgeDocs(kb || []);
      setBackendOnline(true);
      setApiLatencyMs((prev) => prev ?? ms);
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    pingHealth();
  }, [fetchAllData, pingHealth]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (viewMode === "splash") setViewMode("studio");
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode]);

  const toggleDockPref = useCallback(() => {
    setShowDock((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("talentlens_show_dock", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const launchStudio = useCallback((tab = "overview") => {
    setActiveTab(tab);
    setViewMode("studio");
    setMobileNavOpen(false);
  }, []);

  const handleWorkspaceSwitch = (ws) => {
    setActiveWorkspaceId(ws.id);
    setWsDropdownOpen(false);
    logAudit("workspace.switched", `Switched active workspace to "${ws.name}"`);
    notify(`Switched workspace to ${ws.name}`, "info");
  };

  const handleWorkspaceRename = (newName) => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId ? { ...w, name: newName } : w
      )
    );
  };

  // Real recruiting notifications derived from live Django candidates, top matches & pipeline stages
  const notifications = useMemo(() => {
    const derived = [];
    const topMatches = overview?.top_matches || [];
    topMatches.slice(0, 3).forEach((m) => {
      derived.push({
        id: `top-match-${m.id}`,
        title: `Top Match: ${m.candidate_name} (${m.overall_score}%)`,
        description: `${m.recommendation_tier.replace("_", " ")} for ${
          m.job_role_title
        } · Stage: ${m.candidate_stage}`,
        category: "match",
        targetTab: "matching",
        time: "Live DB",
      });
    });

    const interviewOrOffer = (candidates || []).filter((c) =>
      ["INTERVIEW", "OFFER", "SHORTLISTED"].includes(c.pipeline_stage)
    );
    if (interviewOrOffer.length > 0) {
      derived.push({
        id: "pipeline-active-stage",
        title: `${interviewOrOffer.length} Candidates in Active Funnel`,
        description: `${interviewOrOffer
          .slice(0, 3)
          .map((c) => `${c.full_name} (${c.pipeline_stage})`)
          .join(", ")} ready for next hiring review.`,
        category: "pipeline",
        targetTab: "matching",
        time: "Pipeline",
      });
    }

    if (knowledgeDocs.length > 0) {
      derived.push({
        id: "rag-kb-ready",
        title: `${overview?.kpis?.indexed_rag_chunks || knowledgeDocs.length} Live RAG Chunks Ready`,
        description: `${knowledgeDocs.length} HR & rubric documents indexed alongside ${jobs.length} open roles and ${candidates.length} parsed candidates.`,
        category: "rag",
        targetTab: "chatbot",
        time: "RAG Engine",
      });
    }

    return [...liveEvents, ...derived].map((n) => ({
      ...n,
      read: !!readIds[n.id],
    }));
  }, [liveEvents, overview, candidates, knowledgeDocs, jobs, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const next = {};
    notifications.forEach((n) => {
      next[n.id] = true;
    });
    setReadIds((prev) => ({ ...prev, ...next }));
  };

  const markSingleRead = (id) => {
    setReadIds((prev) => ({ ...prev, [id]: true }));
  };

  // Export handlers shared with Command Palette
  const handleQuickExportCandidates = () => {
    const res = exportCandidatesCsv(candidates);
    logAudit(
      "export.candidates_csv",
      `Exported ${res.count} candidates via Command Palette (${res.filename})`
    );
    notify(`Exported ${res.count} candidates to ${res.filename}`);
  };

  const handleQuickExportSnapshot = async () => {
    const allMatches = await api
      .getMatches()
      .catch(() => overview?.top_matches || []);
    const res = exportTalentSnapshotJson({
      workspace: activeWorkspace,
      overview,
      jobs,
      candidates,
      matches: allMatches || [],
      knowledgeDocs,
    });
    logAudit(
      "export.snapshot_json",
      `Exported full JSON snapshot (${res.filename})`
    );
    notify(`Downloaded full talent snapshot ${res.filename}`);
  };

  const navGroups = [
    {
      title: "Recruiting",
      items: [
        {
          id: "overview",
          label: "Overview & Funnel",
          icon: LayoutDashboard,
        },
        {
          id: "parser",
          label: "NLP Resume Parser",
          icon: FileSearch,
        },
        {
          id: "matching",
          label: "Matching & Shortlist",
          icon: GitBranch,
          badge: jobs.length || null,
        },
        {
          id: "chatbot",
          label: "RAG Smart Chatbot",
          icon: Bot,
          badge: knowledgeDocs.length || null,
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          id: "settings",
          label: "Workspace, Billing & API",
          icon: Settings,
        },
      ],
    },
  ];

  const dockItems = [
    { id: "overview", label: "Overview & Funnel", icon: LayoutDashboard },
    { id: "parser", label: "NLP Resume Parser", icon: FileSearch },
    {
      id: "matching",
      label: "Skill-to-Role Matching",
      icon: GitBranch,
      badge: jobs.length || null,
    },
    {
      id: "chatbot",
      label: "RAG Smart Chatbot",
      icon: Bot,
      badge: knowledgeDocs.length || null,
    },
    { id: "settings", label: "Workspace & Billing", icon: Settings },
  ];

  const planMeta = PLAN_LABELS[activePlanId] || PLAN_LABELS.growth;
  const parsedCount = overview?.kpis?.total_candidates ?? candidates.length;
  const ragChunksCount = overview?.kpis?.indexed_rag_chunks ?? 0;
  const parsedPct = Math.min(
    100,
    Math.max(4, Math.round((parsedCount / planMeta.parseLimit) * 100))
  );
  const ragPct = Math.min(
    100,
    Math.max(4, Math.round((ragChunksCount / planMeta.chunkLimit) * 100))
  );

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && sidebarCollapsed;
    return (
      <div className="flex h-full flex-col">
        {/* Brand Row */}
        <div
          className={`flex items-center justify-between gap-2 border-b px-3.5 py-3.5 ${
            isLight ? "border-slate-900/[0.08]" : "border-violet-500/20"
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode("splash")}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left"
            title="Back to Marketing Splash Page"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 text-white shadow-[0_6px_20px_rgba(124,58,237,0.4)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div
                  className={`font-display text-base font-bold tracking-tight truncate ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  TalentLens <GradientText>AI</GradientText>
                </div>
                <div
                  className={`text-[10px] font-mono uppercase tracking-wider truncate ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  SaaS ATS Studio
                </div>
              </div>
            )}
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className={`rounded-lg p-1.5 cursor-pointer ${
                isLight
                  ? "text-slate-500 hover:bg-slate-100"
                  : "text-slate-400 hover:bg-white/10"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`rounded-lg p-1.5 transition cursor-pointer ${
                isLight
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Organization / Hiring Workspace Switcher */}
        <div className="relative px-3 pt-3">
          <button
            type="button"
            onClick={() => setWsDropdownOpen((v) => !v)}
            className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition cursor-pointer ${
              isLight
                ? "border-slate-900/10 bg-[#F4F2FB] hover:border-violet-400/60"
                : "border-white/10 bg-white/[0.04] hover:border-violet-400/45"
            }`}
            title={activeWorkspace.name}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeWorkspace.gradient} font-display text-xs font-bold text-white shadow`}
            >
              {activeWorkspace.short}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-xs font-bold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {activeWorkspace.name}
                  </div>
                  <div
                    className={`text-[10px] font-mono ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    {activeWorkspace.badge}
                  </div>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    wsDropdownOpen ? "rotate-180" : ""
                  } ${isLight ? "text-slate-500" : "text-slate-400"}`}
                />
              </>
            )}
          </button>

          <AnimatePresence>
            {wsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`absolute left-3 right-3 top-full z-40 mt-1.5 min-w-[225px] rounded-xl border p-1.5 shadow-2xl ${
                  isLight
                    ? "border-slate-900/12 bg-white text-slate-900"
                    : "border-violet-400/35 bg-[#120e2b] text-slate-100"
                }`}
              >
                <div
                  className={`px-2 py-1 text-[10px] font-mono uppercase ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Switch Hiring Workspace
                </div>
                {workspaces.map((ws) => {
                  const selected = ws.id === activeWorkspaceId;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleWorkspaceSwitch(ws)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition cursor-pointer ${
                        selected
                          ? isLight
                            ? "bg-violet-50 text-violet-900 font-semibold"
                            : "bg-violet-500/20 text-white font-semibold"
                          : isLight
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-white/5 text-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${ws.gradient} text-[10px] font-bold text-white`}
                      >
                        {ws.short}
                      </span>
                      <span className="flex-1 truncate">{ws.name}</span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <div
                  className={`mb-1.5 px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                        collapsed ? "justify-center" : ""
                      } ${
                        active
                          ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white shadow-[0_6px_20px_-6px_rgba(124,58,237,0.55)]"
                          : isLight
                          ? "text-slate-600 hover:bg-violet-50 hover:text-violet-800"
                          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-left">
                            {item.label}
                          </span>
                          {item.badge !== undefined && item.badge !== null && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                                active
                                  ? "bg-white/20 text-white"
                                  : isLight
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live Plan & Quota Meter Widget */}
        {!collapsed ? (
          <div className="p-3">
            <button
              type="button"
              onClick={() => {
                setSettingsSubTab("billing");
                setActiveTab("settings");
                setMobileNavOpen(false);
              }}
              className={`w-full rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                isLight
                  ? "border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-sky-50/70 hover:border-violet-400"
                  : "border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#100d26] to-fuchsia-950/30 hover:border-violet-400/55"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-display text-xs font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {planMeta.name}
                </span>
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                  PRO
                </span>
              </div>

              {/* Resumes Parsed Meter */}
              <div className="mt-3">
                <div
                  className={`flex justify-between text-[10px] font-mono ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  <span>Resumes Parsed</span>
                  <span>
                    {parsedCount}/{planMeta.parseLimit}
                  </span>
                </div>
                <div
                  className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${
                    isLight ? "bg-slate-200" : "bg-white/10"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                    style={{ width: `${parsedPct}%` }}
                  />
                </div>
              </div>

              {/* RAG Chunks Meter */}
              <div className="mt-2.5">
                <div
                  className={`flex justify-between text-[10px] font-mono ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  <span>RAG Chunks</span>
                  <span>
                    {ragChunksCount}/{planMeta.chunkLimit}
                  </span>
                </div>
                <div
                  className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${
                    isLight ? "bg-slate-200" : "bg-white/10"
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${ragPct}%` }}
                  />
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex justify-center p-3">
            <button
              type="button"
              onClick={() => {
                setSettingsSubTab("billing");
                setActiveTab("settings");
              }}
              title={`${planMeta.name} — ${parsedCount} parses · ${ragChunksCount} RAG chunks`}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition cursor-pointer ${
                isLight
                  ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                  : "border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
              }`}
            >
              <Building2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ClickSpark
      sparkColor={isLight ? "#7C3AED" : "#EC4899"}
      sparkCount={10}
      sparkRadius={26}
    >
      <AnimatePresence>
        {booting && <BootSplash onDone={() => setBooting(false)} />}
      </AnimatePresence>

      {/* Stacked Crisp Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Global Ctrl+K Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        candidates={candidates}
        jobs={jobs}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setViewMode("studio");
        }}
        onSelectJob={(jobId) => setFocusedJobId(jobId)}
        onGoSplash={() => setViewMode("splash")}
        onRefresh={fetchAllData}
        onExportCandidates={handleQuickExportCandidates}
        onExportSnapshot={handleQuickExportSnapshot}
      />

      {/* Slide-Over Hiring Notifications Center */}
      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onMarkRead={markSingleRead}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setViewMode("studio");
        }}
      />

      {viewMode === "splash" ? (
        <LandingSplash
          overview={overview}
          backendOnline={backendOnline}
          apiLatencyMs={apiLatencyMs}
          onLaunchStudio={launchStudio}
          onOpenChatbot={() => launchStudio("chatbot")}
          onSelectPlan={(planId) => {
            setActivePlanId(planId);
            logAudit("billing.plan_selected", `Selected ${planId} tier from Landing Page`);
          }}
        />
      ) : (
        <div
          className={`relative flex min-h-screen transition-colors duration-300 ${
            isLight
              ? "bg-[#F7F6FC] text-slate-900"
              : "bg-[#070614] text-slate-100"
          }`}
        >
          {/* Subtle Ambient Neural Constellation */}
          <div
            className={`pointer-events-none fixed inset-0 z-0 ${
              isLight ? "opacity-55" : "opacity-40"
            }`}
          >
            <Particles particleCount={32} connectionDistance={120} />
          </div>
          <div className="pointer-events-none fixed inset-0 z-0 cosmic-grid opacity-35" />

          {/* Desktop Collapsible SaaS Left Sidebar */}
          <aside
            className={`sticky top-0 z-30 hidden h-screen shrink-0 border-r backdrop-blur-xl transition-all duration-300 lg:block ${
              sidebarCollapsed ? "w-[74px]" : "w-[258px]"
            } ${
              isLight
                ? "border-slate-900/[0.08] bg-white/85"
                : "border-violet-500/20 bg-[#0a081c]/90"
            }`}
          >
            {renderSidebarContent(false)}
          </aside>

          {/* Mobile Slide-Over Sidebar Drawer */}
          <AnimatePresence>
            {mobileNavOpen && (
              <div className="fixed inset-0 z-[95] flex lg:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileNavOpen(false)}
                  className={`fixed inset-0 backdrop-blur-sm ${
                    isLight ? "bg-slate-900/30" : "bg-black/65"
                  }`}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className={`relative z-10 h-full w-72 border-r shadow-2xl ${
                    isLight
                      ? "border-slate-900/10 bg-white"
                      : "border-violet-500/25 bg-[#0a081c]"
                  }`}
                >
                  {renderSidebarContent(true)}
                </motion.aside>
              </div>
            )}
          </AnimatePresence>

          {/* Right Main Workspace Column */}
          <div
            className={`relative z-10 flex min-w-0 flex-1 flex-col ${
              showDock ? "pb-28" : "pb-12"
            }`}
          >
            {/* Enterprise Top Command Bar */}
            <header
              className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-colors ${
                isLight
                  ? "border-slate-900/[0.08] bg-white/82"
                  : "border-violet-500/20 bg-[#080618]/85"
              }`}
            >
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 px-4 py-2.5 sm:px-6">
                {/* Left: Mobile Menu + Breadcrumb */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border lg:hidden cursor-pointer ${
                      isLight
                        ? "border-slate-900/10 bg-white text-slate-700"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-4.5 w-4.5" />
                  </button>

                  <div className="hidden sm:flex items-center gap-2 text-xs min-w-0">
                    <span
                      className={`truncate max-w-[160px] font-medium ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {activeWorkspace.name}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span
                      className={`font-display font-bold truncate ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {TAB_TITLES[activeTab]}
                    </span>
                  </div>
                </div>

                {/* Center: Global Ctrl+K Command Palette Trigger */}
                <button
                  type="button"
                  onClick={() => setCmdOpen(true)}
                  className={`group flex flex-1 max-w-sm items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-xs transition cursor-pointer ${
                    isLight
                      ? "border-slate-900/10 bg-[#F4F2FB] text-slate-500 hover:border-violet-400 hover:bg-white hover:text-slate-800"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-violet-400/50 hover:bg-white/[0.07] hover:text-slate-200"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    <Search className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span className="truncate">
                      Search candidates, roles, commands...
                    </span>
                  </span>
                  <kbd
                    className={`hidden sm:inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${
                      isLight
                        ? "border-slate-200 bg-white text-slate-500"
                        : "border-white/15 bg-white/5 text-slate-400"
                    }`}
                  >
                    Ctrl K
                  </kbd>
                </button>

                {/* Right: Latency Pill, ThemeToggle, Notifications, Sync, Splash, RAG */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Live Django API Latency Pill */}
                  <button
                    type="button"
                    onClick={pingHealth}
                    title="Click to ping Django NLP/RAG Engine (/api/health/)"
                    className={`hidden xl:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                      backendOnline
                        ? isLight
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : isLight
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-rose-500/35 bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    <Activity className="h-3 w-3" />
                    <span>
                      {backendOnline
                        ? `Django ${apiLatencyMs ? `${apiLatencyMs}ms` : "OK"}`
                        : "API Offline"}
                    </span>
                  </button>

                  <ThemeToggle compact />

                  {/* Notifications Center Button */}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(true)}
                    title="Hiring Activity Notifications"
                    className={`relative inline-flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                      isLight
                        ? "border-slate-900/10 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-700"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/45 hover:text-white"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[9px] font-bold text-white shadow">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={fetchAllData}
                    title="Refresh live Django data"
                    className={`hidden md:inline-flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                      isLight
                        ? "border-slate-900/10 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-700"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/45 hover:text-white"
                    }`}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("splash")}
                    title="Back to Marketing Splash Page"
                    className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                      isLight
                        ? "border-slate-900/10 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/45 hover:text-white"
                    }`}
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Splash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chatbot")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      activeTab === "chatbot"
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_6px_18px_rgba(219,39,119,0.35)]"
                        : isLight
                        ? "border border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                        : "border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">RAG Chat</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Active Studio View */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {activeTab === "overview" && (
                    <OverviewView
                      overview={overview}
                      loading={loading}
                      onNavigate={setActiveTab}
                    />
                  )}
                  {activeTab === "parser" && (
                    <ResumeParserView
                      onCandidateAdded={() => {
                        logAudit(
                          "candidate.parsed",
                          "NLP parser extracted skills & saved new candidate dossier"
                        );
                        fetchAllData();
                      }}
                      notify={notify}
                    />
                  )}
                  {activeTab === "matching" && (
                    <MatchingPipelineView
                      jobs={jobs}
                      candidates={candidates}
                      initialJobId={focusedJobId}
                      shortlistThreshold={shortlistThreshold}
                      onDataChanged={() => {
                        logAudit(
                          "pipeline.updated",
                          "Updated candidate stage, role or skill matching evaluations"
                        );
                        fetchAllData();
                      }}
                      notify={notify}
                    />
                  )}
                  {activeTab === "chatbot" && (
                    <RagChatbotView
                      knowledgeDocs={knowledgeDocs}
                      onKnowledgeChanged={() => {
                        logAudit(
                          "rag.knowledge_synced",
                          "Re-indexed live RAG Knowledge Base documents"
                        );
                        fetchAllData();
                      }}
                      notify={notify}
                    />
                  )}
                  {activeTab === "settings" && (
                    <SaaSSettingsView
                      initialSubTab={settingsSubTab}
                      overview={overview}
                      jobs={jobs}
                      candidates={candidates}
                      knowledgeDocs={knowledgeDocs}
                      activeWorkspace={activeWorkspace}
                      onWorkspaceRename={handleWorkspaceRename}
                      showDock={showDock}
                      onToggleDock={toggleDockPref}
                      shortlistThreshold={shortlistThreshold}
                      onShortlistThresholdChange={setShortlistThreshold}
                      activePlanId={activePlanId}
                      onPlanChange={setActivePlanId}
                      auditTrail={auditTrail}
                      onLogAudit={logAudit}
                      notify={notify}
                      apiLatencyMs={apiLatencyMs}
                      onPingHealth={pingHealth}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Signature Floating Magnifying ReactBits Dock (Toggleable in Workspace Settings) */}
          {showDock && (
            <Dock
              items={dockItems}
              activeId={activeTab}
              onSelect={setActiveTab}
            />
          )}
        </div>
      )}
    </ClickSpark>
  );
}
