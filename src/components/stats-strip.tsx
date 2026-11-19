"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  label: string;
  suffix?: string;
}

export function StatsStrip({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>(stats.map(() => 0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const duration = 900;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setCounts(stats.map((s) => Math.round(s.value * eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, stats]);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
    >
      {stats.map((s, i) => (
        <div key={s.label} className="bg-card px-4 py-5 text-center">
          <p className="font-mono text-2xl font-semibold text-primary">
            {counts[i]}
            {s.suffix}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
