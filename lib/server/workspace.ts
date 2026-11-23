import { prisma } from "./prisma";
import type { Document as PrismaDoc, DocumentVersion, MasterProfile } from "@prisma/client";

const DEFAULT_USER_ID = "local-workspace-user";
const DEFAULT_USER_EMAIL = "workspace@farnavi.local";

export async function getWorkspaceUser() {
  return prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
      name: "Farnavi Studio User",
      plan: "Pro",
    },
  });
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function serializeDocument(
  doc: PrismaDoc & { versions?: DocumentVersion[] }
) {
  return {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    seriesId: doc.seriesId,
    series: doc.seriesId,
    template: doc.seriesId,
    activeTab: doc.activeTab,
    language: doc.language,
    accent: doc.accent,
    font: doc.font,
    score: doc.score,
    pinned: doc.pinned,
    label: doc.label ?? undefined,
    tailoredJobTitle: doc.targetJobTitle ?? undefined,
    tailoredCompany: doc.targetCompany ?? undefined,
    tailoredJd: doc.targetJd ?? undefined,
    content: safeJsonParse<Record<string, any>>(doc.contentJson, {}),
    settings: safeJsonParse<Record<string, any>>(doc.settingsJson, {}),
    visibility: safeJsonParse<Record<string, boolean>>(doc.visibilityJson, {}),
    sectionOrder: safeJsonParse<any[]>(doc.sectionOrderJson, []),
    customLabels: safeJsonParse<Record<string, string>>(doc.customLabelsJson, {}),
    headerFooter: safeJsonParse<Record<string, any>>(doc.headerFooterJson, {
      headerText: "",
      footerText: "",
      pageNumbering: "none",
    }),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    versions: doc.versions
      ? doc.versions.map(serializeVersion)
      : undefined,
  };
}

export function serializeVersion(v: DocumentVersion) {
  return {
    id: v.id,
    documentId: v.documentId,
    label: v.label,
    trigger: v.trigger,
    seriesId: v.seriesId,
    template: v.seriesId,
    content: safeJsonParse<Record<string, any>>(v.contentJson, {}),
    settings: safeJsonParse<Record<string, any>>(v.settingsJson, {}),
    visibility: safeJsonParse<Record<string, boolean>>(v.visibilityJson, {}),
    sectionOrder: safeJsonParse<any[]>(v.sectionOrderJson, []),
    savedAt: v.createdAt.toISOString(),
    createdAt: v.createdAt.toISOString(),
  };
}

export function serializeMasterProfile(mp: MasterProfile) {
  return {
    id: mp.id,
    contact: safeJsonParse<Record<string, any>>(mp.contactJson, {}),
    summary: mp.summary,
    experience: safeJsonParse<any[]>(mp.experienceJson, []),
    education: safeJsonParse<any[]>(mp.educationJson, []),
    skills: safeJsonParse<any[]>(mp.skillsJson, []),
    technicalSkills: safeJsonParse<any[]>(mp.technicalSkillsJson, []),
    certifications: safeJsonParse<any[]>(mp.certificationsJson, []),
    courses: safeJsonParse<any[]>(mp.coursesJson, []),
    awards: safeJsonParse<any[]>(mp.awardsJson, []),
    volunteering: safeJsonParse<any[]>(mp.volunteeringJson, []),
    memberships: safeJsonParse<any[]>(mp.membershipsJson, []),
    languages: safeJsonParse<any[]>(mp.languagesJson, []),
    projects: safeJsonParse<any[]>(mp.projectsJson, []),
    publications: safeJsonParse<any[]>(mp.publicationsJson, []),
    references: safeJsonParse<any[]>(mp.referencesJson, []),
    updatedAt: mp.updatedAt.toISOString(),
  };
}