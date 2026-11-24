import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle({ compact = false, className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`group relative inline-flex items-center gap-2 rounded-full border transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ${
        compact ? "p-1" : "px-1.5 py-1"
      } ${
        isDark
          ? "border-violet-400/30 bg-[#141030]/90 hover:border-violet-400/60 shadow-[0_0_18px_rgba(139,92,246,0.18)]"
          : "border-slate-900/12 bg-white/95 hover:border-violet-500/45 shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
      } ${className}`}
    >
      {/* Pill Track */}
      <span
        className={`relative flex h-6 w-12 items-center rounded-full p-0.5 transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900"
            : "bg-gradient-to-r from-amber-100 via-violet-100 to-sky-100"
        }`}
      >
        {/* Background static indicators */}
        <Sun
          className={`pointer-events-none absolute left-1.5 h-3 w-3 transition-opacity duration-200 ${
            isDark ? "text-slate-500 opacity-50" : "text-amber-500 opacity-0"
          }`}
        />
        <Moon
          className={`pointer-events-none absolute right-1.5 h-3 w-3 transition-opacity duration-200 ${
            isDark ? "text-violet-300 opacity-0" : "text-slate-400 opacity-60"
          }`}
        />

        {/* Animated Spring Knob */}
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 30 }}
          className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md ${
            isDark
              ? "ml-auto bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white"
              : "mr-auto bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 text-white"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span
                key="moon"
                initial={{ rotate: -80, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 80, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center justify-center"
              >
                <Moon className="h-3 w-3" />
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                initial={{ rotate: 80, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -80, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center justify-center"
              >
                <Sun className="h-3 w-3" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </span>

      {!compact && (
        <span
          className={`hidden sm:inline pr-1.5 text-[11px] font-semibold tracking-tight transition-colors ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
