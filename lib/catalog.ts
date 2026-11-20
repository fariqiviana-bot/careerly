export const ACCENTS = ["#202124", "#5d6f61", "#706A62", "#5b7a8c", "#c05b49", "#8a6f9e", "#3d4a3f", "#b98a4e"];
export const FONTS = [
  "Merriweather",
  "Lato",
  "Manrope",
  "Libre Baskerville",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Nunito",
  "Source Sans 3",
  "Work Sans",
  "Poppins",
  "Inter",
  "Roboto",
  "Rubik",
];
export const LANGS = [
  "English (US)", "English (UK)", "Français", "Deutsch", "Español", "Svenska",
  "Português", "Italiano", "Nederlands", "Dansk", "Suomi", "Čeština",
  "Polski", "Norsk", "فارسی", "العربية", "Türkçe"
];

export type SeriesCode = "2" | "3" | "4" | "11" | "12" | "14" | "22" | "24";

export const SECTION_SCORE_WEIGHTS: Record<string, { label: string; boost: string; points: number; section: string }> = {
  target:     { label: "Add job target",         boost: "+10%", points: 10, section: "personal" },
  summary:    { label: "Add profile summary",    boost: "+15%", points: 15, section: "summary" },
  experience: { label: "Add employment history", boost: "+25%", points: 25, section: "experience" },
  education:  { label: "Add education",          boost: "+15%", points: 15, section: "education" },
  skills:     { label: "Add core skills",        boost: "+10%", points: 10, section: "skills" },
  certs:      { label: "Add certifications",     boost: "+10%", points: 10, section: "certifications" },
};

export const PREWRITTEN_PHRASES: Record<string, { role: string; category: string; text: string }[]> = {
  summary: [
    { role: "Product Designer", category: "Design & UX", text: "Product Designer with 5+ years of experience shaping B2B SaaS workflows and token-driven design systems adopted by 30+ engineers, lifting user activation by 18% and reducing design-to-dev handoff time by 35%." },
    { role: "Software Engineer", category: "Engineering", text: "Full-Stack Software Engineer specializing in TypeScript, React, Next.js, and cloud-native architectures. Proven track record of cutting page latency by 42% and scaling high-availability services to 250K+ monthly users." },
    { role: "Registered Nurse", category: "Healthcare & Nursing", text: "Dedicated and compassionate Registered Nurse with 6+ years of clinical experience delivering high-quality, patient-centered care within high-acuity emergency and acute care settings. Proficient in Epic and Cerner EHR systems." },
    { role: "Bioinformatician / Data Scientist", category: "Science & Biotech", text: "Computational Biologist and Bioinformatics Scientist experienced in NGS pipelines, Python/R statistical modeling, and multi-omics data visualization, reducing genomic workflow turnaround time by 40%." },
    { role: "Marketing Manager", category: "Marketing & Growth", text: "Growth-focused B2B Marketing Manager with 6+ years scaling demand generation, lifecycle automation, and multi-channel attribution, generating $2.4M in qualified pipeline." },
    { role: "Project / Operations Manager", category: "Operations & Management", text: "Results-oriented Operations & Project Manager skilled in cross-functional team leadership, process streamlining, and resource optimization across global enterprise initiatives." },
  ],
  experience: [
    { role: "Product Designer", category: "Design & UX", text: "Redesigned end-to-end onboarding and activation flows across web and mobile, increasing day-7 retention by 18% and reducing support tickets by 24%." },
    { role: "Product Designer", category: "Design & UX", text: "Architected and documented a 120-component Figma and React design system, accelerating cross-team feature delivery by 30%." },
    { role: "Software Engineer", category: "Engineering", text: "Engineered automated CI/CD pipelines and end-to-end Playwright test suites, reducing production regressions by 60% across 14 microservices." },
    { role: "Software Engineer", category: "Engineering", text: "Optimized PostgreSQL queries and Redis caching layers, lowering P95 API response times from 480ms to 110ms." },
    { role: "Registered Nurse", category: "Healthcare & Nursing", text: "Delivered direct bedside care to 5–6 acute patients per shift, prioritizing patient safety, rapid triage, and HIPAA-compliant EHR charting." },
    { role: "Registered Nurse", category: "Healthcare & Nursing", text: "Mentored 8 new graduate nurses, ensuring seamless unit onboarding, strict infection-control compliance, and 94% patient satisfaction." },
    { role: "Bioinformatician / Data Scientist", category: "Science & Biotech", text: "Developed reproducible RNA-seq and variant-calling pipelines in Python and Nextflow, cutting analysis runtime by 35% across 1,200+ clinical samples." },
    { role: "Marketing Manager", category: "Marketing & Growth", text: "Spearheaded integrated lifecycle email and webinar campaigns that generated $1.4M in qualified pipeline within two quarters." },
    { role: "Project / Operations Manager", category: "Operations & Management", text: "Orchestrated cross-departmental workflows for a 25-person delivery team, completing 14 consecutive product releases on schedule and 12% under budget." },
  ],
};

export type ExtraSectionMeta = {
  id: string;
  title: string;
  pro: boolean;
  atsSafe: boolean;
  description: string;
  previewLines: string[];
};

export const EXTRA_SECTION_CATALOG: ExtraSectionMeta[] = [
  {
    id: "Certifications",
    title: "Certifications & Licenses",
    pro: false,
    atsSafe: true,
    description: "Highlight accredited certifications, clinical licenses, or professional credentials.",
    previewLines: ["PMP — Project Management Institute (2025)", "AWS Certified Solutions Architect · License #88412"],
  },
  {
    id: "Projects",
    title: "Key Projects",
    pro: false,
    atsSafe: true,
    description: "Showcase flagship product launches, research studies, or open-source systems.",
    previewLines: ["Farnavi Career OS — Built 1:1 vector resume studio in Next.js", "Genomic Data Atlas — Automated multi-omics pipeline"],
  },
  {
    id: "Languages",
    title: "Languages",
    pro: false,
    atsSafe: true,
    description: "List spoken and written languages with standardized proficiency levels.",
    previewLines: ["English — Native / Bilingual", "Persian — Native · German — Professional Working"],
  },
  {
    id: "Awards",
    title: "Awards & Scholarships",
    pro: false,
    atsSafe: true,
    description: "Recognize academic honors, industry awards, or competitive fellowships.",
    previewLines: ["Outstanding Innovation Award — National Design Council (2025)", "Dean's Merit Fellowship — Top 2% of Cohort"],
  },
  {
    id: "Volunteering",
    title: "Volunteering & Leadership",
    pro: false,
    atsSafe: true,
    description: "Demonstrate community leadership, mentoring, and non-profit contributions.",
    previewLines: ["Lead Design Mentor — ADPList Global Community (2023–Present)", "Organized 12 career workshops for 400+ graduates"],
  },
  {
    id: "Publications",
    title: "Publications & Papers",
    pro: true,
    atsSafe: true,
    description: "Cite peer-reviewed journal articles, conference papers, or industry whitepapers.",
    previewLines: ["Machine Learning in Genomic Triage — Nature Biotech (2025)", "Scalable Design Tokens for Enterprise Apps — Smashing Mag"],
  },
  {
    id: "Conferences",
    title: "Conferences & Speaking",
    pro: true,
    atsSafe: true,
    description: "Feature keynote talks, workshops, and panel appearances.",
    previewLines: ["Speaker — Figma Config Europe: Token Architecture (2025)", "Panelist — ISMB Bioinformatics Symposium"],
  },
  {
    id: "References",
    title: "References",
    pro: true,
    atsSafe: true,
    description: "Include professional or academic supervisors (syncs with your References sheet).",
    previewLines: ["Dr. Sarah Jenkins — VP of Product @ Rangin (s.jenkins@company.com)", "Available upon request"],
  },
  {
    id: "Hobbies",
    title: "Interests & Passions",
    pro: true,
    atsSafe: true,
    description: "Add human context with curated personal interests and creative pursuits.",
    previewLines: ["Analog Photography · Trail Running · Speculative Typography"],
  },
  {
    id: "Custom section",
    title: "Custom Section",
    pro: true,
    atsSafe: true,
    description: "Create a bespoke section with your own heading and structured entries.",
    previewLines: ["Clinical Rotations / Patents / Editorial Boards / Affiliations"],
  },
];

export const EXTRA_SECTIONS = EXTRA_SECTION_CATALOG.map((s) => s.id);
export const FREE_CHECKS = ["Spellcheck & Grammar", "Quantified Impact", "Wording & Readability", "Recommendations"];
export const LOCKED_CHECKS = ["Credibility", "Interview Risks", "Age Bias", "Employment Gaps", "Scope & Ownership"];

export const WEAK_VERBS = ["responsible for", "helped", "worked on", "assisted with", "duties included", "handled", "tried to"];
export const PERSONAL_PRONOUNS = [" i ", " my ", " me ", " we ", " our "];
export const BUZZWORDS = ["synergy", "go-getter", "hardworker", "think outside the box", "rockstar", "ninja", "guru"];

export const LINKEDIN_STEPS = [
  "LinkedIn URL", "Custom URL", "Target & Position", "Competencies", "Headline",
  "Profile Photo", "Banner", "Achievements", "Spelling & Grammar", "Resume Match",
  "About / Summary", "Experience", "Skills", "Recommendations", "Age Discrimination"
];

export const QUESTIONS = [
  { q: "Tell me about yourself.", tip: "Present → Past → Future. Keep it under 2 minutes." },
  { q: "Describe a project you're proud of.", tip: "STAR: Situation, Task, Action, Result — quantify the result." },
  { q: "Tell me about a conflict with a teammate.", tip: "Focus on the resolution, not the drama." },
  { q: "Why do you want this role?", tip: "Connect their mission to your last 2 achievements." },
  { q: "What is your biggest weakness?", tip: "Real weakness + the system you built to manage it." },
  { q: "Describe a time you failed.", tip: "Own it, then show the lesson applied later." },
  { q: "Where do you see yourself in 3 years?", tip: "Growth that aligns with this team's trajectory." },
  { q: "Do you have questions for us?", tip: "Ask about success metrics for the first 90 days." },
];

export const COACHES = [
  { name: "Karen Maida", role: "Resume & LinkedIn Coach", price: 179, tag: "Career Evolution" },
  { name: "Sayyid Tirmizi", role: "Interview & Search Strategy", price: 229, tag: "Career Confidence" },
  { name: "Patricia Tejera", role: "Executive Positioning", price: 349, tag: "Executive Priority" },
];

export const FAQ = [
  { cat: "Resumes & Cover Letters", count: 16, items: ["How do I import my LinkedIn profile?", "Which template is ATS-friendly?", "How does resume tailoring work?", "Can I export to DOCX and A4/US Letter?"] },
  { cat: "Billing & Accounts", count: 7, items: ["How do I change my plan?", "How do I delete my account?", "Do you offer student discounts?"] },
  { cat: "Jobs & Tracker", count: 14, items: ["What is Ghost-Job Risk?", "How does Auto Apply work?", "How do job alerts work?"] },
];

export const CHAPTERS: { title: string; lessons: string[] }[] = [];

export type TrackStatus = "recommended" | "shortlist" | "auto" | "applied" | "interviewing" | "offer" | "rejected";
export const STATUS_ORDER: TrackStatus[] = ["recommended", "shortlist", "auto", "applied", "interviewing", "offer", "rejected"];
export const STATUS: Record<TrackStatus, { label: string; dot: string; chip: string }> = {
  recommended: { label: "Recommended", dot: "bg-sage", chip: "bg-sage-mist text-secondary-foreground" },
  shortlist:   { label: "Shortlist",   dot: "bg-peach", chip: "bg-accent text-accent-foreground" },
  auto:        { label: "Auto Apply",  dot: "bg-[#8a6f9e]", chip: "bg-[#efe9f4] text-[#5f4a72]" },
  applied:     { label: "Applied",     dot: "bg-[#5b7a8c]", chip: "bg-[#e7eef2] text-[#3d5563]" },
  interviewing:{ label: "Interviewing",dot: "bg-[#b98a4e]", chip: "bg-[#f6ecdd] text-[#7c5a2e]" },
  offer:       { label: "Offer",       dot: "bg-[#4e8a5a]", chip: "bg-[#e6f0e8] text-[#33613d]" },
  rejected:    { label: "Rejected",    dot: "bg-destructive", chip: "bg-[#f7e4de] text-[#8a4436]" },
};