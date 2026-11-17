/**
 * FARNAVI EDITOR — SECTION REGISTRY
 * Drives: content tabs, add-section catalog, reorder, rename, ATS safety.
 * Pattern refs: Teal Sections Tab (rename + drag), Rezi section tabs, Enhancv section catalog.
 */
import type { SectionId } from "./schema";

export type SectionKind = "summary" | "experience" | "education" | "skills" | "generic";

export type SectionDef = {
  id: SectionId;
  kind: SectionKind;
  labelEn: string;
  labelFa: string;
  /** false = may break ATS parsers (tables/graphics heavy or non-standard) */
  atsSafe: boolean;
  defaultOn: boolean;
  renameable: boolean;
  movable: boolean;
  repeatable: boolean;
  hintEn: string;
};

export const SECTION_DEFS: SectionDef[] = [
  { id: "summary",        kind: "summary",    labelEn: "Professional Summary", labelFa: "خلاصه حرفه‌ای", atsSafe: true,  defaultOn: true,  renameable: true,  movable: true,  repeatable: false, hintEn: "400–600 characters. Lead with role + years + one quantified win." },
  { id: "experience",     kind: "experience", labelEn: "Work Experience",      labelFa: "سوابق شغلی",    atsSafe: true,  defaultOn: true,  renameable: true,  movable: true,  repeatable: true,  hintEn: "3–5 recent roles. Bullets = action + scope + measurable result." },
  { id: "education",      kind: "education",  labelEn: "Education",            labelFa: "تحصیلات",       atsSafe: true,  defaultOn: true,  renameable: true,  movable: true,  repeatable: true,  hintEn: "Degree, field, institution, dates. Move above experience if you are a student." },
  { id: "skills",         kind: "skills",     labelEn: "Skills",               labelFa: "مهارت‌ها",      atsSafe: true,  defaultOn: true,  renameable: true,  movable: true,  repeatable: true,  hintEn: "6–10 relevant skills. Group them if the template has a sidebar." },
  { id: "projects",       kind: "generic",    labelEn: "Projects",             labelFa: "پروژه‌ها",      atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Name, your role, stack, outcome." },
  { id: "certifications", kind: "generic",    labelEn: "Certifications",       labelFa: "گواهی‌نامه‌ها", atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Name, issuer, year, credential ID/URL." },
  { id: "awards",         kind: "generic",    labelEn: "Awards",               labelFa: "جوایز",         atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Award, grantor, year, one line of context." },
  { id: "publications",   kind: "generic",    labelEn: "Publications",         labelFa: "انتشارات",      atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Authors, title, venue, year, DOI." },
  { id: "languages",      kind: "generic",    labelEn: "Languages",            labelFa: "زبان‌ها",       atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Language + CEFR level (B2, C1…)." },
  { id: "volunteering",   kind: "generic",    labelEn: "Volunteering",         labelFa: "داوطلبی",       atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Organisation, role, dates, impact." },
  { id: "courses",        kind: "generic",    labelEn: "Training / Courses",   labelFa: "دوره‌ها",       atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Course, provider, year." },
  { id: "conferences",    kind: "generic",    labelEn: "Conferences",          labelFa: "کنفرانس‌ها",    atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Event, role (speaker/attendee), year." },
  { id: "affiliations",   kind: "generic",    labelEn: "Affiliations",         labelFa: "عضویت‌ها",      atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Professional bodies and membership type." },
  { id: "interests",      kind: "generic",    labelEn: "Interests",            labelFa: "علایق",         atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Only if it adds signal for the role." },
  { id: "references",     kind: "generic",    labelEn: "References",           labelFa: "معرف‌ها",       atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Name, title, company, contact — or 'Available on request'." },
  { id: "custom",         kind: "generic",    labelEn: "Custom section",       labelFa: "بخش سفارشی",    atsSafe: true,  defaultOn: false, renameable: true,  movable: true,  repeatable: true,  hintEn: "Any title you want. Keep the structure simple for ATS." }
];

export const sectionDef = (id: SectionId): SectionDef =>
  SECTION_DEFS.find((d) => d.id === id) ?? SECTION_DEFS[SECTION_DEFS.length - 1];

/** Header/contact is fixed at top; summary is movable but never deletable. */
export const DEFAULT_ORDER: SectionId[] = ["summary", "experience", "education", "skills"];

export const isMovable = (id: SectionId): boolean => sectionDef(id).movable;