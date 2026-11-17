"use client";
import React, { useEffect, useRef, useState } from "react";
import Series2 from "./series-2";
const MAP: Record<string, React.ComponentType<any>> = { "2": Series2 };
export const RENDERED = Object.keys(MAP);
const TOGGLES: [string, string][] = [["summary", "Summary"], ["skills", "Skills"], ["technical", "Technical"], ["education", "Education"], ["certifications", "Certifications"], ["projects", "Projects"], ["phone", "Phone"], ["email", "Email"], ["link", "LinkedIn"], ["location", "Location"]];
export function ResumeRender({ doc, onPatch }: { doc: any; onPatch: (c: any) => void }) {
  const id = String(doc.series || doc.template || "");
  const C = MAP[id];
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.5);
  const [zoom, setZoom] = useState(100);
  const [h, setH] = useState(0);
  const vis = (doc.visibility || {}) as Record<string, boolean>;
  const setVis = (k: string, v: boolean) => onPatch({ __visibility: { ...vis, [k]: v } });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const px = 210 * 96 / 25.4;
    const upd = () => { setFit(el.clientWidth / px); setH((inner.current?.offsetHeight || 0) * fit * (zoom / 100)); };
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    upd();
    return () => ro.disconnect();
  }, [fit, zoom]);
  const s = fit * (zoom / 100);
  if (!C) {
    return <div style={{ background: "#f6ecdd", color: "#7c5a2e", border: "1px solid #e6d5b8", borderRadius: 10, padding: 12, fontSize: 12 }}>Live editor for this template is not built yet. Open Executive to edit on the page.</div>;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 168px", gap: 14, alignItems: "start" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 11, color: "#6d776d" }}>
          <span>Click any text on the page to edit</span>
          <span style={{ marginLeft: "auto" }}>{Math.round(s * 100)}%</span>
        </div>
        <div ref={box} className="doc-scroll" style={{ width: "100%", height: h || undefined, overflow: "hidden", borderRadius: 8, boxShadow: "0 6px 24px rgba(43,47,42,0.13)" }}>
          <div ref={inner} style={{ width: "210mm", transformOrigin: "top left", transform: "scale(" + s + ")" }}>
            <C doc={doc} onPatch={onPatch} vis={vis} />
          </div>
        </div>
      </div>
      <div style={{ position: "sticky", top: 12, border: "1px solid #e4e2d8", borderRadius: 12, background: "#fbfaf6", padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5d6f61", marginBottom: 8 }}>Page</div>
        <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Zoom {zoom}%</label>
        <input type="range" min={50} max={160} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%", accentColor: "#5d6f61" }} />
        <button onClick={() => setZoom(100)} style={{ marginTop: 6, width: "100%", fontSize: 11, padding: "5px 0", borderRadius: 999, border: "1px solid #e4e2d8", background: "#fff", cursor: "pointer" }}>Fit width</button>
        <div style={{ height: 1, background: "#e4e2d8", margin: "12px 0" }} />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5d6f61", marginBottom: 8 }}>Sections</div>
        {TOGGLES.map(([k, label]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, padding: "3px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={vis[k] !== false} onChange={(e) => setVis(k, e.target.checked)} style={{ accentColor: "#5d6f61" }} />
            {label}
          </label>))}
        <div style={{ height: 1, background: "#e4e2d8", margin: "12px 0" }} />
        <div style={{ fontSize: 10, color: "#6d776d", lineHeight: 1.5 }}>Fonts and colors are fixed by this template.</div>
      </div>
    </div>
  );
}
