import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

export function Orb({
  size = 180,
  active = false,
  className = "",
  hueShift = 0,
}) {
  const canvasRef = useRef(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let t = 0;
    let raf = 0;

    const draw = () => {
      t += active ? 0.048 : 0.018;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseR = size * 0.34;
      const pulse = Math.sin(t * 2.1) * (active ? size * 0.032 : size * 0.014);

      if (isLight) {
        // Iridescent Pearl-Violet Glass Orb for Light Mode
        const halo = ctx.createRadialGradient(
          cx,
          cy,
          baseR * 0.25,
          cx,
          cy,
          size * 0.5
        );
        halo.addColorStop(0, "rgba(124, 58, 237, 0.22)");
        halo.addColorStop(0.5, "rgba(219, 39, 119, 0.12)");
        halo.addColorStop(0.78, "rgba(2, 132, 199, 0.08)");
        halo.addColorStop(1, "rgba(247, 246, 252, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, size, size);

        // Pearl-glass outer shell sphere
        const sphereGrad = ctx.createRadialGradient(
          cx - baseR * 0.28,
          cy - baseR * 0.28,
          baseR * 0.08,
          cx,
          cy,
          baseR * 1.05
        );
        sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        sphereGrad.addColorStop(0.32, "rgba(237, 233, 254, 0.92)");
        sphereGrad.addColorStop(0.68, "rgba(196, 181, 253, 0.72)");
        sphereGrad.addColorStop(0.92, "rgba(124, 58, 237, 0.45)");
        sphereGrad.addColorStop(1, "rgba(219, 39, 119, 0.22)");

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.95 + pulse * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.shadowColor = "rgba(124, 58, 237, 0.28)";
        ctx.shadowBlur = size * 0.1;
        ctx.fill();
        ctx.strokeStyle = "rgba(124, 58, 237, 0.32)";
        ctx.lineWidth = Math.max(1.2, size * 0.01);
        ctx.stroke();
        ctx.restore();

        // Crisp jewel-toned orbiting energy filaments
        const lightRings = [
          {
            color: `hsla(${262 + hueShift}, 82%, 52%, 0.78)`,
            speed: 1.0,
            tilt: 0.45,
            amp: 5.0,
          },
          {
            color: `hsla(${330 + hueShift}, 80%, 50%, 0.72)`,
            speed: -1.3,
            tilt: -0.6,
            amp: 4.2,
          },
          {
            color: `hsla(${200 + hueShift}, 90%, 42%, 0.74)`,
            speed: 0.8,
            tilt: 1.05,
            amp: 4.8,
          },
        ];

        ctx.save();
        lightRings.forEach((ring, rIdx) => {
          ctx.beginPath();
          const steps = 90;
          for (let i = 0; i <= steps; i++) {
            const theta = (i / steps) * Math.PI * 2;
            const wobble =
              Math.sin(theta * 3 + t * ring.speed * 2 + rIdx) *
                (ring.amp * (size / 180) * (active ? 1.45 : 1)) +
              Math.cos(theta * 5 - t * ring.speed * 1.4) * (2.0 * (size / 180));
            const rad = baseR + pulse + wobble;
            const x =
              cx +
              Math.cos(theta + t * ring.speed * 0.4) *
                rad *
                (0.86 + Math.sin(t + rIdx) * 0.11);
            const y =
              cy +
              Math.sin(theta + t * ring.speed * 0.4) *
                rad *
                (0.86 + Math.cos(t * 0.8 + ring.tilt) * 0.11);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = Math.max(1.4, size * 0.015);
          ctx.shadowColor = ring.color;
          ctx.shadowBlur = size * 0.045;
          ctx.stroke();
        });

        // Iridescent inner prism core + glass highlight
        const prismCore = ctx.createRadialGradient(
          cx - baseR * 0.2,
          cy - baseR * 0.22,
          baseR * 0.05,
          cx,
          cy,
          baseR * 0.7
        );
        prismCore.addColorStop(0, "rgba(255, 255, 255, 0.96)");
        prismCore.addColorStop(0.38, "rgba(56, 189, 248, 0.35)");
        prismCore.addColorStop(0.75, "rgba(124, 58, 237, 0.25)");
        prismCore.addColorStop(1, "rgba(219, 39, 119, 0.04)");

        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.65 + pulse * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = prismCore;
        ctx.fill();

        // Subtle glass specular highlight arc
        ctx.beginPath();
        ctx.arc(
          cx - baseR * 0.26,
          cy - baseR * 0.26,
          baseR * 0.22,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.fill();
        ctx.restore();
      } else {
        // Dark Mode Cosmic Luminous Plasma Orb
        const halo = ctx.createRadialGradient(
          cx,
          cy,
          baseR * 0.15,
          cx,
          cy,
          size * 0.5
        );
        halo.addColorStop(0, "rgba(139, 92, 246, 0.55)");
        halo.addColorStop(0.45, "rgba(236, 72, 153, 0.25)");
        halo.addColorStop(0.75, "rgba(56, 189, 248, 0.12)");
        halo.addColorStop(1, "rgba(7, 6, 20, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, size, size);

        const rings = [
          {
            color: `hsla(${265 + hueShift}, 92%, 68%, 0.85)`,
            speed: 1.0,
            tilt: 0.45,
            amp: 5.5,
          },
          {
            color: `hsla(${328 + hueShift}, 88%, 64%, 0.82)`,
            speed: -1.35,
            tilt: -0.6,
            amp: 4.5,
          },
          {
            color: `hsla(${198 + hueShift}, 94%, 62%, 0.80)`,
            speed: 0.78,
            tilt: 1.05,
            amp: 5.0,
          },
        ];

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        rings.forEach((ring, rIdx) => {
          ctx.beginPath();
          const steps = 90;
          for (let i = 0; i <= steps; i++) {
            const theta = (i / steps) * Math.PI * 2;
            const wobble =
              Math.sin(theta * 3 + t * ring.speed * 2 + rIdx) *
                (ring.amp * (size / 180) * (active ? 1.5 : 1)) +
              Math.cos(theta * 5 - t * ring.speed * 1.4) * (2.2 * (size / 180));
            const rad = baseR + pulse + wobble;
            const x =
              cx +
              Math.cos(theta + t * ring.speed * 0.4) *
                rad *
                (0.86 + Math.sin(t + rIdx) * 0.12);
            const y =
              cy +
              Math.sin(theta + t * ring.speed * 0.4) *
                rad *
                (0.86 + Math.cos(t * 0.8 + ring.tilt) * 0.12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = Math.max(1.4, size * 0.015);
          ctx.shadowColor = ring.color;
          ctx.shadowBlur = size * 0.09;
          ctx.stroke();
        });

        const coreGrad = ctx.createRadialGradient(
          cx - baseR * 0.22,
          cy - baseR * 0.22,
          baseR * 0.05,
          cx,
          cy,
          baseR * 0.92
        );
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
        coreGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.65)");
        coreGrad.addColorStop(0.62, "rgba(139, 92, 246, 0.45)");
        coreGrad.addColorStop(1, "rgba(236, 72, 153, 0.05)");

        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.82 + pulse * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, active, hueShift, isLight]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
}
