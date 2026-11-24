import React, { useEffect, useState } from "react";

export function CountUp({
  to = 0,
  from = 0,
  duration = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const target = Number(to) || 0;

    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration]);

  return (
    <span className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
