import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { DecryptedText, GradientText, Orb } from "./reactbits";

export function BootSplash({ onDone }) {
  const [progress, setProgress] = useState(0);
  const { isLight } = useTheme();

  useEffect(() => {
    const start = performance.now();
    const duration = 1250;
    let raf = 0;

    const tick = (now) => {
      const p = Math.min(100, ((now - start) / duration) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => onDone?.(), 130);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 ${
        isLight ? "bg-[#F7F6FC] text-slate-900" : "bg-[#070614] text-slate-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 cosmic-grid opacity-55" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <Orb size={156} active={true} />
        <h1 className="mt-4 text-3xl md:text-4xl font-display font-extrabold tracking-tight">
          <GradientText>TalentLens AI</GradientText>
        </h1>
        <p
          className={`mt-2 text-xs md:text-sm tracking-[0.18em] uppercase ${
            isLight ? "text-violet-700" : "text-violet-300/90"
          }`}
        >
          <DecryptedText
            text="LOADING NLP PARSER · HYBRID RAG · SKILL PIPELINE"
            speed={20}
          />
        </p>

        <div
          className={`mt-7 h-1.5 w-64 md:w-80 overflow-hidden rounded-full ${
            isLight ? "bg-slate-900/10" : "bg-white/10"
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#0284C7] shadow-[0_0_18px_rgba(236,72,153,0.45)] transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`mt-2 flex w-64 md:w-80 items-center justify-between text-[11px] font-mono ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <span>NEURAL ENGINE READY</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className={`mt-6 rounded-full border px-4 py-1.5 text-xs font-medium transition cursor-pointer ${
            isLight
              ? "border-slate-900/12 bg-white text-slate-700 hover:border-violet-500/50 hover:text-violet-700 shadow-sm"
              : "border-white/15 bg-white/5 text-slate-300 hover:border-violet-400/50 hover:text-white"
          }`}
        >
          Skip Intro →
        </button>
      </div>
    </motion.div>
  );
}
