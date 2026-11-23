import type { ImportParseResult } from "@/lib/server/import-parser";

export type { ImportParseResult };

export async function apiParseResumeFile(file: File): Promise<ImportParseResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/import/parse", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Import failed (${res.status})`);
  }
  return data as ImportParseResult;
}

export async function apiParseResumeText(
  text: string,
  sourceType: "paste" | "linkedin" = "paste",
  linkedinUrl?: string
): Promise<ImportParseResult> {
  const res = await fetch("/api/import/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceType, linkedinUrl }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Import failed (${res.status})`);
  }
  return data as ImportParseResult;
}