import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function GradientText({ children, className = "" }) {
  const { isLight } = useTheme();

  return (
    <span
      className={`animate-gradient-flow bg-clip-text text-transparent ${
        isLight
          ? "bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#0284C7]"
          : "bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#38BDF8]"
      } ${className}`}
    >
      {children}
    </span>
  );
}
