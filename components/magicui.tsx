"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* MagicCard — spotlight follows cursor (Magic UI / 21st.dev style) */
export function MagicCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div ref={ref} onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
      className={cn("group relative overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(230,181,161,.28), transparent 65%)` }} />
      {children}
    </div>
  );
}

/* NumberTicker — count-up on view */
export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const t0 = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - t0) / 900); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); io.disconnect();
    });
    io.observe(el); return () => io.disconnect();
  }, [value]);
  return <span ref={ref} className={cn("tabular-nums", className)}>{n}</span>;
}

export function BorderBeam() { return <span className="border-beam" aria-hidden />; }
export function AnimatedGradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("animated-gradient-text", className)}>{children}</span>;
}