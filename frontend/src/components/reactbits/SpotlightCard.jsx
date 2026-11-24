import React, { useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(139, 92, 246, 0.24)",
  onClick,
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const { isLight } = useTheme();

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const resolvedSpotlight = isLight
    ? spotlightColor.replace(/0\.\d+\)/, "0.11)")
    : spotlightColor;

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
        isLight
          ? "border-slate-900/[0.09] bg-white/90 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] hover:border-violet-500/35 hover:shadow-[0_16px_38px_-14px_rgba(124,58,237,0.16)]"
          : "border-violet-500/20 bg-[#100d26]/80 hover:border-violet-400/45"
      } ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${resolvedSpotlight}, transparent 68%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
