export type CheckCategory = "ats" | "impact" | "language" | "recruiter";
export type CheckSeverity = "pass" | "info" | "warning" | "error";

export interface QuickFixPatch {
  kind: "replace-bullet" | "replace-summary" | "remove-placeholder";
  expId?: string;
  bulletIndex?: number;
  original: string;
  replacement: string;
  buttonLabel: string;
}

export interface AnalysisCheckItem {
  id: string;
  code: string;
  category: CheckCategory;
  title: string;
  severity: CheckSeverity;
  message: string;
  detail?: string;
  section: string;
  impactPoints: number;
  quickFix?: QuickFixPatch;
}

export interface SectionAnalysisSummary {
  section: string;
  label: string;
  score: number;
  strengths: string[];
  issues: string[];
}

export interface AtsPlainViewData {
  parseRate: number;
  layoutKind: "1-column-ats" | "2-column-visual";
  wordCount: number;
  estimatedPages: number;
  detectedFields: Array<{ label: string; value: string; ok: boolean }>;
  plainText: string;
}

export interface JobMatchAnalysis {
  matchScore: number;
  jobTitle: string;
  company: string;
  matchedHard: string[];
  missingHard: string[];
  matchedSoft: string[];
  missingSoft: string[];
  keywordDensityNote: string;
}

export interface ResumeAnalysisReport {
  overallScore: number;
  grade: "Excellent" | "Strong" | "Good" | "Needs Work";
  subscores: {
    ats: number;
    impact: number;
    language: number;
    recruiter: number;
  };
  stats: {
    totalChecks: number;
    passedChecks: number;
    warningCount: number;
    errorCount: number;
    wordCount: number;
    summaryChars: number;
    roleCount: number;
    bulletCount: number;
    quantifiedBulletCount: number;
    quantifiedRatio: number;
    skillCount: number;
  };
  checks: AnalysisCheckItem[];
  sectionAnalysis: SectionAnalysisSummary[];
  atsView: AtsPlainViewData;
  jobMatch?: JobMatchAnalysis;
  analyzedAt: string;
}

const SINGLE_COL_ATS_SERIES = new Set(["11", "12", "14"]);

const WEAK_VERB_MAP: Array<{ pattern: RegExp; verb: string; replacement: string }> = [
  { pattern: /^responsible for\s+/i, verb: "Responsible for", replacement: "Led " },
  { pattern: /^helped\s+(?:to\s+)?/i, verb: "Helped", replacement: "Spearheaded " },
  { pattern: /^worked on\s+/i, verb: "Worked on", replacement: "Engineered " },
  { pattern: /^assisted\s+(?:with\s+|in\s+)?/i, verb: "Assisted", replacement: "Collaborated on " },
  { pattern: /^handled\s+/i, verb: "Handled", replacement: "Directed " },
  { pattern: /^dealt with\s+/i, verb: "Dealt with", replacement: "Resolved " },
  { pattern: /^was tasked with\s+/i, verb: "Was tasked with", replacement: "Executed " },
  { pattern: /^participated in\s+/i, verb: "Participated in", replacement: "Contributed to " },
  { pattern: /^did\s+/i, verb: "Did", replacement: "Delivered " },
  { pattern: /^made\s+/i, verb: "Made", replacement: "Built " },
];

const STRONG_ACTION_VERBS = new Set([
  "accelerated", "achieved", "architected", "automated", "boosted", "built",
  "championed", "collaborated", "consolidated", "coordinated", "created",
  "cut", "delivered", "designed", "developed", "directed", "drove",
  "elevated", "eliminated", "engineered", "enhanced", "established", "exceeded",
  "executed", "expanded", "facilitated", "formulated", "generated", "grew",
  "guided", "identified", "implemented", "improved", "increased", "initiated",
  "innovated", "integrated", "launched", "led", "managed", "mentored",
  "migrated", "modernized", "monitored", "negotiated", "optimized", "orchestrated",
  "organized", "overhauled", "oversaw", "partnered", "pioneered", "planned",
  "prepared", "presented", "prioritized", "produced", "provided", "published",
  "raised", "rebuilt", "reduced", "redesigned", "refined", "resolved",
  "restructured", "revamped", "scaled", "secured", "shaped", "shipped",
  "simplified", "spearheaded", "stabilized", "standardized", "streamlined",
  "strengthened", "structured", "supervised", "supported", "surpassed",
  "tracked", "trained", "transformed", "upgraded", "validated", "won",
]);

const LEADERSHIP_VERBS = new Set([
  "led", "directed", "architected", "spearheaded", "owned", "managed",
  "mentored", "supervised", "championed", "orchestrated", "oversaw",
  "drove", "established", "pioneered", "transformed", "scaled", "founded",
]);

const BUZZWORDS = [
  "hardworking", "team player", "go-getter", "synergy", "self-starter",
  "thought leader", "rockstar", "ninja", "guru", "detail-oriented",
  "results-driven", "passionate", "dynamic", "proactive", "outside the box",
  "best of breed", "value-add", "wheelhouse",
];

const FILLER_WORDS = [
  "basically", "actually", "literally", "very", "really", "just",
  "various", "several", "a lot of", "stuff", "things", "etc.",
];

const PASSIVE_PATTERNS = [
  /\bwas\s+(?:responsible|tasked|assigned|involved|hired|given)\b/i,
  /\bwere\s+(?:managed|handled|completed|developed|created|led|done)\b/i,
  /\bwas\s+(?:managed|handled|completed|developed|created|led|done|built)\b/i,
  /\bhas\s+been\s+(?:managed|developed|created|implemented)\b/i,
];

const PRONOUN_RE = /\b(?:i|me|my|mine|myself|we|us|our|ours)\b/i;

const TYPO_MAP: Array<[RegExp, string]> = [
  [/\bteh\b/gi, "the"],
  [/\brecieve(d|s)?\b/gi, "receive$1"],
  [/\bmanagment\b/gi, "management"],
  [/\bexperiance\b/gi, "experience"],
  [/\bunied\b/gi, "unified"],
  [/\bntech\b/gi, "fintech"],
  [/\bacheive(d|ment|ments)?\b/gi, "achieve$1"],
  [/\bseperate(d)?\b/gi, "separate$1"],
  [/\boccured\b/gi, "occurred"],
  [/\bassitant\b/gi, "assistant"],
  [/\benviroment\b/gi, "environment"],
];

const PLACEHOLDER_SIGNATURES = [
  /write 3(?:\s*[\u2013\-]\s*5)? sentences/i,
  /\byour\s+name\b/i,
  /\byour\s+profession\b/i,
  /enter your job title here/i,
  /position title here/i,
  /^job\s+title\b|\|\s*job\s+title\b/im,
  /\bcompany\s+name\b/i,
  /company\/hospital,\s*city,\s*state/i,
  /\bcity,\s*state(?:\/province)?\b/i,
  /youremail@(?:g?mail|email|example)\.com/i,
  /(?:\(555\)|\b555)[\s.\-]?555[\s.\-]?5555/,
  /\b(?:123[\s.\-]?456[\s.\-]?7890|000[\s.\-]?000[\s.\-]?0000)\b/,
  /linkedin\.com\/name\b/i,
  /describe a key achievement using numbers/i,
  /highlight clinical expertise, leadership/i,
  /\bdegree\s+title\b/i,
  /\buniversity\s+name\b/i,
  /graduation (?:date|year)/i,
  /date\s*[\u2013\-]\s*date/i,
  /\blorem\s+ipsum\b/i,
  /\b(?:john|jane)\s+doe\b/i,
];

const HARD_SKILL_LEXICON = [
  "Python", "R", "Go", "C++", "C#", "Java", "Rust", "SQL", "TypeScript", "JavaScript", "React", "Next.js", "Node.js",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Linux", "Git", "CI/CD", "GraphQL", "REST API",
  "PostgreSQL", "MongoDB", "Redis", "Kafka", "Snowflake", "Spark", "Prisma", "Tailwind CSS", "HTML", "CSS",
  "Figma", "Design Systems", "UI Design", "UX Design", "Prototyping", "User Research",
  "Usability Testing", "Wireframing", "A/B Testing", "Product Strategy", "Roadmapping",
  "Agile", "Scrum", "Jira", "Tableau", "Power BI", "Looker", "Excel", "Google Analytics",
  "Salesforce", "HubSpot", "SEO", "SEM", "CRM", "Financial Modeling", "Forecasting",
  "P&L Management", "Budgeting", "GAAP", "IFRS", "CPA", "QuickBooks", "SAP", "Payroll", "Corporate Tax", "Tax Audit",
  "KYC", "AML", "Supply Chain", "Six Sigma", "Lean", "Project Management",
  "Stakeholder Management", "Data Analysis", "Data Visualization", "Machine Learning",
  "Deep Learning", "NLP", "AI", "ML", "TensorFlow", "PyTorch", "MATLAB", "SPSS",
  "Bioinformatics", "Genomics", "NGS", "RNA-seq", "Nextflow", "Biostatistics", "CRISPR", "PCR", "HPLC",
  "Epic EHR", "Cerner", "HIPAA", "BLS", "ACLS", "CCRN", "Triage", "Acute Care",
  "Clinical Trials", "Wound Care", "Medication Administration", "Patient Advocacy",
  "AutoCAD", "SolidWorks", "Adobe Photoshop", "Adobe Illustrator", "Canva", "WordPress",
];

const SOFT_SKILL_LEXICON = [
  "Leadership", "Communication", "Cross-Functional Collaboration", "Problem Solving",
  "Critical Thinking", "Strategic Planning", "Time Management", "Adaptability",
  "Mentoring", "Teamwork", "Attention to Detail", "Conflict Resolution",
  "Decision Making", "Negotiation", "Empathy", "Ownership", "Accountability",
  "Stakeholder Communication", "Project Coordination", "Prioritization",
];

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function extractBullets(exp: any): string[] {
  if (Array.isArray(exp?.bullets) && exp.bullets.length > 0) {
    return exp.bullets.map((b: any) => String(b || "").trim()).filter(Boolean);
  }
  if (typeof exp?.description === "string" && exp.description.trim()) {
    return exp.description
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^[\u2022\-\*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function parseMonthYear(raw: string): { year: number; month: number; style: string } | null {
  const s = (raw || "").trim();
  if (!s) return null;
  if (/present|current|now/i.test(s)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, style: "present" };
  }
  const mNamed = s.match(/\b([A-Za-z]{3,9})\s+((?:19|20)\d{2})\b/);
  if (mNamed) {
    const m = MONTH_MAP[mNamed[1].toLowerCase()];
    if (m) {
      return {
        year: Number(mNamed[2]),
        month: m,
        style: mNamed[1].length > 3 ? "long-month" : "short-month",
      };
    }
  }
  const mNum = s.match(/\b(0?[1-9]|1[0-2])\/((?:19|20)\d{2})\b/);
  if (mNum) {
    return { year: Number(mNum[2]), month: Number(mNum[1]), style: "numeric" };
  }
  const mYear = s.match(/\b((?:19|20)\d{2})\b/);
  if (mYear) {
    return { year: Number(mYear[1]), month: 6, style: "year-only" };
  }
  return null;
}

function parsePeriodRange(period: string) {
  const parts = (period || "").split(/\s*(?:[-\u2013\u2014]|to)\s*/i);
  const start = parseMonthYear(parts[0] || "");
  const end = parts[1] ? parseMonthYear(parts[1]) : null;
  return { start, end };
}

function toMonthIndex(d: { year: number; month: number }): number {
  return d.year * 12 + d.month;
}

const CASE_SENSITIVE_SHORT_SKILLS = new Set(["R", "C", "Go", "AI", "ML", "QA", "BI", "UI", "UX", "HR", "PR", "IT"]);

function hasWholeKeyword(text: string, kw: string): boolean {
  const clean = String(kw || "").trim();
  if (!clean) return false;
  const escaped = escapeRegExp(clean);
  const caseSensitive = CASE_SENSITIVE_SHORT_SKILLS.has(clean);
  const re = new RegExp(`(?:^|[^A-Za-z0-9_+#&])${escaped}(?:$|[^A-Za-z0-9_+#&])`, caseSensitive ? "" : "i");
  return re.test(text);
}
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractKeywordsFromJobDescription(jd: string, jobTitle: string): {
  hard: string[];
  soft: string[];
} {
  const combined = `${jobTitle}\n${jd}`;
  const lower = combined.toLowerCase();

  const hard: string[] = [];
  const soft: string[] = [];

  for (const kw of HARD_SKILL_LEXICON) {
    if (hasWholeKeyword(combined, kw)) hard.push(kw);
  }
  for (const kw of SOFT_SKILL_LEXICON) {
    if (hasWholeKeyword(combined, kw)) soft.push(kw);
  }

  // Also mine frequent domain bigrams or technical acronyms (e.g., HIPAA, EHR, KPI, SaaS, B2B)
  const acronyms = combined.match(/\b[A-Z]{2,6}\b/g) || [];
  const ignoreAcro = new Set(["THE", "AND", "FOR", "YOU", "ARE", "WITH", "THIS", "THAT", "OUR", "YOUR", "JOB", "INC", "LLC", "USA", "EST", "PST", "UTC", "PDF", "DOC", "NEW", "ALL"]);
  for (const ac of acronyms) {
    if (!ignoreAcro.has(ac) && !hard.some((h) => h.toLowerCase() === ac.toLowerCase())) {
      hard.push(ac);
    }
    if (hard.length >= 16) break;
  }

  if (hard.length === 0) {
    hard.push("Project Management", "Data Analysis", "Process Optimization", "Strategic Planning");
  }
  if (soft.length === 0) {
    soft.push("Leadership", "Communication", "Cross-Functional Collaboration", "Problem Solving");
  }

  return {
    hard: Array.from(new Set(hard)).slice(0, 14),
    soft: Array.from(new Set(soft)).slice(0, 6),
  };
}

export function analyzeResume(params: {
  content: Record<string, any>;
  seriesId?: string;
  settings?: Record<string, any>;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
}): ResumeAnalysisReport {
  const c = params.content || {};
  const seriesId = String(params.seriesId || "11");
  const pageCount = Number(params.settings?.pageCount || 1);

  const name = String(c.name || c.fullName || "").trim();
  const role = String(c.role || c.profession || "").trim();
  const email = String(c.email || "").trim();
  const phone = String(c.phone || "").trim();
  const location = String(c.location || "").trim();
  const linkedin = String(c.linkedin || "").trim();
  const website = String(c.website || "").trim();
  const summary = String(c.summary || "").trim();

  const experience: any[] = Array.isArray(c.experience)
    ? c.experience.filter((e) => !e?.hidden)
    : [];
  const education: any[] = Array.isArray(c.education) ? c.education : [];
  const proSkills: string[] = Array.isArray(c.skills)
    ? c.skills.filter(Boolean)
    : Array.isArray(c.professionalSkills)
    ? c.professionalSkills.filter(Boolean)
    : [];
  const techSkills: string[] = Array.isArray(c.technicalSkills)
    ? c.technicalSkills.filter(Boolean)
    : [];
  const allSkills = Array.from(new Set([...proSkills, ...techSkills]));
  const certifications: any[] = Array.isArray(c.certifications) ? c.certifications : [];

  const allBullets: Array<{ expId: string; expRole: string; idx: number; text: string }> = [];
  for (const exp of experience) {
    const bl = extractBullets(exp);
    bl.forEach((text, idx) => {
      allBullets.push({
        expId: String(exp.id || ""),
        expRole: String(exp.role || exp.title || "Role"),
        idx,
        text,
      });
    });
  }

  // Build plain ATS text representation
  const atsLines: string[] = [];
  if (name) atsLines.push(name.toUpperCase());
  if (role) atsLines.push(role);
  const contactLine = [email, phone, linkedin, website, location].filter(Boolean).join(" | ");
  if (contactLine) atsLines.push(contactLine);
  if (summary) {
    atsLines.push("", "PROFESSIONAL SUMMARY", "====================", summary);
  }
  if (experience.length > 0) {
    atsLines.push("", "PROFESSIONAL EXPERIENCE", "=======================");
    for (const exp of experience) {
      const expTitle = exp.role || exp.title || "Role";
      const expComp = [exp.company, exp.location].filter(Boolean).join(", ");
      atsLines.push(`${expTitle}${expComp ? ` | ${expComp}` : ""}${exp.period ? ` | ${exp.period}` : ""}`);
      if (exp.showOverview && exp.overview) atsLines.push(exp.overview);
      for (const b of extractBullets(exp)) {
        atsLines.push(`- ${b}`);
      }
      atsLines.push("");
    }
  }
  if (education.length > 0) {
    atsLines.push("EDUCATION", "=========");
    for (const ed of education) {
      atsLines.push(
        `${ed.degree || "Degree"}${ed.school ? ` | ${ed.school}` : ""}${ed.period || ed.date ? ` | ${ed.period || ed.date}` : ""}`
      );
    }
    atsLines.push("");
  }
  if (allSkills.length > 0) {
    atsLines.push("SKILLS", "======");
    if (proSkills.length > 0) atsLines.push(`Professional: ${proSkills.join(", ")}`);
    if (techSkills.length > 0) atsLines.push(`Technical: ${techSkills.join(", ")}`);
    atsLines.push("");
  }
  if (certifications.length > 0) {
    atsLines.push("CERTIFICATIONS", "==============");
    for (const ct of certifications) {
      if (typeof ct === "string") atsLines.push(`- ${ct}`);
      else atsLines.push(`- ${[ct.name, ct.issuer, ct.date].filter(Boolean).join(" | ")}`);
    }
  }

  const plainText = atsLines.join("\n").trim();
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const checks: AnalysisCheckItem[] = [];

  // =========================================================================
  // CATEGORY 1: ATS PARSABILITY & FORMAT (7 Checks)
  // =========================================================================
  const isSingleCol = SINGLE_COL_ATS_SERIES.has(seriesId);
  checks.push({
    id: "ats-layout",
    code: "ATS-01",
    category: "ats",
    title: "ATS Layout Compatibility",
    severity: isSingleCol ? "pass" : "info",
    message: isSingleCol
      ? "Single-column linear structure gives maximum ATS parse reliability (98%+)."
      : "Two-column visual template. Farnavi exports clean reading-order PDF/DOCX, or switch to Ivy League / Minimalist / Modern Classic for strict 1-column ATS portals.",
    section: "designer",
    impactPoints: isSingleCol ? 0 : 3,
  });

  const missingCoreSections: string[] = [];
  if (!summary) missingCoreSections.push("Summary");
  if (experience.length === 0) missingCoreSections.push("Work Experience");
  if (education.length === 0) missingCoreSections.push("Education");
  if (allSkills.length === 0) missingCoreSections.push("Skills");

  checks.push({
    id: "ats-sections",
    code: "ATS-02",
    category: "ats",
    title: "Core ATS Section Coverage",
    severity: missingCoreSections.length === 0 ? "pass" : missingCoreSections.length === 1 ? "warning" : "error",
    message:
      missingCoreSections.length === 0
        ? "All 4 standard ATS sections (Summary, Experience, Education, Skills) are present."
        : `Missing core section(s): ${missingCoreSections.join(", ")}.`,
    section: missingCoreSections[0]?.toLowerCase().includes("exp")
      ? "experience"
      : missingCoreSections[0]?.toLowerCase().includes("edu")
      ? "education"
      : missingCoreSections[0]?.toLowerCase().includes("skill")
      ? "skills"
      : "summary",
    impactPoints: missingCoreSections.length * 7,
  });

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPhone = phone.replace(/\D/g, "").length >= 7;
  checks.push({
    id: "ats-contact",
    code: "ATS-03",
    category: "ats",
    title: "Machine-Readable Contact Info",
    severity: validEmail && validPhone ? "pass" : !validEmail ? "error" : "warning",
    message:
      validEmail && validPhone
        ? "Valid email and phone number detected cleanly."
        : !validEmail
        ? "Missing or invalid email address — recruiters cannot contact you."
        : "Add a valid phone number so recruiters can reach you directly.",
    section: "personal",
    impactPoints: !validEmail && !validPhone ? 16 : !validEmail ? 12 : !validPhone ? 5 : 0,
  });

  const dateStyles = new Set<string>();
  let missingDateRoles = 0;
  for (const exp of experience) {
    const rawPeriod = String(exp.period || exp.date || exp.dates || [exp.start, exp.end].filter(Boolean).join(" - ")).trim();
    if (!rawPeriod) {
      missingDateRoles++;
      continue;
    }
    const r = parsePeriodRange(rawPeriod);
    if (r.start && r.start.style !== "present") dateStyles.add(r.start.style);
    if (r.end && r.end.style !== "present") dateStyles.add(r.end.style);
  }
  checks.push({
    id: "ats-dates",
    code: "ATS-04",
    category: "ats",
    title: "Date Format Consistency",
    severity: missingDateRoles > 0 || dateStyles.size > 1 ? "warning" : "pass",
    message:
      missingDateRoles > 0
        ? `${missingDateRoles} role(s) are missing employment dates. ATS platforms like Workday require dates to compute years of experience.`
        : dateStyles.size <= 1
        ? "Employment dates follow a consistent format across roles."
        : "Mixed date formats detected (e.g. 'Jan 2021' mixed with '01/2021' or year-only). Standardize them for ATS timeline parsing.",
    section: "experience",
    impactPoints: (missingDateRoles > 0 ? 5 : 0) + (dateStyles.size > 1 ? 4 : 0),
  });

  const placeholderHits: string[] = [];
  for (const re of PLACEHOLDER_SIGNATURES) {
    const m = plainText.match(re);
    if (m) placeholderHits.push(m[0]);
  }
  checks.push({
    id: "ats-placeholders",
    code: "ATS-05",
    category: "ats",
    title: "Unedited Template Placeholders",
    severity: placeholderHits.length === 0 ? "pass" : "error",
    message:
      placeholderHits.length === 0
        ? "Zero leftover template placeholder strings detected."
        : `Found ${placeholderHits.length} unedited placeholder phrase(s) such as "${placeholderHits[0]}". Replace before applying.`,
    detail: placeholderHits.slice(0, 4).join(" · "),
    section: /write 3/i.test(placeholderHits[0] || "")
      ? "summary"
      : /city|555|youremail|linkedin\.com\/name|profession/i.test(placeholderHits[0] || "")
      ? "personal"
      : "experience",
    impactPoints: Math.min(28, placeholderHits.length * 9),
  });

  const minW = pageCount === 1 ? 260 : pageCount === 2 ? 520 : 850;
  const maxW = pageCount === 1 ? 680 : pageCount === 2 ? 1250 : 1850;
  const wordOk = wordCount >= minW && wordCount <= maxW;
  checks.push({
    id: "ats-length",
    code: "ATS-06",
    category: "ats",
    title: `Word Count for ${pageCount}-Page Target`,
    severity: wordOk ? "pass" : wordCount < minW * 0.65 ? "error" : "warning",
    message: wordOk
      ? `${wordCount} words — ideal density for a ${pageCount}-page resume.`
      : wordCount < minW
      ? `${wordCount} words is light for ${pageCount} page(s) (target ${minW}\u2013${maxW} words). Expand impact bullets.`
      : `${wordCount} words may crowd ${pageCount} page(s) (target ${minW}\u2013${maxW} words). Tighten wordy bullets or switch to ${Math.min(3, pageCount + 1)}P.`,
    section: "experience",
    impactPoints: wordOk ? 0 : wordCount < minW * 0.65 ? 12 : 6,
  });

  const hasRawTechUrl = /lovableproject\.com|localhost:\d+|127\.0\.0\.1|about:blank/i.test(plainText);
  checks.push({
    id: "ats-clean-urls",
    code: "ATS-07",
    category: "ats",
    title: "Clean Links & Zero Technical Artifacts",
    severity: hasRawTechUrl ? "error" : "pass",
    message: hasRawTechUrl
      ? "Detected a temporary preview/localhost URL in your resume text. Remove it immediately."
      : "All URLs and contact strings are clean and recruiter-safe.",
    section: "personal",
    impactPoints: hasRawTechUrl ? 10 : 0,
  });

  // =========================================================================
  // CATEGORY 2: CONTENT & QUANTIFIED IMPACT (7 Checks)
  // =========================================================================
  const metricRe = /(?:\d+%|\$\d|\u20ac\d|\b\d+\+|\b\d+(?:\.\d+)?x\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+\s*(?:users|clients|patients|nurses|engineers|products|projects|teams?|people|months|weeks|days|hours|million|billion|k\b|m\b))/i;
  const quantifiedBullets = allBullets.filter((b) => metricRe.test(b.text));
  const quantifiedRatio =
    allBullets.length > 0 ? Math.round((quantifiedBullets.length / allBullets.length) * 100) : 0;

  checks.push({
    id: "imp-metrics",
    code: "IMP-01",
    category: "impact",
    title: "Quantified Achievements",
    severity:
      allBullets.length === 0
        ? "error"
        : quantifiedRatio >= 40
        ? "pass"
        : quantifiedRatio >= 20
        ? "warning"
        : "error",
    message:
      allBullets.length === 0
        ? "Add measurable achievement bullets to your work experience."
        : quantifiedRatio >= 40
        ? `${quantifiedBullets.length}/${allBullets.length} bullets (${quantifiedRatio}%) include concrete numbers or measurable impact.`
        : `Only ${quantifiedBullets.length}/${allBullets.length} bullets (${quantifiedRatio}%) contain metrics. Aim for 40%+ using the XYZ formula (Accomplished X, measured by Y, by doing Z).`,
    section: "experience",
    impactPoints: allBullets.length === 0 ? 24 : quantifiedRatio >= 40 ? 0 : quantifiedRatio >= 20 ? 8 : quantifiedRatio > 0 ? 16 : 24,
  });

  const thinRoles = experience.filter((e) => extractBullets(e).length < 2);
  const bloatedRoles = experience.filter((e) => extractBullets(e).length > 7);
  checks.push({
    id: "imp-bullet-count",
    code: "IMP-02",
    category: "impact",
    title: "Bullet Count per Role",
    severity:
      experience.length === 0
        ? "error"
        : thinRoles.length === 0 && bloatedRoles.length === 0
        ? "pass"
        : "warning",
    message:
      thinRoles.length > 0
        ? `${thinRoles.length} role(s) have fewer than 2 bullet points. Aim for 3\u20135 concise achievements per role.`
        : bloatedRoles.length > 0
        ? `${bloatedRoles.length} role(s) have more than 7 bullets. Trim to the strongest 4\u20136 outcomes.`
        : "Every work experience entry has a balanced number of bullet points.",
    section: "experience",
    impactPoints: experience.length === 0 ? 10 : thinRoles.length > 0 || bloatedRoles.length > 0 ? 5 : 0,
  });

  const wordyBullets = allBullets.filter((b) => b.text.length > 205);
  const shortBullets = allBullets.filter((b) => b.text.length < 32);
  checks.push({
    id: "imp-bullet-length",
    code: "IMP-03",
    category: "impact",
    title: "Bullet Conciseness & Readability",
    severity: allBullets.length === 0 ? "warning" : wordyBullets.length === 0 && shortBullets.length === 0 ? "pass" : "warning",
    message:
      wordyBullets.length > 0
        ? `${wordyBullets.length} bullet(s) exceed 200 characters and read like dense paragraphs. Keep bullets to 1\u20132 crisp lines.`
        : shortBullets.length > 0
        ? `${shortBullets.length} bullet(s) are very brief (<32 chars). Add scope and measurable outcome.`
        : "All bullet points are concise and easy for recruiters to scan in 6 seconds.",
    detail: wordyBullets[0]?.text.slice(0, 120) || shortBullets[0]?.text,
    section: "experience",
    impactPoints: allBullets.length === 0 ? 6 : wordyBullets.length > 0 || shortBullets.length > 0 ? 4 : 0,
  });

  const sumLen = summary.length;
  const sumPlaceholder = PLACEHOLDER_SIGNATURES.some((re) => re.test(summary));
  checks.push({
    id: "imp-summary",
    code: "IMP-04",
    category: "impact",
    title: "Professional Summary Strength",
    severity:
      !summary || sumPlaceholder
        ? "error"
        : sumLen >= 220 && sumLen <= 650
        ? "pass"
        : "warning",
    message:
      !summary || sumPlaceholder
        ? "Write a tailored 2\u20134 sentence summary (250\u2013600 characters) highlighting years of experience and top impact."
        : sumLen < 220
        ? `Summary is ${sumLen} chars. Expanding to 250\u2013600 chars gives stronger keyword coverage.`
        : sumLen > 650
        ? `Summary is ${sumLen} chars. Trim under 600 chars so recruiters read it immediately.`
        : `Summary length is ${sumLen} characters \u2014 right in the recruiter sweet spot.`,
    section: "summary",
    impactPoints: !summary || sumPlaceholder ? 14 : sumLen < 120 ? 7 : sumLen < 220 || sumLen > 650 ? 4 : 0,
  });

  checks.push({
    id: "imp-exp-depth",
    code: "IMP-05",
    category: "impact",
    title: "Experience History Depth",
    severity: experience.length >= 2 ? "pass" : experience.length === 1 ? "info" : "error",
    message:
      experience.length >= 2
        ? `${experience.length} roles listed, showing clear career progression.`
        : experience.length === 1
        ? "Only 1 work experience listed. Add prior roles, internships, or projects if relevant."
        : "No work experience entries found.",
    section: "experience",
    impactPoints: experience.length === 0 ? 20 : experience.length === 1 ? 5 : 0,
  });

  checks.push({
    id: "imp-skills-density",
    code: "IMP-06",
    category: "impact",
    title: "Skills Coverage & Focus",
    severity:
      allSkills.length >= 6 && allSkills.length <= 22
        ? "pass"
        : allSkills.length === 0
        ? "error"
        : "warning",
    message:
      allSkills.length === 0
        ? "Add 6\u201316 role-specific hard and soft skills for ATS matching."
        : allSkills.length < 6
        ? `Only ${allSkills.length} skill(s) listed. Aim for at least 6\u201312 targeted skills.`
        : allSkills.length > 22
        ? `${allSkills.length} skills listed. Consider focusing on the top 12\u201318 most relevant to your target role.`
        : `${allSkills.length} focused skills listed.`,
    section: "skills",
    impactPoints: allSkills.length === 0 ? 14 : allSkills.length < 6 || allSkills.length > 22 ? 6 : 0,
  });

  const incompleteEdu = education.filter((ed) => !ed.degree || !ed.school);
  checks.push({
    id: "imp-education",
    code: "IMP-07",
    category: "impact",
    title: "Education Completeness",
    severity:
      education.length === 0
        ? "warning"
        : incompleteEdu.length === 0
        ? "pass"
        : "warning",
    message:
      education.length === 0
        ? "No education entries added."
        : incompleteEdu.length > 0
        ? `${incompleteEdu.length} education item(s) missing degree or institution name.`
        : `${education.length} complete education record(s) included.`,
    section: "education",
    impactPoints: education.length === 0 ? 6 : incompleteEdu.length > 0 ? 4 : 0,
  });

  // =========================================================================
  // CATEGORY 3: LANGUAGE & WRITING QUALITY (8 Checks)
  // =========================================================================
  let weakBulletHit: { bullet: (typeof allBullets)[0]; replacement: string; verb: string } | null = null;
  let weakCount = 0;
  const startVerbCounts = new Map<string, number>();
  let strongStartCount = 0;

  for (const b of allBullets) {
    const firstWord = (b.text.match(/^[A-Za-z]+/)?.[0] || "").toLowerCase();
    if (firstWord) {
      startVerbCounts.set(firstWord, (startVerbCounts.get(firstWord) || 0) + 1);
      if (STRONG_ACTION_VERBS.has(firstWord)) strongStartCount++;
    }
    for (const wv of WEAK_VERB_MAP) {
      if (wv.pattern.test(b.text)) {
        weakCount++;
        if (!weakBulletHit) {
          weakBulletHit = {
            bullet: b,
            verb: wv.verb,
            replacement: b.text.replace(wv.pattern, wv.replacement),
          };
        }
        break;
      }
    }
  }

  const strongRatio =
    allBullets.length > 0 ? Math.round((strongStartCount / allBullets.length) * 100) : 0;
  checks.push({
    id: "lang-action-verbs",
    code: "LNG-01",
    category: "language",
    title: "Strong Action Verb Openings",
    severity: allBullets.length === 0 ? "error" : strongRatio >= 65 ? "pass" : "warning",
    message:
      allBullets.length === 0
        ? "No bullets to evaluate yet."
        : strongRatio >= 65
        ? `${strongStartCount}/${allBullets.length} bullets (${strongRatio}%) open with strong action verbs.`
        : `Only ${strongStartCount}/${allBullets.length} bullets (${strongRatio}%) start with high-impact action verbs (e.g. Led, Built, Reduced, Architected).`,
    section: "experience",
    impactPoints: allBullets.length === 0 ? 18 : strongRatio >= 65 ? 0 : strongRatio < 35 ? 15 : 8,
  });

  checks.push({
    id: "lang-weak-verbs",
    code: "LNG-02",
    category: "language",
    title: "Weak Phrases & Duty Language",
    severity: weakCount === 0 ? "pass" : "warning",
    message:
      weakCount === 0
        ? "No weak duty openers ('Responsible for', 'Helped', 'Worked on') found."
        : `Found ${weakCount} bullet(s) starting with weak phrases like "${weakBulletHit?.verb}". Replace with active ownership verbs.`,
    detail: weakBulletHit ? `"${weakBulletHit.bullet.text.slice(0, 95)}"` : undefined,
    section: "experience",
    impactPoints: Math.min(20, weakCount * 6),
    quickFix: weakBulletHit
      ? {
          kind: "replace-bullet",
          expId: weakBulletHit.bullet.expId,
          bulletIndex: weakBulletHit.bullet.idx,
          original: weakBulletHit.bullet.text,
          replacement: weakBulletHit.replacement,
          buttonLabel: `Replace "${weakBulletHit.verb}"`,
        }
      : undefined,
  });

  const repeatedVerbs = Array.from(startVerbCounts.entries())
    .filter(([v, count]) => count >= 3 && v.length > 2)
    .map(([v, count]) => `${v} (${count}x)`);
  checks.push({
    id: "lang-repetitive-verbs",
    code: "LNG-03",
    category: "language",
    title: "Repetitive Opening Verbs",
    severity: repeatedVerbs.length === 0 ? "pass" : "warning",
    message:
      repeatedVerbs.length === 0
        ? "Great verb variety — no opening verb is overused."
        : `Overused opening verb(s): ${repeatedVerbs.join(", ")}. Vary your verbs to keep each bullet distinct.`,
    section: "experience",
    impactPoints: repeatedVerbs.length > 0 ? 4 : 0,
  });

  const pronounBullet = allBullets.find((b) => PRONOUN_RE.test(b.text));
  const summaryHasPronoun = PRONOUN_RE.test(summary);
  const pronounCount =
    allBullets.filter((b) => PRONOUN_RE.test(b.text)).length + (summaryHasPronoun ? 1 : 0);
  checks.push({
    id: "lang-pronouns",
    code: "LNG-04",
    category: "language",
    title: "Personal Pronouns (I / Me / My)",
    severity: pronounCount === 0 ? "pass" : "warning",
    message:
      pronounCount === 0
        ? "No first-person pronouns detected (clean resume style)."
        : `Found personal pronouns in ${pronounCount} place(s). Standard resumes use implied first-person without "I/My/We".`,
    detail: pronounBullet?.text.slice(0, 100) || (summaryHasPronoun ? summary.slice(0, 100) : undefined),
    section: pronounBullet ? "experience" : "summary",
    impactPoints: Math.min(12, pronounCount * 4),
    quickFix: pronounBullet
      ? {
          kind: "replace-bullet",
          expId: pronounBullet.expId,
          bulletIndex: pronounBullet.idx,
          original: pronounBullet.text,
          replacement: pronounBullet.text
            .replace(/^\s*(?:I|We)\s+/i, "")
            .replace(/\bmy\s+/gi, "")
            .replace(/^([a-z])/, (_, ch) => ch.toUpperCase()),
          buttonLabel: "Remove Pronoun",
        }
      : undefined,
  });

  const lowerBody = `${summary} ${allBullets.map((b) => b.text).join(" ")}`.toLowerCase();
  const foundBuzz = BUZZWORDS.filter((bw) => lowerBody.includes(bw));
  checks.push({
    id: "lang-buzzwords",
    code: "LNG-05",
    category: "language",
    title: "Clich\u00e9 Buzzwords",
    severity: foundBuzz.length === 0 ? "pass" : "info",
    message:
      foundBuzz.length === 0
        ? "Free of empty clich\u00e9 buzzwords."
        : `Detected buzzword(s): ${foundBuzz.slice(0, 4).join(", ")}. Replace generic adjectives with concrete proof.`,
    section: summary.toLowerCase().includes(foundBuzz[0] || "__none__") ? "summary" : "experience",
    impactPoints: Math.min(6, foundBuzz.length * 2),
  });

  const passiveBullets = allBullets.filter((b) => PASSIVE_PATTERNS.some((re) => re.test(b.text)));
  checks.push({
    id: "lang-passive",
    code: "LNG-06",
    category: "language",
    title: "Passive Voice Detection",
    severity: passiveBullets.length === 0 ? "pass" : "warning",
    message:
      passiveBullets.length === 0
        ? "Active voice used consistently across achievements."
        : `${passiveBullets.length} bullet(s) use passive phrasing (e.g. "was responsible/managed"). Convert to direct active voice.`,
    detail: passiveBullets[0]?.text.slice(0, 100),
    section: "experience",
    impactPoints: Math.min(12, passiveBullets.length * 4),
  });

  const foundFillers = FILLER_WORDS.filter((fw) =>
    new RegExp(`\\b${escapeRegExp(fw)}\\b`, "i").test(lowerBody)
  );
  checks.push({
    id: "lang-fillers",
    code: "LNG-07",
    category: "language",
    title: "Filler Words & Fluff",
    severity: foundFillers.length === 0 ? "pass" : "info",
    message:
      foundFillers.length === 0
        ? "Tight, direct phrasing with no filler words."
        : `Found filler word(s): ${foundFillers.slice(0, 4).join(", ")}. Cut unnecessary qualifiers to sharpen impact.`,
    section: "experience",
    impactPoints: Math.min(4, foundFillers.length * 2),
  });

  let typoHit: { bullet: (typeof allBullets)[0]; replacement: string; word: string } | null = null;
  let typoCount = 0;
  for (const b of allBullets) {
    for (const [re, rep] of TYPO_MAP) {
      const m = b.text.match(re);
      if (m) {
        typoCount++;
        if (!typoHit) {
          typoHit = {
            bullet: b,
            word: m[0],
            replacement: b.text.replace(re, rep),
          };
        }
      }
    }
  }
  checks.push({
    id: "lang-typos",
    code: "LNG-08",
    category: "language",
    title: "Spelling & PDF Ligature Check",
    severity: typoCount === 0 ? "pass" : "error",
    message:
      typoCount === 0
        ? "No common spelling or PDF ligature errors detected."
        : `Detected ${typoCount} likely typo/ligature error(s) (e.g. "${typoHit?.word}").`,
    detail: typoHit ? `"${typoHit.bullet.text.slice(0, 95)}"` : undefined,
    section: "experience",
    impactPoints: Math.min(12, typoCount * 5),
    quickFix: typoHit
      ? {
          kind: "replace-bullet",
          expId: typoHit.bullet.expId,
          bulletIndex: typoHit.bullet.idx,
          original: typoHit.bullet.text,
          replacement: typoHit.replacement,
          buttonLabel: `Fix "${typoHit.word}"`,
        }
      : undefined,
  });

  // =========================================================================
  // CATEGORY 4: RECRUITER SCREENING CHECKS (6 Checks — 100% Unlocked!)
  // =========================================================================
  const parsedRanges = experience
    .map((e) => ({
      role: String(e.role || e.title || ""),
      company: String(e.company || ""),
      ...parsePeriodRange(e.period || ""),
    }))
    .filter((r) => r.start !== null);

  const impossibleDates = parsedRanges.filter(
    (r) => r.start && r.end && toMonthIndex(r.start) > toMonthIndex(r.end)
  );
  const missingCompanies = experience.filter((e) => !String(e.company || "").trim());

  checks.push({
    id: "rec-credibility",
    code: "REC-01",
    category: "recruiter",
    title: "Credibility & Date Logic",
    severity: experience.length === 0 || impossibleDates.length > 0 || missingCompanies.length > 0 ? "error" : "pass",
    message:
      impossibleDates.length > 0
        ? `${impossibleDates.length} role(s) have a start date after the end date. Correct timeline dates.`
        : missingCompanies.length > 0
        ? `${missingCompanies.length} role(s) are missing a company or organization name.`
        : "Dates, titles, and employer names pass credibility screening.",
    section: "experience",
    impactPoints: experience.length === 0 ? 20 : impossibleDates.length > 0 || missingCompanies.length > 0 ? 8 : 0,
  });

  const shortStints = parsedRanges.filter((r) => {
    if (!r.start || !r.end || r.end.style === "present") return false;
    const months = toMonthIndex(r.end) - toMonthIndex(r.start);
    return months >= 0 && months < 10 && !/intern|contract|freelance/i.test(r.role);
  });
  checks.push({
    id: "rec-interview-risks",
    code: "REC-02",
    category: "recruiter",
    title: "Interview Risk Signals (Tenure)",
    severity: shortStints.length >= 2 ? "warning" : "pass",
    message:
      shortStints.length >= 2
        ? `${shortStints.length} full-time roles lasted under 10 months. Be ready to explain transitions (or label contract/internship roles explicitly).`
        : "No job-hopping or tenure red flags detected.",
    section: "experience",
    impactPoints: shortStints.length >= 2 ? 4 : 0,
  });

  // Employment gap detection (>6 months between consecutive roles)
  const chronological = [...parsedRanges].sort(
    (a, b) => toMonthIndex(b.start!) - toMonthIndex(a.start!)
  );
  let maxGapMonths = 0;
  let gapDetail = "";
  for (let i = 0; i < chronological.length - 1; i++) {
    const newer = chronological[i];
    const older = chronological[i + 1];
    if (newer.start && older.end) {
      const gap = toMonthIndex(newer.start) - toMonthIndex(older.end);
      if (gap > maxGapMonths) {
        maxGapMonths = gap;
        gapDetail = `${gap} months between ${older.company || older.role} and ${newer.company || newer.role}`;
      }
    }
  }
  checks.push({
    id: "rec-gaps",
    code: "REC-03",
    category: "recruiter",
    title: "Employment Gaps",
    severity: maxGapMonths > 6 ? "info" : "pass",
    message:
      maxGapMonths > 6
        ? `Detected a ${maxGapMonths}-month employment gap (${gapDetail}). Consider noting education, consulting, or sabbatical if applicable.`
        : "No unexplained employment gaps (>6 months) detected.",
    section: "experience",
    impactPoints: maxGapMonths > 12 ? 3 : 0,
  });

  const biasItems: string[] = [];
  if (c.dob) biasItems.push("Date of Birth");
  if (c.nationality) biasItems.push("Nationality");
  if (c.maritalStatus) biasItems.push("Marital Status");
  const curYear = new Date().getFullYear();
  const oldGrad = education.find((ed) => {
    const m = String(ed.period || ed.date || "").match(/\b(19\d{2}|20\d{2})\b/);
    return m && curYear - Number(m[1]) > 18;
  });
  if (oldGrad) biasItems.push("Graduation year >18 yrs ago");

  checks.push({
    id: "rec-age-bias",
    code: "REC-04",
    category: "recruiter",
    title: "Age & Personal Bias Screening",
    severity: biasItems.length === 0 ? "pass" : "info",
    message:
      biasItems.length === 0
        ? "No US/UK bias-risk fields (DOB, marital status, dated graduation years) exposed."
        : `Consider hiding ${biasItems.join(", ")} for US/UK/Canada applications to prevent unconscious bias.`,
    section: "personal",
    impactPoints: biasItems.length > 0 ? 2 : 0,
  });

  const isSeniorRole = /\b(?:senior|lead|staff|principal|manager|director|head|vp|chief)\b/i.test(
    `${role} ${experience[0]?.role || ""}`
  );
  const leadershipCount = allBullets.filter((b) => {
    const w = (b.text.match(/^[A-Za-z]+/)?.[0] || "").toLowerCase();
    return LEADERSHIP_VERBS.has(w);
  }).length;

  checks.push({
    id: "rec-scope",
    code: "REC-05",
    category: "recruiter",
    title: "Scope & Ownership Alignment",
    severity: (isSeniorRole && leadershipCount < 2) || (allBullets.length > 0 && strongRatio < 35 && quantifiedRatio === 0) ? "warning" : "pass",
    message:
      !isSeniorRole
        ? "Ownership language matches your target seniority level."
        : leadershipCount >= 2
        ? `${leadershipCount} bullets clearly demonstrate senior ownership and leadership.`
        : `Target title indicates Senior/Lead scope, but only ${leadershipCount} bullet(s) lead with ownership verbs (Led, Architected, Directed, Mentored).`,
    section: "experience",
    impactPoints: isSeniorRole && leadershipCount < 2 ? 6 : allBullets.length > 0 && strongRatio < 35 && quantifiedRatio === 0 ? 8 : 0,
  });

  const hasLinkedIn = /linkedin\.com/i.test(linkedin);
  checks.push({
    id: "rec-reachability",
    code: "REC-06",
    category: "recruiter",
    title: "LinkedIn & Professional Presence",
    severity: hasLinkedIn && Boolean(location) ? "pass" : "info",
    message:
      hasLinkedIn && Boolean(location)
        ? "LinkedIn profile and location are both included for recruiter verification."
        : !hasLinkedIn
        ? "Add your LinkedIn URL \u2014 over 85% of recruiters cross-check LinkedIn profiles."
        : "Add your City & Country/State so location filters match your resume.",
    section: "personal",
    impactPoints: (!hasLinkedIn ? 5 : 0) + (!location ? 3 : 0),
  });

  // Compute category subscores (0..100) with honest evidence caps (Rezi / Resume Worded calibration)
  const calcSub = (cat: CheckCategory) => {
    const penalty = checks
      .filter((ch) => ch.category === cat)
      .reduce((acc, ch) => acc + ch.impactPoints, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  };

  let atsSub = calcSub("ats");
  let impactSub = calcSub("impact");
  let languageSub = calcSub("language");
  let recruiterSub = calcSub("recruiter");

  // Prevent empty/stub resumes from getting free high subscores on unevaluated categories
  if (wordCount < 40) atsSub = Math.min(atsSub, 35);
  if (allBullets.length === 0 && summary.length < 40) {
    languageSub = Math.min(languageSub, 15);
  } else if (allBullets.length === 0) {
    languageSub = Math.min(languageSub, 45);
  }
  if (experience.length === 0) {
    recruiterSub = Math.min(recruiterSub, 20);
    impactSub = Math.min(impactSub, 20);
  }

  const subscores = {
    ats: atsSub,
    impact: impactSub,
    language: languageSub,
    recruiter: recruiterSub,
  };

  let overallScore = Math.round(
    subscores.ats * 0.25 +
      subscores.impact * 0.35 +
      subscores.language * 0.25 +
      subscores.recruiter * 0.15
  );

  if (wordCount < 40) overallScore = Math.min(overallScore, 28);
  else if (experience.length === 0) overallScore = Math.min(overallScore, 38);
  if (placeholderHits.length >= 4) overallScore = Math.min(overallScore, 38);
  else if (placeholderHits.length >= 2) overallScore = Math.min(overallScore, 48);

  const grade: ResumeAnalysisReport["grade"] =
    overallScore >= 88
      ? "Excellent"
      : overallScore >= 75
      ? "Strong"
      : overallScore >= 60
      ? "Good"
      : "Needs Work";

  // Section-by-section summary (Kickresume Section Analysis pattern)
  const sectionAnalysis: SectionAnalysisSummary[] = [
    {
      section: "personal",
      label: "Contact & Header",
      score: [Boolean(name), Boolean(role), validEmail, validPhone, hasLinkedIn].filter(Boolean).length * 20,
      strengths: [
        ...(name ? [`Full name included (${name})`] : []),
        ...(validEmail ? ["Valid email address formatted cleanly"] : []),
        ...(hasLinkedIn ? ["LinkedIn profile linked"] : []),
      ],
      issues: [
        ...(!role ? ["Add a clear target job title under your name"] : []),
        ...(!validPhone ? ["Add a reachable phone number"] : []),
        ...(!location ? ["Add City, State/Country for recruiter filters"] : []),
      ],
    },
    {
      section: "summary",
      label: "Professional Summary",
      score: !summary || sumPlaceholder ? 20 : sumLen >= 220 && sumLen <= 650 ? 100 : 75,
      strengths:
        summary && !sumPlaceholder
          ? [`Present (${sumLen} characters)`]
          : [],
      issues:
        !summary || sumPlaceholder
          ? ["Replace placeholder with a 2\u20134 sentence summary"]
          : sumLen < 220
          ? ["Expand summary to 250\u2013600 characters"]
          : [],
    },
    {
      section: "experience",
      label: "Work Experience",
      score: Math.round((subscores.impact + subscores.language) / 2),
      strengths: [
        ...(experience.length > 0 ? [`${experience.length} role(s) and ${allBullets.length} bullet(s)`] : []),
        ...(quantifiedRatio >= 40 ? [`Strong metrics (${quantifiedRatio}% quantified)`] : []),
        ...(weakCount === 0 && allBullets.length > 0 ? ["Zero weak duty openers"] : []),
      ],
      issues: [
        ...(quantifiedRatio < 40 ? ["Add numbers/percentages to more bullets"] : []),
        ...(weakCount > 0 ? [`Replace ${weakCount} weak verb opener(s)`] : []),
        ...(typoCount > 0 ? [`Fix ${typoCount} spelling/ligature issue(s)`] : []),
      ],
    },
    {
      section: "skills",
      label: "Skills",
      score: allSkills.length >= 6 ? 100 : allSkills.length > 0 ? 65 : 20,
      strengths: allSkills.length >= 6 ? [`${allSkills.length} relevant skills listed`] : [],
      issues: allSkills.length < 6 ? ["Add at least 6\u201312 core hard/soft skills"] : [],
    },
    {
      section: "education",
      label: "Education",
      score: education.length > 0 && incompleteEdu.length === 0 ? 100 : education.length > 0 ? 70 : 40,
      strengths: education.length > 0 ? [`${education.length} education entry included`] : [],
      issues:
        education.length === 0
          ? ["Add your highest degree or relevant training"]
          : incompleteEdu.length > 0
          ? ["Fill in missing degree or institution fields"]
          : [],
    },
  ];

  // Optional Job Description Match
  let jobMatch: JobMatchAnalysis | undefined;
  const jdText = String(params.jobDescription || "").trim();
  const jdTitle = String(params.jobTitle || "").trim();
  if (jdText.length >= 20 || jdTitle.length >= 3) {
    const { hard, soft } = extractKeywordsFromJobDescription(jdText, jdTitle);
    const matchedHard = hard.filter((k) => hasWholeKeyword(plainText, k));
    const missingHard = hard.filter((k) => !hasWholeKeyword(plainText, k));
    const matchedSoft = soft.filter((k) => hasWholeKeyword(plainText, k));
    const missingSoft = soft.filter((k) => !hasWholeKeyword(plainText, k));
    const denom = Math.max(1, hard.length + soft.length * 0.5);
    const matchScore = Math.round(((matchedHard.length + matchedSoft.length * 0.5) / denom) * 100);

    jobMatch = {
      matchScore,
      jobTitle: jdTitle || role || "Target Role",
      company: String(params.jobCompany || "Target Company"),
      matchedHard,
      missingHard,
      matchedSoft,
      missingSoft,
      keywordDensityNote:
        matchScore >= 75
          ? "Strong ATS keyword alignment for this job posting."
          : matchScore >= 50
          ? "Moderate alignment \u2014 weave 3\u20135 missing hard skills into your Skills and Experience bullets."
          : "Low alignment \u2014 prioritize adding the missing hard skills that reflect your true background.",
    };
  }

  const passedChecks = checks.filter((ch) => ch.severity === "pass").length;
  const warningCount = checks.filter((ch) => ch.severity === "warning").length;
  const errorCount = checks.filter((ch) => ch.severity === "error").length;

  return {
    overallScore,
    grade,
    subscores,
    stats: {
      totalChecks: checks.length,
      passedChecks,
      warningCount,
      errorCount,
      wordCount,
      summaryChars: sumLen,
      roleCount: experience.length,
      bulletCount: allBullets.length,
      quantifiedBulletCount: quantifiedBullets.length,
      quantifiedRatio,
      skillCount: allSkills.length,
    },
    checks,
    sectionAnalysis,
    atsView: {
      parseRate: Math.max(15, Math.min(100, subscores.ats)),
      layoutKind: isSingleCol ? "1-column-ats" : "2-column-visual",
      wordCount,
      estimatedPages: Math.max(1, Math.min(3, Math.ceil(wordCount / 560))),
      detectedFields: [
        { label: "Full Name", value: name || "Missing", ok: Boolean(name) && !PLACEHOLDER_SIGNATURES.some((r) => r.test(name)) },
        { label: "Target Title", value: role || "Missing", ok: Boolean(role) && !/your profession/i.test(role) },
        { label: "Email", value: email || "Missing", ok: validEmail },
        { label: "Phone", value: phone || "Missing", ok: validPhone },
        { label: "Location", value: location || "Missing", ok: Boolean(location) && !/city,\s*state/i.test(location) },
        { label: "Experience", value: `${experience.length} roles / ${allBullets.length} bullets`, ok: experience.length > 0 },
      ],
      plainText,
    },
    jobMatch,
    analyzedAt: new Date().toISOString(),
  };
}