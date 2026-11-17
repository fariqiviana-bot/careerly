/**
 * FARNAVI - ENTITLEMENTS (provider-agnostic).
 * No Stripe / Paddle import here. A payment provider only has to produce
 * { plan, proUntil }. Swap providers later without touching any UI.
 *
 * Trial model: 7 days, NO card, started BY THE USER at the first Pro wall.
 * On expiry -> downgrade to free. Editing is NEVER locked.
 * (Enhancv's trial-end edit lock is the #1 anti-pattern we refuse to copy.)
 */
import { FEATURES, PRO_FEATURE_IDS } from "./features";
import type { FeatureId, PlanId } from "./features";
import { FREE_PDF_BRANDING } from "./branding";
import type { BrandingSpec } from "./branding";

export const TRIAL_DAYS = 7;
export const AI_WORDS: Record<PlanId, number> = { free: 0, trial: 2000, pro: 20000 };

export type Account = {
  plan: PlanId;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  proUntil: string | null;
  aiWordsUsed: number;
};

export const freeAccount = (): Account => ({
  plan: "free", trialStartedAt: null, trialEndsAt: null, proUntil: null, aiWordsUsed: 0
});

const ts = (v: string | null): number => (v ? Date.parse(v) : NaN);

/** Server clock is authoritative. `now` is injected so this stays pure/testable. */
export function effectivePlan(a: Account, now: number): PlanId {
  if (a.plan === "pro") {
    const end = ts(a.proUntil);
    return Number.isNaN(end) || end > now ? "pro" : "free";
  }
  if (a.plan === "trial") {
    const end = ts(a.trialEndsAt);
    return !Number.isNaN(end) && end > now ? "trial" : "free";
  }
  return "free";
}

export function startTrial(a: Account, now: number): Account {
  if (a.trialStartedAt) return a; // one trial per account, ever
  const end = now + TRIAL_DAYS * 86400000;
  return { ...a, plan: "trial", trialStartedAt: new Date(now).toISOString(), trialEndsAt: new Date(end).toISOString() };
}

export function trialDaysLeft(a: Account, now: number): number {
  const end = ts(a.trialEndsAt);
  if (Number.isNaN(end) || end <= now) return 0;
  return Math.ceil((end - now) / 86400000);
}

/** Show the amber banner at T-3 and T-1 (Enhancv's early, explicit warning). */
export function trialBanner(a: Account, now: number): { show: boolean; daysLeft: number } {
  const d = trialDaysLeft(a, now);
  return { show: effectivePlan(a, now) === "trial" && d <= 3, daysLeft: d };
}

export type Entitlements = {
  plan: PlanId;
  can: Record<FeatureId, boolean>;
  aiWordsQuota: number;
  aiWordsLeft: number;
  pdfBranding: BrandingSpec | null;
  sharePageBranded: boolean;
  lockedFeatures: FeatureId[];
  reasonFor: (id: FeatureId) => string;
};

export function resolveEntitlements(a: Account, now: number): Entitlements {
  const plan = effectivePlan(a, now);
  const isPro = plan === "pro" || plan === "trial";
  const can = {} as Record<FeatureId, boolean>;
  for (const id of Object.keys(FEATURES) as FeatureId[]) {
    can[id] = FEATURES[id].minPlan === "free" ? true : isPro;
  }
  const quota = AI_WORDS[plan];
  return {
    plan,
    can,
    aiWordsQuota: quota,
    aiWordsLeft: Math.max(0, quota - a.aiWordsUsed),
    pdfBranding: can.removeBranding ? null : FREE_PDF_BRANDING,
    sharePageBranded: !can.removeBranding,
    lockedFeatures: PRO_FEATURE_IDS.filter((id) => !can[id]),
    reasonFor: (id) => FEATURES[id].reason
  };
}