"use client";

import { apiGetMe, apiLogout, apiListDocuments, apiListTracker, apiCreateTracker, apiUpdateTracker, apiDeleteTracker, apiListInterviews, apiCreateInterview } from "@/lib/api/workspace-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { TrackStatus } from "./catalog";
import { SERIES_CATALOG, SeriesTemplate } from "./templates-dna";

export { SERIES_CATALOG };
export type { SeriesTemplate };

export const uid = () => Math.random().toString(36).slice(2, 9);

// ============================================================================
// LEGACY PLATFORM TYPES & HELPERS (Dashboard, Jobs, Tracker, Interviews, AI)
// ============================================================================
export type DocType = "resume" | "cover" | "resignation" | "website" | "tailored";
export type CertItem = { id: string; name: string; issuer: string; date: string; licenseNumber?: string; code?: string };
export type Exp = {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  current?: boolean;
  showOverview?: boolean;
  overview?: string;
  hidden?: boolean;
  bullets?: string[];
  description?: string;
};
export type Edu = {
  id: string;
  degree: string;
  field?: string;
  school: string;
  location?: string;
  period: string;
  current?: boolean;
  description?: string;
};

export type Content = {
  name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  emblemType?: string;
  technicalSkills?: string[];
  sectionOrder?: string[];
  role: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  website?: string;
  nationality?: string;
  dob?: string;
  drivingLicense?: string;
  summary: string;
  accomplishments?: string;
  powerStatement?: string;
  experience: Exp[];
  education: Edu[];
  skills: string[];
  skillCategories?: { id: string; name: string; items: string[] }[];
  extras: string[];
  extraDetails?: Record<string, string>;
  certifications?: CertItem[];
  courses?: CourseItem[];
  awards?: AwardItem[];
  volunteering?: VolunteerItem[];
  memberships?: MembershipItem[];
  interests?: string[];
  references?: ReferenceItem[];
  letter: { to: string; company: string; subject: string; body: string };
};

export type DocLayoutSettings = {
  pageSize: "A4" | "Letter";
  pageCount: 1 | 2 | 3;
  layoutMode: "two-col" | "ats";
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  pageMargin: number;
  dateFormat: "January YYYY" | "Jan YYYY" | "MM/YYYY" | "YYYY";
  sectionCase: "Aa" | "AA";
  headerAlign: "left" | "center" | "right";
  hideSkillLevels: boolean;
  showTitle: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showLocation: boolean;
  showLink: boolean;
  uppercaseName: boolean;
  dateAlign?: "left" | "right";
};

export type Doc = {
  id: string;
  type: DocType;
  title: string;
  template: string;
  series?: string;
  variant?: "design" | "ats";
  visibility?: Record<string, boolean>;
  accent: string;
  font: string;
  secondaryFont?: string;
  score: number;
  pinned: boolean;
  label?: string;
  targetJobId?: string;
  published?: boolean;
  slug?: string;
  webTemplate?: "sidebar" | "editorial" | "minimal";
  settings?: DocLayoutSettings;
  createdAt: string;
  updatedAt: string;
  versions?: { id: string; label: string; timestamp?: string; savedAt: string; template: string; content: Content; settings?: DocLayoutSettings }[];
  tailoredJobTitle?: string;
  tailoredCompany?: string;
  tailoredJd?: string;
  language?: string;
  activeTab?: "resume" | "cover" | "references";
  sectionOrder?: SectionLayoutItem[];
  content: Content;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  mode: "Remote" | "Hybrid" | "On-site";
  salary: string;
  tags: string[];
  posted: string;
  risk: "Low" | "Moderate";
  applicants: number;
  rating: number;
  reviews: number;
  summary: string;
};

export type TrackItem = {
  id: string;
  title: string;
  company: string;
  url: string;
  status: TrackStatus;
  location?: string;
  salary: string;
  notes: string;
  date: string;
  resumeId?: string;
  coverId?: string;
};

export type Interview = {
  id: string;
  title: string;
  company: string;
  seniority: string;
  mode: string;
  createdAt: string;
};

export const defaultSettings = (twoCol = true): DocLayoutSettings => ({
  pageSize: "A4",
  pageCount: 1,
  layoutMode: twoCol ? "two-col" : "ats",
  fontSize: 10,
  lineHeight: 1.35,
  sectionSpacing: 14,
  pageMargin: 0.45,
  dateFormat: "Jan YYYY",
  sectionCase: "AA",
  headerAlign: "left",
  hideSkillLevels: true,
  showTitle: true,
  showPhone: true,
  showEmail: true,
  showLocation: true,
  showLink: true,
  uppercaseName: true,
});

export function calculateDocScore(content: Content): {
  score: number;
  nextStep: { key: string; label: string; boost: string; section: string };
  breakdown: { design: number; structure: number; content: number };
  strengths: { id: string; section: string; message: string }[];
  issues: { id: string; severity: "error" | "warning" | "info"; label: string; message: string; section: string; fixLabel?: string }[];
} {
  let score = 15;
  let nextStep = { key: "experience", label: "Add employment history", boost: "+25%", section: "experience" };

  const hasTarget = Boolean(content.role && content.role.trim().length > 2);
  const hasSummary = Boolean(content.summary && content.summary.trim().length >= 120);
  const hasExp = Array.isArray(content.experience) && content.experience.length > 0 && Boolean(content.experience[0]?.description?.trim());
  const hasMoreExp = Array.isArray(content.experience) && content.experience.length >= 2;
  const hasEdu = Array.isArray(content.education) && content.education.length > 0;
  const hasSkills = Array.isArray(content.skills) && content.skills.length >= 5;
  const hasExtras = Array.isArray(content.extras) && content.extras.length >= 1;

  if (hasTarget) score += 10;
  if (hasExp) score += 15;
  if (hasMoreExp) score += 10;
  if (hasEdu) score += 15;
  if (hasSummary) score += 15;
  if (hasSkills) score += 10;
  if (hasExtras) score += 10;

  if (!hasExp || !hasMoreExp) {
    nextStep = { key: "experience", label: "Add employment history", boost: "+25%", section: "experience" };
  } else if (!hasSummary) {
    nextStep = { key: "summary", label: "Expand professional summary (400+ chars)", boost: "+15%", section: "summary" };
  } else if (!hasEdu) {
    nextStep = { key: "education", label: "Add education background", boost: "+15%", section: "education" };
  } else if (!hasSkills) {
    nextStep = { key: "skills", label: "Add at least 5 core skills", boost: "+10%", section: "skills" };
  } else if (!hasTarget) {
    nextStep = { key: "target", label: "Set your target job title", boost: "+10%", section: "personal" };
  } else {
    nextStep = { key: "tailor", label: "Tailor resume to a job listing", boost: "+10%", section: "review" };
  }

  const finalScore = Math.min(100, Math.max(15, score));
  return {
    score: finalScore,
    nextStep,
    breakdown: {
      design: 92,
      structure: 95,
      content: Math.min(98, Math.max(35, finalScore - 8)),
    },
    strengths: [
      { id: "str-exp", section: "experience", message: hasExp ? "Strong experience structure" : "Clean template layout" },
      { id: "str-skl", section: "skills", message: hasSkills ? "Relevant skills listed" : "ATS-ready formatting" },
    ],
    issues: !hasSummary ? [{ id: "iss-sum", severity: "warning", label: "Expand professional summary", message: "Expand professional summary to 120+ characters for stronger ATS impact.", section: "summary", fixLabel: "Fix"}] : [],
  };
}

export const baseContent = (): Content => ({
  name: "Viana Fariqi",
  role: "Product Designer",
  email: "fariqiviana@gmail.com",
  phone: "+98 912 000 0000",
  location: "Tehran, Iran",
  linkedin: "linkedin.com/in/viana-fariqi",
  website: "farnavi.com",
  summary: "Product designer with 4+ years shaping B2B SaaS. Shipped design systems used by 30+ engineers; lifted activation by 18%.",
  experience: [
    { id: uid(), role: "Product Designer", company: "Rangin Agency", location: "Tehran", period: "Jan 2023 \u2013 Present", current: true, description: "Led redesign of onboarding; +18% activation. Built a 120-component design system." },
  ],
  education: [
    { id: uid(), degree: "BSc, Cellular & Molecular Biology", school: "University of Tehran", location: "Tehran", period: "Sep 2024 \u2013 Present", current: true },
  ],
  skills: ["Figma", "Design Systems", "Prototyping", "User Research", "HTML/CSS", "Interaction Design"],
  extras: ["Projects", "Languages"],
  extraDetails: {
    Projects: "Farnavi Career OS \u2013 Designed and built a full-stack career & resume platform.\nDesign System Kit \u2013 Created a 120-component token-driven UI library.",
    Languages: "Persian (Native) \u00b7 English (Professional proficiency)",
  },
  letter: {
    to: "Hiring Manager",
    company: "Telgorithm",
    subject: "Application for Marketing Manager",
    body: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Marketing Manager position at Telgorithm. With over 4 years of experience shaping B2B SaaS products, building scalable design systems, and driving user activation up by 18%, I am confident in my ability to contribute immediately to your growth initiatives.\n\nThank you for your time and consideration.\n\nSincerely,\nViana Fariqi",
  },
});

export const seriesColor = (id?: string) => {
  const found = SERIES_CATALOG.find((s) => s.id === id);
  return found?.accentColor;
};
export const seriesFont = (id?: string) => {
  const found = SERIES_CATALOG.find((s) => s.id === id);
  return found?.headingFont;
};

const SEED_JOBS: Job[] = [
  { id: "j1", title: "Remote Product Designer", company: "Pellera", location: "United States", mode: "Remote", salary: "$90k \u2013 $120k", tags: ["Figma", "B2B", "SaaS"], posted: "2d ago", risk: "Low", applicants: 214, rating: 4.1, reviews: 128, summary: "Own end-to-end design for a B2B analytics suite. Strong systems thinking and Figma proficiency required." },
  { id: "j2", title: "Senior Product Designer", company: "Nova Labs", location: "Tehran, Iran", mode: "Hybrid", salary: "$10k \u2013 $20k / yr", tags: ["Design Systems", "Mobile"], posted: "Today", risk: "Moderate", applicants: 1050, rating: 2.8, reviews: 5, summary: "Lead designer for a fintech super-app. Mentor 3 designers; drive research ops." },
  { id: "j3", title: "Marketing Manager", company: "Telgorithm", location: "US Remote", mode: "Remote", salary: "$58 \u2013 $63 / hr", tags: ["B2B Marketing", "SaaS", "Automation"], posted: "4d ago", risk: "Low", applicants: 96, rating: 4.4, reviews: 61, summary: "Own demand gen for a messaging API platform. Event marketing + lifecycle." },
  { id: "j4", title: "Frontend Developer", company: "CM.com", location: "Amsterdam", mode: "On-site", salary: "\u20ac55k \u2013 \u20ac70k", tags: ["React", "TypeScript"], posted: "1d ago", risk: "Low", applicants: 180, rating: 3.9, reviews: 84, summary: "Build conversational commerce UI in React + TS." },
  { id: "j5", title: "UX Writer", company: "Euler", location: "Berlin", mode: "Remote", salary: "\u20ac45k \u2013 \u20ac58k", tags: ["Content", "UX"], posted: "3d ago", risk: "Moderate", applicants: 410, rating: 3.5, reviews: 22, summary: "Craft flows for a data platform; partner with design + PM." },
  { id: "j6", title: "Data Analyst", company: "Cardinal Health", location: "Dublin", mode: "Hybrid", salary: "\u20ac48k \u2013 \u20ac60k", tags: ["SQL", "Python"], posted: "5d ago", risk: "Low", applicants: 320, rating: 3.7, reviews: 210, summary: "Analytics for supply-chain ops; SQL + dashboards." },
];

const SEED_TRACK: TrackItem[] = [
  { id: "t1", title: "Remote Product Designer", company: "Pellera", url: "https://example.com/j1", status: "recommended", location: "Remote", salary: "$90k\u2013120k", notes: "", date: "Today" },
  { id: "t2", title: "UX Writer", company: "Euler", url: "https://example.com/j5", status: "recommended", location: "Berlin", salary: "\u20ac45k\u201358k", notes: "", date: "Today" },
  { id: "t3", title: "Data Analyst", company: "Cardinal Health", url: "https://example.com/j6", status: "shortlist", location: "Dublin", salary: "\u20ac48k\u201360k", notes: "Referral via Sara", date: "Yesterday" },
  { id: "t4", title: "Marketing Manager", company: "Telgorithm", url: "https://example.com/j3", status: "auto", location: "Remote", salary: "$58\u201363/hr", notes: "", date: "2d ago" },
  { id: "t5", title: "Frontend Developer", company: "CM.com", url: "https://example.com/j4", status: "applied", location: "Amsterdam", salary: "\u20ac55k\u201370k", notes: "Applied via site", date: "3d ago" },
  { id: "t6", title: "Senior Product Designer", company: "Nova Labs", url: "https://example.com/j2", status: "interviewing", location: "Tehran", salary: "$10k\u201320k", notes: "Round 2 with HM", date: "4d ago" },
];

// ============================================================================
// RESUME STUDIO MULTI-PAGE TYPES & EXACT WORD XML SAMPLE DATA
// ============================================================================
export interface ExperienceItem {
  [key: string]: any;
  id: string;
  title: string;
  company: string;
  location?: string;
  period: string;
  summaryParagraph?: string;
  bullets: string[];
}

export interface EducationItem {
  [key: string]: any;
  id: string;
  degree: string;
  school: string;
  location?: string;
  date: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  emblemType?: string;
  technicalSkills?: string[];
  sectionOrder?: string[];
  issuer: string;
  date: string;
  licenseNumber?: string;
}

export interface CourseItem {
  [key: string]: any;
  id: string;
  title: string;
  institution: string;
  date: string;
}

export interface AwardItem {
  [key: string]: any;
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface VolunteerItem {
  [key: string]: any;
  id: string;
  organization: string;
  role: string;
  description?: string;
  date: string;
}

export interface MembershipItem {
  [key: string]: any;
  id: string;
  organization: string;
  role: string;
  description?: string;
  date: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  emblemType?: string;
  technicalSkills?: string[];
  sectionOrder?: string[];
  title: string;
  company: string;
  phone: string;
  email: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  heading: string;
  type: "projects" | "languages" | "awards" | "volunteering" | "publications" | "custom";
  visible: boolean;
  column: "left" | "right" | "main";
  items: CustomSectionItem[];
}

export interface SectionLayoutItem {
  id: string;
  label: string;
  visible: boolean;
  column: "left" | "right" | "main";
}

export interface DocumentStyleSettings {
  [key: string]: any;
  fontFamily?: string;
  pageSize: "A4" | "Letter";
  pageCount: 1 | 2 | 3;
  accentColor: string;
  fontScale: number;
  lineSpacing: number;
  pageMarginMm: number;
  sectionGapPx: number;
  showPhoto: boolean;
  showEmblem: boolean;
  showSignature: boolean;
}

export interface ResumeContent {
  [key: string]: any;
  fullName: string;
  profession: string;
  phone: string;
  email: string;
  linkedin: string;
  location?: string;
  photoUrl?: string;
  summary: string;
  areasOfExpertise: string[];
  professionalSkills: string[];
  technicalSkills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  courses: CourseItem[];
  awards: AwardItem[];
  volunteering: VolunteerItem[];
  memberships: MembershipItem[];
  interests: string[];
  customSections: CustomSection[];
  coverLetter: {
    [key: string]: any;
    date: string;
    reSubject?: string;
    recipientName: string;
    recipientTitle: string;
    companyName: string;
    companyAddress: string;
    greeting: string;
    openingParagraph: string;
    bodyParagraph: string;
    highlightsIntro?: string;
    bulletHighlights?: string[];
    closingParagraph: string;
    signOff: string;
    signatureText: string;
  };
  references: ReferenceItem[];
}

export interface ResumeDocument {
  id: string;
  title: string;
  seriesId: string;
  targetRole: string;
  language: string;
  updatedAt: string;
  atsScore: number;
  activeTab: "resume" | "cover" | "references";
  style: DocumentStyleSettings;
  sectionOrder: SectionLayoutItem[];
  content: ResumeContent;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  timestamp: string;
  seriesId: string;
  content: ResumeContent;
  style: DocumentStyleSettings;
}

const DEFAULT_SECTION_ORDER: SectionLayoutItem[] = [
  { id: "summary", label: "Professional Summary", visible: true, column: "right" },
  { id: "experience", label: "Professional Experience", visible: true, column: "right" },
  { id: "education", label: "Education", visible: true, column: "left" },
  { id: "skills", label: "Skills & Expertise", visible: true, column: "left" },
  { id: "certifications", label: "Certifications & Licenses", visible: true, column: "left" },
  { id: "courses", label: "Professional Development", visible: true, column: "right" },
  { id: "awards", label: "Achievements & Awards", visible: true, column: "left" },
  { id: "volunteering", label: "Volunteer & Community", visible: true, column: "left" },
  { id: "memberships", label: "Memberships & Affiliations", visible: true, column: "left" },
  { id: "interests", label: "Interests", visible: true, column: "main" },
];

const DEFAULT_STYLE_BY_SERIES: Record<string, any> = {
  "11": {
    fontFamily: "Times New Roman",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Times New Roman",
    baseFontSize: 10,
    lineHeight: 1.15,
    pageMargin: 36,
    sectionSpacing: 14,
    accentColor: "#000000",
    headingColor: "#000000",
    mutedColor: "#333333",
    paperTone: "pure-white",
    borderStyle: "hairline",
    headerAlignment: "center",
    showSectionIcons: false,
    showSkillBars: false,
    compactMode: false,
  },
  "2": {
    fontFamily: "Rubik",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Libre Baskerville",
    baseFontSize: 10,
    lineHeight: 1.15,
    pageMargin: 36,
    sectionSpacing: 14,
    accentColor: "#002060",
    headingColor: "#1F3C88",
    mutedColor: "#44546A",
    paperTone: "pure-white",
    borderStyle: "hairline",
    headerAlignment: "center",
    showSectionIcons: true,
    showSkillBars: false,
    compactMode: false,
  },
  "3": {
    fontFamily: "Source Sans 3",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Playfair Display",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 28,
    sectionSpacing: 16,
    accentColor: "#2C2C2C",
    headingColor: "#2C2C2C",
    mutedColor: "#595959",
    paperTone: "pure-white",
    borderStyle: "hairline",
    headerAlignment: "center",
    showSectionIcons: true,
    showSkillBars: false,
    compactMode: false,
  },
  "6": {
    fontFamily: "Lato",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Montserrat",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 28,
    sectionSpacing: 16,
    accentColor: "#7A6552",
    headingColor: "#3A332C",
    mutedColor: "#7F7F7F",
    paperTone: "warm-ivory",
    borderStyle: "hairline",
    headerAlignment: "center",
    showSectionIcons: true,
    showSkillBars: false,
    compactMode: false,
  },
  "1": {
    fontFamily: "Open Sans",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Merriweather",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 28,
    sectionSpacing: 16,
    accentColor: "#4A5A67",
    headingColor: "#2F3A42",
    mutedColor: "#595959",
    paperTone: "pure-white",
    borderStyle: "subtle",
    headerAlignment: "left",
    showSectionIcons: true,
    showSkillBars: false,
    compactMode: false,
  },
  "5": {
    fontFamily: "Nunito",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Poppins",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 28,
    sectionSpacing: 16,
    accentColor: "#2F3E46",
    headingColor: "#2F3E46",
    mutedColor: "#52796F",
    paperTone: "soft-linen",
    borderStyle: "subtle",
    headerAlignment: "left",
    showSectionIcons: true,
    showSkillBars: false,
    compactMode: false,
  },
  "7": {
    fontFamily: "Work Sans",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Libre Baskerville",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 32,
    sectionSpacing: 16,
    accentColor: "#1F2421",
    headingColor: "#1F2421",
    mutedColor: "#5A605D",
    paperTone: "pure-white",
    borderStyle: "hairline",
    headerAlignment: "left",
    showSectionIcons: false,
    showSkillBars: false,
    compactMode: false,
  },
  "4": {
    fontFamily: "Calibri",
    pageSize: "A4",
    pageCount: 1,
    fontScale: 1,
    lineSpacing: 1.15,
    headingFontFamily: "Calibri",
    baseFontSize: 10,
    lineHeight: 1.35,
    pageMargin: 32,
    sectionSpacing: 16,
    accentColor: "#2B547E",
    headingColor: "#1F3A52",
    mutedColor: "#595959",
    paperTone: "pure-white",
    borderStyle: "hairline",
    headerAlignment: "left",
    showSectionIcons: false,
    showSkillBars: false,
    compactMode: false,
  },
};

const STANDARD_EXPERIENCE_5: ExperienceItem[] = [
  {
    id: "e1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name",
    location: "Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Highlight your key responsibilities and impact in this role. Summarize how your leadership, technical skills, and strategic execution contributed to team and organizational goals.",
    bullets: [
      "Identify your top 3 to 5 core strengths that set you apart in your industry and align directly with the target role.",
      "Apply precise, field-specific terminology so hiring managers and ATS parsers immediately recognize your domain expertise.",
      "Showcase both technical proficiency and cross-functional leadership capabilities required for senior execution.",
      "Tie your day-to-day contributions directly to measurable business outcomes, revenue growth, or operational savings.",
      "Incorporate high-priority keywords from the job description naturally into your achievement statements.",
    ],
  },
  {
    id: "e2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name",
    location: "Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Quantify your achievements to clearly demonstrate the tangible value you delivered across projects and teams.",
    bullets: [
      "Highlight measurable accomplishments backed by concrete metrics, percentages, and performance benchmarks.",
      "Detail complex initiatives where your ownership was pivotal to on-time delivery and stakeholder satisfaction.",
      "Select achievements that directly mirror the core competencies requested in the target job posting.",
    ],
  },
  {
    id: "e3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name",
    location: "Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Tailor your experience to illustrate how you solve problems, streamline workflows, and elevate team performance.",
    bullets: [
      "Align your documented accomplishments with the key operational priorities of the hiring organization.",
      "Demonstrate how your specialized expertise improved process efficiency and cross-team collaboration.",
      "Write concisely with strong action verbs that emphasize ownership, initiative, and measurable impact.",
    ],
  },
  {
    id: "e4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name",
    location: "Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Outline earlier career progression that demonstrates foundational expertise, reliability, and consistent growth.",
    bullets: [
      "Coordinated daily project deliverables across multiple departments, maintaining 99% on-schedule completion.",
      "Standardized reporting templates and documentation workflows, reducing onboarding time for new team members.",
      "Partnered with senior leadership to analyze operational bottlenecks and implement cost-saving improvements.",
      "Recognized for consistent excellence in client communication, issue resolution, and service quality.",
    ],
  },
  {
    id: "e5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name",
    location: "Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Summarize foundational experience and key contributions that built your core professional skill set.",
    bullets: [
      "Supported cross-functional project teams in research, data validation, and client presentation preparation.",
      "Maintained accurate records and compliance documentation across high-volume operational workflows.",
      "Contributed to process improvement initiatives that enhanced team productivity and service delivery.",
    ],
  },
];

const STANDARD_COURSES_4: CourseItem[] = [
  { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
  { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
  { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
  { id: "cr4", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
];

const STANDARD_AWARDS_4: AwardItem[] = [
  { id: "aw1", title: "AWARD / ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
  { id: "aw2", title: "AWARD / ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
  { id: "aw3", title: "AWARD / ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
  { id: "aw4", title: "AWARD / ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
];

const STANDARD_VOLUNTEER_4: VolunteerItem[] = [
  { id: "vl1", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
  { id: "vl2", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
  { id: "vl3", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
  { id: "vl4", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
];

const STANDARD_MEMBERSHIPS_3: MembershipItem[] = [
  { id: "mb1", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
  { id: "mb2", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
  { id: "mb3", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
];

const STANDARD_REFERENCES_4: ReferenceItem[] = [
  { id: "r1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
  { id: "r2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
  { id: "r3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
  { id: "r4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
];

export const SAMPLE_CONTENT_BY_SERIES: Record<string, ResumeContent> = {
  "11": {
    name: "BLAKE TRUMAN",
    fullName: "BLAKE TRUMAN",
    firstName: "BLAKE",
    lastName: "TRUMAN",
    profession: "YOUR PROFESSION",
    title: "YOUR PROFESSION",
    phone: "(555) 555-5555",
    email: "youremail@mail.com",
    linkedin: "Linkedin.com/name",
    location: "City, State/Province",
    website: "",
    photoUrl: "",
    personal: {
      fullName: "BLAKE TRUMAN",
      title: "YOUR PROFESSION",
      phone: "(555) 555-5555",
      email: "youremail@mail.com",
      linkedin: "Linkedin.com/name",
      location: "City, State/Province",
    },
    summary:
      "Showcase your top accomplishments upfront, quantifying impacts with metrics to demonstrate tangible value. Use paragraphs or bullet points to highlight how your contributions drive business success, focusing on the benefits you deliver to the organization rather than personal objectives.",
    areasOfExpertise: [
      "Project Oversight",
      "Conflict Mediation",
      "Strategic Leadership",
      "Team Direction",
      "Effective Communication",
      "Process Enhancement",
      "Resource Optimization",
      "Customer Engagement",
    ],
    skills: [
      "Project Oversight",
      "Conflict Mediation",
      "Strategic Leadership",
      "Team Direction",
      "Effective Communication",
      "Process Enhancement",
      "Resource Optimization",
      "Customer Engagement",
    ],
    technicalSkills: [],
    professionalSkills: [],
    volunteering: [],
    customSections: [],
    experience: [
      {
        id: "ivy-exp-1",
        title: "ENTER YOUR JOB TITLE HERE",
        role: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        period: "Date \u2013 Present",
        date: "Date \u2013 Present",
        description:
          "Use this optional paragraph to summarize the role, highlight major accomplishments, note your progression to the position (e.g., via promotion), or briefly introduce the company if it\u2019s lesser-known. You may skip this paragraph to proceed directly to the bullet points.",
        bullets: [
          "Emphasize achievements that showcase value to the employer, such as boosting revenue, cutting costs, or streamlining operations. Use dynamic action verbs like \u201Corchestrated\u201D or \u201Cexecuted\u201D instead of passive phrases like \u201Cresponsible for.\u201D",
          "Highlight your most significant and relevant accomplishments first to capture attention. Incorporate specific metrics where possible to demonstrate measurable impact.",
          "Focus on results that align with the hiring company\u2019s goals, emphasizing leadership and innovation. Tailor contributions to reflect skills that enhance organizational success.",
          "Show your ability to lead projects or teams with clear, quantified examples of success.",
        ],
      },
      {
        id: "ivy-exp-2",
        title: "ENTER YOUR JOB TITLE HERE",
        role: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        period: "Date \u2013 Date",
        date: "Date \u2013 Date",
        description: "",
        bullets: [
          "Analyze the job posting to identify key skills, qualifications, or keywords emphasized by the employer. Integrate these terms into your resume to align with the role\u2019s requirements and improve ATS compatibility.",
          "Prioritize achievements that demonstrate your ability to meet the job\u2019s demands, using relevant examples. Ensure content reflects the posting\u2019s priorities to increase selection chances.",
          "Maintain ATS-friendly formatting by using clear, keyword-rich descriptions of your accomplishments. Submit the resume in either Word or PDF format for compatibility.",
        ],
      },
    ],
    education: [
      {
        id: "ivy-edu-1",
        degree: "DEGREE TITLE",
        school: "University Name \u2013 Location",
        date: "Date",
      },
      {
        id: "ivy-edu-2",
        degree: "CERTIFICATION NAME",
        school: "Organization",
        date: "Date",
      },
    ],
    courses: [
      {
        id: "ivy-crs-1",
        title: "COURSE / WORKSHOP / CLASS",
        name: "COURSE / WORKSHOP / CLASS",
        institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
        date: "Date",
      },
      {
        id: "ivy-crs-2",
        title: "COURSE / WORKSHOP / CLASS",
        name: "COURSE / WORKSHOP / CLASS",
        institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
        date: "Date",
      },
      {
        id: "ivy-crs-3",
        title: "COURSE / WORKSHOP / CLASS",
        name: "COURSE / WORKSHOP / CLASS",
        institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
        date: "Date",
      },
    ],
    certifications: [],
    awards: [],
    volunteer: [],
    memberships: [],
    languages: [],
    projects: [],
    interests: [
      "Learning conversational Spanish - Mentoring youth at community outreach programs",
      "Enthusiast of strategic board games - Perfecting artisanal sourdough bread - Kayaking on local rivers",
    ],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      salutation: "Dear [Hiring Manager],",
      openingParagraph:
        "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results.",
      bodyParagraph:
        "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance).",
      closingParagraph:
        "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:",
      paragraphs: [
        "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results.",
        "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance).",
        "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:",
      ],
      quote:
        "\u201CI would welcome the opportunity to discuss how my skills and experience align with your company\u2019s objectives. Please feel free to contact me at (555) 555-5555 or youremail@mail.com.\u201D",
      closingNote: "Thank you for your consideration.",
      signOff: "Sincerely,",
      signatureText: "Blake Truman",
    },
    references: [
      { id: "ivy-ref-1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "ivy-ref-2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "ivy-ref-3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "ivy-ref-4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
    ],
  },
  "2": {
    fullName: "JENNIFER DAVIS",
    profession: "YOUR PROFESSION",
    title: "YOUR PROFESSION",
    email: "youremail@mail.com",
    phone: "(555) 555-5555",
    location: "City, State/Province",
    linkedin: "Linkedin.com/name",
    summary: "Write 3\u20135 sentences that clearly summarize your strongest professional skills and the value you bring to an employer. Focus on the results you deliver and how your expertise helps organizations achieve their goals. Avoid outdated objective statements and keep the tone confident and results-oriented.",
    experience: [
      {
        id: "e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Present",
        summaryParagraph: "Start with a short overview of your role and main responsibilities. Then add 3\u20134 strong achievement bullets below.",
        overview: "Start with a short overview of your role and main responsibilities. Then add 3\u20134 strong achievement bullets below.",
        showOverview: true,
        bullets: [
          "Describe a key achievement using numbers (e.g. reduced costs by X%, improved speed by Y%, increased revenue).",
          "Highlight leadership or project results. Include team size, timeline, and measurable outcome whenever possible.",
          "Show how you improved a process or system. Quantify the impact (time saved, productivity gain, error reduction).",
          "Mention collaboration with leadership or other departments and the positive result it created.",
        ],
      },
      {
        id: "e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Explain how you improved efficiency or quality. Add a clear metric if available.",
          "Describe how you supported or developed others (mentoring, training, coaching) and the outcome.",
          "Share a tool, system, or process you introduced and the benefit it delivered.",
        ],
      },
      {
        id: "e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Show your ability to handle multiple priorities while maintaining quality and meeting deadlines.",
          "Describe a problem you identified and fixed. Include the improvement it created.",
          "Highlight cross-functional collaboration and how it helped the team or company succeed.",
        ],
      },
      {
        id: "e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Open with a short statement about how you successfully handled change, multiple projects, or fast-paced environments while delivering consistent results.",
        overview: "Open with a short statement about how you successfully handled change, multiple projects, or fast-paced environments while delivering consistent results.",
        showOverview: true,
        bullets: [
          "Explain how you organized, prioritized, and tracked multiple projects or shifting priorities to keep everything on schedule.",
          "Give a clear example of quickly learning or implementing a new tool, process, or technology and the positive impact it created.",
          "Describe how you improved communication or collaboration between teams and the measurable benefit that resulted.",
        ],
      },
      {
        id: "e5",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Start with a brief statement about your approach to leading teams and developing people to achieve strong results.",
        overview: "Start with a brief statement about your approach to leading teams and developing people to achieve strong results.",
        showOverview: true,
        bullets: [
          "Share a clear leadership result that includes team size, targets exceeded, and the quality level you maintained.",
          "Explain how you mentored or supported the professional growth of colleagues and the outcome of that support.",
          "Mention training sessions, workshops, or knowledge-sharing activities you designed or led and who benefited from them.",
          "Describe how you identified and solved a team or process problem and successfully restored progress or momentum.",
        ],
      },
      {
        id: "e6",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Write a short introduction about your commitment to continuous learning and professional growth and how it benefits your work.",
        overview: "Write a short introduction about your commitment to continuous learning and professional growth and how it benefits your work.",
        showOverview: true,
        bullets: [
          "List relevant courses, certifications, or training programs and briefly explain how you applied what you learned.",
          "Share a new method, tool, or practice you introduced that led to improved results or clearer goals.",
          "Explain how you stayed current with industry trends and actively shared useful knowledge with your colleagues.",
          "Mention professional groups, events, or networks you participated in and the practical value you brought back to your work.",
        ],
      },
      {
        id: "e7",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Open with how you contributed to strategy or long-term goals.",
        overview: "Open with how you contributed to strategy or long-term goals.",
        showOverview: true,
        bullets: [
          "Describe your involvement in shaping vision, goals, or strategic plans.",
          "Give an example of supporting or leading a significant change or transformation.",
          "Highlight cross-functional projects or partnerships you drove and their impact.",
          "Explain how you identified risks early and helped the organization manage them.",
        ],
      },
      {
        id: "e8",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Start with your approach to innovation and continuous improvement.",
        overview: "Start with your approach to innovation and continuous improvement.",
        showOverview: true,
        bullets: [
          "Describe a new product, process, or service you developed or launched and the result.",
          "Share an example of solving a difficult problem with a creative or resourceful solution.",
          "Explain how you found and captured opportunities for greater efficiency or growth.",
          "Describe how you encouraged new ideas and innovation within your team.",
          "Mention how you measured and tracked the long-term success of the changes you made.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name - Location", year: "Graduation Year", date: "Graduation Year" },
      { id: "ed2", degree: "CERTIFICATION NAME", school: "Issuing Organization", year: "Year Earned", date: "Year Earned" },
      { id: "ed3", degree: "COURSE OR PROGRAM", school: "Institution or Platform", year: "Completion Year", date: "Completion Year" },
    ],
    areasOfExpertise: [
      "Time Management",
      "Critical Thinking",
      "Leadership",
      "Problem Solving",
      "Creativity",
      "Attention to Detail",
    ],
    professionalSkills: [
      "Time Management",
      "Critical Thinking",
      "Leadership",
      "Problem Solving",
      "Creativity",
      "Attention to Detail",
    ],
    interests: [],
    customSections: [],
    skills: [
      "Time Management",
      "Critical Thinking",
      "Leadership",
      "Problem Solving",
      "Creativity",
      "Attention to Detail",
    ],
    technicalSkills: [
      "Microsoft Office Suite",
      "Canva & Adobe Photoshop",
      "WordPress Basics",
      "SEO",
    ],
    languages: [
      "Language \u2013 Proficiency Level",
      "Language \u2013 Proficiency Level",
      "Language \u2013 Proficiency Level",
      "Language \u2013 Proficiency Level",
    ],
    certifications: [
      { id: "c1", name: "CERTIFICATION NAME", issuer: "Issuing Organization", date: "Year Earned" },
    ],
    courses: [
      { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr4", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
    ],
    awards: [
      { id: "aw1", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw2", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw3", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw4", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
    ],
    volunteering: [
      { id: "vl1", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
      { id: "vl2", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
      { id: "vl3", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
      { id: "vl4", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
    ],
    memberships: [
      { id: "mb1", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
      { id: "mb2", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
      { id: "mb3", role: "Your Role", organization: "NAME OF ORGANIZATION", period: "Date Range", date: "Date Range", description: "Description or Location" },
    ],
    coverLetter: {
      date: "[Date]",
      reSubject: "RE: [Job Title]",
      subjectLine: "RE: [Job Title]",
      recipientName: "[Hiring Manager Name]",
      recipientTitle: "",
      companyName: "Company Name",
      companyAddress: "",
      greeting: "Dear [Hiring Manager],",
      salutation: "Dear [Hiring Manager],",
      openingParagraph: "I\u2019ve always been driven by curiosity and the desire to create meaningful results. The role of [Job Title] at [Company Name] feels like a natural next step that aligns with my passion for growth and delivering measurable impact.",
      bodyParagraph: "Share why this specific role and company excite you. Connect your experience to their needs and show genuine interest.",
      bodyParagraph1: "Share why this specific role and company excite you. Connect your experience to their needs and show genuine interest.",
      highlightsIntro: "Key accomplishments include:",
      highlights: [
        "Consistently exceeded sales targets by up to 35% year-over-year",
        "Guided cross-functional teams to deliver strategic client solutions",
        "Developed and implemented a new onboarding program that increased retention by 20%",
        "Built strong client partnerships resulting in long-term contracts",
      ],
      closingParagraph: "I believe success comes from listening deeply and acting decisively. I\u2019m confident my mix of strategy, creativity, and leadership can make an immediate impact at [Company Name].",
      signOff: "Sincerely,",
      closingGreeting: "Sincerely,",
      signatureText: "Jennifer Davis",
      keyAccomplishments: [
        "Consistently exceeded sales targets by up to 35% year-over-year",
        "Guided cross-functional teams to deliver strategic client solutions",
        "Developed and implemented a new onboarding program that increased retention by 20%",
        "Built strong client partnerships resulting in long-term contracts",
      ],
    } as any,
    references: [
      { id: "rf1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
    ],
  },
  "3": {
    fullName: "JAMES SMITH",
    profession: "YOUR PROFESSION",
    title: "YOUR PROFESSION",
    email: "youremail@mail.com",
    phone: "(555) 555-5555",
    location: "City, State/Province",
    linkedin: "Linkedin.com/name",
    summary: "This section is dedicated to showcasing your most impactful skills and accomplishments. The emphasis is on demonstrating the concrete value you bring and how your contributions will directly support the organization's objectives.",
    experience: [
      {
        id: "el_e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Present",
        summaryParagraph: "Your experience section should highlight not just what you did, but how your work created value. Keep each role focused, relevant, and results-driven.",
        overview: "Your experience section should highlight not just what you did, but how your work created value. Keep each role focused, relevant, and results-driven.",
        showOverview: true,
        bullets: [
          "Summarize your key responsibilities in 2\u20133 impactful sentences.",
          "Emphasize achievements that align with the role you\u2019re applying for.",
          "Use strong action verbs like led, improved, developed, or implemented.",
          "Focus on outcomes rather than daily duties.",
        ],
      },
      {
        id: "el_e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Quantify your results whenever possible \u2014 numbers immediately build credibility and attract attention.",
        overview: "Quantify your results whenever possible \u2014 numbers immediately build credibility and attract attention.",
        showOverview: true,
        bullets: [
          "Use the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].",
          "Example: \u201CBoosted sales by 20% through a new client engagement strategy.\u201D",
          "Include metrics such as time saved, growth achieved, or efficiency improved.",
        ],
      },
      {
        id: "el_e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "A polished resume shows professionalism and care. Review your work carefully before submitting.",
        overview: "A polished resume shows professionalism and care. Review your work carefully before submitting.",
        showOverview: true,
        bullets: [
          "Proofread for grammar, spelling, and formatting consistency.",
          "Double-check job titles, dates, and contact details.",
          "Keep your layout clean, balanced, and easy to read.",
        ],
      },
      {
        id: "el_e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "As you expand your experience section, focus on showing career progression and versatility. Employers value consistency, adaptability, and continuous growth across roles.",
        overview: "As you expand your experience section, focus on showing career progression and versatility. Employers value consistency, adaptability, and continuous growth across roles.",
        showOverview: true,
        bullets: [
          "Highlight promotions, increased responsibilities, or expanded scope of work.",
          "Emphasize collaboration \u2014 mention cross-functional teamwork or mentoring others.",
          "Showcase how each role built upon the last, reflecting professional development.",
          "Use brief yet impactful statements to demonstrate initiative and reliability.",
        ],
      },
      {
        id: "el_e5",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Strong experience entries don\u2019t just describe what you did \u2014 they show how you made a difference. Focus on problem-solving and innovation.",
        overview: "Strong experience entries don\u2019t just describe what you did \u2014 they show how you made a difference. Focus on problem-solving and innovation.",
        showOverview: true,
        bullets: [
          "Illustrate moments where you identified issues and implemented effective solutions.",
          "Mention tools, systems, or methods you introduced that improved performance.",
          "Demonstrate adaptability in dynamic or fast-paced environments.",
          "Example: \u201CStreamlined reporting processes, cutting project turnaround time by 25%.\u201D",
        ],
      },
      {
        id: "el_e6",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "To maintain a professional flow, ensure your continued experience section feels cohesive with the rest of your resume. Attention to structure and clarity enhances overall readability.",
        overview: "To maintain a professional flow, ensure your continued experience section feels cohesive with the rest of your resume. Attention to structure and clarity enhances overall readability.",
        showOverview: true,
        bullets: [
          "Keep formatting and spacing consistent with previous sections.",
          "Avoid redundancy \u2014 let each role contribute something new to your story.",
          "If you have older roles, summarize them briefly while keeping focus on relevance.",
          "End this section with roles that highlight both expertise and career growth, demonstrating how each step in your journey has prepared you for greater responsibilities and more impactful contributions.",
        ],
      },
      {
        id: "el_e7",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "As you conclude your experience section, focus on leadership, strategic impact, and long-term achievements. This final segment should reinforce your growth trajectory and showcase the depth of your expertise.",
        overview: "As you conclude your experience section, focus on leadership, strategic impact, and long-term achievements. This final segment should reinforce your growth trajectory and showcase the depth of your expertise.",
        showOverview: true,
        bullets: [
          "Emphasize leadership roles, decision-making, and mentorship experience.",
          "Highlight contributions that influenced company direction, performance, or culture.",
          "Include strategic initiatives that demonstrate innovation and measurable results.",
          "Example: \u201CLed a cross-departmental initiative that improved client satisfaction by 40%.\u201D",
        ],
      },
      {
        id: "el_e8",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Older or early-career roles can be summarized more briefly while maintaining professionalism and relevance. They help illustrate continuity and the foundation of your current strengths.",
        overview: "Older or early-career roles can be summarized more briefly while maintaining professionalism and relevance. They help illustrate continuity and the foundation of your current strengths.",
        showOverview: true,
        bullets: [
          "Combine early positions if they share similar responsibilities or focus areas.",
          "Use concise phrasing to maintain readability and visual flow.",
          "Focus on transferable skills such as teamwork, communication, and adaptability.",
          "Conclude this section with roles that demonstrate steady growth, proven reliability, and a sustained commitment to professional excellence.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name - Location", year: "Graduation Year", date: "Graduation Year" },
      { id: "ed2", degree: "DEGREE TITLE", school: "University Name - Location", year: "Graduation Year", date: "Graduation Year" },
      { id: "ed3", degree: "DEGREE TITLE", school: "University Name - Location", year: "Graduation Year", date: "Graduation Year" },
    ],
    areasOfExpertise: [
      "Project Management", "Team Leadership", "Process Optimization", "Stakeholder Engagement",
      "Data Analysis", "Onboarding & Training", "Problem-Solving", "Team Coordination",
      "Workflow Automation", "Time Management", "Documentation", "Adaptability",
    ],
    professionalSkills: [
      "Project Management", "Team Leadership", "Process Optimization", "Stakeholder Engagement",
      "Data Analysis", "Onboarding & Training", "Problem-Solving", "Team Coordination",
      "Workflow Automation", "Time Management", "Documentation", "Adaptability",
    ],
    skills: [
      "Project Management", "Team Leadership", "Process Optimization", "Stakeholder Engagement",
      "Data Analysis", "Onboarding & Training", "Problem-Solving", "Team Coordination",
      "Workflow Automation", "Time Management", "Documentation", "Adaptability",
    ],
    technicalSkills: [],
    languages: [],
    interests: [],
    customSections: [],
    certifications: [],
    courses: [
      { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
    ],
    awards: [
      { id: "aw1", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw2", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw3", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw4", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
    ],
    volunteering: [
      { id: "vl1", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date" },
      { id: "vl2", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date" },
      { id: "vl3", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date" },
      { id: "vl4", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date" },
    ],
    memberships: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      salutation: "Dear [Hiring Manager],",
      openingParagraph: "Use this space to write a personalized introduction to your future employer.",
      bodyParagraph: "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic.",
      closingParagraph: "Thank the reader for their time and consideration, expressing enthusiasm to discuss the opportunity further.",
      signOff: "Sincerely,",
      closingGreeting: "Sincerely,",
      signatureText: "James Smith",
    } as any,
    references: [
      { id: "rf1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
    ],
  },
  "4": {
    fullName: "OLIVIA ANDERSON",
    profession: "YOUR PROFESSION",
    title: "YOUR PROFESSION",
    email: "youremail@mail.com",
    phone: "(555) 555-5555",
    location: "City, State/Province",
    linkedin: "Linkedin.com/name",
    summary: "Use this section to succinctly present your top strengths and key achievements, highlighting the measurable value you offer and clearly demonstrating how your skills contribute to the organization\u2019s goals. Focus on concrete accomplishments that illustrate your impact, and prioritize results and relevance to employers\u2019 needs, ensuring your profile stands out as a valuable asset to any team.",
    experience: [
      {
        id: "dc_e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Present",
        summaryParagraph: "A valuable resume shows you as a results-driven professional whose strengths match employer needs and deliver measurable impact.",
        overview: "A valuable resume shows you as a results-driven professional whose strengths match employer needs and deliver measurable impact.",
        showOverview: true,
        bullets: [
          "Pinpoint your 3 to 5 most relevant skills that distinguish you in your field.",
          "Use precise, industry-specific terminology to make your expertise clear.",
          "Demonstrate both technical competencies and interpersonal abilities essential to success.",
          "Connect your skills to authentic workplace demands and context.",
          "Incorporate relevant keywords from job postings to optimize your resume for hiring platforms.",
        ],
      },
      {
        id: "dc_e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Quantify your achievements to clearly show your professional value.",
        overview: "Quantify your achievements to clearly show your professional value.",
        showOverview: true,
        bullets: [
          "Spotlight measurable accomplishments, using data and outcomes to support your claims.",
          "Describe projects or initiatives where your involvement was pivotal to success, detailing your role and impact on outcomes.",
          "Select achievements that are tailored to the position you desire, showing your fit and value.",
        ],
      },
      {
        id: "dc_e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Tailor your resume to show how you can help the team succeed, positioning yourself as an essential asset.",
        overview: "Tailor your resume to show how you can help the team succeed, positioning yourself as an essential asset.",
        showOverview: true,
        bullets: [
          "Match your strengths and achievements to the job requirements.",
          "Emphasize how your expertise drives organizational success, prioritizing employer needs over generic objectives.",
          "Write clearly and confidently, choosing active, value-adding language.",
        ],
      },
      {
        id: "dc_e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "To ensure your resume stands out to recruiters and hiring managers, focus on communicating your professional story with authenticity and impact. Your goal is to make your background relevant and memorable.",
        overview: "To ensure your resume stands out to recruiters and hiring managers, focus on communicating your professional story with authenticity and impact. Your goal is to make your background relevant and memorable.",
        showOverview: true,
        bullets: [
          "Begin each resume section with a strong, action-focused headline that highlights your accomplishments.",
          "Emphasize distinctive career experiences, specialized projects, or unique accomplishments that set you apart from other applicants.",
          "Incorporate well-crafted, concise summaries that effectively communicate your professional goals, values, and career trajectory.",
          "Provide context for your achievements to showcase depth and range.",
          "Include relevant certifications or training to demonstrate ongoing professional development.",
        ],
      },
      {
        id: "dc_e5",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Show prospective employers you\u2019re invested in both your work and the workplace. Your ability to collaborate, adapt, and contribute to company culture matters.",
        overview: "Show prospective employers you\u2019re invested in both your work and the workplace. Your ability to collaborate, adapt, and contribute to company culture matters.",
        showOverview: true,
        bullets: [
          "Mention teamwork and collaboration on successful projects.",
          "Highlight your adaptability and eagerness to learn new technologies or processes, demonstrating your readiness to embrace change and grow with evolving business needs.",
          "Include concise references to your leadership experiences, mentoring activities, and cross-functional contributions to showcase your ability to inspire others and collaborate effectively across teams.",
        ],
      },
      {
        id: "dc_e6",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Demonstrate professionalism by ensuring your resume communicates clearly and looks polished. Presentation can influence perception as much as content.",
        overview: "Demonstrate professionalism by ensuring your resume communicates clearly and looks polished. Presentation can influence perception as much as content.",
        showOverview: true,
        bullets: [
          "Maintain a clean, consistent formatting style with clear headings and organized sections to ensure your resume is visually appealing and easy for employers to read.",
          "Review your resume thoroughly to identify and correct any spelling, grammar, or punctuation errors, ensuring your document is polished and professional.",
          "Carefully avoid excessive jargon in your resume, instead choosing clear and accessible language that is specifically tailored to resonate with the requirements of the role and the industry.",
          "Use white space and clear headings to organize your resume and make key information easy to find.",
        ],
      },
      {
        id: "dc_e7",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Polish the final details of your resume to create a professional impression and make your application stand out.",
        overview: "Polish the final details of your resume to create a professional impression and make your application stand out.",
        showOverview: true,
        bullets: [
          "Choose uniform and appropriate font styles and sizes across all sections to ensure a polished, consistent, and visually pleasing appearance.",
          "Make sure all text and sections are neatly aligned and evenly spaced to give your resume a balanced, organized, and professional layout.",
          "Use well-structured bullet points throughout your resume to break up information, making each accomplishment or responsibility clear and easy to digest for the reader.",
          "Add clickable links to your LinkedIn, portfolio, or website to give employers quick access to your work or credentials.",
          "Display your contact information\u2014such as phone number, email, and LinkedIn\u2014clearly at the top of your resume, ensuring it is current and easy for employers to find.",
        ],
      },
      {
        id: "dc_e8",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name / Location",
        location: "Location",
        period: "Date \u2013 Date",
        summaryParagraph: "Showcase qualities that align you with the company\u2019s culture to illustrate your potential as a team member.",
        overview: "Showcase qualities that align you with the company\u2019s culture to illustrate your potential as a team member.",
        showOverview: true,
        bullets: [
          "Elaborate on your communication abilities and relationship-building skills, providing examples of successful collaborations or stakeholder interactions.",
          "Demonstrate a sense of accountability by describing occasions where you proactively identified challenges or solved problems to support team or company goals.",
          "Show enthusiasm for the role and highlight how your values and experience align with the organization\u2019s mission.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name, Location", year: "Graduation Year", date: "Graduation Year" },
      { id: "ed2", degree: "DEGREE TITLE", school: "University Name, Location", year: "Graduation Year", date: "Graduation Year" },
    ],
    areasOfExpertise: [
      "Project Coordination", "Group Leadership", "Workflow Streamlining", "Client Interaction",
      "Data Interpretation", "Employee Onboarding", "Issue Resolution", "Cross-Team Collaboration",
      "Process Automation", "Schedule Management", "Record-Keeping",
    ],
    professionalSkills: [
      "Project Coordination", "Group Leadership", "Workflow Streamlining", "Client Interaction",
      "Data Interpretation", "Employee Onboarding", "Issue Resolution", "Cross-Team Collaboration",
      "Process Automation", "Schedule Management", "Record-Keeping",
    ],
    skills: [
      "Project Coordination", "Group Leadership", "Workflow Streamlining", "Client Interaction",
      "Data Interpretation", "Employee Onboarding", "Issue Resolution", "Cross-Team Collaboration",
      "Process Automation", "Schedule Management", "Record-Keeping",
    ],
    technicalSkills: [
      "Python Programming", "SQL Database Management", "Tableau Data Visualization",
      "Salesforce CRM Management", "AutoCAD Design Software", "Jira Project Management",
      "AWS Cloud Computing",
    ],
    languages: [],
    interests: [],
    customSections: [],
    certifications: [
      { id: "c1", name: "License Name", issuer: "Authority/Organization", date: "Date" },
      { id: "c2", name: "Certification Name", issuer: "Issuing Organization", date: "Date" },
    ],
    courses: [
      { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
      { id: "cr4", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", year: "DATE", date: "DATE" },
    ],
    awards: [
      { id: "aw1", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw2", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
      { id: "aw3", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", year: "Date", date: "Date" },
    ],
    volunteering: [
      { id: "vl1", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date", description: "" },
      { id: "vl2", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date", description: "" },
      { id: "vl3", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", period: "Date", date: "Date", description: "" },
    ],
    memberships: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      salutation: "Dear [Hiring Manager],",
      openingParagraph: "Use this space to write a personalized introduction to your future employer.",
      bodyParagraph: "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic.",
      closingParagraph: "Thank the reader for considering the application, and express enthusiasm for future communication.",
      signOff: "Sincerely,",
      closingGreeting: "Sincerely,",
      signatureText: "Olivia Anderson",
    } as any,
    references: [
      { id: "rf1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "rf4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
    ],
  },
  "12": {
    fullName: "JONAH ROMANO",
    profession: "YOUR PROFESSION",
    phone: "(555) 555-5555",
    email: "youremail@mail.com",
    linkedin: "Linkedin.com/name",
    location: "City, State/Province",
    summary:
      "Lead with standout achievements, using quantifiable outcomes to highlight the tangible impact and benefits you contribute to organizational success. Present them in paragraph or bullet form to quickly convey your value, centering objectives on business results.",
    areasOfExpertise: [
      "Initiative Management",
      "Dispute Resolution",
      "Visionary Planning",
      "Group Leadership",
      "Clear Communication",
      "Operational Improvement",
      "Budget Management",
      "Client Relations",
    ],
    professionalSkills: [
      "Time Management",
      "Critical Thinking",
      "Leadership",
      "Problem Solving",
      "Creativity",
      "Attention to Detail",
      "Adaptability",
      "Communication",
    ],
    technicalSkills: [
      "Microsoft Office Suite",
      "Canva & Adobe Photoshop",
      "WordPress Basics",
      "SEO",
      "Google Analytics",
      "CRM Platforms",
    ],
    experience: [
      {
        id: "e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Present",
        summaryParagraph:
          "Include this optional paragraph to provide an overview of the role, spotlight key outcomes, show your path to the position (e.g., through a promotion), or briefly introduce the company if it's not widely recognized. You may exclude this paragraph to move directly to the bullet points.",
        bullets: [
          "Highlight accomplishments that deliver measurable value to the employer, such as increasing profitability, reducing expenses, or enhancing workflows. Use powerful action verbs like 'Directed' or 'Implemented' in place of passive phrases like 'tasked with.'",
          "Prioritize your most impactful and relevant successes to engage the hiring manager. Include concrete metrics where applicable to quantify your contributions.",
          "Emphasize outcomes that align with the employer's objectives, showcasing leadership and innovation. Tailor entries to spotlight skills that drive organizational growth.",
          "Demonstrate your ability to lead projects or teams effectively, providing clear examples of achievement. Quantify results to underscore your impact on the organization.",
        ],
      },
      {
        id: "e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Examine the job posting for essential skills, qualifications, or keywords that the employer emphasizes. Weave these terms into your resume to match role requirements and optimize ATS compatibility.",
          "Focus on accomplishments that demonstrate your suitability for the position, using relevant examples. Ensure content aligns with the job posting's priorities to improve selection potential.",
          "Use clear, keyword-rich descriptions of your achievements to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
        ],
      },
      {
        id: "e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Spearheaded operational improvement initiatives that reduced cycle times by 18% across regional teams.",
          "Managed annual departmental budgets and vendor contracts, consistently delivering under forecast.",
          "Built standardized client reporting dashboards that improved executive visibility and retention.",
        ],
      },
      {
        id: "e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Coordinated cross-departmental project schedules, milestone tracking, and stakeholder communications.",
          "Resolved complex customer escalations, improving satisfaction scores across key accounts.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Date" },
      { id: "ed2", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Date" },
    ],
    certifications: [
      { id: "c1", name: "CERTIFICATION NAME", issuer: "Organization", date: "Date" },
      { id: "c2", name: "CERTIFICATION NAME", issuer: "Organization", date: "Date" },
    ],
    courses: STANDARD_COURSES_4.slice(0, 3),
    awards: STANDARD_AWARDS_4,
    volunteering: STANDARD_VOLUNTEER_4,
    memberships: STANDARD_MEMBERSHIPS_3,
    interests: [],
    customSections: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "Hiring Manager",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      openingParagraph:
        "I am pleased to submit my application for the open role at your organization. My background in initiative management, operational improvement, and group leadership aligns closely with your current priorities.",
      bodyParagraph:
        "In my recent roles, I have directed cross-functional initiatives that boosted productivity, streamlined workflows, and delivered measurable financial results.",
      closingParagraph:
        "Thank you for your time and consideration. I look forward to speaking with you about how I can contribute to your team's continued success.",
      signOff: "Sincerely,",
      signatureText: "Jonah Romano",
    },
    references: STANDARD_REFERENCES_4,
  },
  "14": {
    fullName: "JACKSON CALDWELL",
    profession: "YOUR PROFESSION",
    phone: "(555) 555-5555",
    email: "youremail@mail.com",
    linkedin: "Linkedin.com/name",
    location: "City, State/Province",
    summary:
      "Begin with key accomplishments, leveraging measurable outcomes to showcase the concrete value and benefits you bring to organizational growth. Format as paragraphs or bullets to swiftly communicate your impact, keeping the focus on business objectives rather than personal goals.",
    areasOfExpertise: ["Time Management", "Critical Thinking", "Leadership", "Problem Solving", "Creativity"],
    professionalSkills: ["Time Management", "Critical Thinking", "Leadership", "Problem Solving", "Creativity", "Strategic Execution", "Stakeholder Alignment"],
    technicalSkills: ["Microsoft Office Suite", "Canva & Adobe Photoshop", "WordPress Basics", "SEO", "Data Analytics"],
    experience: [
      {
        id: "e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Present",
        summaryParagraph:
          "This optional paragraph can provide context for the role, summarize key achievements, highlight career progression (such as a promotion), or offer a brief description of the company if it's lesser-known. Omit this section if you prefer to go straight to the bullet points.",
        bullets: [
          "Focus on accomplishments that demonstrate how you benefited the employer, such as increasing revenue, reducing costs, or improving efficiency. Use strong action verbs like 'spearheaded' or 'implemented' rather than passive terms like 'responsible for.'",
          "Place your most impactful and relevant achievements at the top to grab attention, using specific metrics where possible to show measurable results.",
          "Emphasize results that align with the hiring company's goals, showcasing leadership, innovation, and contributions that drive organizational growth.",
          "Illustrate your ability to lead projects or teams with clear, measurable examples of positive outcomes.",
        ],
      },
      {
        id: "e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Review the job listing to pinpoint critical skills, qualifications, or keywords highlighted by the employer. Incorporate these terms naturally into your resume to match the role's needs and boost ATS performance.",
          "Emphasize accomplishments that showcase your capability to fulfill the job's requirements, supported by relevant examples. Align your content with the employer's key priorities to improve your chances of selection.",
          "Ensure ATS compatibility by crafting clear, keyword-focused descriptions of your achievements. Provide the resume in Word or PDF format for optimal system readability.",
        ],
      },
      {
        id: "e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Ensure ATS compatibility by crafting clear, keyword-focused descriptions of your achievements. Provide the resume in Word or PDF format for optimal system readability.",
        ],
      },
      {
        id: "e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Led cross-functional process redesigns that improved operational throughput and reduced turnaround time by 22%.",
          "Partnered with executive stakeholders to define quarterly OKRs, resource plans, and performance dashboards.",
        ],
      },
      {
        id: "e5",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Managed project documentation, risk logs, and client status reporting across multiple concurrent engagements.",
          "Implemented quality assurance checklists that reduced deliverable revisions and improved client satisfaction.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Date" },
      { id: "ed2", degree: "COURSE OR PROGRAM", school: "Institution or Platform", location: "Location", date: "Date" },
    ],
    certifications: [
      { id: "c1", name: "CERTIFICATION NAME", issuer: "Organization", date: "Date" },
    ],
    courses: [
      { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
      { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
    ],
    awards: STANDARD_AWARDS_4,
    volunteering: STANDARD_VOLUNTEER_4,
    memberships: STANDARD_MEMBERSHIPS_3,
    interests: [],
    customSections: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "Hiring Manager",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      openingParagraph:
        "I am writing to apply for the open position with your team. With extensive experience in strategic execution, process optimization, and cross-functional leadership, I am eager to contribute to your organization's continued growth.",
      bodyParagraph:
        "Throughout my career, I have focused on delivering measurable business outcomes through structured problem solving and collaborative execution.",
      highlightsIntro: "Key highlights include:",
      bulletHighlights: [
        "Spearheaded operational improvements that increased team efficiency and reduced overhead costs.",
        "Delivered complex, multi-stakeholder projects on schedule and aligned with strategic KPIs.",
        "Built scalable workflows and documentation standards that elevated overall deliverable quality.",
      ],
      closingParagraph:
        "Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can benefit your team.",
      signOff: "Sincerely,",
      signatureText: "Jackson Caldwell",
    },
    references: STANDARD_REFERENCES_4,
  },
  "22": {
    fullName: "THEO FINCH",
    profession: "YOUR PROFESSION",
    phone: "(555) 555-5555",
    email: "youremail@mail.com",
    linkedin: "Linkedin.com/name",
    location: "City, State/Province",
    photoUrl: "/templates/22/preview-resume-1p-a4.png",
    summary:
      "Use this space to write a brief introduction that highlights your key strengths, core abilities, and overall professional focus. Aim for 2\u20133 clear sentences that reflect the value you bring and the type of work you excel at. Keep the tone confident and concise while summarizing what sets you apart and what you aim to contribute in your next role.",
    areasOfExpertise: [
      "Task Orchestration",
      "Group Direction",
      "Operational Streamlining",
      "Client Relations",
      "Data Evaluation",
      "Staff Integration",
      "Issue Resolution",
      "Inter-Team Collaboration",
      "Process Efficiency",
      "Versatility",
    ],
    professionalSkills: [
      "Task Orchestration",
      "Group Direction",
      "Operational Streamlining",
      "Client Relations",
      "Data Evaluation",
      "Staff Integration",
      "Issue Resolution",
      "Inter-Team Collaboration",
      "Process Efficiency",
      "Versatility",
    ],
    technicalSkills: [
      "Python Coding",
      "Tableau Data Analytics",
      "AutoCAD Design Tools",
      "Trello Task Management",
      "AWS Cloud Solutions",
    ],
    experience: [
      {
        id: "e1",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Present",
        bullets: [
          "Describe moments when you strengthened operations by organizing tasks, clarifying steps, or keeping your team on track.",
          "Highlight contributions where you supported smoother workflows by anticipating needs and preparing resources ahead of time.",
          "Include examples showing how you handled responsibilities consistently and maintained reliable progress during busy periods.",
          "Mention instances where your attention to detail improved accuracy, reduced errors, and enhanced overall work quality.",
          "Add examples demonstrating how your communication helped align expectations and kept colleagues informed during shared tasks.",
        ],
      },
      {
        id: "e2",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Provide examples of how you coordinated activities, followed through on commitments, and supported timely completion.",
          "Mention situations where your initiative simplified processes, resolved small obstacles, or made ongoing tasks easier for others.",
          "Highlight contributions that reflect your ability to adapt quickly, stay organized, and handle shifting priorities effectively.",
        ],
      },
      {
        id: "e3",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Note moments when you contributed to a positive team atmosphere by offering support, clarity, or steady collaboration.",
          "Show how your effort strengthened team results.",
        ],
      },
      {
        id: "e4",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Coordinated cross-team project schedules and resource allocation to ensure seamless milestone execution.",
          "Implemented structured quality checks that reduced operational bottlenecks and improved client satisfaction.",
          "Supported onboarding and training for new staff members across core operational workflows.",
        ],
      },
      {
        id: "e5",
        title: "ENTER YOUR JOB TITLE HERE",
        company: "Company Name",
        location: "Location",
        period: "Date \u2013 Date",
        bullets: [
          "Maintained detailed operational logs, performance metrics, and executive summary reports.",
          "Collaborated with department leads to streamline recurring administrative and client-facing processes.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
      { id: "ed2", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
      { id: "ed3", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
    ],
    certifications: [],
    courses: STANDARD_COURSES_4.slice(0, 3),
    awards: STANDARD_AWARDS_4,
    volunteering: STANDARD_VOLUNTEER_4.slice(0, 3),
    memberships: STANDARD_MEMBERSHIPS_3,
    interests: [],
    customSections: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager Name",
      recipientTitle: "Hiring Manager",
      companyName: "Company Name",
      companyAddress: "Company Address",
      greeting: "Dear [Hiring Manager],",
      openingParagraph:
        "I am excited to submit my application for the open role at your organization. With a strong foundation in operational streamlining, task orchestration, and client relations, I am eager to bring my dedication and collaborative approach to your team.",
      bodyParagraph:
        "In my previous positions, I have consistently improved workflow clarity, supported cross-functional teams, and delivered high-quality outcomes under tight deadlines.",
      highlightsIntro: "Key highlights of my experience include:",
      bulletHighlights: [
        "Streamlined daily team operations and resource planning to improve on-time project delivery.",
        "Strengthened client and stakeholder communication across high-priority initiatives.",
        "Reduced recurring workflow errors through proactive quality checks and documentation.",
      ],
      closingParagraph:
        "Thank you for your time and consideration. I welcome the opportunity to discuss how my background and work ethic align with your organization's needs.",
      signOff: "Sincerely,",
      signatureText: "Theo Finch",
    },
    references: [
      { id: "r1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "r2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "r3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
      { id: "r4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
    ],
  },
  "24": {
    fullName: "FLORENCE NIGHTINGALE",
    profession: "REGISTERED NURSE",
    phone: "(555) 555-5555",
    email: "youremail@mail.com",
    linkedin: "Linkedin.com/name",
    location: "City, State/Province",
    summary:
      "Dedicated and compassionate Registered Nurse with 6+ years of clinical experience delivering high-quality, patient-centered care within high-acuity emergency and acute care settings. Highly skilled in rapid triage, acute patient stabilization, complex wound management, and multidisciplinary care coordination. Proficient in Epic and Cerner EHR systems, with an unwavering commitment to clinical safety, infection control, and patient advocacy.",
    areasOfExpertise: [
      "Acute & Emergency Care",
      "Triage & Rapid Assessment",
      "Medication Administration",
      "IV Therapy & Blood Infusion",
      "Wound Care & Dressing",
      "Patient & Family Education",
      "Discharge Planning",
      "Infection Prevention",
      "EHR / EMR Documentation",
    ],
    professionalSkills: [
      "Clinical Judgment",
      "Patient Assessment",
      "Critical Care Response",
      "Epic & Cerner EHR",
      "Phlebotomy & Cannulation",
      "Tracheostomy Care",
      "Interdisciplinary Teamwork",
      "Compassionate Bedside Care",
    ],
    technicalSkills: [
      "Epic & Cerner EHR",
      "Telemetry Monitoring",
      "IV Infusion Pumps",
      "HIPAA Compliance",
    ],
    experience: [
      {
        id: "e1",
        title: "POSITION TITLE HERE",
        company: "Company/Hospital",
        location: "City, State",
        period: "Date \u2013 Date",
        summaryParagraph: "Highlight clinical expertise, leadership, and measurable patient care achievements.",
        bullets: [
          "Delivered direct bedside care to 5\u20136 acute patients per shift, prioritizing safety.",
          "Streamlined treatment protocols to reduce patient readmissions.",
          "Supervised unit nursing staff to elevate clinical care and foster teamwork.",
          "Maintained precise EHR charting compliant with HIPAA standards.",
          "Led unit training to build essential staff clinical skills.",
        ],
      },
      {
        id: "e2",
        title: "POSITION TITLE HERE",
        company: "Company/Hospital",
        location: "City, State",
        period: "Date \u2013 Date",
        bullets: [
          "Mentored 8 new nurses, ensuring seamless onboarding and strict protocol compliance.",
          "Executed rapid triage assessments and acute care plans.",
          "Collaborated with multidisciplinary teams, achieving 94% patient satisfaction.",
          "Administered medications, IV infusions, and sterile treatments with high precision.",
        ],
      },
      {
        id: "e3",
        title: "POSITION TITLE HERE",
        company: "Company/Hospital",
        location: "City, State",
        period: "Date \u2013 Date",
        bullets: [
          "Monitored telemetry and vitals, promptly reporting acute changes.",
          "Assisted post-op patients with safe mobility, hygiene, and sterile wound care.",
          "Provided clear, compassionate discharge instructions to patients and families.",
          "Supported code response teams during critical unit emergencies.",
        ],
      },
      {
        id: "e4",
        title: "POSITION TITLE HERE",
        company: "Company/Hospital",
        location: "City, State",
        period: "Date \u2013 Date",
        bullets: [
          "Coordinated care plans with physicians, specialists, and case managers for complex medical-surgical patients.",
          "Performed sterile dressing changes, catheter care, and central line maintenance with zero infection incidents.",
          "Educated patients and families on chronic disease management, medication adherence, and post-discharge recovery.",
        ],
      },
      {
        id: "e5",
        title: "POSITION TITLE HERE",
        company: "Company/Hospital",
        location: "City, State",
        period: "Date \u2013 Date",
        bullets: [
          "Conducted comprehensive admission assessments and documented individualized care plans in Epic EHR.",
          "Assisted in rapid stabilization of emergency department admissions and acute trauma cases.",
        ],
      },
    ],
    education: [
      { id: "ed1", degree: "Master of Science in Nursing", school: "University of Michigan", location: "", date: "Graduation Date" },
      { id: "ed2", degree: "Bachelor of Science in Nursing", school: "University of Washington", location: "", date: "Graduation Date" },
      { id: "ed3", degree: "Continuing Education: Patient Assessment", school: "", location: "", date: "Graduation Date" },
    ],
    certifications: [
      { id: "c1", name: "BLS \u2013 Basic Life Support", issuer: "American Heart Association", date: "Expires July 2030" },
      { id: "c2", name: "ACLS \u2013 Advanced Cardiac Life Support", issuer: "American Heart Association", date: "Expires May 2029" },
      { id: "c3", name: "RN \u2013 Registered Nurse", issuer: "New York City", date: "Expires April 2032", licenseNumber: "License #222222" },
      { id: "c4", name: "CCRN \u2013 Certified Critical Care Nurse", issuer: "American Association of Critical Care Nurses", date: "Expires October 2028" },
    ],
    courses: STANDARD_COURSES_4,
    awards: [
      { id: "aw1", title: "ACHIEVEMENT HERE", issuer: "Hospital / Healthcare System", date: "Date" },
      { id: "aw2", title: "AWARD HERE", issuer: "Nursing Excellence Board", date: "Date" },
      { id: "aw3", title: "HONORS", issuer: "University / Medical Center", date: "Date" },
      { id: "aw4", title: "DAISY Award Nominee", issuer: "Regional Medical Center", date: "Date" },
    ],
    volunteering: [
      { id: "vl1", organization: "Charity / Organization", role: "Your Role", description: "Info about what you did", date: "Date" },
      { id: "vl2", organization: "Community Health Clinic", role: "Volunteer RN", description: "Provided free health screenings and patient education", date: "Date" },
      { id: "vl3", organization: "Red Cross Blood Drive", role: "Clinical Volunteer", description: "Supported donor triage and post-donation care", date: "Date" },
    ],
    memberships: [
      { id: "mb1", organization: "American Nurses Association", role: "Active Member", description: "National Chapter", date: "2021 \u2013 Present" },
      { id: "mb2", organization: "NY Nurses Association", role: "Registered Member", description: "State Chapter", date: "2015 \u2013 Present" },
    ],
    interests: [],
    customSections: [],
    coverLetter: {
      date: "Date Here",
      recipientName: "Hiring Manager",
      recipientTitle: "Director of Nursing",
      companyName: "Name of Hospital / Company",
      companyAddress: "City, State",
      greeting: "Dear Hiring Manager (or Dear Mr. Robertson):",
      openingParagraph:
        "I am writing to express my strong interest in the Registered Nurse position at your hospital. With over 6 years of hands-on clinical experience in acute and emergency care, I bring a steadfast commitment to patient safety, clinical excellence, and compassionate bedside care.",
      bodyParagraph:
        "Throughout my nursing career, I have thrived in fast-paced clinical environments requiring rapid triage, precise care coordination, and calm leadership.",
      highlightsIntro: "My accomplishments include the following:",
      bulletHighlights: [
        "Delivered safe, patient-centered bedside care to 5\u20136 high-acuity patients per shift while maintaining 94% patient satisfaction.",
        "Mentored and precepted 8 new graduate nurses, ensuring strict adherence to clinical protocols and HIPAA standards.",
        "Streamlined unit discharge education and follow-up protocols to help reduce avoidable patient readmissions.",
        "Collaborated seamlessly with interdisciplinary medical teams during acute emergencies and code responses.",
      ],
      closingParagraph:
        "I would welcome the opportunity to discuss how my clinical background, certifications (BLS, ACLS, CCRN), and dedication to patient advocacy can support your nursing unit. Thank you for your time and consideration.",
      signOff: "Sincerely,",
      signatureText: "Florence Nightingale",
    },
    references: [
      { id: "r1", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r2", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r3", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r4", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r5", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r6", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r7", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
      { id: "r8", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
    ],
  },
};

function cloneContent(seriesId: string): ResumeContent {
  const base = SAMPLE_CONTENT_BY_SERIES[seriesId] || SAMPLE_CONTENT_BY_SERIES["11"];
  return JSON.parse(JSON.stringify(base));
}

function cloneStyle(seriesId: string): DocumentStyleSettings {
  const base = DEFAULT_STYLE_BY_SERIES[seriesId] || DEFAULT_STYLE_BY_SERIES["11"];
  return JSON.parse(JSON.stringify(base));
}

function cloneSections(): SectionLayoutItem[] {
  return JSON.parse(JSON.stringify(DEFAULT_SECTION_ORDER));
}

const INITIAL_DOCUMENTS: ResumeDocument[] = [
  {
    id: "doc-executive",
    title: "Executive Resume",
    type: "resume",
    template: "2", seriesId: "2",
    updatedAt: "2026-11-18T14:00:00.000Z",
    edited: "Just now",
    score: 96,
    isPro: true,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["2"] || DEFAULT_STYLE_BY_SERIES["2"] },
    style: DEFAULT_STYLE_BY_SERIES["2"] || DEFAULT_STYLE_BY_SERIES["2"],
    content: SAMPLE_CONTENT_BY_SERIES["2"] || SAMPLE_CONTENT_BY_SERIES["2"],
    versions: [],
  },
  {
    id: "doc-ivy-league",
    title: "Ivy League Resume",
    type: "resume",
    template: "11", seriesId: "11",
    updatedAt: "2026-11-18T13:30:00.000Z",
    edited: "30 mins ago",
    score: 95,
    isPro: false,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["11"] || DEFAULT_STYLE_BY_SERIES["11"] },
    style: DEFAULT_STYLE_BY_SERIES["11"] || DEFAULT_STYLE_BY_SERIES["11"],
    content: SAMPLE_CONTENT_BY_SERIES["11"] || SAMPLE_CONTENT_BY_SERIES["11"],
    versions: [],
  },
  {
    id: "doc-elegant",
    title: "Elegant Resume",
    type: "resume",
    template: "3", seriesId: "3",
    updatedAt: "2026-11-18T13:00:00.000Z",
    edited: "1 hour ago",
    score: 94,
    isPro: true,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["3"] || DEFAULT_STYLE_BY_SERIES["3"] },
    style: DEFAULT_STYLE_BY_SERIES["3"] || DEFAULT_STYLE_BY_SERIES["3"],
    content: SAMPLE_CONTENT_BY_SERIES["3"] || SAMPLE_CONTENT_BY_SERIES["3"],
    versions: [],
  },
  {
    id: "doc-photo-column",
    title: "Photo Column Resume",
    type: "resume",
    template: "22", seriesId: "22",
    updatedAt: "2026-11-18T12:30:00.000Z",
    edited: "2 hours ago",
    score: 93,
    isPro: true,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["22"] || DEFAULT_STYLE_BY_SERIES["22"] },
    style: DEFAULT_STYLE_BY_SERIES["22"] || DEFAULT_STYLE_BY_SERIES["22"],
    content: SAMPLE_CONTENT_BY_SERIES["22"] || SAMPLE_CONTENT_BY_SERIES["22"],
    versions: [],
  },
  {
    id: "doc-modern",
    title: "Modern Healthcare Resume",
    type: "resume",
    template: "24", seriesId: "24",
    updatedAt: "2026-11-18T12:00:00.000Z",
    edited: "3 hours ago",
    score: 95,
    isPro: true,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["24"] || DEFAULT_STYLE_BY_SERIES["24"] },
    style: DEFAULT_STYLE_BY_SERIES["24"] || DEFAULT_STYLE_BY_SERIES["24"],
    content: SAMPLE_CONTENT_BY_SERIES["24"] || SAMPLE_CONTENT_BY_SERIES["24"],
    versions: [],
  },
  {
    id: "doc-contemporary",
    title: "Double Column Resume",
    type: "resume",
    template: "4", seriesId: "4",
    updatedAt: "2026-11-18T11:30:00.000Z",
    edited: "4 hours ago",
    score: 94,
    isPro: true,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["4"] || DEFAULT_STYLE_BY_SERIES["4"] },
    style: DEFAULT_STYLE_BY_SERIES["4"] || DEFAULT_STYLE_BY_SERIES["4"],
    content: SAMPLE_CONTENT_BY_SERIES["4"] || SAMPLE_CONTENT_BY_SERIES["4"],
    versions: [],
  },
  {
    id: "doc-minimal",
    title: "Minimal Resume",
    type: "resume",
    template: "14", seriesId: "14",
    updatedAt: "2026-11-18T11:00:00.000Z",
    edited: "5 hours ago",
    score: 92,
    isPro: false,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["14"] || DEFAULT_STYLE_BY_SERIES["14"] },
    style: DEFAULT_STYLE_BY_SERIES["14"] || DEFAULT_STYLE_BY_SERIES["14"],
    content: SAMPLE_CONTENT_BY_SERIES["14"] || SAMPLE_CONTENT_BY_SERIES["14"],
    versions: [],
  },
  {
    id: "doc-single-column", title: "Single Column Resume", type: "resume", template: "12", seriesId: "12",
    updatedAt: "2026-11-18T10:30:00.000Z",
    edited: "6 hours ago",
    score: 92,
    isPro: false,
    settings: { paperSize: "A4", targetPages: 1, style: DEFAULT_STYLE_BY_SERIES["12"] || DEFAULT_STYLE_BY_SERIES["12"] },
    style: DEFAULT_STYLE_BY_SERIES["12"] || DEFAULT_STYLE_BY_SERIES["12"],
    content: SAMPLE_CONTENT_BY_SERIES["12"] || SAMPLE_CONTENT_BY_SERIES["12"],
    versions: [],
  },
] as any;

const TRANSLATION_DICTIONARY: Record<string, {
  profession: string;
  summary: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  present: string;
  degreeTitle: string;
  universityName: string;
  certName: string;
  orgName: string;
  courseTitle: string;
  awardTitle: string;
  volunteerRole: string;
  greeting: string;
  signOff: string;
  bullets: string[];
}> = {
  French: {
    profession: "VOTRE PROFESSION",
    summary:
      "Profil professionnel orient\u00e9 vers les r\u00e9sultats, combinant leadership strat\u00e9gique, optimisation des processus et gestion d'\u00e9quipe. Expertise d\u00e9montr\u00e9e dans l'am\u00e9lioration de la performance op\u00e9rationnelle et la r\u00e9alisation d'objectifs mesurables.",
    jobTitle: "INTITUL\u00c9 DU POSTE",
    companyName: "Nom de l'entreprise",
    location: "Ville, Pays",
    present: "Date \u2013 Pr\u00e9sent",
    degreeTitle: "DIPL\u00d4ME UNIVERSITAIRE",
    universityName: "Nom de l'universit\u00e9",
    certName: "NOM DE LA CERTIFICATION",
    orgName: "Organisation",
    courseTitle: "FORMATION / ATELIER PROFESSIONNEL",
    awardTitle: "PRIX / DISTINCTION",
    volunteerRole: "R\u00f4le b\u00e9n\u00e9vole",
    greeting: "Madame, Monsieur,",
    signOff: "Cordialement,",
    bullets: [
      "Pilotage d'initiatives strat\u00e9giques g\u00e9n\u00e9rant une croissance mesurable de la productivit\u00e9 et une r\u00e9duction des co\u00fbts op\u00e9rationnels.",
      "Coordination d'\u00e9quipes pluridisciplinaires pour livrer des projets complexes dans les d\u00e9lais impartis.",
      "Optimisation des flux de travail et alignement des objectifs op\u00e9rationnels avec la strat\u00e9gie globale de l'entreprise.",
    ],
  },
  German: {
    profession: "IHR BERUFSTITEL",
    summary:
      "Ergebnisorientierte Fach- und F\u00fchrungskraft mit nachweislicher Erfolgsbilanz in der Prozessoptimierung, Projektleitung und strategischen Teamf\u00fchrung. Fokus auf messbare Gesch\u00e4ftsergebnisse und nachhaltige Effizienzsteigerung.",
    jobTitle: "IHRE POSITION HIER",
    companyName: "Unternehmensname",
    location: "Stadt, Land",
    present: "Datum \u2013 Heute",
    degreeTitle: "STUDIENABSCHLUSS",
    universityName: "Universit\u00e4tsname",
    certName: "ZERTIFIZIERUNGSNAME",
    orgName: "Organisation",
    courseTitle: "WEITERBILDUNG / WORKSHOP",
    awardTitle: "AUSZEICHNUNG / ERFOLG",
    volunteerRole: "Ehrenamtliche Rolle",
    greeting: "Sehr geehrte Damen und Herren,",
    signOff: "Mit freundlichen Gr\u00fc\u00dfen,",
    bullets: [
      "Leitung strategischer Initiativen zur Steigerung der operativen Effizienz und Senkung der Betriebskosten.",
      "Erfolgreiche Steuerung abteilungs\u00fcbergreifender Teams und termingerechte Umsetzung komplexer Projekte.",
      "Implementierung datengest\u00fctzter Workflows zur kontinuierlichen Qualit\u00e4ts- und Leistungsverbesserung.",
    ],
  },
  Spanish: {
    profession: "TU PROFESI\u00d3N",
    summary:
      "Profesional orientado a resultados con s\u00f3lida experiencia en liderazgo de equipos, optimizaci\u00f3n de procesos y gesti\u00f3n estrat\u00e9gica de proyectos. Comprometido con la excelencia operativa y el logro de metas cuantificables.",
    jobTitle: "T\u00cdTULO DEL PUESTO",
    companyName: "Nombre de la Empresa",
    location: "Ciudad, Pa\u00eds",
    present: "Fecha \u2013 Presente",
    degreeTitle: "T\u00cdTULO UNIVERSITARIO",
    universityName: "Nombre de la Universidad",
    certName: "NOMBRE DE LA CERTIFICACI\u00d3N",
    orgName: "Organizaci\u00f3n",
    courseTitle: "CURSO / TALLER PROFESIONAL",
    awardTitle: "PREMIO / LOGRO DESTACADO",
    volunteerRole: "Rol de Voluntariado",
    greeting: "Estimado/a Responsable de Contrataci\u00f3n:",
    signOff: "Atentamente,",
    bullets: [
      "Liderazgo de iniciativas clave que incrementaron la eficiencia operativa y redujeron los tiempos de entrega.",
      "Coordinaci\u00f3n de equipos multifuncionales logrando el cumplimiento del 98% de los objetivos trimestrales.",
      "Estandarizaci\u00f3n de procesos internos y mejora continua de la satisfacci\u00f3n del cliente.",
    ],
  },
  Arabic: {
    profession: "\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a",
    summary:
      "\u0645\u0647\u0646\u064a \u0645\u062a\u0645\u0631\u0633 \u064a\u0631\u0643\u0632 \u0639\u0644\u0649 \u062a\u062d\u0642\u064a\u0642 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0642\u064a\u0627\u0633\u060c \u0645\u0639 \u062e\u0628\u0631\u0629 \u0648\u0627\u0633\u0639\u0629 \u0641\u064a \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0648\u062a\u0637\u0648\u064a\u0631 \u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644 \u0648\u0642\u064a\u0627\u062f\u0629 \u0641\u0631\u0642 \u0627\u0644\u0639\u0645\u0644 \u0628\u0643\u0641\u0627\u0621\u0629 \u0639\u0627\u0644\u064a\u0629.",
    jobTitle: "\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a \u0647\u0646\u0627",
    companyName: "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629",
    location: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062f\u0648\u0644\u0629",
    present: "\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u2013 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646",
    degreeTitle: "\u0627\u0644\u062f\u0631\u062c\u0629 \u0627\u0644\u0639\u0644\u0645\u064a\u0629 / \u0627\u0644\u062a\u062e\u0635\u0635",
    universityName: "\u0627\u0633\u0645 \u0627\u0644\u062c\u0627\u0645\u0639\u0629",
    certName: "\u0627\u0633\u0645 \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629",
    orgName: "\u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u0645\u0627\u0646\u062d\u0629",
    courseTitle: "\u062f\u0648\u0631\u0629 \u062a\u062f\u0631\u064a\u0628\u064a\u0629 / \u0648\u0631\u0634\u0629 \u0639\u0645\u0644",
    awardTitle: "\u062c\u0627\u0626\u0632\u0629 / \u0625\u0646\u062c\u0627\u0632 \u0645\u0647\u0646\u064a",
    volunteerRole: "\u062f\u0648\u0631 \u062a\u0637\u0648\u0639\u064a",
    greeting: "\u0627\u0644\u0633\u064a\u062f/\u0629 \u0645\u062f\u064a\u0631 \u0627\u0644\u062a\u0648\u0638\u064a\u0641 \u0627\u0644\u0645\u062d\u062a\u0631\u0645\u060c",
    signOff: "\u0645\u0639 \u062e\u0627\u0644\u0635 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u060c",
    bullets: [
      "\u0642\u064a\u0627\u062f\u0629 \u0645\u0628\u0627\u062f\u0631\u0627\u062a \u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0623\u062f\u0627\u0621 \u0648\u062a\u062d\u0633\u064a\u0646 \u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629.",
      "\u0627\u0644\u062a\u0646\u0633\u064a\u0642 \u0628\u064a\u0646 \u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0644\u0636\u0645\u0627\u0646 \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0641\u064a \u0627\u0644\u0645\u0648\u0627\u0639\u064a\u062f \u0627\u0644\u0645\u062d\u062f\u062f\u0629.",
      "\u062a\u0637\u0628\u064a\u0642 \u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062a \u0627\u0644\u0645\u0647\u0646\u064a\u0629 \u0644\u062f\u0639\u0645 \u0627\u0644\u0623\u0647\u062f\u0627\u0641 \u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0644\u0644\u0645\u0624\u0633\u0633\u0629.",
    ],
  },
  Persian: {
    profession: "\u0639\u0646\u0648\u0627\u0646 \u0634\u063a\u0644\u06cc \u0634\u0645\u0627",
    summary:
      "\u0645\u062a\u062e\u0635\u0635 \u0646\u062a\u06cc\u062c\u0647\u200c\u0645\u062d\u0648\u0631 \u0628\u0627 \u0633\u0627\u0628\u0642\u0647 \u062f\u0631\u062e\u0634\u0627\u0646 \u062f\u0631 \u0645\u062f\u06cc\u0631\u06cc\u062a \u067e\u0631\u0648\u0698\u0647\u060c \u0628\u0647\u06cc\u0646\u0647\u200c\u0633\u0627\u0632\u06cc \u0641\u0631\u0622\u06cc\u0646\u062f\u0647\u0627 \u0648 \u0647\u062f\u0627\u06cc\u062a \u062a\u06cc\u0645\u200c\u0647\u0627\u06cc \u062a\u062e\u0635\u0635\u06cc. \u062a\u0645\u0631\u06a9\u0632 \u0628\u0631 \u0627\u06cc\u062c\u0627\u062f \u0627\u0631\u0632\u0634 \u0642\u0627\u0628\u0644\u200c\u0627\u0646\u062f\u0627\u0632\u0647\u200c\u06af\u06cc\u0631\u06cc \u0648 \u0627\u0631\u062a\u0642\u0627\u06cc \u0628\u0647\u0631\u0647\u200c\u0648\u0631\u06cc \u0633\u0627\u0632\u0645\u0627\u0646\u06cc.",
    jobTitle: "\u0639\u0646\u0648\u0627\u0646 \u0634\u063a\u0644\u06cc \u062e\u0648\u062f \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f",
    companyName: "\u0646\u0627\u0645 \u0634\u0631\u06a9\u062a / \u0633\u0627\u0632\u0645\u0627\u0646",
    location: "\u0634\u0647\u0631\u060c \u0627\u0633\u062a\u0627\u0646",
    present: "\u062a\u0627\u0631\u06cc\u062e \u2013 \u0627\u06a9\u0646\u0648\u0646",
    degreeTitle: "\u0645\u062f\u0631\u06a9 \u0648 \u0631\u0634\u062a\u0647 \u062a\u062d\u0635\u06cc\u0644\u06cc",
    universityName: "\u0646\u0627\u0645 \u062f\u0627\u0646\u0634\u06af\u0627\u0647",
    certName: "\u0639\u0646\u0648\u0627\u0646 \u06af\u0648\u0627\u0647\u06cc\u0646\u0627\u0645\u0647 \u062a\u062e\u0635\u0635\u06cc",
    orgName: "\u0646\u0627\u0645 \u0645\u0648\u0633\u0633\u0647 \u0635\u0627\u062f\u0631\u06a9\u0646\u0646\u062f\u0647",
    courseTitle: "\u062f\u0648\u0631\u0647 \u062a\u062e\u0635\u0635\u06cc / \u06a9\u0627\u0631\u06af\u0627\u0647 \u0622\u0645\u0648\u0632\u0634\u06cc",
    awardTitle: "\u062f\u0633\u062a\u0627\u0648\u0631\u062f / \u062a\u0642\u062f\u06cc\u0631\u0646\u0627\u0645\u0647",
    volunteerRole: "\u0641\u0639\u0627\u0644\u06cc\u062a \u062f\u0627\u0648\u0637\u0644\u0628\u0627\u0646\u0647",
    greeting: "\u0645\u062f\u06cc\u0631 \u0645\u062d\u062a\u0631\u0645 \u0627\u0633\u062a\u062e\u062f\u0627\u0645\u060c",
    signOff: "\u0628\u0627 \u0627\u062d\u062a\u0631\u0627\u0645\u060c",
    bullets: [
      "\u0647\u062f\u0627\u06cc\u062a \u067e\u0631\u0648\u0698\u0647\u200c\u0647\u0627\u06cc \u06a9\u0644\u06cc\u062f\u06cc \u0628\u0627 \u0647\u062f\u0641 \u0627\u0641\u0632\u0627\u06cc\u0634 \u0628\u0647\u0631\u0647\u200c\u0648\u0631\u06cc \u0648 \u06a9\u0627\u0647\u0634 \u0647\u0632\u06cc\u0646\u0647\u200c\u0647\u0627\u06cc \u0639\u0645\u0644\u06cc\u0627\u062a\u06cc.",
      "\u0647\u0645\u0627\u0647\u0646\u06af\u06cc \u0645\u0648\u062b\u0631 \u0645\u06cc\u0627\u0646 \u062a\u06cc\u0645\u200c\u0647\u0627\u06cc \u0686\u0646\u062f\u062a\u062e\u0635\u0635\u06cc \u0648 \u062a\u062d\u0648\u06cc\u0644 \u0628\u0647\u200c\u0645\u0648\u0642\u0639 \u062f\u0633\u062a\u0627\u0648\u0631\u062f\u0647\u0627\u06cc \u067e\u0631\u0648\u0698\u0647.",
      "\u0627\u0633\u062a\u0627\u0646\u062f\u0627\u0631\u062f\u0633\u0627\u0632\u06cc \u06af\u0632\u0627\u0631\u0634\u200c\u0647\u0627 \u0648 \u0628\u0647\u0628\u0648\u062f \u0645\u0633\u062a\u0645\u0631 \u06a9\u06cc\u0641\u06cc\u062a \u062e\u062f\u0645\u0627\u062a \u0648 \u0631\u0636\u0627\u06cc\u062a \u0645\u0634\u062a\u0631\u06cc\u0627\u0646.",
    ],
  },
};

function mapResumeDocToLegacyDoc(d: ResumeDocument): Doc {
  const tpl = SERIES_CATALOG.find((s) => s.id === d?.seriesId) || SERIES_CATALOG[0];
  const baseSettings = defaultSettings(tpl.columns === 2);
  return {
    id: d.id,
    type: d.activeTab === "cover" ? "cover" : "resume",
    activeTab: d.activeTab || "resume",
    title: d.title,
    template: d.seriesId,
    series: d.seriesId,
    language: d.language || "English",
    variant: tpl.ats ? "ats" : "design",
    accent: d.style?.accentColor || tpl.accentColor,
    font: tpl.headingFont,
    secondaryFont: tpl.bodyFont,
    score: d.atsScore,
    pinned: d.id === "d1",
    sectionOrder: d.sectionOrder,
    visibility: (d.sectionOrder || []).reduce((acc, s) => {
      acc[s.id] = s.visible;
      return acc;
    }, {} as Record<string, boolean>),
    settings: {
      ...baseSettings,
      pageSize: d.style?.pageSize || "A4",
      pageCount: d.style?.pageCount || 1,
      fontSize: d.style?.fontScale ? Math.round((d.style.fontScale / 100) * 10) : 10,
      lineHeight: d.style?.lineSpacing || 1.35,
      sectionSpacing: d.style?.sectionGapPx || 14,
      pageMargin: d.style?.pageMarginMm ? +(d.style.pageMarginMm / 25.4).toFixed(2) : 0.5,
    },
    createdAt: d.updatedAt,
    updatedAt: d.updatedAt,
    content: {
      name: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).fullName,
      firstName: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).firstName,
      lastName: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).lastName,
      role: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).profession || (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).title || "",
      email: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).email || "",
      phone: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).phone || "",
      location: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).location,
      linkedin: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).linkedin,
      website: "farnavi.com",
      summary: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).summary,
      skills: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).professionalSkills || [],
      technicalSkills: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).technicalSkills || [],
      sectionOrder: (d.sectionOrder || []).map((s) => s.id),
      experience: ((d.content || SAMPLE_CONTENT_BY_SERIES["2"]).experience || []).map((e) => ({
        id: e.id,
        role: e.title,
        company: e.company,
        location: e.location,
        period: e.period,
        showOverview: Boolean(e.summaryParagraph),
        overview: e.summaryParagraph || "",
        bullets: e.bullets || [],
        description: (e.bullets || []).join("\n"),
      })),
      education: ((d.content || SAMPLE_CONTENT_BY_SERIES["2"]).education || []).map((ed) => ({
        id: ed.id,
        degree: ed.degree,
        school: ed.school,
        location: ed.location,
        period: ed.date,
      })),
      certifications: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).certifications || [],
      courses: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).courses || [],
      awards: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).awards || [],
      volunteering: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).volunteering || [],
      memberships: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).memberships || [],
      interests: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).interests || [],
      references: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).references || [],
      extras: ["Certifications", "Courses", "Awards", "Volunteering"],
      extraDetails: {},
      letter: {
        to: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.recipientName,
        company: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.companyName,
        subject: (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.reSubject || "Application",
        body: [
          (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.openingParagraph,
          (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.bodyParagraph,
          (d.content || SAMPLE_CONTENT_BY_SERIES["2"]).coverLetter.closingParagraph,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    },
  };
}

export interface UnifiedAppStore {
  // Resume Studio API (useAppStore)
  documents: ResumeDocument[];
  activeDocId: string;
  activeDocument: ResumeDocument;
  activeSeries: SeriesTemplate;
  versions: VersionSnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  loadSampleOnTemplateSwitch: boolean;
  setLoadSampleOnTemplateSwitch: (val: boolean) => void;
  setActiveDocId: (id: string) => void;
  updateActiveDocument: (updater: (doc: ResumeDocument) => ResumeDocument) => void;
  updateActiveContent: (updater: (content: ResumeContent) => ResumeContent) => void;
  updateActiveStyle: (updater: (style: DocumentStyleSettings) => DocumentStyleSettings) => void;
  switchSeries: (seriesId: string, loadSample?: boolean) => void;
  resetToSeriesSample: (seriesId?: string) => void;
  createDocumentFromSeries: (seriesId: string, customTitle?: string, initialContent?: ResumeContent) => string;
  duplicateDocument: (id: string) => string;
  deleteDocument: (id: string) => void;
  saveVersionSnapshot: (label: string) => void;
  restoreVersionSnapshot: (snapshotId: string) => void;
  translateActiveDocument: (targetLanguage: string) => void;
  undo: () => void;
  redo: () => void;

  // Legacy Platform API (useStore)
  user: {
    name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  emblemType?: string;
  technicalSkills?: string[];
  sectionOrder?: string[];
    email: string;
    plan: string;
    target: string;
    completion: number;
    resumeUploaded?: boolean;
    matchChecked?: boolean;
  };
  setUser: (u: Partial<UnifiedAppStore["user"]>) => void;
  docs: Doc[];
  jobs: Job[];
  tracker: TrackItem[];
  interviews: Interview[];
  credits: number;
  setCredits: (n: number) => void;
  autoConfigured: boolean;
  setAutoConfigured: (b: boolean) => void;
  savedJobs: string[];
  toggleSaveJob: (id: string) => void;
  addDoc: (type: DocType, title: string, opts?: Partial<Doc>) => Doc;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  removeDoc: (id: string) => void;
  duplicateDoc: (id: string) => void;
  addTrack: (t: Omit<TrackItem, "id" | "date">) => void;
  moveTrack: (id: string, s: TrackStatus) => void;
  updateTrack: (id: string, patch: Partial<TrackItem>) => void;
  removeTrack: (id: string) => void;
  addInterview: (i: Omit<Interview, "id" | "createdAt">) => void;
  translateDoc: (id: string, targetLanguage: string) => void;
  saveDocVersion: (id: string, label?: string) => void;
  restoreDocVersion: (id: string, versionId: string) => void;
  resetDocToTemplateSample: (id: string, seriesId?: string) => void;
  upsertDocFromRemote: (remote: any) => void;
  authenticated: boolean;
  signOut: () => Promise<void>;
}

export const JUST_CREATED_DOC_IDS = new Set<string>();
const StoreContext = createContext<UnifiedAppStore | null>(null);
const STORAGE_KEY = "farnavi_store_v35";

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<ResumeDocument[]>(INITIAL_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>("d1");
  const [loadSampleOnTemplateSwitch, setLoadSampleOnTemplateSwitch] = useState<boolean>(false);
  const [historyPast, setHistoryPast] = useState<ResumeDocument[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<ResumeDocument[][]>([]);
  const [versions, setVersions] = useState<VersionSnapshot[]>([
    {
      id: "v-init",
      label: "Original Template Sample",
      timestamp: "Initial Baseline",
      seriesId: "11",
      content: cloneContent("11"),
      style: cloneStyle("11"),
    },
  ]);

  // Legacy Platform State
  const [user, setUserState] = useState<UnifiedAppStore["user"]>({
    name: "Viana Fariqi",
    email: "fariqiviana@gmail.com",
    plan: "Free",
    target: "Product Designer",
    completion: 85,
    resumeUploaded: true,
    matchChecked: true,
  });
  const [tracker, setTracker] = useState<TrackItem[]>(SEED_TRACK);
  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: "i1",
      title: "Senior Product Designer",
      company: "Nova Labs",
      seniority: "Senior",
      mode: "Personalized",
      createdAt: "Today",
    },
  ]);
  const [credits, setCredits] = useState(5);
  const [autoConfigured, setAutoConfigured] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>(["j2"]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
          const starterIds = new Map(INITIAL_DOCUMENTS.map((d) => [d.id, d]));
          const repaired = parsed.documents.map((d: any) => {
            const base = starterIds.get(d?.id);
            const badDate = !d?.updatedAt || Number.isNaN(Date.parse(d.updatedAt));
            if (base && (badDate || (d.id === "doc-executive" && String(d.seriesId || d.template) !== "2"))) {
              return base;
            }
            return badDate ? { ...d, updatedAt: new Date().toISOString() } : d;
          });
          const presentIds = new Set(repaired.map((d: any) => d?.id));
          const seenIds = new Set<string>();
          const seenUntouched = new Set<string>();
          const deduped = repaired.filter((d: any) => {
            if (!d?.id || seenIds.has(d.id)) return false;
            seenIds.add(d.id);
            const starterMatch = INITIAL_DOCUMENTS.find(
              (s) =>
                s.title === d.title &&
                String(s.seriesId) === String(d.seriesId || d.template) &&
                (d.content?.fullName || d.content?.name || "") ===
                  (s.content?.fullName || s.content?.name || "")
            );
            if (starterMatch) {
              if (d.id !== starterMatch.id && presentIds.has(starterMatch.id)) return false;
              if (seenUntouched.has(starterMatch.id)) return false;
              seenUntouched.add(starterMatch.id);
            }
            return true;
          });
          setDocuments(deduped);
        }
        if (parsed.activeDocId) {
          setActiveDocId(parsed.activeDocId);
        }
        if (parsed.user) {
          setUserState((prev) => ({ ...prev, ...parsed.user }));
        }
        if (Array.isArray(parsed.tracker)) {
          setTracker(parsed.tracker);
        }
        if (Array.isArray(parsed.interviews)) {
          setInterviews(parsed.interviews);
        }
      }
    } catch (err) { console.warn("[store]", err); }
  }, []);

  const signingOutRef = React.useRef(false);

  useEffect(() => {
    if (signingOutRef.current) return;
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ documents, activeDocId, user, tracker, interviews })
      );
    } catch (err) { console.warn("[store]", err); }
  }, [documents, activeDocId, user, tracker, interviews]);

  const activeDocument = documents.find((d) => d.id === activeDocId) || documents[0] || INITIAL_DOCUMENTS[0];
  const activeSeries =
    SERIES_CATALOG.find((s) => s.id === activeDocument?.seriesId) || SERIES_CATALOG[0];

  const pushUndoState = (currentDocs: ResumeDocument[]) => {
    setHistoryPast((prev) => [...prev.slice(-19), JSON.parse(JSON.stringify(currentDocs))]);
    setHistoryFuture([]);
  };

  const updateActiveDocument = (updater: (doc: ResumeDocument) => ResumeDocument) => {
    setDocuments((prev) => {
      pushUndoState(prev);
      return prev.map((d) =>
        d.id === activeDocument.id ? { ...updater(d), updatedAt: "Just now" } : d
      );
    });
  };

  const updateActiveContent = (updater: (content: ResumeContent) => ResumeContent) => {
    updateActiveDocument((doc) => ({
      ...doc,
      content: updater(doc.content),
    }));
  };

  const updateActiveStyle = (updater: (style: DocumentStyleSettings) => DocumentStyleSettings) => {
    updateActiveDocument((doc) => ({
      ...doc,
      style: updater(doc.style || cloneStyle(doc.seriesId)),
    }));
  };

  const switchSeries = (seriesId: string, loadSample?: boolean) => {
    const shouldLoad = loadSample !== undefined ? loadSample : loadSampleOnTemplateSwitch;
    const tpl = SERIES_CATALOG.find((s) => s.id === seriesId);
    const maxPages = tpl ? tpl.pages.length : 3;
    updateActiveDocument((doc) => {
      const baseStyle = cloneStyle(seriesId);
      const currentCount = doc.style?.pageCount || 1;
      const clampedCount = Math.min(currentCount, maxPages) as 1 | 2 | 3;
      return {
        ...doc,
        seriesId,
        title: shouldLoad && tpl ? `${tpl.name} Resume` : doc.title,
        style: {
          ...baseStyle,
          pageSize: doc.style?.pageSize || "A4",
          pageCount: clampedCount,
        },
        content: shouldLoad ? cloneContent(seriesId) : doc.content,
      };
    });
  };

  const resetToSeriesSample = (seriesId?: string) => {
    const targetSeries = seriesId || activeDocument.seriesId;
    const tpl = SERIES_CATALOG.find((s) => s.id === targetSeries);
    updateActiveDocument((doc) => ({
      ...doc,
      seriesId: targetSeries,
      language: "English",
      title: tpl ? `${tpl.name} Resume` : doc.title,
      style: cloneStyle(targetSeries),
      sectionOrder: cloneSections(),
      content: cloneContent(targetSeries),
    }));
  };

  const createDocumentFromSeries = (seriesId: string, customTitle?: string) => {
    const series = SERIES_CATALOG.find((s) => s.id === seriesId) || SERIES_CATALOG[0];
    const newId = "doc-" + Date.now().toString(36);
    const newDoc: ResumeDocument = {
      id: newId,
      title: customTitle || `${series.name} Resume`,
      seriesId: series.id,
      targetRole: series.WritePersona,
      language: "English",
      updatedAt: new Date().toISOString(),
      atsScore: series.ats ? 98 : 94,
      activeTab: "resume",
      style: cloneStyle(series.id),
      sectionOrder: cloneSections(),
      content: cloneContent(series.id),
    };
    JUST_CREATED_DOC_IDS.add(newId);
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newId);
    return newId;
  };

  const duplicateDocument = (id: string) => {
    const source = documents.find((d) => d.id === id) || activeDocument;
    const newId = "doc-" + Date.now().toString(36);
    const copy: ResumeDocument = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      title: `${source.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [copy, ...prev]);
    setActiveDocId(newId);
    return newId;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) return INITIAL_DOCUMENTS;
      if (activeDocId === id) {
        setActiveDocId(filtered[0].id);
      }
      return filtered;
    });
  };

  const saveVersionSnapshot = (label: string) => {
    const snap: VersionSnapshot = {
      id: "v-" + Date.now().toString(36),
      label: label || `Snapshot (${activeSeries.name})`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      seriesId: activeDocument.seriesId,
      content: JSON.parse(JSON.stringify(activeDocument.content)),
      style: JSON.parse(JSON.stringify(activeDocument.style)),
    };
    setVersions((prev) => [snap, ...prev]);
  };

  const restoreVersionSnapshot = (snapshotId: string) => {
    const snap = versions.find((v) => v.id === snapshotId);
    if (!snap) return;
    updateActiveDocument((doc) => ({
      ...doc,
      seriesId: snap.seriesId,
      content: JSON.parse(JSON.stringify(snap.content)),
      style: JSON.parse(JSON.stringify(snap.style)),
    }));
  };

  const translateActiveDocument = (targetLanguage: string) => {
    if (targetLanguage === "English") {
      const sample = cloneContent(activeDocument.seriesId);
      updateActiveDocument((doc) => ({
        ...doc,
        language: "English",
        content: {
          ...sample,
          fullName: doc.content.fullName,
          phone: doc.content.phone,
          email: doc.content.email,
          linkedin: doc.content.linkedin,
        },
      }));
      return;
    }

    const dict = TRANSLATION_DICTIONARY[targetLanguage];
    if (!dict) return;

    updateActiveDocument((doc) => ({
      ...doc,
      language: targetLanguage,
      content: {
        ...doc.content,
        profession: dict.profession,
        summary: dict.summary,
        experience: doc.content.experience.map((exp, idx) => ({
          ...exp,
          title: dict.jobTitle,
          company: dict.companyName,
          location: dict.location,
          period: idx === 0 ? dict.present : exp.period,
          summaryParagraph: undefined,
          bullets: dict.bullets,
        })),
        education: doc.content.education.map((ed) => ({
          ...ed,
          degree: dict.degreeTitle,
          school: dict.universityName,
          location: dict.location,
        })),
        certifications: doc.content.certifications.map((cert) => ({
          ...cert,
          name: dict.certName,
          issuer: dict.orgName,
        })),
        courses: (doc.content.courses || []).map((cr) => ({
          ...cr,
          title: dict.courseTitle,
          institution: dict.orgName,
        })),
        awards: (doc.content.awards || []).map((aw) => ({
          ...aw,
          title: dict.awardTitle,
          issuer: dict.orgName,
        })),
        volunteering: (doc.content.volunteering || []).map((vl) => ({
          ...vl,
          organization: dict.orgName,
          role: dict.volunteerRole,
        })),
        coverLetter: {
          ...doc.content.coverLetter,
          greeting: dict.greeting,
          openingParagraph: dict.summary,
          bodyParagraph: dict.bullets.join(" "),
          signOff: dict.signOff,
        },
      },
    }));
  };

  const undo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, -1));
    setHistoryFuture((prev) => [JSON.parse(JSON.stringify(documents)), ...prev]);
    setDocuments(previous);
  };

  const redo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, JSON.parse(JSON.stringify(documents))]);
    setDocuments(next);
  };

  // Legacy Platform Bridge Methods
  const legacyDocs = documents.map(mapResumeDocToLegacyDoc);

    const upsertDocFromRemote = React.useCallback((remote: any) => {
    if (!remote?.id) return;
    const rawSeries = String(remote.seriesId || remote.series || remote.template || '11');
    const matchedSeries = SERIES_CATALOG.find((sc) => sc.id === rawSeries)?.id || '11';
    const baseStyle = cloneStyle(matchedSeries);
    const rSettings = remote.settings || {};
    const nextStyle: DocumentStyleSettings = {
      ...baseStyle,
      pageSize: rSettings.pageSize === 'Letter' ? 'Letter' : 'A4',
      pageCount: (rSettings.pageCount === 2 ? 2 : rSettings.pageCount === 3 ? 3 : 1) as 1 | 2 | 3,
      accentColor: remote.accent || baseStyle.accentColor,
      fontScale: rSettings.fontSize ? Math.round((Number(rSettings.fontSize) / 10) * 100) : baseStyle.fontScale,
      lineSpacing: Number(rSettings.lineHeight) || baseStyle.lineSpacing,
      sectionGapPx: Number(rSettings.sectionSpacing) || baseStyle.sectionGapPx,
      pageMarginMm: rSettings.pageMargin ? +(Number(rSettings.pageMargin) * 25.4).toFixed(1) : baseStyle.pageMarginMm,
    };
    const c = remote.content || {};
    const baseContent = cloneContent(matchedSeries);
    const nextContent: ResumeContent = {
      ...baseContent,
      fullName: c.name ?? c.fullName ?? baseContent.fullName,
      firstName: c.firstName !== undefined ? c.firstName : baseContent.firstName,
      lastName: c.lastName !== undefined ? c.lastName : baseContent.lastName,
      profession: c.role ?? c.profession ?? baseContent.profession,
      email: c.email ?? baseContent.email,
      phone: c.phone ?? baseContent.phone,
      location: c.location ?? baseContent.location,
      linkedin: c.linkedin ?? baseContent.linkedin,
      summary: c.summary ?? baseContent.summary,
      professionalSkills: Array.isArray(c.skills) ? c.skills : baseContent.professionalSkills,
      technicalSkills: Array.isArray(c.technicalSkills) ? c.technicalSkills : baseContent.technicalSkills,
      experience: Array.isArray(c.experience) ? c.experience.map((e: any) => ({
        id: e.id || 'exp-' + Math.random().toString(36).slice(2, 7),
        title: e.role || e.title || '',
        company: e.company || '',
        location: e.location || '',
        period: e.period || '',
        summaryParagraph: e.showOverview ? e.overview : undefined,
        bullets: Array.isArray(e.bullets) ? e.bullets : String(e.description || '').split(/\r?\n/).map((x: string) => x.trim()).filter(Boolean),
      })) : baseContent.experience,
      education: Array.isArray(c.education) ? c.education.map((ed: any) => ({
        id: ed.id || 'edu-' + Math.random().toString(36).slice(2, 7),
        degree: ed.degree || '',
        school: ed.school || '',
        location: ed.location || '',
        date: ed.period || ed.date || '',
      })) : baseContent.education,
      certifications: Array.isArray(c.certifications) ? c.certifications : baseContent.certifications,
      courses: Array.isArray(c.courses) ? c.courses : baseContent.courses,
      awards: Array.isArray(c.awards) ? c.awards : baseContent.awards,
      volunteering: Array.isArray(c.volunteering) ? c.volunteering : baseContent.volunteering,
      memberships: Array.isArray(c.memberships) ? c.memberships : baseContent.memberships,
      interests: Array.isArray(c.interests) ? c.interests : baseContent.interests,
      areasOfExpertise: Array.isArray(c.areasOfExpertise) ? c.areasOfExpertise : baseContent.areasOfExpertise,
      photoUrl: c.photoUrl ?? c.photo ?? baseContent.photoUrl,
      coverLetter: c.coverLetter ? { ...baseContent.coverLetter, ...c.coverLetter } : baseContent.coverLetter,
      references: Array.isArray(c.references) ? c.references : baseContent.references,
    };
    const nextDoc: ResumeDocument = {
      id: String(remote.id),
      title: remote.title || 'Untitled Resume',
      seriesId: matchedSeries,
      targetRole: remote.targetJobTitle || nextContent.profession || 'Professional',
      language: remote.language || 'English',
      updatedAt: remote.updatedAt || new Date().toISOString(),
      atsScore: Number(remote.score) || 95,
      activeTab: (remote.activeTab === 'cover' || remote.activeTab === 'references' ? remote.activeTab : 'resume'),
      style: nextStyle,
      sectionOrder: Array.isArray(remote.sectionOrder) && remote.sectionOrder.length > 0 ? remote.sectionOrder : cloneSections(),
      content: nextContent,
    };
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === nextDoc.id);
      return exists ? prev.map((d) => (d.id === nextDoc.id ? nextDoc : d)) : [nextDoc, ...prev];
    });
  }, []);
  const addDoc = (_type: DocType, title: string, opts: Partial<Doc> = {}): Doc => {
    const rawTpl = opts.template || opts.series || "11";
    const matchedSeries =
      (SERIES_CATALOG.find((s) => s.id === String(rawTpl))?.id || SERIES_CATALOG.find((s) => s.id === String(rawTpl).replace(/[^0-9]/g, ""))?.id || "11");
    const newId = createDocumentFromSeries(matchedSeries, title);
    const created = documents.find((d) => d.id === newId) || {
      id: newId,
      title,
      seriesId: matchedSeries,
      targetRole: "Professional",
      language: "English",
      updatedAt: new Date().toISOString(),
      atsScore: 95,
      activeTab: "resume" as const,
      style: cloneStyle(matchedSeries),
      sectionOrder: cloneSections(),
      content: cloneContent(matchedSeries),
    };
    return mapResumeDocToLegacyDoc(created);
  };

  const updateDoc = (id: string, patch: Partial<Doc>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const rawNextSeries = patch.series || patch.template;
        const nextSeries =
          rawNextSeries && SERIES_CATALOG.some((s) => s.id === rawNextSeries)
            ? rawNextSeries
            : rawNextSeries
            ? rawNextSeries.replace(/[^0-9]/g, "") || d.seriesId
            : d.seriesId;
        const seriesChanged = nextSeries !== d.seriesId && SERIES_CATALOG.some((s) => s.id === nextSeries);
        const tpl = SERIES_CATALOG.find((s) => s.id === nextSeries) || SERIES_CATALOG[0];

        let nextStyle: DocumentStyleSettings = {
          ...(d.style || cloneStyle(nextSeries)),
          accentColor: patch.accent || (seriesChanged ? tpl.accentColor : d.style?.accentColor || tpl.accentColor),
        };
        if (patch.settings) {
          if (patch.settings.pageSize) nextStyle.pageSize = patch.settings.pageSize;
          if (patch.settings.pageCount) {
            const maxP = tpl.pages.length as 1 | 2 | 3;
            nextStyle.pageCount = Math.min(patch.settings.pageCount, maxP) as 1 | 2 | 3;
          }
          if (patch.settings.fontSize) nextStyle.fontScale = Math.round((patch.settings.fontSize / 10) * 100);
          if (patch.settings.lineHeight) nextStyle.lineSpacing = patch.settings.lineHeight;
          if (patch.settings.sectionSpacing) nextStyle.sectionGapPx = patch.settings.sectionSpacing;
          if (patch.settings.pageMargin) nextStyle.pageMarginMm = +(patch.settings.pageMargin * 25.4).toFixed(1);
        }

        let nextSectionOrder = [...(d.sectionOrder || cloneSections())];
        if (patch.content?.sectionOrder && Array.isArray(patch.content.sectionOrder)) {
          const orderIds = patch.content.sectionOrder;
          nextSectionOrder.sort((a, b) => {
            const ia = orderIds.indexOf(a.id);
            const ib = orderIds.indexOf(b.id);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
        }
        if (patch.visibility) {
          nextSectionOrder = nextSectionOrder.map((s) =>
            patch.visibility && s.id in patch.visibility
              ? { ...s, visible: Boolean(patch.visibility[s.id]) }
              : s
          );
        }

        let nextContent: ResumeContent = { ...d.content };

        if (patch.content) {
          const c = patch.content;
          if (seriesChanged && c.name === SAMPLE_CONTENT_BY_SERIES[nextSeries]?.fullName) {
            nextContent = cloneContent(nextSeries);
          } else {
            const nextFullName = c.name ?? nextContent.fullName;
            let nextFirstName = c.firstName !== undefined ? c.firstName : nextContent.firstName;
            let nextLastName = c.lastName !== undefined ? c.lastName : nextContent.lastName;
            if (
              nextFullName &&
              nextFullName !== nextContent.fullName &&
              `${nextFirstName || ""} ${nextLastName || ""}`.trim().toLowerCase() !== nextFullName.trim().toLowerCase()
            ) {
              const nameParts = nextFullName.trim().split(/\s+/);
              nextFirstName = nameParts[0] || "";
              nextLastName = nameParts.slice(1).join(" ");
            }
            nextContent = {
              ...nextContent,
              fullName: nextFullName,
              firstName: nextFirstName,
              lastName: nextLastName,
              profession: c.role ?? nextContent.profession,
              email: c.email ?? nextContent.email,
              phone: c.phone ?? nextContent.phone,
              location: c.location ?? nextContent.location,
              linkedin: c.linkedin ?? nextContent.linkedin,
              summary: c.summary ?? nextContent.summary,
              professionalSkills: Array.isArray(c.skills) ? c.skills : nextContent.professionalSkills,
              technicalSkills: Array.isArray(c.technicalSkills) ? c.technicalSkills : nextContent.technicalSkills,
              experience: Array.isArray(c.experience)
                ? c.experience.map((e) => ({
                    id: e.id,
                    title: e.role,
                    company: e.company,
                    location: e.location || "",
                    period: e.period,
                    summaryParagraph: e.showOverview ? e.overview : undefined,
                    bullets:
                      Array.isArray(e.bullets) && e.bullets.length > 0
                        ? e.bullets
                        : (e.description || "")
                            .split(/\r?\n/)
                            .map((line) => line.replace(/^[â€¢\-\*]\s*/, "").trim())
                            .filter(Boolean),
                  }))
                : nextContent.experience,
              education: Array.isArray(c.education)
                ? c.education.map((ed) => ({
                    id: ed.id,
                    degree: ed.degree,
                    school: ed.school,
                    location: ed.location || "",
                    date: ed.period,
                  }))
                : nextContent.education,
              certifications: Array.isArray(c.certifications) ? c.certifications : nextContent.certifications,
              courses: Array.isArray(c.courses) ? c.courses : nextContent.courses,
              awards: Array.isArray(c.awards) ? c.awards : nextContent.awards,
              volunteering: Array.isArray(c.volunteering) ? c.volunteering : nextContent.volunteering,
              memberships: Array.isArray(c.memberships) ? c.memberships : nextContent.memberships,
              interests: Array.isArray(c.interests) ? c.interests : nextContent.interests,
              areasOfExpertise: Array.isArray((c as any).areasOfExpertise) ? (c as any).areasOfExpertise : nextContent.areasOfExpertise,
              photoUrl: (c as any).photoUrl ?? nextContent.photoUrl,
              coverLetter: (c as any).coverLetter ? { ...nextContent.coverLetter, ...(c as any).coverLetter } : nextContent.coverLetter,
              references: Array.isArray(c.references) ? c.references : nextContent.references,
            };
          }
        }

        const nextTab =
          patch.activeTab ||
          (patch.type === "cover" ? "cover" : patch.type === "resume" ? "resume" : d.activeTab);

        return {
          ...d,
          title: patch.title ?? (seriesChanged && SERIES_CATALOG.some((sc) => d.title === `${sc.name} Resume`) ? `${tpl.name} Resume` : d.title),
          seriesId: nextSeries,
          activeTab: nextTab,
          style: nextStyle,
          sectionOrder: nextSectionOrder,
          content: nextContent,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

    const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGetMe();
        if (cancelled) return;
        if (me.authenticated && me.user) {
          setAuthenticated(true);
          setUserState((prev) => ({
            ...prev,
            name: me.user!.name,
            email: me.user!.email,
            plan: (me.user!.plan === "Pro" ? "Pro" : "Free") as any,
          }));
        } else {
          setAuthenticated(false);
        }

        const [dbTracks, dbInterviews, dbDocs] = await Promise.all([
          apiListTracker(),
          apiListInterviews(),
          me.authenticated ? apiListDocuments() : Promise.resolve(null),
        ]);
        if (cancelled) return;

        if (me.authenticated) {
          setTracker(dbTracks as TrackItem[]);
          setInterviews(dbInterviews as Interview[]);
          if (Array.isArray(dbDocs)) {
            if (dbDocs.length > 0) {
              dbDocs.forEach((rd) => upsertDocFromRemote(rd));
              const dbIds = new Set(dbDocs.map((rd) => rd.id));
              setDocuments((prev) => prev.filter((d) => dbIds.has(d.id)));
            } else {
              setDocuments([]);
            }
          }
        } else {
          if (dbTracks.length > 0) setTracker(dbTracks as TrackItem[]);
          if (dbInterviews.length > 0) setInterviews(dbInterviews as Interview[]);
        }
      } catch (err) {
        console.warn("[store] DB workspace hydration warning:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [upsertDocFromRemote]);

  const signOut = React.useCallback(async () => {
    signingOutRef.current = true;
    try { await apiLogout(); } catch (err) { console.warn("[store] signOut error:", err); }
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("farnavi_")) localStorage.removeItem(k);
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("farnavi_")) sessionStorage.removeItem(k);
      }
    } catch (err) { console.warn("[store] clear error:", err); }
    setAuthenticated(false);
    window.location.assign("/login");
  }, []);

  const addTrackDb = (item: Omit<TrackItem, "id" | "date">) => {
    const id = "tr_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    const date = new Date().toISOString().slice(0, 10);
    const next: TrackItem = { ...item, id, date };
    setTracker((prev) => [next, ...prev]);
    apiCreateTracker(next).catch((err) => console.warn("[store] addTrack sync error:", err));
  };
  const moveTrackDb = (id: string, status: TrackStatus) => {
    setTracker((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    apiUpdateTracker(id, { status }).catch((err) => console.warn("[store] moveTrack sync error:", err));
  };
  const updateTrackDb = (id: string, patch: Partial<TrackItem>) => {
    setTracker((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    apiUpdateTracker(id, patch).catch((err) => console.warn("[store] updateTrack sync error:", err));
  };
  const removeTrackDb = (id: string) => {
    setTracker((prev) => prev.filter((t) => t.id !== id));
    apiDeleteTracker(id).catch((err) => console.warn("[store] removeTrack sync error:", err));
  };
  const addInterviewDb = (item: Omit<Interview, "id" | "createdAt">) => {
    const id = "int_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    const createdAt = new Date().toISOString();
    const next: Interview = { ...item, id, createdAt };
    setInterviews((prev) => [next, ...prev]);
    apiCreateInterview(next).catch((err) => console.warn("[store] addInterview sync error:", err));
  };
return (
    <StoreContext.Provider
      value={{
        documents,
        activeDocId,
        activeDocument,
        activeSeries,
        versions,
        canUndo: historyPast.length > 0,
        canRedo: historyFuture.length > 0,
        loadSampleOnTemplateSwitch,
        setLoadSampleOnTemplateSwitch,
        setActiveDocId,
        updateActiveDocument,
        updateActiveContent,
        updateActiveStyle,
        switchSeries,
        resetToSeriesSample,
        createDocumentFromSeries,
        duplicateDocument,
        deleteDocument,
        saveVersionSnapshot,
        restoreVersionSnapshot,
        translateActiveDocument,
        undo,
        redo,
        user,
        setUser: (u) => setUserState((p) => ({ ...p, ...u })),
        docs: legacyDocs,
        jobs: SEED_JOBS,
        tracker,
        interviews,
        credits,
        setCredits,
        autoConfigured,
        setAutoConfigured,
        savedJobs,
        toggleSaveJob: (id) =>
          setSavedJobs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
        addDoc,
        upsertDocFromRemote,
        authenticated,
        signOut,
        updateDoc,
        removeDoc: deleteDocument,
        duplicateDoc: (id) => {
          duplicateDocument(id);
        },
        addTrack: addTrackDb,
        moveTrack: moveTrackDb,
        updateTrack: updateTrackDb,
        removeTrack: removeTrackDb,
        addInterview: addInterviewDb,
        translateDoc: (_id, lang) => translateActiveDocument(lang),
        saveDocVersion: (_id, label) => saveVersionSnapshot(label || "Saved Version"),
        restoreDocVersion: (_id, versionId) => restoreVersionSnapshot(versionId),
        resetDocToTemplateSample: (id, seriesId) => {
          setDocuments((prev) =>
            prev.map((d) => {
              if (d.id !== id) return d;
              const targetSeries = seriesId || d.seriesId;
              const tpl = SERIES_CATALOG.find((sc) => sc.id === targetSeries);
              return {
                ...d,
                seriesId: targetSeries,
                language: "English",
                title: tpl ? `${tpl.name} Resume` : d.title,
                style: cloneStyle(targetSeries),
                sectionOrder: cloneSections(),
                content: cloneContent(targetSeries),
                updatedAt: new Date().toISOString(),
              };
            })
          );
        },
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const StoreProvider = AppStoreProvider;

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
export function templateContentForSeries(seriesId?: string): Content {
  const id = seriesId && SAMPLE_CONTENT_BY_SERIES[seriesId] ? seriesId : "11";
  const src = SAMPLE_CONTENT_BY_SERIES[id];
  return {
    name: src.fullName,
    firstName: src.firstName,
    lastName: src.lastName,
    role: src.profession,
    email: src.email,
    phone: src.phone,
    location: src.location,
    linkedin: src.linkedin,
    website: "farnavi.com",
    summary: src.summary,
    experience: src.experience.map((e) => ({
      id: e.id,
      role: e.title,
      company: e.company,
      location: e.location,
      period: e.period,
      description: [e.summaryParagraph, ...(e.bullets || [])].filter(Boolean).join("\n"),
    })),
    education: src.education.map((ed) => ({
      id: ed.id,
      degree: ed.degree,
      school: ed.school,
      location: ed.location,
      period: ed.date,
    })),
    skills: [...(src.professionalSkills || []), ...(src.technicalSkills || [])],
    extras: ["Certifications", "Courses"],
    extraDetails: {
      Certifications: (src.certifications || []).map((c) => `${c.name} - ${c.issuer} (${c.date})`).join("\n"),
      Courses: (src.courses || []).map((c) => `${c.title} - ${c.institution} (${c.date})`).join("\n"),
    },
    letter: {
      to: src.coverLetter.recipientName,
      company: src.coverLetter.companyName,
      subject: src.coverLetter.reSubject || "Application",
      body: [
        src.coverLetter.greeting,
        src.coverLetter.openingParagraph,
        src.coverLetter.bodyParagraph,
        src.coverLetter.closingParagraph,
        src.coverLetter.signOff,
        src.coverLetter.signatureText,
      ].join("\n\n"),
    },
  };
}