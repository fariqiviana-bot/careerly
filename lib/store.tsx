"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { TrackStatus } from "./catalog";
import { TEMPLATES } from "./catalog";

export const uid = () => Math.random().toString(36).slice(2, 9);
export type DocType = "resume" | "cover" | "resignation" | "website" | "tailored";
export type Exp = { id: string; role: string; company: string; location?: string; period: string; current?: boolean; description: string };
export type Edu = { id: string; degree: string; field?: string; school: string; location?: string; period: string; current?: boolean; description?: string };

export type Content = {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
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
};

export type Doc = {
  id: string;
  type: DocType;
  title: string;
  template: string;
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
  content: Content;
};

export type Job = {
  id: string; title: string; company: string; location: string; mode: "Remote" | "Hybrid" | "On-site";
  salary: string; tags: string[]; posted: string; risk: "Low" | "Moderate"; applicants: number; rating: number; reviews: number; summary: string;
};
export type TrackItem = { id: string; title: string; company: string; url: string; status: TrackStatus; location: string; salary: string; notes: string; date: string; resumeId?: string; coverId?: string };
export type Interview = { id: string; title: string; company: string; seniority: string; mode: string; createdAt: string };

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
} {
  let score = 15; // امتیاز پایه مطابق Resume.io
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
    { id: uid(), role: "Product Designer", company: "Rangin Agency", location: "Tehran", period: "Jan 2023 — Present", current: true, description: "Led redesign of onboarding; +18% activation. Built a 120-component design system." },
  ],
  education: [
    { id: uid(), degree: "BSc, Cellular & Molecular Biology", school: "University of Tehran", location: "Tehran", period: "Sep 2024 — Present", current: true }
  ],
  skills: ["Figma", "Design Systems", "Prototyping", "User Research", "HTML/CSS", "Interaction Design"],
  extras: ["Projects", "Languages"],
  extraDetails: {
    Projects: "Farnavi Career OS — Designed and built a full-stack career & resume platform.\nDesign System Kit — Created a 120-component token-driven UI library.",
    Languages: "Persian (Native) · English (Professional proficiency)",
  },
  letter: {
    to: "Hiring Manager",
    company: "Telgorithm",
    subject: "Application for Marketing Manager",
    body: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Marketing Manager position at Telgorithm. With over 4 years of experience shaping B2B SaaS products, building scalable design systems, and driving user activation up by 18%, I am confident in my ability to contribute immediately to your growth initiatives.\n\nThank you for your time and consideration.\n\nSincerely,\nViana Fariqi"
  },
});

const now = () => new Date().toISOString();

const seedDocs: Doc[] = [
  {
    id: "d1",
    type: "resume",
    title: "Viana Fariqi — Editorial Resume",
    template: "editorial-11",
    accent: "#202124",
    font: "Merriweather",
    secondaryFont: "Lato",
    score: 15,
    pinned: true,
    label: "Primary Resume",
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "d2",
    type: "tailored",
    title: "Telgorithm — Marketing Manager (ATS)",
    template: "prime-ats-11",
    accent: "#3d4a3f",
    font: "Merriweather",
    secondaryFont: "Lato",
    score: 82,
    pinned: false,
    label: "Tailored for Telgorithm",
    settings: defaultSettings(false),
    createdAt: now(),
    updatedAt: now(),
    content: { ...baseContent(), role: "Marketing Manager" },
  },
  {
    id: "d3",
    type: "resume",
    title: "Viana Fariqi — Harmonized Resume",
    template: "harmonized-12",
    accent: "#5d6f61",
    font: "Manrope",
    secondaryFont: "Lato",
    score: 78,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "d4",
    type: "resume",
    title: "Viana Fariqi — Calligraphic Signature",
    template: "calligraphic-14",
    accent: "#706A62",
    font: "Merriweather",
    secondaryFont: "Merriweather",
    score: 80,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "d5",
    type: "resume",
    title: "Viana Fariqi — Executive Crest",
    template: "crest-22",
    accent: "#3d4a3f",
    font: "Merriweather",
    secondaryFont: "Merriweather",
    score: 86,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "c1",
    type: "cover",
    title: "Cover Letter — Telgorithm (Editorial)",
    template: "editorial-11",
    accent: "#202124",
    font: "Merriweather",
    secondaryFont: "Lato",
    score: 90,
    pinned: true,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "c2",
    type: "cover",
    title: "Cover Letter — Harmonized Suite",
    template: "harmonized-12",
    accent: "#5d6f61",
    font: "Manrope",
    secondaryFont: "Lato",
    score: 88,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "c3",
    type: "cover",
    title: "Cover Letter — Calligraphic Signature",
    template: "calligraphic-14",
    accent: "#706A62",
    font: "Merriweather",
    score: 88,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "c4",
    type: "cover",
    title: "Cover Letter — Executive Crest",
    template: "crest-22",
    accent: "#3d4a3f",
    font: "Merriweather",
    score: 92,
    pinned: false,
    settings: defaultSettings(true),
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
  {
    id: "w1",
    type: "website",
    title: "Viana Fariqi Personal Website",
    template: "editorial-11",
    webTemplate: "editorial",
    slug: "viana-fariqi",
    accent: "#5d6f61",
    font: "Merriweather",
    score: 0,
    pinned: false,
    published: true,
    createdAt: now(),
    updatedAt: now(),
    content: baseContent(),
  },
];

const seedJobs: Job[] = [
  { id: "j1", title: "Remote Product Designer", company: "Pellera", location: "United States", mode: "Remote", salary: "$90k – $120k", tags: ["Figma", "B2B", "SaaS"], posted: "2d ago", risk: "Low", applicants: 214, rating: 4.1, reviews: 128, summary: "Own end-to-end design for a B2B analytics suite. Strong systems thinking and Figma proficiency required." },
  { id: "j2", title: "Senior Product Designer", company: "Nova Labs", location: "Tehran, Iran", mode: "Hybrid", salary: "$10k – $20k / yr", tags: ["Design Systems", "Mobile"], posted: "Today", risk: "Moderate", applicants: 1050, rating: 2.8, reviews: 5, summary: "Lead designer for a fintech super-app. Mentor 3 designers; drive research ops." },
  { id: "j3", title: "Marketing Manager", company: "Telgorithm", location: "US Remote", mode: "Remote", salary: "$58 – $63 / hr", tags: ["B2B Marketing", "SaaS", "Automation"], posted: "4d ago", risk: "Low", applicants: 96, rating: 4.4, reviews: 61, summary: "Own demand gen for a messaging API platform. Event marketing + lifecycle." },
  { id: "j4", title: "Frontend Developer", company: "CM.com", location: "Amsterdam", mode: "On-site", salary: "€55k – €70k", tags: ["React", "TypeScript"], posted: "1d ago", risk: "Low", applicants: 180, rating: 3.9, reviews: 84, summary: "Build conversational commerce UI in React + TS." },
  { id: "j5", title: "UX Writer", company: "Euler", location: "Berlin", mode: "Remote", salary: "€45k – €58k", tags: ["Content", "UX"], posted: "3d ago", risk: "Moderate", applicants: 410, rating: 3.5, reviews: 22, summary: "Craft flows for a data platform; partner with design + PM." },
  { id: "j6", title: "Data Analyst", company: "Cardinal Health", location: "Dublin", mode: "Hybrid", salary: "€48k – €60k", tags: ["SQL", "Python"], posted: "5d ago", risk: "Low", applicants: 320, rating: 3.7, reviews: 210, summary: "Analytics for supply-chain ops; SQL + dashboards." },
];

const seedTrack: TrackItem[] = [
  { id: "t1", title: "Remote Product Designer", company: "Pellera", url: "https://example.com/j1", status: "recommended", location: "Remote", salary: "$90k–120k", notes: "", date: now() },
  { id: "t2", title: "UX Writer", company: "Euler", url: "https://example.com/j5", status: "recommended", location: "Berlin", salary: "€45k–58k", notes: "", date: now() },
  { id: "t3", title: "Data Analyst", company: "Cardinal Health", url: "https://example.com/j6", status: "shortlist", location: "Dublin", salary: "€48k–60k", notes: "Referral via Sara", date: now() },
  { id: "t4", title: "Marketing Manager", company: "Telgorithm", url: "https://example.com/j3", status: "auto", location: "Remote", salary: "$58–63/hr", notes: "", date: now() },
  { id: "t5", title: "Frontend Developer", company: "CM.com", url: "https://example.com/j4", status: "applied", location: "Amsterdam", salary: "€55k–70k", notes: "Applied via site", date: now() },
  { id: "t6", title: "Senior Product Designer", company: "Nova Labs", url: "https://example.com/j2", status: "interviewing", location: "Tehran", salary: "$10k–20k", notes: "Round 2 with HM", date: now() },
];

const VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));
function normalizeTemplateId(tplId?: string): string {
  if (tplId && VALID_TEMPLATE_IDS.has(tplId)) return tplId;
  if (tplId === "prime-ats") return "prime-ats-11";
  if (tplId === "pure-ats") return "pure-ats-14";
  if (tplId === "modern") return "harmonized-12";
  if (tplId === "executive") return "crest-22";
  return "editorial-11";
}

type Store = {
  user: { name: string; email: string; plan: string; target: string; completion: number; resumeUploaded?: boolean; matchChecked?: boolean };
  setUser: (u: Partial<Store["user"]>) => void;
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
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Store["user"]>({
    name: "Viana Fariqi",
    email: "fariqiviana@gmail.com",
    plan: "Free",
    target: "Product Designer",
    completion: 15,
    resumeUploaded: true,
    matchChecked: false,
  });
  const [docs, setDocs] = useState<Doc[]>(seedDocs);
  const [tracker, setTracker] = useState<TrackItem[]>(seedTrack);
  const [interviews, setInterviews] = useState<Interview[]>([
    { id: "i1", title: "Senior Product Designer", company: "Nova Labs", seniority: "Senior", mode: "Personalized", createdAt: now() }
  ]);
  const [credits, setCredits] = useState(1);
  const [autoConfigured, setAutoConfigured] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>(["j2"]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("farnavi_store_v2") ?? localStorage.getItem("farnavi_store");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.user) setUserState((p) => ({ ...p, ...s.user }));
        if (Array.isArray(s.docs) && s.docs.length > 0) {
          const migrated = s.docs.map((d: Doc) => {
            const tplId = normalizeTemplateId(d.template);
            const tplObj = TEMPLATES.find((t) => t.id === tplId) ?? TEMPLATES[0];
            return {
              ...d,
              template: tplId,
              font: d.font && d.font !== "Instrument Sans" ? d.font : tplObj.headingFont,
              secondaryFont: d.secondaryFont ?? tplObj.bodyFont,
              settings: { ...defaultSettings(tplObj.twoCol), ...(d.settings || {}) },
              ...(d.type === "website" ? { webTemplate: d.webTemplate ?? "editorial", slug: d.slug ?? "viana-fariqi", published: d.published ?? true } : {}),
            };
          });
          setDocs(migrated);
        }
        if (Array.isArray(s.tracker)) setTracker(s.tracker);
        if (Array.isArray(s.interviews)) setInterviews(s.interviews);
        if (typeof s.credits === "number") setCredits(s.credits);
        if (typeof s.autoConfigured === "boolean") setAutoConfigured(s.autoConfigured);
        if (Array.isArray(s.savedJobs)) setSavedJobs(s.savedJobs);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(
        "farnavi_store_v2",
        JSON.stringify({ user, docs, tracker, interviews, credits, autoConfigured, savedJobs })
      );
    }
  }, [hydrated, user, docs, tracker, interviews, credits, autoConfigured, savedJobs]);

  const value: Store = {
    user,
    setUser: (u) => setUserState((p) => ({ ...p, ...u })),
    docs,
    jobs: seedJobs,
    tracker,
    interviews,
    credits,
    setCredits,
    autoConfigured,
    setAutoConfigured,
    savedJobs,
    toggleSaveJob: (id) => setSavedJobs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    addDoc: (type, title, opts = {}) => {
      const tplId = normalizeTemplateId(opts.template);
      const tplObj = TEMPLATES.find((t) => t.id === tplId) ?? TEMPLATES[0];
      const initialContent = opts.content ?? baseContent();
      const calc = calculateDocScore(initialContent);
      const d: Doc = {
        id: uid(),
        type,
        title,
        template: tplId,
        webTemplate: "editorial",
        slug: type === "website" ? `viana-fariqi-${Math.floor(Math.random() * 90 + 10)}` : undefined,
        published: type === "website" ? false : undefined,
        accent: opts.accent ?? tplObj.accent,
        font: opts.font ?? tplObj.headingFont,
        secondaryFont: opts.secondaryFont ?? tplObj.bodyFont,
        score: opts.score ?? (type === "resume" || type === "tailored" ? calc.score : 85),
        pinned: false,
        settings: opts.settings ?? defaultSettings(tplObj.twoCol),
        createdAt: now(),
        updatedAt: now(),
        content: initialContent,
        ...opts,
      };
      setDocs((p) => [d, ...p]);
      return d;
    },
    updateDoc: (id, patch) =>
      setDocs((p) =>
        p.map((d) => {
          if (d.id !== id) return d;
          const nextContent = patch.content ?? d.content;
          const nextScore = patch.score ?? (d.type === "resume" || d.type === "tailored" ? calculateDocScore(nextContent).score : d.score);
          return { ...d, ...patch, content: nextContent, score: nextScore, updatedAt: now() };
        })
      ),
    removeDoc: (id) => setDocs((p) => p.filter((d) => d.id !== id)),
    duplicateDoc: (id) =>
      setDocs((p) => {
        const d = p.find((x) => x.id === id);
        return d ? [{ ...d, id: uid(), title: d.title + " (Copy)", pinned: false, createdAt: now(), updatedAt: now() }, ...p] : p;
      }),
    addTrack: (t) => setTracker((p) => [{ ...t, id: uid(), date: now() }, ...p]),
    moveTrack: (id, s) => setTracker((p) => p.map((t) => (t.id === id ? { ...t, status: s } : t))),
    updateTrack: (id, patch) => setTracker((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    removeTrack: (id) => setTracker((p) => p.filter((t) => t.id !== id)),
    addInterview: (i) => setInterviews((p) => [{ ...i, id: uid(), createdAt: now() }, ...p]),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}