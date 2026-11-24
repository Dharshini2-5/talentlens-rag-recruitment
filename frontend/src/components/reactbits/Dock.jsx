import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export function Dock({ items = [], activeId, onSelect, className = "" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { isLight } = useTheme();

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 ${className}`}
      role="navigation"
      aria-label="Primary Workspace Dock"
    >
      <div
        className={`flex items-end gap-2 rounded-2xl border px-3 py-2 backdrop-blur-2xl transition-all duration-300 ${
          isLight
            ? "border-slate-900/10 bg-white/88 shadow-[0_14px_40px_-10px_rgba(15,23,42,0.18),0_2px_8px_rgba(124,58,237,0.10)]"
            : "border-violet-500/30 bg-[#0d0a22]/85 shadow-[0_14px_50px_rgba(7,6,20,0.85),0_0_30px_rgba(139,92,246,0.22)]"
        }`}
      >
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          const dist = hoveredIdx === null ? 3 : Math.abs(hoveredIdx - idx);
          const scale = dist === 0 ? 1.22 : dist === 1 ? 1.09 : 1.0;

          return (
            <motion.button
              key={item.id}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelect(item.id)}
              animate={{ scale, y: dist === 0 ? -6 : dist === 1 ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              className={`group relative flex h-11 w-11 md:h-12 md:w-12 flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-sky-500 text-white shadow-[0_6px_22px_rgba(124,58,237,0.45)] border border-white/25"
                  : isLight
                  ? "bg-slate-100/90 text-slate-600 hover:bg-violet-100 hover:text-violet-700 border border-slate-900/[0.06]"
                  : "bg-white/[0.04] text-slate-300 hover:bg-violet-500/20 hover:text-white border border-white/10"
              }`}
            >
              {/* Tooltip */}
              <span
                className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
                  isLight
                    ? "border-slate-900/10 bg-slate-900 text-white"
                    : "border-violet-400/35 bg-[#120e2b]/95 text-slate-100"
                }`}
              >
                {item.label}
              </span>
              <Icon className="h-5 w-5" />
              {item.badge !== undefined && item.badge !== null && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-bold text-white shadow">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span
                  className={`absolute -bottom-1.5 h-1 w-4 rounded-full ${
                    isLight
                      ? "bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.65)]"
                      : "bg-sky-400 shadow-[0_0_8px_#38BDF8]"
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
