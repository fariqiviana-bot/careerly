import type { SmartFitResult } from "@/lib/server/smart-fit";

export type { SmartFitResult };

export async function apiSmartAutoFit(payload: {
  content: Record<string, any>;
  seriesId?: string;
  pageSize?: "A4" | "Letter";
  targetPages?: 1 | 2 | 3;
}): Promise<SmartFitResult> {
  const res = await fetch("/api/editor/auto-fit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Smart Auto-Fit failed");
  return data as SmartFitResult;
}