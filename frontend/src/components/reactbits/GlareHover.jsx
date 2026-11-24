import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function GlareHover({ children, className = "" }) {
  const { isLight } = useTheme();

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div
        className={`pointer-events-none absolute inset-0 -translate-x-full skew-x-[-22deg] bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[180%] ${
          isLight ? "via-violet-400/18" : "via-white/15"
        }`}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
