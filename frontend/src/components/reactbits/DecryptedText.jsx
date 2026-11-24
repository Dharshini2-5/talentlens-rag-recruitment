import React, { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+";

export function DecryptedText({
  text = "",
  speed = 28,
  className = "",
  revealOnHover = false,
}) {
  const [display, setDisplay] = useState(text);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = text.length;
    const interval = setInterval(() => {
      frame += 1;
      const next = text
        .split("")
        .map((ch, idx) => {
          if (ch === " ") return " ";
          if (idx < frame) return text[idx];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(next);
      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, trigger]);

  return (
    <span
      onMouseEnter={() => revealOnHover && setTrigger((v) => v + 1)}
      className={`font-mono ${className}`}
    >
      {display}
    </span>
  );
}
