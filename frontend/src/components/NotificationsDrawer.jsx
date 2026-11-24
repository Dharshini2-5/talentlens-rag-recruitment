import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  Bot,
  CheckCheck,
  CheckCircle2,
  FileSearch,
  GitBranch,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_META = {
  match: {
    icon: GitBranch,
    darkChip: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    lightChip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  parser: {
    icon: FileSearch,
    darkChip: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    lightChip: "bg-violet-50 text-violet-700 border-violet-200",
  },
  rag: {
    icon: Bot,
    darkChip: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30",
    lightChip: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  },
  pipeline: {
    icon: Sparkles,
    darkChip: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    lightChip: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

export function NotificationsDrawer({
  open,
  onClose,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onNavigate,
}) {
  const { isLight } = useTheme();
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[105] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Hiring Notifications Center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 backdrop-blur-sm ${
              isLight ? "bg-slate-900/25" : "bg-black/60"
            }`}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className={`relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl ${
              isLight
                ? "border-slate-900/10 bg-white text-slate-900"
                : "border-violet-500/25 bg-[#0d0a21] text-slate-100"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                isLight ? "border-slate-900/10" : "border-violet-500/20"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold">
                      Hiring Activity Center
                    </h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-fuchsia-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Live talent alerts, NLP parses & RAG updates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg p-1.5 transition cursor-pointer ${
                  isLight
                    ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter & Mark Read Strip */}
            <div
              className={`flex items-center justify-between border-b px-5 py-2.5 ${
                isLight
                  ? "border-slate-900/8 bg-slate-50/80"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {["all", "unread"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                      filter === f
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm"
                        : isLight
                        ? "text-slate-600 hover:bg-slate-200/70"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    {f === "all"
                      ? `All (${notifications.length})`
                      : `Unread (${unreadCount})`}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className={`inline-flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
                    isLight
                      ? "text-violet-700 hover:text-fuchsia-600"
                      : "text-violet-300 hover:text-fuchsia-300"
                  }`}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Feed Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {visible.length === 0 ? (
                <div className="flex h-56 flex-col items-center justify-center text-center">
                  <CheckCircle2
                    className={`h-8 w-8 ${
                      isLight ? "text-emerald-500" : "text-emerald-400/75"
                    }`}
                  />
                  <p className="mt-2 text-sm font-semibold">You&apos;re all caught up</p>
                  <p
                    className={`mt-1 text-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    New resume parses, shortlists, and KB updates appear here.
                  </p>
                </div>
              ) : (
                visible.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.pipeline;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onMarkRead?.(item.id);
                        if (item.targetTab) {
                          onNavigate?.(item.targetTab);
                          onClose();
                        }
                      }}
                      className={`group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition cursor-pointer ${
                        !item.read
                          ? isLight
                            ? "border-violet-300/70 bg-violet-50/70 hover:bg-violet-50"
                            : "border-violet-400/35 bg-violet-500/10 hover:bg-violet-500/15"
                          : isLight
                          ? "border-slate-200/80 bg-white hover:border-slate-300"
                          : "border-white/10 bg-white/[0.025] hover:border-violet-400/35"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          isLight ? meta.lightChip : meta.darkChip
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-mono ${
                                isLight ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {item.time}
                            </span>
                            {!item.read && (
                              <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                            )}
                          </div>
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            isLight ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          {item.description}
                        </p>
                        {item.targetTab && (
                          <span
                            className={`mt-1.5 inline-block text-[10px] font-mono font-semibold uppercase ${
                              isLight ? "text-violet-700" : "text-sky-300"
                            }`}
                          >
                            Open {item.targetTab} →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ToastStack({ toasts = [], onDismiss }) {
  const { isLight } = useTheme();

  return (
    <div
      className="pointer-events-none fixed top-5 right-5 z-[120] flex w-full max-w-sm flex-col gap-2.5"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isErr = t.type === "error";
          const isInfo = t.type === "info";
          const Icon = isErr ? AlertCircle : isInfo ? Info : CheckCircle2;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium shadow-2xl backdrop-blur-xl ${
                isErr
                  ? isLight
                    ? "border-rose-300 bg-rose-50/98 text-rose-900"
                    : "border-rose-400/50 bg-rose-950/92 text-rose-100"
                  : isInfo
                  ? isLight
                    ? "border-sky-300 bg-white/98 text-slate-900"
                    : "border-sky-400/45 bg-[#0e152c]/95 text-sky-100"
                  : isLight
                  ? "border-violet-300/80 bg-white/98 text-slate-900"
                  : "border-violet-400/50 bg-[#140f33]/95 text-violet-100"
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  isErr
                    ? isLight
                      ? "text-rose-600"
                      : "text-rose-400"
                    : isInfo
                    ? isLight
                      ? "text-sky-600"
                      : "text-sky-400"
                    : isLight
                    ? "text-emerald-600"
                    : "text-emerald-400"
                }`}
              />
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                type="button"
                onClick={() => onDismiss?.(t.id)}
                className={`rounded p-0.5 opacity-60 hover:opacity-100 cursor-pointer ${
                  isLight ? "text-slate-500" : "text-slate-300"
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
