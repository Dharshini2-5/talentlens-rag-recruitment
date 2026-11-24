import React, { useEffect, useRef } from "react";

export function ClickSpark({
  children,
  sparkColor = "#EC4899",
  sparkCount = 10,
  sparkRadius = 26,
  duration = 460,
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const palette = [sparkColor, "#8B5CF6", "#38BDF8"];

    const onClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.25,
          startTime: now,
          color: palette[i % palette.length],
        });
      }
    };

    window.addEventListener("click", onClick);

    const draw = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((s) => {
        const elapsed = now - s.startTime;
        if (elapsed >= duration) return false;
        const p = elapsed / duration;
        const eased = 1 - Math.pow(1 - p, 3);
        const dist = eased * sparkRadius;
        const len = (1 - eased) * 10;
        const x1 = s.x + Math.cos(s.angle) * dist;
        const y1 = s.y + Math.sin(s.angle) * dist;
        const x2 = s.x + Math.cos(s.angle) * (dist + len);
        const y2 = s.y + Math.sin(s.angle) * (dist + len);

        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
    };
  }, [sparkColor, sparkCount, sparkRadius, duration]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9999]"
        aria-hidden="true"
      />
      {children}
    </>
  );
}
