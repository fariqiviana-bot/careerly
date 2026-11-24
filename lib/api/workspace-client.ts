export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  createdAt?: string;
}

export async function apiGetMe(): Promise<{ authenticated: boolean; user: AuthUser | null }> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return { authenticated: false, user: null };
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<{ authenticated: boolean; user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Login failed");
  return data;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<{ authenticated: boolean; user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Registration failed");
  return data;
}

export async function apiLoginDemo(): Promise<{ authenticated: boolean; user: AuthUser }> {
  const res = await fetch("/api/auth/demo", { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Demo login failed");
  return data;
}

export async function apiLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function apiListTracker(): Promise<any[]> {
  const res = await fetch("/api/tracker", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export async function apiCreateTracker(payload: Record<string, any>) {
  const res = await fetch("/api/tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to create tracker item");
  return data.item;
}

export async function apiUpdateTracker(id: string, patch: Record<string, any>) {
  const res = await fetch(`/api/tracker/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update tracker item");
  return data.item;
}

export async function apiDeleteTracker(id: string) {
  const res = await fetch(`/api/tracker/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error("Failed to delete tracker item");
}

export async function apiListInterviews(): Promise<any[]> {
  const res = await fetch("/api/interviews", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export async function apiCreateInterview(payload: Record<string, any>) {
  const res = await fetch("/api/interviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to create interview");
  return data.item;
}

export async function apiUpdateInterview(id: string, patch: Record<string, any>) {
  const res = await fetch(`/api/interviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update interview");
  return data.item;
}

export async function apiGetCvBySlug(slug: string) {
  const res = await fetch(`/api/cv/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.document || null;
}
export async function apiListDocuments(): Promise<any[]> {
  const res = await fetch("/api/documents", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.documents) ? data.documents : [];
}
