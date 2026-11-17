/**
 * FARNAVI EDITOR — CANONICAL SCHEMA (v3)
 * Single source of truth for the Create/Edit resume flow.
 * Pure module: no React, no store imports (safe to import anywhere).
 * Locked template design lives in ./design-tokens, NEVER here.
 */
export const SCHEMA_VERSION = 3;

export type PageSize = "a4" | "letter";
export type DocKind = "resume" | "cover" | "references";
export type SeriesId = "2" | "3" | "4" | "11" | "12" | "14" | "22" | "24";

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export type Ym = { y: number | null; m: number | null };
export const emptyYm = (): Ym => ({ y: null, m: null });

export type LinkItem = { id: string; label: string; url: string; show: boolean };

export type Contact = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: LinkItem[];
  photo: { src: string; zoom: number; offsetX: number; offsetY: number } | null;
  dob: string;
  nationality: string;
  drivingLicense: string;
  maritalStatus: string;
};

export type Bullet = { id: string; text: string; on: boolean };
export const newBullet = (text = ""): Bullet => ({ id: uid(), text, on: true });

export type ExperienceItem = {
  id: string; role: string; company: string; location: string;
  start: Ym; end: Ym; current: boolean; bullets: Bullet[]; on: boolean;
};
export type EducationItem = {
  id: string; degree: string; field: string; school: string; location: string;
  start: Ym; end: Ym; current: boolean; gpa: string; bullets: Bullet[]; on: boolean;
};
export type SkillItem = { id: string; label: string; level: number | null };
export type SkillGroup = { id: string; name: string; items: SkillItem[] };
export type GenericItem = {
  id: string; title: string; subtitle: string; date: string; url: string;
  bullets: Bullet[]; on: boolean;
};

export type SectionId =
  | "summary" | "experience" | "education" | "skills" | "projects"
  | "certifications" | "awards" | "publications" | "languages" | "volunteering"
  | "courses" | "interests" | "references" | "conferences" | "affiliations" | "custom";

export type SectionState = {
  id: SectionId; key: string; title: string; on: boolean; order: number;
  items: GenericItem[];
};

export type ResumeContent = {
  contact: Contact;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  sections: SectionState[];
  letter: { to: string; company: string; subject: string; body: string };
};

/** User-adjustable design. Template colors/fonts are NOT here (locked). */
export type DocDesign = {
  pageSize: PageSize;
  margins: { top: number; right: number; bottom: number; left: number }; // inches
  bodySize: number;        // pt
  lineHeight: number;      // percent 120..200
  listLineHeight: number;  // percent 120..200
  spacing: { sections: number; titleToContent: number; headings: number; blocks: number; items: number }; // pt
  dateFormat: "MM/YYYY" | "YYYY" | "MMM YYYY" | "MMMM YYYY";
  headerAlign: "left" | "center" | "right";
  dateAlign: "inline" | "right";
  locationAlign: "inline" | "right";
  skillsLayout: "inline" | "columns" | "categories";
  experienceEmphasis: "company" | "role";
  educationEmphasis: "school" | "degree";
  showLocations: "company" | "role" | "hidden";
  tenureMode: "company" | "role" | "both";
  sectionTitleCase: "as-written" | "upper" | "title";
  nameCase: "as-written" | "upper" | "title";
  bulletSymbol: "dot" | "dash" | "endash" | "square" | "none";
  divider: "none" | "thin" | "thick";
  showPhoto: boolean;
  showContactIcons: boolean;
  hideSkillLevels: boolean;
  show: { title: boolean; phone: boolean; email: boolean; location: boolean; links: boolean; dob: boolean; nationality: boolean };
  pageTarget: 1 | 2 | 3 | "auto";
  autoFit: boolean;
};

export const defaultDesign = (pageSize: PageSize = "a4"): DocDesign => ({
  pageSize,
  margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  bodySize: 10, lineHeight: 140, listLineHeight: 135,
  spacing: { sections: 14, titleToContent: 6, headings: 2, blocks: 6, items: 3 },
  dateFormat: "MMM YYYY",
  headerAlign: "left", dateAlign: "right", locationAlign: "inline",
  skillsLayout: "inline",
  experienceEmphasis: "role", educationEmphasis: "degree",
  showLocations: "role", tenureMode: "role",
  sectionTitleCase: "upper", nameCase: "as-written",
  bulletSymbol: "dot", divider: "thin",
  showPhoto: false, showContactIcons: false, hideSkillLevels: true,
  show: { title: true, phone: true, email: true, location: true, links: true, dob: false, nationality: false },
  pageTarget: "auto", autoFit: false
});

export const emptyContact = (): Contact => ({
  fullName: "", headline: "", email: "", phone: "", location: "",
  links: [], photo: null, dob: "", nationality: "", drivingLicense: "", maritalStatus: ""
});

export const emptyContent = (): ResumeContent => ({
  contact: emptyContact(), summary: "", experience: [], education: [],
  skills: [{ id: uid(), name: "Skills", items: [] }], sections: [],
  letter: { to: "", company: "", subject: "", body: "" }
});

export type ResumeDoc = {
  schema: number;
  id: string;
  kind: DocKind;
  series: SeriesId;
  title: string;
  content: ResumeContent;
  design: DocDesign;
  targetJob: { title: string; company: string; description: string } | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ---------- date helpers ---------- */
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export function formatYm(v: Ym, fmt: DocDesign["dateFormat"]): string {
  if (v.y === null) return "";
  if (fmt === "YYYY") return String(v.y);
  if (v.m === null) return String(v.y);
  const i = Math.min(11, Math.max(0, v.m - 1));
  if (fmt === "MM/YYYY") return String(v.m).padStart(2, "0") + "/" + v.y;
  if (fmt === "MMM YYYY") return MONTHS_SHORT[i] + " " + v.y;
  return MONTHS_LONG[i] + " " + v.y;
}
export function formatRange(a: Ym, b: Ym, current: boolean, fmt: DocDesign["dateFormat"]): string {
  const left = formatYm(a, fmt);
  const right = current ? "Present" : formatYm(b, fmt);
  if (!left && !right) return "";
  if (!right) return left;
  if (!left) return right;
  return left + " — " + right;
}

/** Best-effort parse of legacy free-text periods like "Jan 2023 — Present". */
export function parseLegacyPeriod(period: string): { start: Ym; end: Ym; current: boolean } {
  const out = { start: emptyYm(), end: emptyYm(), current: /present|current|now/i.test(period || "") };
  const parts = (period || "").split(/—|–|-|to/i).map((s) => s.trim());
  const one = (s: string): Ym => {
    if (!s) return emptyYm();
    const y = s.match(/(19|20)\d{2}/);
    const mName = s.match(/[A-Za-z]{3,}/);
    let m: number | null = null;
    if (mName) {
      const k = MONTHS_SHORT.findIndex((x) => mName[0].toLowerCase().startsWith(x.toLowerCase()));
      if (k >= 0) m = k + 1;
    }
    const mNum = s.match(/\b(0?[1-9]|1[0-2])\s*\//);
    if (m === null && mNum) m = Number(mNum[1]);
    return { y: y ? Number(y[0]) : null, m };
  };
  out.start = one(parts[0] || "");
  out.end = one(parts[1] || "");
  return out;
}

/** Migration bridge from the legacy lib/store `Content` shape. */
export function migrateLegacyContent(legacy: Record<string, unknown>): ResumeContent {
  const c = emptyContent();
  const s = (k: string): string => (typeof legacy[k] === "string" ? (legacy[k] as string) : "");
  c.contact.fullName = s("name");
  c.contact.headline = s("role");
  c.contact.email = s("email");
  c.contact.phone = s("phone");
  c.contact.location = s("location");
  c.contact.nationality = s("nationality");
  c.contact.dob = s("dob");
  c.contact.drivingLicense = s("drivingLicense");
  if (s("linkedin")) c.contact.links.push({ id: uid(), label: "LinkedIn", url: s("linkedin"), show: true });
  if (s("website")) c.contact.links.push({ id: uid(), label: "Website", url: s("website"), show: true });
  c.summary = s("summary");

  const exp = Array.isArray(legacy.experience) ? (legacy.experience as Record<string, unknown>[]) : [];
  c.experience = exp.map((e) => {
    const p = parseLegacyPeriod(typeof e.period === "string" ? e.period : "");
    const desc = typeof e.description === "string" ? e.description : "";
    return {
      id: uid(),
      role: typeof e.role === "string" ? e.role : "",
      company: typeof e.company === "string" ? e.company : "",
      location: typeof e.location === "string" ? e.location : "",
      start: p.start, end: p.end, current: p.current,
      bullets: desc.split("\n").map((t) => t.trim()).filter(Boolean).map((t) => newBullet(t)),
      on: true
    };
  });

  const edu = Array.isArray(legacy.education) ? (legacy.education as Record<string, unknown>[]) : [];
  c.education = edu.map((e) => {
    const p = parseLegacyPeriod(typeof e.period === "string" ? e.period : "");
    return {
      id: uid(),
      degree: typeof e.degree === "string" ? e.degree : "",
      field: typeof e.field === "string" ? e.field : "",
      school: typeof e.school === "string" ? e.school : "",
      location: typeof e.location === "string" ? e.location : "",
      start: p.start, end: p.end, current: p.current, gpa: "", bullets: [], on: true
    };
  });

  const skills = Array.isArray(legacy.skills) ? (legacy.skills as string[]) : [];
  c.skills = [{ id: uid(), name: "Skills", items: skills.map((label) => ({ id: uid(), label, level: null })) }];

  const extras = Array.isArray(legacy.extras) ? (legacy.extras as string[]) : [];
  const details = (legacy.extraDetails as Record<string, string>) || {};
  c.sections = extras.map((name, i) => ({
    id: "custom" as SectionId,
    key: "legacy-" + i,
    title: name,
    on: true,
    order: i,
    items: (details[name] || "").split("\n").map((t) => t.trim()).filter(Boolean)
      .map((t) => ({ id: uid(), title: t, subtitle: "", date: "", url: "", bullets: [], on: true }))
  }));

  const letter = (legacy.letter as Record<string, string>) || {};
  c.letter = { to: letter.to || "", company: letter.company || "", subject: letter.subject || "", body: letter.body || "" };
  return c;
}