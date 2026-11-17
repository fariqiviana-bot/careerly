"use client";
import React, { useEffect, useRef, useState } from "react";
import Series2 from "./series-2";
import { resolveTemplate, previewUrl } from "@/lib/editor/templates";
import type { PageSize } from "@/lib/editor/schema";

const MAP: Record<string, React.ComponentType<any>> = { "2": Series2 };
export const RENDERED = Object.keys(MAP);

const TOGGLES: [string, string][] = [
  ["summary", "Summary"], ["skills", "Skills"], ["technical", "Technical"],
  ["education", "Education"], ["certifications", "Certifications"], ["projects", "Projects"],
  ["phone", "Phone"], ["email", "Email"], ["link", "LinkedIn"], ["location", "Location"]
];

const RAIL = "sticky top-3 rounded-xl border border-border bg-card p-3";
const LABEL = "mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary";

export function ResumeRender({ doc, onPatch }: { doc: any; onPatch: (c: any) => void }) {
  const resolved = resolveTemplate(doc);
  const id = resolved?.series ?? "";
  const C = MAP[id];
  const size: PageSize = doc?.settings?.pageSize === "Letter" ? "letter" : "a4";
  const pageWmm = size === "letter" ? 215.9 : 210;

  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.5);
  const [zoom, setZoom] = useState(100);
  const [h, setH] = useState(0);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const vis = (doc?.visibility || {}) as Record<string, boolean>;
  const setVis = (k: string, v: boolean) => onPatch({ __visibility: { ...vis, [k]: v } });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const px = (pageWmm * 96) / 25.4;
    const measure = () => {
      const f = el.clientWidth / px;
      setFit(f);
      setH((inner.current?.offsetHeight || 0) * f * (zoomRef.current / 100));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (inner.current) ro.observe(inner.current);
    measure();
    return () => ro.disconnect();
  }, [pageWmm, id]);

  useEffect(() => {
    setH((inner.current?.offsetHeight || 0) * fit * (zoom / 100));
  }, [zoom, fit, doc]);

  const s = fit * (zoom / 100);
  const d = resolved?.design;

  const lockedInfo = (
    <div className={RAIL}>
      <div className={LABEL}>Template design</div>
      <div className="space-y-1.5 text-[11px] text-muted-foreground">
        <div>{resolved?.entry.name ?? "Unknown"} · {d?.columns ?? resolved?.entry.columns ?? 1}-column</div>
        <div>{d?.heading ?? "—"}{d?.body && d.body !== d.heading ? " + " + d.body : ""}</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ background: d?.accent ?? "transparent" }} />
          {d?.accent ?? "color pending verification"}
        </div>
        <div className="pt-1">Fonts and colors are fixed by this template.</div>
      </div>
    </div>
  );

  if (!C) {
    const src = previewUrl(id, "resume", 1, size);
    return (
      <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: "1fr 168px" }}>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Template preview ({size === "a4" ? "A4" : "US Letter"}, 1-page)</span>
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              Live editor arrives in Chunk 5–6
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            {src ? (
              <img src={src} alt={(resolved?.entry.name ?? "Template") + " preview"} className="block w-full" />
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">Preview image not found for this series.</div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            This is the real exported page of the template. Inline editing for this series is being built;
            series 2 is already editable.
          </p>
        </div>
        {lockedInfo}
      </div>
    );
  }

  return (
    <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: "1fr 168px" }}>
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Click any text on the page to edit</span>
          <span className="ml-auto">{Math.round(s * 100)}%</span>
        </div>
        <div ref={box} className="doc-scroll w-full overflow-hidden rounded-lg shadow-sm" style={{ height: h || undefined }}>
          <div ref={inner} style={{ width: pageWmm + "mm", transformOrigin: "top left", transform: "scale(" + s + ")" }}>
            <C doc={doc} onPatch={onPatch} vis={vis} />
          </div>
        </div>
      </div>
      <div className={RAIL}>
        <div className={LABEL}>Page</div>
        <label className="mb-1 block text-[11px]">Zoom {zoom}%</label>
        <input type="range" min={50} max={160} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-primary" />
        <button onClick={() => setZoom(100)} className="mt-1.5 w-full rounded-full border border-border bg-white py-1 text-[11px]">Fit width</button>
        <div className="my-3 h-px bg-border" />
        <div className={LABEL}>Sections</div>
        {TOGGLES.map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-1.5 py-0.5 text-[11px]">
            <input type="checkbox" checked={vis[k] !== false} onChange={(e) => setVis(k, e.target.checked)} className="accent-primary" />
            {label}
          </label>
        ))}
        <div className="my-3 h-px bg-border" />
        <div className="text-[10px] leading-relaxed text-muted-foreground">Fonts and colors are fixed by this template.</div>
      </div>
    </div>
  );
}