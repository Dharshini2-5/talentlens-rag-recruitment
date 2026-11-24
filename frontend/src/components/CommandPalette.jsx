import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Briefcase,
  CornerDownLeft,
  Download,
  FileJson,
  FileSearch,
  GitBranch,
  Home,
  LayoutDashboard,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function CommandPalette({
  open,
  onClose,
  candidates = [],
  jobs = [],
  onNavigate,
  onSelectJob,
  onGoSplash,
  onRefresh,
  onExportCandidates,
  onExportSnapshot,
}) {
  const { isDark, isLight, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();

    const navItems = [
      {
        id: "nav-overview",
        group: "Navigation",
        label: "Overview & Hiring Funnel",
        subtitle: "Live KPIs, skill supply vs. demand & ranked matches",
        icon: LayoutDashboard,
        shortcut: "G O",
        action: () => onNavigate("overview"),
      },
      {
        id: "nav-parser",
        group: "Navigation",
        label: "NLP Resume Parser & Profiler",
        subtitle: "Upload PDF/DOCX/TXT or run 1-click sample extraction",
        icon: FileSearch,
        shortcut: "G P",
        action: () => onNavigate("parser"),
      },
      {
        id: "nav-matching",
        group: "Navigation",
        label: "Matching & Shortlist Pipeline",
        subtitle: "4-pillar skill-gap radar, auto-shortlist & Kanban board",
        icon: GitBranch,
        shortcut: "G M",
        action: () => onNavigate("matching"),
      },
      {
        id: "nav-chatbot",
        group: "Navigation",
        label: "RAG Smart Recruitment Chatbot",
        subtitle: "Hybrid BM25 + TF-IDF Q&A with live Knowledge Base",
        icon: Bot,
        shortcut: "G C",
        action: () => onNavigate("chatbot"),
      },
      {
        id: "nav-settings",
        group: "Navigation",
        label: "Workspace, Billing & API Settings",
        subtitle: "Themes, metered usage, API keys, webhooks & CSV exports",
        icon: Settings,
        shortcut: "G S",
        action: () => onNavigate("settings"),
      },
      {
        id: "nav-splash",
        group: "Navigation",
        label: "Open Marketing & Product Splash",
        subtitle: "View landing page, architecture showcase & SaaS pricing",
        icon: Home,
        action: () => onGoSplash?.(),
      },
    ];

    const actionItems = [
      {
        id: "act-theme",
        group: "Quick Actions",
        label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: isDark
          ? "Editorial studio lavender-snow light interface"
          : "Deep cosmic violet & neon fuchsia dark studio",
        icon: isDark ? Sun : Moon,
        shortcut: "T",
        action: () => toggleTheme(),
      },
      {
        id: "act-export-csv",
        group: "Quick Actions",
        label: "Export Candidate Pipeline CSV",
        subtitle: `Download ${candidates.length} parsed candidates from live Django DB`,
        icon: Download,
        action: () => onExportCandidates?.(),
      },
      {
        id: "act-export-json",
        group: "Quick Actions",
        label: "Export Full Talent Snapshot JSON",
        subtitle: "Bundle live KPIs, jobs, candidates, matches & KB metadata",
        icon: FileJson,
        action: () => onExportSnapshot?.(),
      },
      {
        id: "act-refresh",
        group: "Quick Actions",
        label: "Sync Live Django Backend Data",
        subtitle: "Re-fetch candidates, roles, matches & RAG chunks",
        icon: RefreshCw,
        action: () => onRefresh?.(),
      },
    ];

    const jobItems = (jobs || []).map((job) => ({
      id: `job-${job.id}`,
      group: "Open Job Roles",
      label: job.title,
      subtitle: `${job.department || "Engineering"} · ${job.work_mode} · ${
        job.salary_band
      } · Top ${job.top_match_score || 0}%`,
      keywords: [
        job.title,
        job.department,
        job.location,
        ...(job.required_skills || []),
        ...(job.preferred_skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      icon: Briefcase,
      badge: `${job.openings} open`,
      action: () => {
        onSelectJob?.(job.id);
        onNavigate("matching");
      },
    }));

    const candItems = (candidates || []).map((c) => ({
      id: `cand-${c.id}`,
      group: "Live Candidates",
      label: c.full_name,
      subtitle: `${c.seniority_level} · ${c.pipeline_stage} · ATS ${
        c.ats_score
      }% · ${(c.extracted_skills || []).slice(0, 4).join(", ")}`,
      keywords: [
        c.full_name,
        c.email,
        c.seniority_level,
        c.pipeline_stage,
        c.education,
        c.location,
        ...(c.extracted_skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      icon: User,
      badge: c.pipeline_stage,
      action: () => {
        const topJobId = c.top_matches?.[0]?.job_role;
        if (topJobId) onSelectJob?.(topJobId);
        onNavigate("matching");
      },
    }));

    const all = [...navItems, ...actionItems, ...jobItems, ...candItems];
    if (!q) {
      return [
        ...navItems.slice(0, 5),
        ...actionItems.slice(0, 3),
        ...jobItems.slice(0, 3),
        ...candItems.slice(0, 4),
      ];
    }

    return all
      .filter((item) => {
        const hay = `${item.label} ${item.subtitle || ""} ${
          item.keywords || ""
        } ${item.group}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 16);
  }, [
    query,
    isDark,
    candidates,
    jobs,
    onNavigate,
    onSelectJob,
    onGoSplash,
    onRefresh,
    onExportCandidates,
    onExportSnapshot,
    toggleTheme,
  ]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => (items.length ? (prev + 1) % items.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) =>
          items.length ? (prev - 1 + items.length) % items.length : 0
        );
      } else if (e.key === "Enter" && items[activeIdx]) {
        e.preventDefault();
        items[activeIdx].action();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, items, activeIdx, onClose]);

  // Group items preserving flat index for keyboard nav
  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item, flatIdx) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push({ ...item, flatIdx });
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[11vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Global Command Palette"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 backdrop-blur-md ${
              isLight ? "bg-slate-900/35" : "bg-black/70"
            }`}
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${
              isLight
                ? "border-slate-900/12 bg-white text-slate-900 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.28)]"
                : "border-violet-400/35 bg-[#0f0c26]/98 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
            }`}
          >
            {/* Search Input Bar */}
            <div
              className={`flex items-center gap-3 border-b px-4 py-3.5 ${
                isLight ? "border-slate-900/10" : "border-violet-500/20"
              }`}
            >
              <Search
                className={`h-4 w-4 shrink-0 ${
                  isLight ? "text-violet-600" : "text-violet-400"
                }`}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates by name or skill, open roles, views, or actions..."
                className={`w-full bg-transparent text-sm focus:outline-none ${
                  isLight
                    ? "text-slate-900 placeholder:text-slate-400"
                    : "text-white placeholder:text-slate-500"
                }`}
              />
              <kbd
                className={`hidden sm:inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${
                  isLight
                    ? "border-slate-200 bg-slate-100 text-slate-500"
                    : "border-white/15 bg-white/5 text-slate-400"
                }`}
              >
                ESC
              </kbd>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg p-1 transition cursor-pointer ${
                  isLight
                    ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[54vh] overflow-y-auto p-2.5 space-y-3">
              {grouped.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles
                    className={`mx-auto h-7 w-7 ${
                      isLight ? "text-violet-400" : "text-violet-400/60"
                    }`}
                  />
                  <p
                    className={`mt-2 text-sm font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    No matching candidates, roles, or commands for &ldquo;{query}&rdquo;
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isLight ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    Try searching a skill like &ldquo;Django&rdquo;, &ldquo;React&rdquo;, or &ldquo;RAG&rdquo;
                  </p>
                </div>
              ) : (
                grouped.map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    <div
                      className={`px-2.5 pb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {groupName}
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.flatIdx === activeIdx;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setActiveIdx(item.flatIdx)}
                            onClick={() => {
                              item.action();
                              onClose();
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                              isActive
                                ? isLight
                                  ? "bg-violet-600/10 text-violet-950 ring-1 ring-violet-500/25"
                                  : "bg-violet-500/20 text-white ring-1 ring-violet-400/40"
                                : isLight
                                ? "text-slate-700 hover:bg-slate-100/80"
                                : "text-slate-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  isActive
                                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm"
                                    : isLight
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-white/[0.06] text-slate-300"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {item.label}
                                </div>
                                {item.subtitle && (
                                  <div
                                    className={`truncate text-xs ${
                                      isLight
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge && (
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                    isLight
                                      ? "bg-violet-100 text-violet-700"
                                      : "bg-violet-500/20 text-violet-200"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {item.shortcut && (
                                <kbd
                                  className={`hidden sm:inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono ${
                                    isLight
                                      ? "border-slate-200 bg-slate-50 text-slate-500"
                                      : "border-white/10 bg-white/5 text-slate-400"
                                  }`}
                                >
                                  {item.shortcut}
                                </kbd>
                              )}
                              {isActive && (
                                <CornerDownLeft
                                  className={`h-3.5 w-3.5 ${
                                    isLight
                                      ? "text-violet-600"
                                      : "text-violet-300"
                                  }`}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Hints */}
            <div
              className={`flex items-center justify-between border-t px-4 py-2 text-[11px] font-mono ${
                isLight
                  ? "border-slate-900/10 bg-slate-50 text-slate-500"
                  : "border-violet-500/20 bg-white/[0.02] text-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span>
                {candidates.length} Candidates · {jobs.length} Roles Indexed
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
