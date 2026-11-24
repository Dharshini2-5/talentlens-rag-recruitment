import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function StarBorder({
  as: Component = "button",
  className = "",
  innerClassName = "",
  color = "#EC4899",
  secondaryColor = "#38BDF8",
  speed = "5s",
  children,
  ...rest
}) {
  const { isLight } = useTheme();
  const resolvedColor = isLight && color === "#EC4899" ? "#DB2777" : color;
  const resolvedSecondary =
    isLight && secondaryColor === "#38BDF8" ? "#7C3AED" : secondaryColor;

  return (
    <Component
      className={`group relative inline-flex overflow-hidden rounded-xl p-[1.5px] cursor-pointer focus:outline-none ${
        isLight
          ? "shadow-[0_10px_28px_-10px_rgba(124,58,237,0.45)]"
          : ""
      } ${className}`}
      {...rest}
    >
      <span
        className="pointer-events-none absolute -top-3 -left-1/2 h-8 w-[200%] opacity-90"
        style={{
          background: `radial-gradient(circle, ${resolvedColor}, transparent 22%)`,
          animation: `star-orbit-top ${speed} linear infinite alternate`,
        }}
      />
      <span
        className="pointer-events-none absolute -bottom-3 -right-1/2 h-8 w-[200%] opacity-90"
        style={{
          background: `radial-gradient(circle, ${resolvedSecondary}, transparent 22%)`,
          animation: `star-orbit-bottom ${speed} linear infinite alternate`,
        }}
      />
      <span
        className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-[10.5px] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
          isLight
            ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 group-hover:brightness-105"
            : "bg-[#120e2b]/95 group-hover:bg-[#19133c]"
        } ${innerClassName}`}
      >
        {children}
      </span>
    </Component>
  );
}
