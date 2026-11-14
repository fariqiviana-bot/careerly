"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { TrackStatus } from "./catalog";

export const uid = () => Math.random().toString(36).slice(2, 9);
export type DocType = "resume" | "cover" | "resignation" | "website" | "tailored";
export type Exp = { id: string; role: string; company: string; period: string; description: string };
export type Edu = { id: string; degree: string; school: string; period: string };
export type Content = {
  name: string; role: string; email: string; phone: string; location: string; summary: string;
  experience: Exp[]; education: Edu[]; skills: string[]; extras: string[];
  letter: { to: string; company: string; subject: string; body: string };
};
export type Doc = {
  id: string; type: DocType; title: string; template: string; accent: string; font: string;
  score: number; pinned: boolean; label?: string; published?: boolean; createdAt: string; updatedAt: string; content: Content;
};
export type Job = {
  id: string; title: string; company: string; location: string; mode: "Remote"|"Hybrid"|"On-site";
  salary: string; tags: string[]; posted: string; risk: "Low"|"Moderate"; applicants: number; rating: number; reviews: number; summary: string;
};
export type TrackItem = { id: string; title: string; company: string; url: string; status: TrackStatus; location: string; salary: string; notes: string; date: string };
export type Interview = { id: string; title: string; company: string; seniority: string; mode: string; createdAt: string };

const baseContent = (): Content => ({
  name: "Viana Fariqi", role: "Product Designer", email: "fariqiviana@gmail.com", phone: "+98 912 000 0000",
  location: "Tehran, Iran", summary: "Product designer with 4+ years shaping B2B SaaS. Shipped design systems used by 30+ engineers; lifted activation by 18%.",
  experience: [
    { id: uid(), role: "Product Designer", company: "Rangin Agency", period: "2023 — Present", description: "Led redesign of onboarding; +18% activation. Built a 120-component design system." },
    { id: uid(), role: "UI Designer", company: "Freelance", period: "2021 — 2023", description: "Delivered 14 client projects across fintech and health." },
  ],
  education: [{ id: uid(), degree: "BSc, Cellular & Molecular Biology", school: "University of Tehran", period: "2024 — 2028" }],
  skills: ["Figma","Design Systems","Prototyping","User Research","HTML/CSS","Interaction Design"],
  extras: ["Projects","Languages"],
  letter: { to: "Hiring Manager", company: "Telgorithm", subject: "Application for Marketing Manager", body: "Dear Hiring Manager,\n\nI am excited to apply..." },
});

const now = () => new Date().toISOString();
const seedDocs: Doc[] = [
  { id: "d1", type: "resume", title: "Product Designer Resume", template: "classic", accent: "#5d6f61", font: "Instrument Sans", score: 68, pinned: true, createdAt: now(), updatedAt: now(), content: baseContent() },
  { id: "d2", type: "tailored", title: "Telgorithm — Marketing Manager", template: "prime-ats", accent: "#3d4a3f", font: "Instrument Sans", score: 82, pinned: false, createdAt: now(), updatedAt: now(), content: { ...baseContent(), role: "Marketing Manager" } },
  { id: "d3", type: "cover", title: "Cover Letter — Telgorithm", template: "classic", accent: "#5d6f61", font: "Instrument Sans", score: 0, pinned: false, createdAt: now(), updatedAt: now(), content: baseContent() },
  { id: "d4", type: "resignation", title: "Resignation Letter", template: "classic", accent: "#5d6f61", font: "Instrument Sans", score: 0, pinned: false, createdAt: now(), updatedAt: now(), content: baseContent() },
  { id: "d5", type: "website", title: "Viana Fariqi — Website", template: "modern", accent: "#c98d72", font: "Instrument Sans", score: 0, pinned: false, published: false, createdAt: now(), updatedAt: now(), content: baseContent() },
];
const seedJobs: Job[] = [
  { id: "j1", title: "Remote Product Designer", company: "Pellera", location: "United States", mode: "Remote", salary: "$90k – $120k", tags: ["Figma","B2B","SaaS"], posted: "2d ago", risk: "Low", applicants: 214, rating: 4.1, reviews: 128, summary: "Own end-to-end design for a B2B analytics suite. Strong systems thinking and Figma proficiency required." },
  { id: "j2", title: "Senior Product Designer", company: "Nova Labs", location: "Tehran, Iran", mode: "Hybrid", salary: "$10k – $20k / yr", tags: ["Design Systems","Mobile"], posted: "Today", risk: "Moderate", applicants: 1050, rating: 2.8, reviews: 5, summary: "Lead designer for a fintech super-app. Mentor 3 designers; drive research ops." },
  { id: "j3", title: "Marketing Manager", company: "Telgorithm", location: "US Remote", mode: "Remote", salary: "$58 – $63 / hr", tags: ["B2B Marketing","SaaS","Automation"], posted: "4d ago", risk: "Low", applicants: 96, rating: 4.4, reviews: 61, summary: "Own demand gen for a messaging API platform. Event marketing + lifecycle." },
  { id: "j4", title: "Frontend Developer", company: "CM.com", location: "Amsterdam", mode: "On-site", salary: "€55k – €70k", tags: ["React","TypeScript"], posted: "1d ago", risk: "Low", applicants: 180, rating: 3.9, reviews: 84, summary: "Build conversational commerce UI in React + TS." },
  { id: "j5", title: "UX Writer", company: "Euler", location: "Berlin", mode: "Remote", salary: "€45k – €58k", tags: ["Content","UX"], posted: "3d ago", risk: "Moderate", applicants: 410, rating: 3.5, reviews: 22, summary: "Craft flows for a data platform; partner with design + PM." },
  { id: "j6", title: "Data Analyst", company: "Cardinal Health", location: "Dublin", mode: "Hybrid", salary: "€48k – €60k", tags: ["SQL","Python"], posted: "5d ago", risk: "Low", applicants: 320, rating: 3.7, reviews: 210, summary: "Analytics for supply-chain ops; SQL + dashboards." },
];
const seedTrack: TrackItem[] = [
  { id: "t1", title: "Remote Product Designer", company: "Pellera", url: "https://example.com/j1", status: "recommended", location: "Remote", salary: "$90k–120k", notes: "", date: now() },
  { id: "t2", title: "UX Writer", company: "Euler", url: "https://example.com/j5", status: "recommended", location: "Berlin", salary: "€45k–58k", notes: "", date: now() },
  { id: "t3", title: "Data Analyst", company: "Cardinal Health", url: "https://example.com/j6", status: "shortlist", location: "Dublin", salary: "€48k–60k", notes: "Referral via Sara", date: now() },
  { id: "t4", title: "Marketing Manager", company: "Telgorithm", url: "https://example.com/j3", status: "auto", location: "Remote", salary: "$58–63/hr", notes: "", date: now() },
  { id: "t5", title: "Frontend Developer", company: "CM.com", url: "https://example.com/j4", status: "applied", location: "Amsterdam", salary: "€55k–70k", notes: "Applied via site", date: now() },
  { id: "t6", title: "Senior Product Designer", company: "Nova Labs", url: "https://example.com/j2", status: "interviewing", location: "Tehran", salary: "$10k–20k", notes: "Round 2 with HM", date: now() },
];

type Store = {
  user: { name: string; email: string; plan: string; target: string; completion: number };
  setUser: (u: Partial<Store["user"]>) => void;
  docs: Doc[]; jobs: Job[]; tracker: TrackItem[]; interviews: Interview[];
  credits: number; setCredits: (n: number) => void;
  autoConfigured: boolean; setAutoConfigured: (b: boolean) => void;
  savedJobs: string[]; toggleSaveJob: (id: string) => void;
  addDoc: (type: DocType, title: string, opts?: Partial<Doc>) => Doc;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  removeDoc: (id: string) => void; duplicateDoc: (id: string) => void;
  addTrack: (t: Omit<TrackItem, "id" | "date">) => void;
  moveTrack: (id: string, s: TrackStatus) => void;
  updateTrack: (id: string, patch: Partial<TrackItem>) => void;
  removeTrack: (id: string) => void;
  addInterview: (i: Omit<Interview, "id" | "createdAt">) => void;
};
const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState({ name: "Viana Fariqi", email: "fariqiviana@gmail.com", plan: "Free", target: "Product Designer", completion: 15 });
  const [docs, setDocs] = useState<Doc[]>(seedDocs);
  const [tracker, setTracker] = useState<TrackItem[]>(seedTrack);
  const [interviews, setInterviews] = useState<Interview[]>([{ id: "i1", title: "Senior Product Designer", company: "Nova Labs", seniority: "Senior", mode: "Personalized", createdAt: now() }]);
  const [credits, setCredits] = useState(1);
  const [autoConfigured, setAutoConfigured] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>(["j2"]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("careerly");
      if (raw) { const s = JSON.parse(raw); setUserState(s.user); setDocs(s.docs); setTracker(s.tracker); setInterviews(s.interviews); setCredits(s.credits); setAutoConfigured(s.autoConfigured); setSavedJobs(s.savedJobs); }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem("careerly", JSON.stringify({ user, docs, tracker, interviews, credits, autoConfigured, savedJobs }));
  }, [hydrated, user, docs, tracker, interviews, credits, autoConfigured, savedJobs]);

  const value: Store = {
    user, setUser: (u) => setUserState((p) => ({ ...p, ...u })),
    docs, jobs: seedJobs, tracker, interviews, credits, setCredits, autoConfigured, setAutoConfigured, savedJobs,
    toggleSaveJob: (id) => setSavedJobs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    addDoc: (type, title, opts = {}) => {
      const d: Doc = { id: uid(), type, title, template: "classic", accent: "#5d6f61", font: "Instrument Sans", score: type === "resume" ? 15 : 0, pinned: false, createdAt: now(), updatedAt: now(), content: baseContent(), ...opts };
      setDocs((p) => [d, ...p]); return d;
    },
    updateDoc: (id, patch) => setDocs((p) => p.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d))),
    removeDoc: (id) => setDocs((p) => p.filter((d) => d.id !== id)),
    duplicateDoc: (id) => setDocs((p) => { const d = p.find((x) => x.id === id); return d ? [{ ...d, id: uid(), title: d.title + " (copy)", pinned: false, createdAt: now(), updatedAt: now() }, ...p] : p; }),
    addTrack: (t) => setTracker((p) => [{ ...t, id: uid(), date: now() }, ...p]),
    moveTrack: (id, s) => setTracker((p) => p.map((t) => (t.id === id ? { ...t, status: s } : t))),
    updateTrack: (id, patch) => setTracker((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    removeTrack: (id) => setTracker((p) => p.filter((t) => t.id !== id)),
    addInterview: (i) => setInterviews((p) => [{ ...i, id: uid(), createdAt: now() }, ...p]),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}