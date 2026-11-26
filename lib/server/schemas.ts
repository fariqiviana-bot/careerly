import { z } from "zod";

export const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "login", "logout", "register", "signup",
  "editor", "dashboard", "documents", "templates", "print", "cv",
  "share", "s", "settings", "account", "tracker", "interviews",
  "pricing", "about", "help", "support", "master-profile",
]);

export const MAX_DOCUMENT_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB raw JSON cap

export function isSafeImageRef(val: unknown): boolean {
  if (val === undefined || val === null || val === "") return true;
  if (typeof val !== "string") return false;
  const v = val.trim();
  if (!v) return true;
  if (v.length > 3_500_000) return false;
  if (/^(javascript|vbscript):/i.test(v)) return false;
  if (/^data:/i.test(v)) {
    return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(v);
  }
  return true;
}

export const SafeSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,118}[a-zA-Z0-9]?$/, "Slug may only contain letters, numbers, hyphens, and underscores")
  .refine((v) => !RESERVED_SLUGS.has(v.toLowerCase()), "This URL slug is reserved and cannot be used");
export const SERIES_ID_ENUM = z.enum(["2", "3", "4", "11", "12", "14", "22", "24"]);

export const HeaderFooterSchema = z
  .object({
    headerText: z.string().max(200).optional().default(""),
    footerText: z.string().max(200).optional().default(""),
    pageNumbering: z
      .enum(["none", "1-2-3", "1/3", "page-1"])
      .optional()
      .default("none"),
  })
  .passthrough();

export const ExperienceItemSchema = z
  .object({
    id: z.string().min(1),
    role: z.string().max(300).optional().default(""),
    title: z.string().optional(),
    company: z.string().optional().default(""),
    location: z.string().optional().default(""),
    period: z.string().optional().default(""),
    startMonth: z.string().optional(),
    startYear: z.string().optional(),
    endMonth: z.string().optional(),
    endYear: z.string().optional(),
    current: z.boolean().optional(),
    positionType: z
      .enum([
        "full-time",
        "part-time",
        "internship",
        "contract",
        "freelance",
        "teaching",
        "board",
        "",
      ])
      .optional(),
    showOverview: z.boolean().optional(),
    overview: z.string().optional(),
    summaryParagraph: z.string().optional(),
    hidden: z.boolean().optional(),
    bullets: z.array(z.string()).optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const EducationItemSchema = z
  .object({
    id: z.string().min(1),
    degree: z.string().optional().default(""),
    field: z.string().optional().default(""),
    school: z.string().optional().default(""),
    location: z.string().optional().default(""),
    period: z.string().optional().default(""),
    date: z.string().optional(),
    gpa: z.string().optional(),
    dateLabel: z.string().optional(),
    current: z.boolean().optional(),
    hidden: z.boolean().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const CustomSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    kind: z.enum(["simple", "advanced"]).default("simple"),
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().optional().default(""),
            subtitle: z.string().optional().default(""),
            date: z.string().optional().default(""),
            location: z.string().optional().default(""),
            description: z.string().optional().default(""),
            bullets: z.array(z.string()).optional(),
            hidden: z.boolean().optional(),
          })
          .passthrough()
      )
      .default([]),
  })
  .passthrough();

export const DocumentContentSchema = z
  .object({
    name: z.string().max(300).optional().default(""),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    titleBefore: z.string().optional(),
    titleAfter: z.string().optional(),
    pronouns: z.string().optional(),
    role: z.string().optional().default(""),
    email: z.string().max(300).optional().default(""),
    phone: z.string().max(120).optional().default(""),
    location: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
    website: z.string().optional().default(""),
    photoUrl: z.string().refine(isSafeImageRef, "Invalid or unsafe image format (SVG is not allowed)").optional(),
    photo: z.string().refine(isSafeImageRef, "Invalid or unsafe image format (SVG is not allowed)").optional(),
    nationality: z.string().optional(),
    dob: z.string().optional(),
    drivingLicense: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    summary: z.string().max(20000).optional().default(""),
    powerStatement: z.string().optional(),
    accomplishments: z.string().optional(),
    experience: z.array(ExperienceItemSchema).max(60, "Maximum 60 experience entries allowed").optional().default([]),
    education: z.array(EducationItemSchema).max(30, "Maximum 30 education entries allowed").optional().default([]),
    skills: z.array(z.string().max(200)).max(150, "Maximum 150 skills allowed").optional().default([]),
    areasOfExpertise: z.array(z.string()).optional(),
    technicalSkills: z.array(z.string()).optional(),
    skillCategories: z.array(z.any()).optional(),
    certifications: z.array(z.any()).optional(),
    courses: z.array(z.any()).optional(),
    awards: z.array(z.any()).optional(),
    volunteering: z.array(z.any()).optional(),
    memberships: z.array(z.any()).optional(),
    languages: z.array(z.any()).optional(),
    projects: z.array(z.any()).optional(),
    publications: z.array(z.any()).optional(),
    interests: z.array(z.string()).optional(),
    references: z.array(z.any()).optional(),
    customSections: z.array(CustomSectionSchema).optional(),
    coverLetter: z.record(z.any()).refine((cl) => !cl || isSafeImageRef(cl.signatureImage), "Invalid or unsafe signature image format").optional(),
    letter: z.record(z.any()).optional(),
    sectionOrder: z.array(z.string()).optional(),
    extras: z.array(z.string()).optional(),
    extraDetails: z.record(z.string()).optional(),
  })
  .passthrough();

export const CreateDocumentSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  type: z.enum(["resume", "cover", "resignation", "website", "tailored"]).optional().default("resume"),
  slug: SafeSlugSchema.nullable().optional(),
  expectedUpdatedAt: z.string().nullable().optional(),
  title: z.string().min(1).max(180).optional().default("Untitled Resume"),
  seriesId: z.string().min(1).max(20).optional().default("11"),
  activeTab: z.enum(["resume", "cover", "references"]).optional().default("resume"),
  language: z.string().max(60).optional().default("English"),
  accent: z.string().max(40).optional().default("#202124"),
  font: z.string().max(80).optional().default("Merriweather"),
  score: z.number().int().min(0).max(100).optional().default(0),
  pinned: z.boolean().optional().default(false),
  label: z.string().max(80).nullable().optional(),
  targetJobTitle: z.string().max(180).nullable().optional(),
  targetCompany: z.string().max(180).nullable().optional(),
  targetJd: z.string().max(30000).nullable().optional(),
  content: DocumentContentSchema.optional().default({}),
  settings: z.record(z.any()).optional().default({}),
  visibility: z.record(z.boolean()).optional().default({}),
  sectionOrder: z.array(z.any()).optional().default([]),
  customLabels: z.record(z.string()).optional().default({}),
  headerFooter: HeaderFooterSchema.optional().default({
    headerText: "",
    footerText: "",
    pageNumbering: "none",
  }),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

export const CreateVersionSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  trigger: z
    .enum(["manual", "auto", "pre-tailor", "pre-import", "pre-restore"])
    .optional()
    .default("manual"),
});

export const UpdateMasterProfileSchema = z.object({
  contact: z.record(z.any()).optional(),
  summary: z.string().optional(),
  experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  skills: z.array(z.any()).optional(),
  technicalSkills: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  courses: z.array(z.any()).optional(),
  awards: z.array(z.any()).optional(),
  volunteering: z.array(z.any()).optional(),
  memberships: z.array(z.any()).optional(),
  languages: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  publications: z.array(z.any()).optional(),
  references: z.array(z.any()).optional(),
});