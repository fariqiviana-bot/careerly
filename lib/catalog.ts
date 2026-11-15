export const ACCENTS = ["#202124", "#5d6f61", "#706A62", "#5b7a8c", "#c05b49", "#8a6f9e", "#3d4a3f", "#b98a4e"];
export const FONTS = [
  "Merriweather",
  "Lato",
  "Manrope",
  "Great Vibes",
  "Instrument Sans",
  "Georgia",
  "Garamond",
];
export const LANGS = [
  "English (US)", "English (UK)", "Français", "Deutsch", "Español", "Svenska",
  "Português", "Italiano", "Nederlands", "Dansk", "Suomi", "Čeština",
  "Polski", "Norsk", "فارسی", "العربية", "Türkçe"
];

export type SeriesCode = "11" | "12" | "14" | "22";

export type Tpl = {
  id: string;
  series: SeriesCode;
  name: string;
  subtitle: string;
  category: "ATS" | "Editorial" | "Executive" | "Signature";
  ats: boolean;
  twoCol: boolean;
  photo: boolean;
  pro: boolean;
  accent: string;
  headingFont: string;
  bodyFont: string;
  scriptFont?: string;
  pagesSupported: number[];
  sizesSupported: ("A4" | "Letter")[];
  hasCoverLetter: boolean;
  hasReferences: boolean;
  badge?: string;
  files: {
    googleDocsPdf: string;
    docx: {
      a4: { resume1p: string; resume2p: string; resume3p?: string; ats1p: string; ats2p: string; cover: string; references: string };
      letter: { resume1p: string; resume2p: string; resume3p?: string; ats1p: string; ats2p: string; cover: string; references: string };
    };
    pdf: {
      a4: { resume1p: string; resume2p: string; resume3p?: string; ats1p: string; ats2p: string; cover: string; references: string };
      letter: { resume1p: string; resume2p: string; resume3p?: string; ats1p: string; ats2p: string; cover: string; references: string };
    };
  };
};

function buildSeriesFiles(s: SeriesCode) {
  const base = `/templates/series-${s}`;
  return {
    googleDocsPdf: `${base}/google-docs-links.pdf`,
    docx: {
      a4: {
        resume1p: `${base}/docx/a4/resume-1p.docx`,
        resume2p: `${base}/docx/a4/resume-2p.docx`,
        resume3p: `${base}/docx/a4/resume-3p.docx`,
        ats1p: `${base}/docx/a4/ats-1p.docx`,
        ats2p: `${base}/docx/a4/ats-2p.docx`,
        cover: `${base}/docx/a4/cover-letter.docx`,
        references: `${base}/docx/a4/references.docx`,
      },
      letter: {
        resume1p: `${base}/docx/letter/resume-1p.docx`,
        resume2p: `${base}/docx/letter/resume-2p.docx`,
        resume3p: `${base}/docx/letter/resume-3p.docx`,
        ats1p: `${base}/docx/letter/ats-1p.docx`,
        ats2p: `${base}/docx/letter/ats-2p.docx`,
        cover: `${base}/docx/letter/cover-letter.docx`,
        references: `${base}/docx/letter/references.docx`,
      },
    },
    pdf: {
      a4: {
        resume1p: `${base}/pdf/a4/resume-1p.pdf`,
        resume2p: `${base}/pdf/a4/resume-2p.pdf`,
        resume3p: `${base}/pdf/a4/resume-3p.pdf`,
        ats1p: `${base}/pdf/a4/ats-1p.pdf`,
        ats2p: `${base}/pdf/a4/ats-2p.pdf`,
        cover: `${base}/pdf/a4/cover-letter.pdf`,
        references: `${base}/pdf/a4/references.pdf`,
      },
      letter: {
        resume1p: `${base}/pdf/letter/resume-1p.pdf`,
        resume2p: `${base}/pdf/letter/resume-2p.pdf`,
        resume3p: `${base}/pdf/letter/resume-3p.pdf`,
        ats1p: `${base}/pdf/letter/ats-1p.pdf`,
        ats2p: `${base}/pdf/letter/ats-2p.pdf`,
        cover: `${base}/pdf/letter/cover-letter.pdf`,
        references: `${base}/pdf/letter/references.pdf`,
      },
    },
  };
}

export const TEMPLATES: Tpl[] = [
  // Series 11 (Lato & Merriweather)
  {
    id: "editorial-11",
    series: "11",
    name: "Editorial",
    subtitle: "Two-Column Editorial · Merriweather & Lato",
    category: "Editorial",
    ats: true,
    twoCol: true,
    photo: false,
    pro: false,
    accent: "#202124",
    headingFont: "Merriweather",
    bodyFont: "Lato",
    pagesSupported: [1, 2, 3],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "Popular",
    files: buildSeriesFiles("11"),
  },
  {
    id: "prime-ats-11",
    series: "11",
    name: "Prime ATS",
    subtitle: "Single-Column Linear ATS · Merriweather & Lato",
    category: "ATS",
    ats: true,
    twoCol: false,
    photo: false,
    pro: false,
    accent: "#3d4a3f",
    headingFont: "Merriweather",
    bodyFont: "Lato",
    pagesSupported: [1, 2],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "ATS Friendly",
    files: buildSeriesFiles("11"),
  },

  // Series 12 (Manrope, Lato & Merriweather)
  {
    id: "harmonized-12",
    series: "12",
    name: "Harmonized",
    subtitle: "Two-Column Modern Grid · Manrope & Merriweather",
    category: "Editorial",
    ats: true,
    twoCol: true,
    photo: false,
    pro: false,
    accent: "#5d6f61",
    headingFont: "Manrope",
    bodyFont: "Lato",
    pagesSupported: [1, 2, 3],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "Updated",
    files: buildSeriesFiles("12"),
  },
  {
    id: "precision-ats-12",
    series: "12",
    name: "Precision ATS",
    subtitle: "Single-Column Tech & Corporate ATS · Manrope & Lato",
    category: "ATS",
    ats: true,
    twoCol: false,
    photo: false,
    pro: false,
    accent: "#5b7a8c",
    headingFont: "Manrope",
    bodyFont: "Lato",
    pagesSupported: [1, 2],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "ATS Friendly",
    files: buildSeriesFiles("12"),
  },

  // Series 14 (Great Vibes & Merriweather)
  {
    id: "calligraphic-14",
    series: "14",
    name: "Calligraphic",
    subtitle: "Two-Column Signature Header · Merriweather & Great Vibes",
    category: "Signature",
    ats: true,
    twoCol: true,
    photo: false,
    pro: false,
    accent: "#706A62",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    scriptFont: "Great Vibes",
    pagesSupported: [1, 2, 3],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "Signature",
    files: buildSeriesFiles("14"),
  },
  {
    id: "pure-ats-14",
    series: "14",
    name: "Pure ATS",
    subtitle: "Single-Column Classic Serif ATS · Merriweather",
    category: "ATS",
    ats: true,
    twoCol: false,
    photo: false,
    pro: false,
    accent: "#202124",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    scriptFont: "Great Vibes",
    pagesSupported: [1, 2],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "ATS Friendly",
    files: buildSeriesFiles("14"),
  },

  // Series 22 (Executive Crest - Merriweather & Great Vibes)
  {
    id: "crest-22",
    series: "22",
    name: "Executive Crest",
    subtitle: "Two-Column Executive Architecture · Merriweather",
    category: "Executive",
    ats: true,
    twoCol: true,
    photo: false,
    pro: false,
    accent: "#3d4a3f",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    scriptFont: "Great Vibes",
    pagesSupported: [1, 2, 3],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "Executive",
    files: buildSeriesFiles("22"),
  },
  {
    id: "momentum-ats-22",
    series: "22",
    name: "Momentum ATS",
    subtitle: "Single-Column Executive ATS · Merriweather",
    category: "ATS",
    ats: true,
    twoCol: false,
    photo: false,
    pro: false,
    accent: "#706A62",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    pagesSupported: [1, 2],
    sizesSupported: ["A4", "Letter"],
    hasCoverLetter: true,
    hasReferences: true,
    badge: "ATS Friendly",
    files: buildSeriesFiles("22"),
  },
];

export type CoverTpl = {
  id: string;
  series: SeriesCode;
  name: string;
  subtitle: string;
  pairedResumeId: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  scriptFont?: string;
  files: Tpl["files"];
};

export const COVER_TEMPLATES: CoverTpl[] = [
  {
    id: "cover-editorial-11",
    series: "11",
    name: "Editorial Cover Letter",
    subtitle: "Matched with Editorial & Prime ATS · Merriweather & Lato",
    pairedResumeId: "editorial-11",
    accent: "#202124",
    headingFont: "Merriweather",
    bodyFont: "Lato",
    files: buildSeriesFiles("11"),
  },
  {
    id: "cover-harmonized-12",
    series: "12",
    name: "Harmonized Cover Letter",
    subtitle: "Matched with Harmonized & Precision ATS · Manrope & Lato",
    pairedResumeId: "harmonized-12",
    accent: "#5d6f61",
    headingFont: "Manrope",
    bodyFont: "Lato",
    files: buildSeriesFiles("12"),
  },
  {
    id: "cover-calligraphic-14",
    series: "14",
    name: "Calligraphic Cover Letter",
    subtitle: "Matched with Calligraphic & Pure ATS · Signature Script",
    pairedResumeId: "calligraphic-14",
    accent: "#706A62",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    scriptFont: "Great Vibes",
    files: buildSeriesFiles("14"),
  },
  {
    id: "cover-crest-22",
    series: "22",
    name: "Executive Crest Cover Letter",
    subtitle: "Matched with Executive Crest & Momentum ATS · Merriweather",
    pairedResumeId: "crest-22",
    accent: "#3d4a3f",
    headingFont: "Merriweather",
    bodyFont: "Merriweather",
    scriptFont: "Great Vibes",
    files: buildSeriesFiles("22"),
  },
];

export const SECTION_SCORE_WEIGHTS: Record<string, { label: string; boost: string; points: number }> = {
  target: { label: "Add job target", boost: "+10%", points: 10 },
  summary: { label: "Write professional summary (400-600 chars)", boost: "+15%", points: 15 },
  experience: { label: "Add employment history", boost: "+25%", points: 25 },
  education: { label: "Add education details", boost: "+15%", points: 15 },
  skills: { label: "Add 5+ core skills", boost: "+15%", points: 15 },
  extras: { label: "Add projects, languages or certifications", boost: "+10%", points: 10 },
};

export const PREWRITTEN_PHRASES: Record<string, { role: string; text: string }[]> = {
  summary: [
    { role: "Product Designer", text: "Product designer with 4+ years shaping B2B SaaS workflows. Built token-driven design systems adopted by 30+ engineers and lifted user activation by 18%." },
    { role: "Software Engineer", text: "Full-stack engineer specializing in TypeScript, React, and Next.js. Reduced page load latency by 42% and architected scalable microservices serving 250k+ monthly users." },
    { role: "Marketing Manager", text: "Growth-focused Marketing Manager with 6+ years scaling B2B SaaS demand generation, lifecycle automation, and multi-channel attribution." },
    { role: "Data / Bioinformatician", text: "Computational biologist & data analyst experienced in Python, genomic pipelines, and statistical modeling. Published reproducible workflows cutting analysis time by 35%." },
  ],
  experience: [
    { role: "Product Designer", text: "Redesigned core onboarding flow across web and mobile, increasing day-7 activation by 18% and reducing support tickets by 24%." },
    { role: "Product Designer", text: "Architected and documented a 120-component Figma & React design system, accelerating feature delivery speed by 30%." },
    { role: "Software Engineer", text: "Implemented automated CI/CD pipelines and end-to-end testing, reducing production regressions by 60%." },
    { role: "Marketing Manager", text: "Spearheaded lifecycle email and webinar campaigns generating $1.4M in qualified pipeline within two quarters." },
  ],
};

export const RESUME_EXAMPLES = [
  {
    id: "ex-product-designer",
    role: "Senior Product Designer",
    category: "Design & UX",
    template: "editorial-11",
    summary: "Senior Product Designer with 5+ years crafting B2B SaaS products and scalable design systems. Proven track record of increasing conversion by 22% through iterative user research.",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Interaction Design", "WCAG Accessibility"],
  },
  {
    id: "ex-marketing-manager",
    role: "Marketing Manager",
    category: "Marketing & Growth",
    template: "harmonized-12",
    summary: "Data-driven B2B Marketing Manager with expertise in demand generation, product positioning, and marketing automation across enterprise SaaS markets.",
    skills: ["Demand Generation", "HubSpot", "SEO/SEM", "Lifecycle Marketing", "Copywriting", "Revenue Attribution"],
  },
  {
    id: "ex-software-engineer",
    role: "Full-Stack Developer",
    category: "Engineering & Tech",
    template: "precision-ats-12",
    summary: "Full-Stack Engineer experienced in React, Next.js, TypeScript, and Python FastAPI. Passionate about clean architecture, web performance, and AI-assisted workflows.",
    skills: ["TypeScript", "React & Next.js", "Python", "FastAPI", "PostgreSQL", "Tailwind CSS"],
  },
  {
    id: "ex-molecular-biologist",
    role: "Molecular Genetics Researcher",
    category: "Science & Biotech",
    template: "pure-ats-14",
    summary: "Molecular Biology & Bioinformatics researcher skilled in genomic sequence analysis, primer design, microbial physiology, and computational data visualization.",
    skills: ["Molecular Genetics", "Primer Design", "PCR & Gel Electrophoresis", "Python Bioinformatics", "Microscopy", "Scientific Writing"],
  },
];

export const EXTRA_SECTIONS = [
  "Projects", "Languages", "Certifications", "Awards", "Publications",
  "Volunteering", "References", "Conferences", "Training / Courses",
  "Hobbies & Interests", "Signature", "Custom section"
];
export const FREE_CHECKS = ["Spellcheck & Grammar", "Quantified Impact", "Wording & Readability", "Recommendations"];
export const LOCKED_CHECKS = ["Credibility", "Interview Risks", "Age Bias", "Employment Gaps"];

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

// نگه‌داری آرایه خالی برای جلوگیری از خطای کامپایل در فایل‌های قدیمی قبل از چانک ۲
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