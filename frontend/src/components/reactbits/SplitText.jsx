import React from "react";
import { motion } from "framer-motion";

export function SplitText({
  text = "",
  className = "",
  delay = 0.03,
  mode = "words",
}) {
  const items = mode === "chars" ? text.split("") : text.split(" ");

  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {items.map((item, idx) => (
        <motion.span
          key={`${item}-${idx}`}
          initial={{ opacity: 0, y: 24, rotateX: -35 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.55,
            delay: idx * delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
          style={{ marginRight: mode === "words" ? "0.28em" : 0 }}
        >
          {item === " " ? "\u00A0" : item}
        </motion.span>
      ))}
    </span>
  );
}
