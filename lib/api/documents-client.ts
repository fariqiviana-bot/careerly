export interface BackendVersion {
  id: string;
  documentId: string;
  label: string;
  trigger: string;
  seriesId: string;
  template: string;
  content: Record<string, any>;
  settings: Record<string, any>;
  visibility: Record<string, boolean>;
  sectionOrder: any[];
  savedAt: string;
}

export interface BackendMasterProfile {
  id: string;
  contact: Record<string, any>;
  summary: string;
  experience: any[];
  education: any[];
  skills: any[];
  technicalSkills: any[];
  certifications: any[];
  courses: any[];
  awards: any[];
  volunteering: any[];
  memberships: any[];
  languages: any[];
  projects: any[];
  publications: any[];
  references: any[];
  updatedAt: string;
}

export async function apiGetDocument(id: string) {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}?optional=1`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /api/documents/${id} failed (${res.status})`);
  const data = await res.json();
  return data.document;
}

export async function apiUpsertDocument(payload: Record<string, any>) {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /api/documents failed (${res.status})`);
  const data = await res.json();
  return data.document;
}

export async function apiPatchDocument(
  id: string,
  payload: Record<string, any>,
  opts?: { signal?: AbortSignal; keepalive?: boolean }
) {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}?upsert=1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
    keepalive: opts?.keepalive,
  });
  if (res.status === 409) {
    const conflictData = await res.json().catch(() => ({}));
    const err: any = new Error(conflictData.error || "Document modified in another tab");
    err.status = 409;
    err.code = "CONFLICT";
    err.serverDocument = conflictData.document;
    throw err;
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err: any = new Error(errData.error || `PATCH /api/documents/${id} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.document;
}

export async function apiListVersions(id: string): Promise<BackendVersion[]> {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}/versions`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.versions) ? data.versions : [];
}

export async function apiCreateVersion(
  id: string,
  label?: string,
  trigger: "manual" | "auto" | "pre-tailor" | "pre-import" | "pre-restore" = "manual"
): Promise<BackendVersion> {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, trigger }),
  });
  if (!res.ok) throw new Error(`POST versions failed (${res.status})`);
  const data = await res.json();
  return data.version;
}

export async function apiRestoreVersion(id: string, versionId: string) {
  const res = await fetch(
    `/api/documents/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/restore`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Restore version failed (${res.status})`);
  const data = await res.json();
  return data.document;
}

export async function apiGetMasterProfile(): Promise<BackendMasterProfile> {
  const res = await fetch("/api/master-profile", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch master profile");
  const data = await res.json();
  return data.profile;
}

export async function apiSaveMasterProfile(payload: Record<string, any>): Promise<BackendMasterProfile> {
  const res = await fetch("/api/master-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save master profile");
  const data = await res.json();
  return data.profile;
}

export async function apiSyncContactToAll(contact: Record<string, any>) {
  const res = await fetch("/api/master-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync-contact-to-all", contact }),
  });
  if (!res.ok) throw new Error("Failed to sync contact to all resumes");
  return res.json();
}