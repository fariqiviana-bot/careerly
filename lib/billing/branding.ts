/**
 * FARNAVI - PLATFORM OVERLAY (third color namespace).
 * NEVER reads the UI palette (app/globals.css) and NEVER reads template tokens.
 * Grayscale only, so it sits safely on all 8 monochrome templates.
 *
 * DECISION 2026-11-17: visible text is the bare domain "farnavi.com".
 * No "Created with" prefix. Shorter, quieter, still a direct acquisition channel.
 *
 * RENDERING CONTRACT (implemented in C12):
 *  - wordmark + logo are drawn as SVG OUTLINED PATHS -> no extractable text
 *    -> zero ATS pollution, not searchable inside the PDF.
 *  - the whole mark is wrapped in an anchor to linkUrl. Chrome preserves the
 *    link annotation when printing to PDF, so it stays clickable while the
 *    text layer stays clean.
 *  - placed INSIDE the bottom margin. With the default 12.7mm margin of all
 *    8 templates the content is displaced by 0mm and no page is added.
 */
export type BrandingSpec = {
  wordmark: string;
  linkUrl: string;
  clickable: boolean;
  fontFamily: string;
  fontPt: number;
  colorHex: string;
  align: "left" | "center" | "right";
  baselineFromBottomMm: number;
  showLogo: boolean;
  logoHeightMm: number;
  gapMm: number;
  clearanceMm: number;
  renderAs: "svg-paths";
};

export const FREE_PDF_BRANDING: BrandingSpec = {
  wordmark: "farnavi.com",
  linkUrl: "https://farnavi.com",
  clickable: true,
  fontFamily: "Instrument Sans",
  fontPt: 6.5,
  colorHex: "#9A9A9A",
  align: "right",
  baselineFromBottomMm: 4,
  showLogo: true,
  logoHeightMm: 2.4,
  gapMm: 1.2,
  clearanceMm: 6,
  renderAs: "svg-paths"
};

/** Public share page /s/{id} carries this banner on free plans. */
export const SHARE_PAGE_BANNER_TEXT = "Built with Farnavi - create yours free";

/** PDF document metadata on every plan. */
export const PDF_PRODUCER = "Farnavi";

/** TXT is the clean ATS escape hatch: never branded, on any plan. */
export const TXT_IS_NEVER_BRANDED = true;

/**
 * How much the usable content height must shrink.
 * Returns 0 for every default template (12.7mm bottom margin >= 6mm clearance).
 * PageCanvas (C04) MUST consume this when computing the content box.
 */
export function contentBottomReserveMm(bottomMarginMm: number, spec: BrandingSpec | null): number {
  if (!spec) return 0;
  const need = spec.clearanceMm;
  return bottomMarginMm >= need ? 0 : Math.round((need - bottomMarginMm) * 100) / 100;
}

/** Vertical band the mark occupies, measured from the top edge of the page. */
export function brandingBandMm(pageHeightMm: number, spec: BrandingSpec): { from: number; to: number } {
  const to = pageHeightMm - spec.baselineFromBottomMm;
  return { from: Math.round((to - spec.logoHeightMm) * 100) / 100, to };
}