import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

export function Particles({
  className = "",
  particleCount = 64,
  connectionDistance = 135,
  mouseRepelRadius = 150,
}) {
  const canvasRef = useRef(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId = 0;

    const palette = isLight
      ? [
          { r: 124, g: 58, b: 237 }, // Rich Violet
          { r: 219, g: 39, b: 119 }, // Editorial Fuchsia
          { r: 2, g: 132, b: 199 }, // Studio Sky
        ]
      : [
          { r: 139, g: 92, b: 246 }, // Electric Violet
          { r: 236, g: 72, b: 153 }, // Neon Fuchsia
          { r: 56, g: 189, b: 248 }, // Cyber Sky
        ];

    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const particles = Array.from({ length: particleCount }, (_, i) => {
      const color = palette[i % palette.length];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        radius: isLight ? Math.random() * 1.8 + 1.2 : Math.random() * 1.9 + 1.1,
        color,
        alpha: isLight
          ? Math.random() * 0.36 + 0.38
          : Math.random() * 0.55 + 0.35,
      };
    });

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouseRepelRadius && dist > 1) {
          const force = (mouseRepelRadius - dist) / mouseRepelRadius;
          p.vx += (dx / dist) * force * 0.22;
          p.vy += (dy / dist) * force * 0.22;
        }

        // Gentle velocity damping
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (Math.abs(p.vx) < 0.08) p.vx += (Math.random() - 0.5) * 0.04;
        if (Math.abs(p.vy) < 0.08) p.vy += (Math.random() - 0.5) * 0.04;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Neural constellation links
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const lx = p.x - q.x;
          const ly = p.y - q.y;
          const ldist = Math.hypot(lx, ly);
          if (ldist < connectionDistance) {
            const lineAlpha =
              (1 - ldist / connectionDistance) * (isLight ? 0.22 : 0.24);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${lineAlpha})`;
            ctx.lineWidth = isLight ? 0.9 : 0.85;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Link to cursor
        if (dist < mouseRepelRadius + 30) {
          const mAlpha =
            (1 - dist / (mouseRepelRadius + 30)) * (isLight ? 0.34 : 0.38);
          ctx.beginPath();
          ctx.strokeStyle = isLight
            ? `rgba(124, 58, 237, ${mAlpha})`
            : `rgba(236, 72, 153, ${mAlpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Crisp node dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        if (!isLight) {
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.85)`;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.22)`;
          ctx.shadowBlur = 4;
        }
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [particleCount, connectionDistance, mouseRepelRadius, isLight]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
