/**
 * FARNAVI - FEATURE REGISTRY (single source of truth for every lock).
 * Rule: every locked control must name its feature and its reason.
 * Pattern: Kickresume transparency ("This resume uses 3 premium features: ...").
 * Anti-pattern avoided: Enhancv green-ON toggle with a red error underneath.
 */
export type PlanId = "free" | "trial" | "pro";

export type FeatureId =
  | "premiumTemplate" | "designColors" | "designFonts" | "photo"
  | "exportPdf" | "exportTxt" | "exportDocx" | "removeBranding"
  | "aiWriting" | "atsDeep" | "jdTargeting" | "versionHistory" | "translate";

export type FeatureDef = {
  id: FeatureId;
  label: string;
  /** "free" = always available; "pro" = Pro or active trial */
  minPlan: "free" | "pro";
  /** shown verbatim next to the locked control */
  reason: string;
};

export const FEATURES: Record<FeatureId, FeatureDef> = {
  exportPdf:       { id: "exportPdf",       label: "PDF export",        minPlan: "free", reason: "Free PDFs include a small Farnavi mark in the bottom margin." },
  exportTxt:       { id: "exportTxt",       label: "Plain text export", minPlan: "free", reason: "Always free and never branded - the ATS-safe path." },
  premiumTemplate: { id: "premiumTemplate", label: "Design templates",  minPlan: "pro",  reason: "The 5 design templates are Pro. The 3 ATS templates stay free." },
  designColors:    { id: "designColors",    label: "Accent colors",     minPlan: "pro",  reason: "Free uses the template's own color. Pro lets you set your own." },
  designFonts:     { id: "designFonts",     label: "Font pairs",        minPlan: "pro",  reason: "Free uses the template's font pair. Pro unlocks all pairs." },
  photo:           { id: "photo",           label: "Profile photo",     minPlan: "pro",  reason: "Photo upload is Pro, on templates that support a photo slot." },
  exportDocx:      { id: "exportDocx",      label: "Word export",       minPlan: "pro",  reason: "Editable Word export is Pro." },
  removeBranding:  { id: "removeBranding",  label: "Remove branding",   minPlan: "pro",  reason: "Pro removes the Farnavi mark from your PDF and share page." },
  aiWriting:       { id: "aiWriting",       label: "AI writing",        minPlan: "pro",  reason: "AI writing uses your Pro word quota." },
  atsDeep:         { id: "atsDeep",         label: "Full ATS report",   minPlan: "pro",  reason: "Free shows the overall score. Pro shows all 5 categories." },
  jdTargeting:     { id: "jdTargeting",     label: "Job targeting",     minPlan: "pro",  reason: "Matching against a job description is Pro." },
  versionHistory:  { id: "versionHistory",  label: "Version history",   minPlan: "pro",  reason: "Restoring older versions is Pro." },
  translate:       { id: "translate",       label: "Translate",         minPlan: "pro",  reason: "Resume translation is Pro." }
};

export const PRO_FEATURE_IDS: FeatureId[] =
  (Object.keys(FEATURES) as FeatureId[]).filter((k) => FEATURES[k].minPlan === "pro");