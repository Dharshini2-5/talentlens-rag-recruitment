import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

export function TrueFocus({
  words = ["NLP Parsing", "Hybrid RAG", "Skill Matching"],
  intervalMs = 2400,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { isLight } = useTheme();

  useEffect(() => {
    if (paused || words.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, words.length, intervalMs]);

  return (
    <div
      className={`inline-flex flex-wrap items-center justify-center gap-3 ${className}`}
      onMouseLeave={() => setPaused(false)}
    >
      {words.map((word, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={word}
            type="button"
            onMouseEnter={() => {
              setPaused(true);
              setActiveIndex(idx);
            }}
            className="relative px-3.5 py-1.5 text-sm md:text-base font-display font-semibold tracking-wide transition-all cursor-pointer"
          >
            <span
              className={`relative z-10 transition-all duration-300 ${
                isActive
                  ? isLight
                    ? "text-slate-900 blur-0"
                    : "text-white blur-0"
                  : isLight
                  ? "text-slate-500/80 blur-[1.2px] hover:text-slate-800"
                  : "text-slate-400/75 blur-[1.4px] hover:text-slate-200"
              }`}
            >
              {word}
            </span>
            {isActive && (
              <motion.span
                layoutId="true-focus-frame"
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className={`pointer-events-none absolute inset-0 rounded-lg border ${
                  isLight
                    ? "border-violet-600/45 bg-violet-600/[0.08] shadow-[0_6px_18px_rgba(124,58,237,0.16)]"
                    : "border-violet-400/60 bg-violet-500/12 shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                }`}
              >
                <span className="absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-fuchsia-500 rounded-tl-sm" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-sky-500 rounded-tr-sm" />
                <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-sky-500 rounded-bl-sm" />
                <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-fuchsia-500 rounded-br-sm" />
              </motion.span>
            )}
          </button>
        );
      })}
    </div>
  );
}
