import type { ResumeAnalysisReport } from "@/lib/server/resume-analyzer";

export type { ResumeAnalysisReport };

export async function apiAnalyzeResume(payload: {
  content: Record<string, any>;
  seriesId?: string;
  settings?: Record<string, any>;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
}): Promise<ResumeAnalysisReport> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Analyze failed (${res.status})`);
  }
  return data as ResumeAnalysisReport;
}