import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export function PillNav({
  items = [],
  activeId,
  onChange,
  layoutId = "pill-nav-active",
  className = "",
}) {
  const { isLight } = useTheme();

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border p-1 backdrop-blur-md transition-colors ${
        isLight
          ? "border-slate-900/10 bg-white/90 shadow-sm"
          : "border-violet-500/25 bg-[#0c0a1f]/85"
      } ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs md:text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? "text-white"
                : isLight
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className={`absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-500 ${
                  isLight
                    ? "shadow-[0_4px_14px_rgba(124,58,237,0.35)]"
                    : "shadow-[0_0_18px_rgba(139,92,246,0.45)]"
                }`}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
