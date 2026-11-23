import type { AiRuntimeStatus } from "@/lib/server/ai-client";
import type { TailorProposal } from "@/app/api/ai/tailor/route";
import type { SummaryVariant } from "@/app/api/ai/summary/route";
import type { AiChatPatch } from "@/app/api/ai/chat/route";

export type { AiRuntimeStatus, TailorProposal, SummaryVariant, AiChatPatch };

export async function apiGetAiStatus(): Promise<AiRuntimeStatus> {
  const res = await fetch("/api/ai/status", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to check AI status");
  return res.json();
}

export async function apiGenerateBullets(payload: {
  role?: string;
  company?: string;
  existingBullet?: string;
  keyword?: string;
  tone?: "impact" | "concise" | "leadership";
  count?: number;
}): Promise<{ bullets: string[]; mode: string; provider: string; model: string }> {
  const res = await fetch("/api/ai/bullet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Bullet generation failed");
  return data;
}

export async function apiGenerateSummaries(payload: {
  content: Record<string, any>;
  targetRole?: string;
  highlightSkills?: string[];
}): Promise<{ variants: SummaryVariant[]; mode: string; provider: string; model: string }> {
  const res = await fetch("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Summary generation failed");
  return data;
}

export async function apiTailorResume(payload: {
  content: Record<string, any>;
  seriesId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription: string;
  level: "conservative" | "balanced" | "turbo";
}): Promise<{
  proposals: TailorProposal[];
  beforeMatch: number;
  estimatedAfterMatch: number;
  level: string;
  mode: string;
  provider: string;
  model: string;
}> {
  const res = await fetch("/api/ai/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Tailoring failed");
  return data;
}

export async function apiGenerateCoverLetter(payload: {
  content: Record<string, any>;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  tone?: "confident" | "warm" | "executive";
}): Promise<{ coverLetter: Record<string, any>; mode: string; provider: string; model: string }> {
  const res = await fetch("/api/ai/cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Cover letter generation failed");
  return data;
}

export async function apiTranslateResume(payload: {
  content: Record<string, any>;
  targetLanguage: string;
}): Promise<{ translated: Record<string, any> | null; mode: string; note?: string }> {
  const res = await fetch("/api/ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Translation failed");
  return data;
}

export async function apiAiChat(payload: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  content: Record<string, any>;
  seriesId?: string;
}): Promise<{ reply: string; patches: AiChatPatch[]; mode: string; provider: string; model: string }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "AI chat failed");
  return data;
}