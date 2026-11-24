import React, { useRef, useState } from "react";

export function TiltedCard({
  children,
  className = "",
  maxTilt = 9,
}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const onMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * maxTilt * 2;
    const rotX = -(py - 0.5) * maxTilt * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.015,1.015,1.015)`,
    });
    setGlare({ x: px * 100, y: py * 100, opacity: 0.24 });
  };

  const onMouseLeave = () => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        ...style,
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformStyle: "preserve-3d",
      }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.45), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}
