import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function BorderBeam({
  duration = 7,
  className = "",
  colorFrom = "#8B5CF6",
  colorMid = "#EC4899",
  colorTo = "#38BDF8",
}) {
  const { isLight } = useTheme();
  const c1 = isLight && colorFrom === "#8B5CF6" ? "#7C3AED" : colorFrom;
  const c2 = isLight && colorMid === "#EC4899" ? "#DB2777" : colorMid;
  const c3 = isLight && colorTo === "#38BDF8" ? "#0284C7" : colorTo;

  return (
    <div
      className={`pointer-events-none absolute inset-0 rounded-[inherit] p-[1.3px] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className={`animate-border-beam absolute -inset-[100%] ${
          isLight ? "opacity-70" : "opacity-80"
        }`}
        style={{
          "--beam-duration": `${duration}s`,
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 220deg, ${c1} 265deg, ${c2} 305deg, ${c3} 340deg, transparent 360deg)`,
        }}
      />
    </div>
  );
}
