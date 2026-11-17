/**
 * FARNAVI EDITOR — LOCKED TEMPLATE DESIGN TOKENS
 * HARD RULE 0: template colors/fonts come ONLY from public/templates/{id}/design.json
 * (aggregated into lib/template-design.json by CHUNK 01).
 * If a required token is missing we FAIL. We never fall back to the UI palette.
 */
import raw from "@/lib/template-design.json";

export type SeriesDesign = {
  accent: string | null; deep: string | null; tint: string | null;
  ink: string; muted: string; rule: string; page: string;
  heading: string | null; body: string | null;
  margins: { top: number | null; right: number | null; bottom: number | null; left: number | null };
  pageSize: { w: number | null; h: number | null; unit: string };
  columns: number; photo: boolean;
  typeScale: { name: number | null; sectionTitle: number | null; body: number | null; minor: number | null };
  confidence: { colors: string; fonts: string; typeScale: string };
  needsReview: string[];
};

const MAP = raw as unknown as Record<string, SeriesDesign>;

export const SERIES_IDS = Object.keys(MAP).filter((k) => !k.startsWith("_"));

export type TokenResult =
  | { ok: true; id: string; design: SeriesDesign }
  | { ok: false; id: string; missing: string[] };

/** Fail-fast resolver used by every renderer. */
export function getSeriesDesign(id: string): TokenResult {
  const d = MAP[id];
  const missing: string[] = [];
  if (!d) return { ok: false, id, missing: ["series-not-found"] };
  if (!d.accent) missing.push("colors.accent");
  if (!d.heading) missing.push("fonts.heading");
  if (!d.body) missing.push("fonts.body");
  if (!d.ink) missing.push("colors.ink");
  if (missing.length) return { ok: false, id, missing };
  return { ok: true, id, design: d };
}

/** CSS custom properties for the document surface (never for app chrome). */
export function docCssVars(d: SeriesDesign): Record<string, string> {
  return {
    "--tpl-accent": d.accent ?? "",
    "--tpl-deep": d.deep ?? d.accent ?? "",
    "--tpl-tint": d.tint ?? "transparent",
    "--tpl-ink": d.ink,
    "--tpl-muted": d.muted,
    "--tpl-rule": d.rule,
    "--tpl-page": d.page,
    "--tpl-font-heading": '"' + (d.heading ?? "") + '", sans-serif',
    "--tpl-font-body": '"' + (d.body ?? "") + '", sans-serif'
  };
}

/* ---------- physical page geometry ---------- */
export const MM_PER_IN = 25.4;
export const PT_PER_IN = 72;
export const px = (mm: number): number => (mm * 96) / MM_PER_IN;
export const mmToPt = (mm: number): number => (mm * PT_PER_IN) / MM_PER_IN;

export const PAGES = {
  a4: { wmm: 210, hmm: 297, label: "A4" },
  letter: { wmm: 215.9, hmm: 279.4, label: "US Letter" }
} as const;

export type PageSizeKey = keyof typeof PAGES;