"use client";
import React, { useEffect, useRef, useState } from "react";
export function Ed({ v, on, style, ph, multi }: { v: string; on: (s: string) => void; style?: React.CSSProperties; ph?: string; multi?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [f, setF] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el && !f && el.innerText !== (v || "")) el.innerText = v || "";
  }, [v, f]);
  return (
    <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" tabIndex={0}
      data-ph={ph || ""} className={"ed" + (multi ? " ed-multi" : "")}
      onFocus={() => setF(true)}
      onBlur={(e) => { setF(false); on((e.currentTarget.innerText || "").replace(/\n+$/, "")); }}
      onKeyDown={(e) => { if (!multi && e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLDivElement).blur(); } }}
      style={{ ...style, outline: "none", cursor: "text", borderRadius: 2, boxShadow: f ? "0 0 0 1.5px var(--ed-ring)" : undefined, background: f ? "var(--ed-fill)" : undefined }} />
  );
}
export function AddRow({ label, on, tone }: { label: string; on: () => void; tone: string }) {
  return (
    <button type="button" onClick={on} className="ed-add"
      style={{ borderColor: tone, color: tone, fontSize: "7pt", padding: "1mm 2mm", marginTop: "1.4mm", width: "100%", textAlign: "left", borderRadius: 2, borderStyle: "dashed", borderWidth: "0.3mm", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
      + {label}
    </button>
  );
}
export function Del({ on, tone }: { on: () => void; tone: string }) {
  return (
    <button type="button" onClick={on} className="ed-del" title="Remove"
      style={{ color: tone, background: "transparent", border: "none", cursor: "pointer", fontSize: "8pt", lineHeight: 1, padding: "0 1mm", fontFamily: "inherit" }}>×</button>
  );
}
