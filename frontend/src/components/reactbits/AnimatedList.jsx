import React from "react";
import { motion } from "framer-motion";

export function AnimatedList({
  items = [],
  renderItem,
  keyExtractor,
  className = "",
  staggerDelay = 0.055,
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map((item, idx) => (
        <motion.div
          key={keyExtractor ? keyExtractor(item, idx) : idx}
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.36,
            delay: idx * staggerDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{ scale: 1.01, x: 3 }}
        >
          {renderItem(item, idx)}
        </motion.div>
      ))}
    </div>
  );
}
