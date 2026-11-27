import type { ExportDocKind } from "@/lib/server/docx-injector";

export interface ClientExportLayoutOptions {
  visibility?: Record<string, boolean>;
  sectionOrder?: any[];
  customLabels?: Record<string, string>;
}

function sanitizeFileBase(raw: string, fallback = "Farnavi"): string {
  return (
    String(raw || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || fallback
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export async function apiDownloadInjectedDocx(
  payload: {
    seriesId: string;
    kind: ExportDocKind;
    pageSize: "A4" | "Letter";
    pageCount: 1 | 2 | 3;
    fileName: string;
    mode?: "visual" | "ats";
    accent?: string;
    font?: string;
    content: Record<string, any>;
  } & ClientExportLayoutOptions
) {
  const res = await fetch("/api/export/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error || `DOCX export failed (${res.status})`);
  }
  const blob = await res.blob();
  const safe = sanitizeFileBase(payload.fileName);
  const atsTag = payload.mode === "ats" ? "_ATS" : "";
  triggerBlobDownload(blob, `${safe}_${payload.kind}_${payload.pageSize}${atsTag}.docx`);
}

export async function apiDownloadZipBundle(
  payload: {
    seriesId: string;
    pageSize: "A4" | "Letter";
    pageCount: 1 | 2 | 3;
    fileName: string;
    content: Record<string, any>;
  } & ClientExportLayoutOptions
) {
  const res = await fetch("/api/export/bundle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error || `ZIP export failed (${res.status})`);
  }
  const blob = await res.blob();
  const safe = sanitizeFileBase(payload.fileName);
  triggerBlobDownload(blob, `${safe}_Complete_Package.zip`);
}

export async function apiDownloadTxt(
  payload: {
    fileName: string;
    content: Record<string, any>;
  } & ClientExportLayoutOptions
) {
  const res = await fetch("/api/export/txt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`TXT export failed (${res.status})`);
  const blob = await res.blob();
  const safe = sanitizeFileBase(payload.fileName);
  triggerBlobDownload(blob, `${safe}_ATS.txt`);
}
export interface ShareLinkRecord {
  id: string;
  token: string;
  documentId: string;
  active: boolean;
  showContact: boolean;
  viewCount: number;
  createdAt: string;
}

export async function apiGetShareLink(docId: string): Promise<ShareLinkRecord | null> {
  const res = await fetch(`/api/documents/${encodeURIComponent(docId)}/share`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.share || null;
}

export async function apiUpsertShareLink(
  docId: string,
  opts: { active?: boolean; showContact?: boolean } = {}
): Promise<ShareLinkRecord> {
  const res = await fetch(`/api/documents/${encodeURIComponent(docId)}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Could not update share link");
  return data.share;
}