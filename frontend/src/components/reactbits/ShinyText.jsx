import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function ShinyText({ text, children, className = "" }) {
  const { isLight } = useTheme();

  return (
    <span
      className={`animate-shiny-text bg-clip-text text-transparent ${
        isLight
          ? "bg-gradient-to-r from-violet-700 via-fuchsia-600 to-sky-700"
          : "bg-gradient-to-r from-slate-300 via-white to-violet-300"
      } ${className}`}
    >
      {text || children}
    </span>
  );
}
