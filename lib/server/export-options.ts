export type VisibilityMap = Record<string, boolean>;
export type CustomLabelsMap = Record<string, string>;
export type SectionOrderEntry =
  | string
  | {
      id?: string;
      key?: string;
      hidden?: boolean;
      visible?: boolean;
      label?: string;
    };

export interface ExportLayoutOptions {
  visibility?: VisibilityMap;
  sectionOrder?: SectionOrderEntry[];
  customLabels?: CustomLabelsMap;
}

export const DEFAULT_RESUME_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "languages",
] as const;

const KEY_ALIASES: Record<string, string> = {
  summary: "summary",
  profile: "summary",
  objective: "summary",
  experience: "experience",
  work: "experience",
  employment: "experience",
  education: "education",
  skills: "skills",
  expertise: "skills",
  competencies: "skills",
  technicalskills: "skills",
  certifications: "certifications",
  certificates: "certifications",
  licenses: "certifications",
  projects: "projects",
  languages: "languages",
  references: "references",
  courses: "courses",
  awards: "awards",
  volunteering: "volunteering",
  memberships: "memberships",
  interests: "interests",
  publications: "publications",
};

export function canonicalSectionKey(raw: string): string {
  const norm = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return KEY_ALIASES[norm] || String(raw || "").trim().toLowerCase();
}

export function isSectionVisible(
  key: string,
  visibility?: VisibilityMap,
  sectionOrder?: SectionOrderEntry[]
): boolean {
  const canon = canonicalSectionKey(key);
  if (visibility && typeof visibility === "object") {
    for (const [k, v] of Object.entries(visibility)) {
      if (canonicalSectionKey(k) === canon && v === false) {
        return false;
      }
    }
  }
  if (Array.isArray(sectionOrder)) {
    for (const entry of sectionOrder) {
      if (entry && typeof entry === "object") {
        const entryKey = canonicalSectionKey(String(entry.id || entry.key || ""));
        if (entryKey === canon && (entry.hidden === true || entry.visible === false)) {
          return false;
        }
      }
    }
  }
  return true;
}

export function resolveSectionOrder(sectionOrder?: SectionOrderEntry[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(sectionOrder)) {
    for (const entry of sectionOrder) {
      const raw = typeof entry === "string" ? entry : String(entry?.id || entry?.key || "");
      const canon = canonicalSectionKey(raw);
      if (canon && !seen.has(canon) && (DEFAULT_RESUME_SECTIONS as readonly string[]).includes(canon)) {
        seen.add(canon);
        ordered.push(canon);
      }
    }
  }

  for (const def of DEFAULT_RESUME_SECTIONS) {
    if (!seen.has(def)) {
      seen.add(def);
      ordered.push(def);
    }
  }

  return ordered;
}

export function resolveSectionLabel(
  key: string,
  defaultLabel: string,
  customLabels?: CustomLabelsMap,
  sectionOrder?: SectionOrderEntry[]
): string {
  const canon = canonicalSectionKey(key);
  if (customLabels && typeof customLabels === "object") {
    for (const [k, v] of Object.entries(customLabels)) {
      if (canonicalSectionKey(k) === canon && typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
  }
  if (Array.isArray(sectionOrder)) {
    for (const entry of sectionOrder) {
      if (entry && typeof entry === "object") {
        const entryKey = canonicalSectionKey(String(entry.id || entry.key || ""));
        if (entryKey === canon && typeof entry.label === "string" && entry.label.trim()) {
          return entry.label.trim();
        }
      }
    }
  }
  return defaultLabel;
}

export function applyVisibilityToContent(
  content: Record<string, any>,
  visibility?: VisibilityMap,
  sectionOrder?: SectionOrderEntry[]
): Record<string, any> {
  const next: Record<string, any> = { ...(content || {}) };

  if (!isSectionVisible("summary", visibility, sectionOrder)) {
    next.summary = "";
    next.powerStatement = "";
  }
  if (!isSectionVisible("experience", visibility, sectionOrder)) {
    next.experience = [];
  }
  if (!isSectionVisible("education", visibility, sectionOrder)) {
    next.education = [];
  }
  if (!isSectionVisible("skills", visibility, sectionOrder)) {
    next.skills = [];
    next.technicalSkills = [];
    next.areasOfExpertise = [];
    next.professionalSkills = [];
    next.skillCategories = [];
  }
  if (!isSectionVisible("certifications", visibility, sectionOrder)) {
    next.certifications = [];
  }
  if (!isSectionVisible("projects", visibility, sectionOrder)) {
    next.projects = [];
  }
  if (!isSectionVisible("languages", visibility, sectionOrder)) {
    next.languages = [];
  }
  if (!isSectionVisible("references", visibility, sectionOrder)) {
    next.references = [];
  }
  if (!isSectionVisible("courses", visibility, sectionOrder)) {
    next.courses = [];
  }
  if (!isSectionVisible("awards", visibility, sectionOrder)) {
    next.awards = [];
  }
  if (!isSectionVisible("volunteering", visibility, sectionOrder)) {
    next.volunteering = [];
  }
  if (!isSectionVisible("memberships", visibility, sectionOrder)) {
    next.memberships = [];
  }
  if (!isSectionVisible("interests", visibility, sectionOrder)) {
    next.interests = [];
  }
  if (!isSectionVisible("publications", visibility, sectionOrder)) {
    next.publications = [];
  }

  return next;
}

export function buildSafeContentDisposition(rawBaseName: string, suffix: string): string {
  const cleaned = String(rawBaseName || "")
    .replace(/[\r\n"\\\/:*?<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const asciiBase =
    cleaned
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "Farnavi_Document";
  const utf8Base = (cleaned.replace(/\s+/g, "_") || asciiBase).slice(0, 100);
  const asciiFilename = `${asciiBase}${suffix}`;
  const encodedUtf8 = encodeURIComponent(`${utf8Base}${suffix}`);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedUtf8}`;
}
