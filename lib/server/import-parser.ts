import JSZip from "jszip";
import { extractText, getDocumentProxy } from "unpdf";

export interface ImportedExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  current: boolean;
  overview: string;
  showOverview: boolean;
  bullets: string[];
  description: string;
}

export interface ImportedEducation {
  id: string;
  degree: string;
  field: string;
  school: string;
  location: string;
  period: string;
  gpa?: string;
}

export interface ImportedCert {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ImportedCourse {
  id: string;
  title: string;
  institution: string;
  date: string;
}

export interface ImportedAward {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface ImportedVolunteer {
  id: string;
  organization: string;
  role: string;
  date: string;
  description: string;
}

export interface ImportedReference {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
}

export interface ParsedResumeData {
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  experience: ImportedExperience[];
  education: ImportedEducation[];
  skills: string[];
  technicalSkills: string[];
  certifications: ImportedCert[];
  courses: ImportedCourse[];
  awards: ImportedAward[];
  volunteering: ImportedVolunteer[];
  references: ImportedReference[];
}

export interface ImportParseResult {
  parsed: ParsedResumeData;
  stats: {
    sourceType: "pdf" | "docx" | "txt" | "paste" | "linkedin";
    fileName?: string;
    rawChars: number;
    lineCount: number;
    detectedSections: string[];
    experienceCount: number;
    bulletCount: number;
    educationCount: number;
    skillCount: number;
    certificationCount: number;
    confidence: number;
    warnings: string[];
  };
  rawTextPreview: string;
  mode: "deterministic" | "ai-enhanced";
}

interface ExtractedLine {
  text: string;
  fontSize: number;
  page: number;
  yRatio: number; // 0 = top of page, 1 = bottom of page
}

function makeId(prefix: string, idx: number): string {
  return `${prefix}_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
}

// Repair both Unicode ligature glyphs and Chromium PDF dropped "fi"/"fl" ligatures
const DROPPED_LIGATURE_FIXES: Array<[RegExp, string]> = [
  [/\bunied\b/gi, "unified"],
  [/\bntech\b/gi, "fintech"],
  [/\bprole(s)?\b/gi, "profile$1"],
  [/\bspecic(ally|ations?|s)?\b/gi, "specific$1"],
  [/\bworkow(s)?\b/gi, "workflow$1"],
  [/\bcerticat(e|es|ion|ions)\b/gi, "certificat$1"],
  [/\bcertied\b/gi, "certified"],
  [/\befcien(t|tly|cy)\b/gi, "efficien$1"],
  [/\bidentied\b/gi, "identified"],
  [/\bqualied\b/gi, "qualified"],
  [/\bsignican(t|tly|ce)\b/gi, "significan$1"],
  [/\bbenet(s|ed|ing)?\b/gi, "benefit$1"],
  [/\bofce(r|rs|s)?\b/gi, "office$1"],
  [/\bconden(t|tly|ce)\b/gi, "confiden$1"],
  [/\bveried\b/gi, "verified"],
  [/\bmodied\b/gi, "modified"],
  [/\bscientic\b/gi, "scientific"],
  [/\bsimpled\b/gi, "simplified"],
  [/\bsimplied\b/gi, "simplified"],
  [/\bconict(s)?\b/gi, "conflict$1"],
  [/\binuenc(e|ed|ing)\b/gi, "influenc$1"],
  [/\bexib(le|ility)\b/gi, "flexib$1"],
  [/\bportolio\b/gi, "portfolio"],
];

function normalizeText(input: string): string {
  let out = input
    .replace(/\ufb00/g, "ff")
    .replace(/\ufb01/g, "fi")
    .replace(/\ufb02/g, "fl")
    .replace(/\ufb03/g, "ffi")
    .replace(/\ufb04/g, "ffl")
    .replace(/\u00a0/g, " ");

  for (const [re, rep] of DROPPED_LIGATURE_FIXES) {
    out = out.replace(re, (match, ...args) => {
      const replaced = match.replace(re, rep);
      if (match[0] && match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replaced.charAt(0).toUpperCase() + replaced.slice(1);
      }
      return replaced;
    });
  }
  return out;
}

// Collapse letter-spaced headings like "S U M M A R Y" or "S A R A  M O H A M M A D I"
function collapseSpacedLetters(line: string): string {
  const s = line.trim();
  const tokens = s.split(/\s+/);
  if (tokens.length < 4) return s;
  const singleLetters = tokens.filter((t) => /^[A-Za-z&]$/.test(t)).length;
  if (singleLetters / tokens.length < 0.75) return s;
  // Preserve multi-space word breaks as single spaces, join single-space letters
  return s
    .split(/\s{2,}/)
    .map((word) => word.replace(/\s+/g, ""))
    .join(" ");
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

// Strip inline Chrome/Edge print noise fragments before checking whole-line noise
function stripInlineBrowserNoise(line: string): string {
  return line
    .replace(/https?:\/\/(?:localhost:\d+|127\.0\.0\.1(?::\d+)?|[0-9a-f-]{12,}\.[a-z0-9.-]+|[^\s]*lovableproject\.com[^\s]*)/gi, " ")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, " ")
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?\b/gi, " ")
    .replace(/\b(?:page\s+)?\d+\s+of\s+\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBrowserPrintNoise(line: string, fontSize = 10, yRatio = 0.5): boolean {
  const s = line.trim();
  if (!s) return true;
  if (/lovableproject\.com|about:blank|chrome-extension:\/\/|localhost:\d+|127\.0\.0\.1/i.test(s)) {
    return true;
  }
  if (/https?:\/\/[0-9a-f-]{10,}/i.test(s)) return true;
  // Broken UUID URL wrap fragments like "a5ef-" or "2b7d40a1a7c7.lovableproject.com/"
  if (/^[0-9a-f]{3,}(?:-[0-9a-f]*)+$/i.test(s)) return true;
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i.test(s)) {
    return true;
  }
  if (/^(?:page\s+)?\d+\s*(?:\/|of)\s*\d+$/i.test(s)) return true;
  // Browser tab title printed at top/bottom ("Sara Mohammadi — Senior Product Designer Resume")
  if (/[\u2014\u2013\|]|\s-\s/.test(s) && /\b(?:resume|cv)\b/i.test(s)) {
    return true;
  }
  if (/\b(?:resume|curriculum\s+vitae)\s*$/i.test(s) && s.split(/\s+/).length >= 3) {
    return true;
  }
  // Running headers/footers in extreme page margins (<4.8% top or >94.5% bottom)
  if ((yRatio < 0.048 || yRatio > 0.945) && fontSize <= 9.5) {
    return true;
  }
  if (/^[=\-_*\u2022\u00b7\u2014\u2013]{3,}$/.test(s)) return true;
  return false;
}

const JOB_TITLE_KEYWORDS_RE =
  /\b(?:senior|junior|lead|principal|staff|chief|head|vp|director|manager|designer|developer|engineer|architect|analyst|scientist|bioinformatician|nurse|rn|physician|doctor|consultant|specialist|coordinator|administrator|officer|executive|assistant|associate|intern|founder|ceo|cto|cfo|coo|writer|editor|marketer|strategist|researcher|technician|teacher|professor|product|ux|ui|frontend|backend|fullstack|software|data|marketing|sales|operations|hr|finance)\b/i;

function looksLikeJobTitle(s: string): boolean {
  const clean = s.trim();
  if (!clean || clean.length > 72) return false;
  return JOB_TITLE_KEYWORDS_RE.test(clean);
}

function extractParagraphsFromWordXml(xml: string): ExtractedLine[] {
  const cleaned = xml.replace(/<mc:Fallback[\s\S]*?<\/mc:Fallback>/g, "");
  const paras: ExtractedLine[] = [];
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let m: RegExpExecArray | null;

  while ((m = pRegex.exec(cleaned)) !== null) {
    const inner = m[1];
    const szMatch = inner.match(/<w:sz\s+w:val="(\d+)"/);
    const fontSize = szMatch ? Number(szMatch[1]) / 2 : 10;

    const withDelims = inner
      .replace(/<w:tab\s*\/>/g, "  |  ")
      .replace(/<w:(?:br|cr)(?:\s[^>]*)?\/>/g, "\n");

    const texts: string[] = [];
    const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
    let tm: RegExpExecArray | null;
    while ((tm = tRegex.exec(withDelims)) !== null) {
      texts.push(decodeXmlEntities(tm[1]));
    }
    const line = normalizeText(texts.join("")).replace(/[ \t]+/g, " ").trim();
    if (line) {
      for (const sub of line.split("\n")) {
        const s = collapseSpacedLetters(sub.trim());
        if (s) paras.push({ text: s, fontSize, page: 1, yRatio: 0.2 });
      }
    }
  }
  return paras;
}

export async function extractLinesFromDocxBuffer(buffer: Buffer): Promise<ExtractedLine[]> {
  const zip = await JSZip.loadAsync(buffer);
  const parts: ExtractedLine[] = [];

  const headerNames = Object.keys(zip.files)
    .filter((n) => /^word\/header\d*\.xml$/i.test(n))
    .sort();
  for (const h of headerNames) {
    const xml = await zip.files[h].async("string");
    parts.push(...extractParagraphsFromWordXml(xml));
  }

  const docFile = zip.files["word/document.xml"];
  if (!docFile) {
    throw new Error("Invalid .docx file: word/document.xml not found");
  }
  const docXml = await docFile.async("string");
  parts.push(...extractParagraphsFromWordXml(docXml));

  return parts.map((p, idx) => ({
    ...p,
    yRatio: parts.length > 1 ? idx / (parts.length - 1) : 0,
  }));
}

export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  const lines = await extractLinesFromDocxBuffer(buffer);
  return lines.map((l) => l.text).join("\n");
}

interface PdfTextAtom {
  str: string;
  x: number;
  y: number;
  w: number;
  fs: number;
}

function groupAtomsIntoLines(atoms: PdfTextAtom[], pageNum: number, pageH: number): ExtractedLine[] {
  if (atoms.length === 0) return [];
  const sorted = [...atoms].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3.2) return b.y - a.y;
    return a.x - b.x;
  });

  const rows: PdfTextAtom[][] = [];
  for (const atom of sorted) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && Math.abs(lastRow[0].y - atom.y) <= 3.2) {
      lastRow.push(atom);
    } else {
      rows.push([atom]);
    }
  }

  return rows
    .map((row) => {
      row.sort((a, b) => a.x - b.x);
      let out = "";
      let prevEnd = -1;
      let maxFs = 0;
      for (const item of row) {
        const s = normalizeText(item.str);
        if (!s) continue;
        if (item.fs > maxFs) maxFs = item.fs;
        if (prevEnd >= 0) {
          const gap = item.x - prevEnd;
          if (gap > 20) out += "  ";
          else if (gap > 1.6 && !out.endsWith(" ") && !s.startsWith(" ")) out += " ";
        }
        out += s;
        prevEnd = item.x + (item.w || s.length * Math.max(4, item.fs * 0.48));
      }
      const text = collapseSpacedLetters(out.replace(/[ \t]{3,}/g, "  ").trim());
      const avgY = row.reduce((acc, r) => acc + r.y, 0) / row.length;
      const yRatio = pageH > 0 ? Math.max(0, Math.min(1, 1 - avgY / pageH)) : 0.5;
      return { text, fontSize: maxFs || 10, page: pageNum, yRatio };
    })
    .filter((r) => r.text.length > 0);
}

function detectColumnSplitX(bodyAtoms: PdfTextAtom[], pageW: number): number | null {
  if (bodyAtoms.length < 18) return null;
  let bestX: number | null = null;
  let bestScore = Infinity;

  for (let pct = 28; pct <= 72; pct += 2) {
    const splitX = (pageW * pct) / 100;
    let crossing = 0;
    let leftCount = 0;
    let rightCount = 0;

    for (const a of bodyAtoms) {
      const aEnd = a.x + Math.max(a.w, a.str.length * 4);
      if (a.x < splitX - 6 && aEnd > splitX + 6) {
        crossing++;
      } else if (aEnd <= splitX + 6) {
        leftCount++;
      } else {
        rightCount++;
      }
    }

    if (leftCount >= 6 && rightCount >= 6 && crossing <= Math.max(2, Math.floor(bodyAtoms.length * 0.035))) {
      if (crossing < bestScore) {
        bestScore = crossing;
        bestX = splitX;
      }
    }
  }
  return bestX;
}

export async function extractLinesFromPdfBuffer(buffer: Buffer): Promise<ExtractedLine[]> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const allLines: ExtractedLine[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const pageW = viewport.width || 595;
      const pageH = viewport.height || 842;
      const content = await page.getTextContent();

      const rawAtoms: PdfTextAtom[] = [];
      for (const raw of content.items as any[]) {
        if (typeof raw?.str !== "string" || !raw.str.trim()) continue;
        const tr = Array.isArray(raw.transform) ? raw.transform : [1, 0, 0, 1, 0, 0];
        const fs = Math.hypot(Number(tr[0] || 0), Number(tr[1] || 0)) || Number(raw.height || 10);
        rawAtoms.push({
          str: raw.str,
          x: Number(tr[4] || 0),
          y: Number(tr[5] || 0),
          w: Number(raw.width || 0),
          fs: Math.round(fs * 10) / 10,
        });
      }

      // Drop extreme top/bottom Chrome/Edge print margin headers & footers BEFORE layout grouping
      const atoms = rawAtoms.filter((a) => {
        const yRatio = 1 - a.y / pageH;
        if ((yRatio < 0.048 || yRatio > 0.948) && a.fs <= 9.5) return false;
        if (isBrowserPrintNoise(a.str, a.fs, yRatio)) return false;
        return true;
      });

      if (atoms.length === 0) continue;

      const maxY = Math.max(...atoms.map((a) => a.y));
      const minY = Math.min(...atoms.map((a) => a.y));
      const headerCutY = maxY - (maxY - minY) * 0.14;

      const headerAtoms = atoms.filter((a) => a.y >= headerCutY);
      const bodyAtoms = atoms.filter((a) => a.y < headerCutY);

      const splitX = detectColumnSplitX(bodyAtoms, pageW);
      if (splitX !== null) {
        const leftAtoms = bodyAtoms.filter((a) => a.x + Math.max(a.w, 4) * 0.5 <= splitX);
        const rightAtoms = bodyAtoms.filter((a) => a.x + Math.max(a.w, 4) * 0.5 > splitX);

        allLines.push(...groupAtomsIntoLines(headerAtoms, p, pageH));
        const leftIsWider = splitX > pageW * 0.5;
        if (leftIsWider) {
          allLines.push(...groupAtomsIntoLines(leftAtoms, p, pageH));
          allLines.push(...groupAtomsIntoLines(rightAtoms, p, pageH));
        } else {
          allLines.push(...groupAtomsIntoLines(rightAtoms, p, pageH));
          allLines.push(...groupAtomsIntoLines(leftAtoms, p, pageH));
        }
      } else {
        allLines.push(...groupAtomsIntoLines(atoms, p, pageH));
      }
    }

    if (allLines.length > 0) return allLines;
  } catch (err) { console.warn("[import-parser]", err); }

  const fallback = await extractText(new Uint8Array(buffer), { mergePages: true });
  const txt = normalizeText(typeof fallback.text === "string" ? fallback.text : "");
  return txt
    .split(/\r?\n/)
    .map((t) => collapseSpacedLetters(t.trim()))
    .filter(Boolean)
    .map((text, idx, arr) => ({
      text,
      fontSize: idx === 0 ? 18 : 10,
      page: 1,
      yRatio: arr.length > 1 ? idx / (arr.length - 1) : 0,
    }));
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const lines = await extractLinesFromPdfBuffer(buffer);
  return lines.map((l) => l.text).join("\n");
}

type SectionKey =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "technicalSkills"
  | "certifications"
  | "courses"
  | "awards"
  | "volunteering"
  | "references"
  | "other";

const SECTION_PATTERNS: Array<{ key: SectionKey; re: RegExp }> = [
  {
    key: "summary",
    re: /^(?:professional\s+summary|executive\s+summary|career\s+summary|summary|profile|about|about\s+me|career\s+profile|objective|professional\s+profile|personal\s+statement|overview)$/i,
  },
  {
    key: "experience",
    re: /^(?:professional\s+experience|work\s+experience|employment\s+history|experience(?:\s+continued)?|work\s+history|career\s+history|relevant\s+experience)$/i,
  },
  {
    key: "education",
    re: /^(?:education(?:\s*(?:&|and)\s*certifications?)?|academic\s+background|education\s*(?:&|and)\s*training|qualifications)$/i,
  },
  {
    key: "technicalSkills",
    re: /^(?:technical\s+skills|technical\s+proficiencies|tech\s+stack|technologies|tools\s*(?:&|and)\s*technologies)$/i,
  },
  {
    key: "skills",
    re: /^(?:skills|core\s+skills|key\s+skills|areas\s+of\s+expertise|core\s+competencies|competencies|skills\s*(?:&|and)\s*interests|skills\s*(?:&|and)\s*expertise|professional\s+skills)$/i,
  },
  {
    key: "certifications",
    re: /^(?:certifications?|licenses?\s*(?:&|and)\s*certifications?|certifications?\s*(?:&|and)\s*licenses?|credentials?)$/i,
  },
  {
    key: "courses",
    re: /^(?:courses?|training|professional\s+development|training\s*(?:&|and)\s*courses|workshops?)$/i,
  },
  {
    key: "awards",
    re: /^(?:awards?|achievements?(?:\s*(?:&|and)\s*awards?)?|honors?(?:\s*(?:&|and)\s*awards?)?|awards?\s*(?:&|and)\s*scholarships?|key\s+achievements?)$/i,
  },
  {
    key: "volunteering",
    re: /^(?:volunteer(?:ing)?(?:\s+experience)?|community\s+involvement|volunteering\s*(?:&|and)\s*leadership)$/i,
  },
  { key: "references", re: /^(?:references?)$/i },
  {
    key: "other",
    re: /^(?:languages?|interests?|hobbies|projects?|publications?|memberships?|affiliations?|contact|contact\s+info(?:rmation)?)$/i,
  },
];

function detectSectionHeading(line: string): SectionKey | null {
  const collapsed = collapseSpacedLetters(line);
  const clean = collapsed
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean || clean.length > 48 || clean.split(" ").length > 6) return null;
  for (const { key, re } of SECTION_PATTERNS) {
    if (re.test(clean)) return key;
  }
  return null;
}

const DATE_RANGE_RE =
  /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b|Date)\s*(?:[-\u2013\u2014]|to)\s*(?:Present|Current|Now|Date|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)/i;

const SINGLE_YEAR_RE = /\b(?:19|20)\d{2}\b/;

function cleanBullet(line: string): string {
  return line.replace(/^[\u2022\u25cf\u25aa\u25ab\u25e6\u2023\u2043\-*\u2013\u2014]\s*/, "").trim();
}

function isBulletLine(line: string): boolean {
  return /^[\u2022\u25cf\u25aa\u25ab\u25e6\u2023\u2043\-*]\s+/.test(line.trim());
}

function parseExperienceBlock(lines: string[]): ImportedExperience[] {
  const items: ImportedExperience[] = [];
  let current: ImportedExperience | null = null;

  const flush = () => {
    if (!current) return;
    current.bullets = current.bullets.filter(Boolean);
    current.description = [
      current.overview,
      ...current.bullets.map((b) => `\u2022 ${b}`),
    ]
      .filter(Boolean)
      .join("\n");
    if (current.role || current.company || current.bullets.length > 0) {
      items.push(current);
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(DATE_RANGE_RE);
    const bullet = isBulletLine(line);

    if (dateMatch && !bullet) {
      const period = dateMatch[0].trim();
      const withoutDate = line
        .replace(DATE_RANGE_RE, "")
        .replace(/[\|\-\u2013\u2014\u2022\u00b7]+$/g, "")
        .replace(/^[\|\-\u2013\u2014\u2022\u00b7]+/g, "")
        .trim();

      if (withoutDate.length >= 3) {
        flush();
        const parts = withoutDate.split(/\s*(?:\||\u2014|\u2013|\bat\b)\s*/i).filter(Boolean);
        current = {
          id: makeId("exp", items.length),
          role: parts[0] || withoutDate,
          company: parts[1] || "",
          location: parts[2] || "",
          period,
          current: /present|current|now/i.test(period),
          overview: "",
          showOverview: false,
          bullets: [],
          description: "",
        };
      } else if (current && !current.period) {
        current.period = period;
        current.current = /present|current|now/i.test(period);
      } else {
        flush();
        current = {
          id: makeId("exp", items.length),
          role: "Role Title",
          company: "",
          location: "",
          period,
          current: /present|current|now/i.test(period),
          overview: "",
          showOverview: false,
          bullets: [],
          description: "",
        };
      }
      continue;
    }

    if (bullet) {
      if (!current) {
        current = {
          id: makeId("exp", items.length),
          role: "Experience",
          company: "",
          location: "",
          period: "",
          current: false,
          overview: "",
          showOverview: false,
          bullets: [],
          description: "",
        };
      }
      current.bullets.push(cleanBullet(line));
      continue;
    }

    if (!current) {
      current = {
        id: makeId("exp", items.length),
        role: line,
        company: "",
        location: "",
        period: "",
        current: false,
        overview: "",
        showOverview: false,
        bullets: [],
        description: "",
      };
    } else if (!current.company && current.bullets.length === 0 && line.length <= 90) {
      const compParts = line.split(/\s*(?:\/|\||\u2022)\s*/).filter(Boolean);
      current.company = compParts[0] || line;
      if (compParts[1]) current.location = compParts.slice(1).join(", ");
    } else if (
      current.bullets.length >= 1 &&
      line.length <= 70 &&
      i + 1 < lines.length &&
      (DATE_RANGE_RE.test(lines[i + 1]) || lines[i + 1].includes("/") || lines[i + 1].includes("|"))
    ) {
      flush();
      current = {
        id: makeId("exp", items.length),
        role: line,
        company: "",
        location: "",
        period: "",
        current: false,
        overview: "",
        showOverview: false,
        bullets: [],
        description: "",
      };
    } else if (!current.overview && current.bullets.length === 0) {
      current.overview = line;
      current.showOverview = true;
    } else if (current.bullets.length > 0) {
      if (line.length < 45 && /^[A-Z]/.test(line) && !/[.!?]$/.test(line)) {
        current.bullets.push(line);
      } else {
        current.bullets[current.bullets.length - 1] += " " + line;
      }
    } else {
      current.overview = [current.overview, line].filter(Boolean).join(" ");
      current.showOverview = true;
    }
  }

  flush();
  return items;
}

function parseEducationBlock(lines: string[]): ImportedEducation[] {
  const items: ImportedEducation[] = [];
  let cur: ImportedEducation | null = null;

  const flush = () => {
    if (cur && (cur.degree || cur.school)) items.push(cur);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || isBrowserPrintNoise(line)) continue;
    const isDegree =
      /\b(bachelor|master|ph\.?d|doctor|b\.?s\.?c?|b\.?a\.?|m\.?s\.?c?|m\.?b\.?a|m\.?a\.?|associate|diploma|degree|certificate|certification)\b/i.test(
        line
      );
    const isSchool =
      /\b(university|college|institute|school|academy|polytechnic)\b/i.test(line);
    const dateM = line.match(DATE_RANGE_RE) || line.match(SINGLE_YEAR_RE);

    if (isDegree && (!cur || cur.degree)) {
      flush();
      cur = {
        id: makeId("edu", items.length),
        degree: line.replace(DATE_RANGE_RE, "").trim(),
        field: "",
        school: "",
        location: "",
        period: dateM ? dateM[0].trim() : "",
      };
      continue;
    }

    if (!cur) {
      cur = {
        id: makeId("edu", items.length),
        degree: isSchool ? "" : line.replace(DATE_RANGE_RE, "").trim(),
        field: "",
        school: isSchool ? line.replace(DATE_RANGE_RE, "").trim() : "",
        location: "",
        period: dateM ? dateM[0].trim() : "",
      };
      continue;
    }

    if (isSchool && !cur.school) {
      cur.school = line.replace(DATE_RANGE_RE, "").trim();
      if (dateM && !cur.period) cur.period = dateM[0].trim();
    } else if (dateM && !cur.period && line.length <= 36) {
      cur.period = dateM[0].trim();
    } else if (!cur.school) {
      cur.school = line;
    } else {
      flush();
      cur = {
        id: makeId("edu", items.length),
        degree: line.replace(DATE_RANGE_RE, "").trim(),
        field: "",
        school: "",
        location: "",
        period: dateM ? dateM[0].trim() : "",
      };
    }
  }
  flush();
  return items;
}

function parseCategorizedSkills(
  generalLines: string[],
  explicitTechLines: string[]
): { skills: string[]; technicalSkills: string[] } {
  const pro: string[] = [];
  const tech: string[] = [];
  const seenPro = new Set<string>();
  const seenTech = new Set<string>();

  const pushItems = (text: string, target: "pro" | "tech") => {
    const parts = text.split(/\s*(?:,|\u2022|\u00b7|\||;)\s*/);
    for (const part of parts) {
      const s = part.trim();
      if (!s || s.length < 2 || s.length > 48) continue;
      if (/^(?:professional|technical|skills?|tools?|design|research|languages?)$/i.test(s)) continue;
      const k = s.toLowerCase();
      if (target === "tech") {
        if (!seenTech.has(k)) {
          seenTech.add(k);
          tech.push(s);
        }
      } else {
        if (!seenPro.has(k)) {
          seenPro.add(k);
          pro.push(s);
        }
      }
    }
  };

  let curBucket: "pro" | "tech" = "pro";
  for (const raw of generalLines) {
    const line = cleanBullet(raw);
    if (!line) continue;
    const prefixMatch = line.match(/^([A-Za-z][A-Za-z\s/&]{1,22}):\s*(.*)$/);
    if (prefixMatch) {
      const cat = prefixMatch[1].trim().toLowerCase();
      const rest = prefixMatch[2].trim();
      curBucket =
        /tool|tech|software|stack|program|framework|system|code|platform/.test(cat)
          ? "tech"
          : "pro";
      if (rest) pushItems(rest, curBucket);
      continue;
    }
    if (/^technical$/i.test(line)) {
      curBucket = "tech";
      continue;
    }
    if (/^professional$/i.test(line)) {
      curBucket = "pro";
      continue;
    }
    pushItems(line, curBucket);
  }

  for (const raw of explicitTechLines) {
    const line = cleanBullet(raw).replace(/^[A-Za-z][A-Za-z\s/&]{1,22}:\s*/, "");
    if (line) pushItems(line, "tech");
  }

  return {
    skills: pro.slice(0, 24),
    technicalSkills: tech.slice(0, 24),
  };
}

function parseSimpleTriplets(lines: string[]): Array<{ a: string; b: string; c: string }> {
  const res: Array<{ a: string; b: string; c: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = cleanBullet(lines[i]);
    if (!line || isBrowserPrintNoise(line)) continue;
    if (line.includes(" - ") || line.includes(" | ") || line.includes(" \u2014 ")) {
      const parts = line.split(/\s*(?:-|\u2014|\|)\s*/).filter(Boolean);
      res.push({ a: parts[0] || line, b: parts[1] || "", c: parts[2] || "" });
    } else {
      const next = lines[i + 1] ? cleanBullet(lines[i + 1]) : "";
      const next2 = lines[i + 2] ? cleanBullet(lines[i + 2]) : "";
      if (next && (SINGLE_YEAR_RE.test(next) || /date|year/i.test(next))) {
        res.push({ a: line, b: "", c: next });
        i += 1;
      } else if (next && next2 && (SINGLE_YEAR_RE.test(next2) || /date|year/i.test(next2))) {
        res.push({ a: line, b: next, c: next2 });
        i += 2;
      } else {
        res.push({ a: line, b: next, c: "" });
        if (next) i += 1;
      }
    }
  }
  return res;
}

function splitCombinedNameAndRole(rawLine: string): { name: string; role: string } {
  const cleaned = rawLine
    .replace(/^[\|\s]+|[\|\s]+$/g, "")
    .replace(/\b(?:resume|cv)\b\s*$/i, "")
    .trim();
  const sep = cleaned.match(/^(.+?)\s*(?:\u2014|\u2013|\||(?:\s-\s))\s*(.+)$/);
  if (sep) {
    return {
      name: sep[1].trim(),
      role: sep[2].replace(/\b(?:resume|cv)\b\s*$/i, "").trim(),
    };
  }
  return { name: cleaned, role: "" };
}

function splitFirstLast(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function parseResumeLinesDeterministic(
  extractedLines: ExtractedLine[],
  meta: { sourceType: ImportParseResult["stats"]["sourceType"]; fileName?: string }
): ImportParseResult {
  const cleanLines: ExtractedLine[] = [];
  for (const raw of extractedLines) {
    const t0 = collapseSpacedLetters(normalizeText(raw.text).replace(/\s+/g, " ").trim());
    if (!t0 || isBrowserPrintNoise(t0, raw.fontSize, raw.yRatio)) continue;
    const t1 = stripInlineBrowserNoise(t0);
    if (!t1 || isBrowserPrintNoise(t1, raw.fontSize, raw.yRatio)) continue;
    cleanLines.push({ ...raw, text: t1 });
  }

  const allTextLines = cleanLines.map((l) => l.text);
  const fullText = allTextLines.join("\n");

  const emailMatch = fullText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : "";

  const phoneMatch = fullText.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{3,4}[\s.-]?\d{3,4}/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : "";

  const linkedinMatch = fullText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?[a-zA-Z0-9\-_%/.]+/i
  );
  const linkedin = linkedinMatch
    ? linkedinMatch[0].replace(/^https?:\/\/(www\.)?/i, "")
    : "";

  const websiteMatch = fullText.match(
    /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com)(?!lovableproject\.com)[a-z0-9-]+\.(?:com|io|dev|org|net|me|co)(?:\/[^\s|]*)?/i
  );
  const website =
    websiteMatch &&
    (!email || !email.includes(websiteMatch[0])) &&
    !/lovableproject/i.test(websiteMatch[0])
      ? websiteMatch[0].replace(/^https?:\/\/(www\.)?/i, "")
      : "";

  const buckets: Record<SectionKey, ExtractedLine[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    technicalSkills: [],
    certifications: [],
    courses: [],
    awards: [],
    volunteering: [],
    references: [],
    other: [],
  };

  let activeSection: SectionKey = "header";
  const detectedSections: string[] = [];

  for (const item of cleanLines) {
    const maybeSec = detectSectionHeading(item.text);
    if (maybeSec) {
      activeSection = maybeSec;
      if (!detectedSections.includes(maybeSec)) detectedSections.push(maybeSec);
      continue;
    }
    buckets[activeSection].push(item);
  }

  const isContactLine = (l: string) =>
    (email && l.includes(email)) ||
    (phone && l.includes(phone)) ||
    (linkedin && l.toLowerCase().includes("linkedin")) ||
    /https?:\/\//i.test(l) ||
    l.includes("|");

  const isValidPersonName = (l: string) => {
    const s = l.replace(/^[\|\s]+|[\|\s]+$/g, "").trim();
    if (s.length < 3 || s.length > 40) return false;
    if (/\d|@|http|\.com|\bresume\b|\bcv\b/i.test(s)) return false;
    if (detectSectionHeading(s)) return false;
    if (/^[A-Za-z\s.\-']+,\s*[A-Za-z\s.\-']+$/.test(s)) return false; // City, Country
    if (looksLikeJobTitle(s)) return false; // Never confuse job title with person's name!
    const words = s.split(/\s+/);
    return words.length >= 2 && words.length <= 4;
  };

  // 1. Detect Person Name cleanly (prefer largest-font valid person name in top 35% of Page 1)
  const headerNonContact = buckets.header.filter((x) => !isContactLine(x.text));
  const topCandidates = cleanLines.filter(
    (x) =>
      x.page === 1 &&
      x.yRatio <= 0.35 &&
      !isContactLine(x.text) &&
      isValidPersonName(x.text)
  );

  let name = "";
  let role = "";
  let nameIdx = -1;

  if (topCandidates.length > 0) {
    const maxFs = topCandidates.reduce((m, c) => Math.max(m, c.fontSize), 0);
    const best = topCandidates.find((c) => c.fontSize >= maxFs - 0.5) || topCandidates[0];
    name = best.text.replace(/^[\|\s]+|[\|\s]+$/g, "").trim();
    nameIdx = headerNonContact.findIndex((x) => x.text === best.text);
  } else {
    // Fallback: check if top header line combined "Name — Role"
    for (let i = 0; i < headerNonContact.length; i++) {
      const split = splitCombinedNameAndRole(headerNonContact[i].text);
      if (isValidPersonName(split.name)) {
        name = split.name;
        if (split.role) role = split.role;
        nameIdx = i;
        break;
      }
    }
  }

  // 2. Detect Job Title cleanly (must look like a job title or appear directly under Name, never equal Name)
  let roleIdx = -1;
  if (!role) {
    const searchPool = nameIdx >= 0 ? headerNonContact.slice(nameIdx + 1) : headerNonContact;
    // First pass: prefer lines with actual job title keywords
    for (let i = 0; i < searchPool.length; i++) {
      const cand = searchPool[i].text.trim();
      if (
        looksLikeJobTitle(cand) &&
        cand.toLowerCase() !== name.toLowerCase() &&
        !/[.!?]$/.test(cand) &&
        !detectSectionHeading(cand)
      ) {
        role = cand;
        roleIdx = nameIdx >= 0 ? nameIdx + 1 + i : i;
        break;
      }
    }
    // Second pass: short non-location line right below Name
    if (!role) {
      for (let i = 0; i < searchPool.length; i++) {
        const cand = searchPool[i].text.trim();
        const isLocLike = /^[A-Za-z\s.\-']+,\s*[A-Za-z\s.\-']+$/.test(cand);
        if (
          cand.length >= 3 &&
          cand.length <= 58 &&
          !isLocLike &&
          cand.toLowerCase() !== name.toLowerCase() &&
          !/[.!?]$/.test(cand) &&
          !detectSectionHeading(cand) &&
          !/\b(?:resume|cv)\b/i.test(cand)
        ) {
          role = cand;
          roleIdx = nameIdx >= 0 ? nameIdx + 1 + i : i;
          break;
        }
      }
    }
  }

  // 3. Extract Location (even if inline with email/phone/linkedin/icons!)
  let location = "";
  const locCandidates = [
    ...buckets.header.map((x) => x.text),
    ...buckets.other.map((x) => x.text),
    ...allTextLines.slice(0, 30),
  ];
  for (const rawLine of locCandidates) {
    // Strip known contact tokens first so "Tehran, Iran +98 912..." isolates "Tehran, Iran"
    let stripped = rawLine;
    if (email) stripped = stripped.split(email).join(" | ");
    if (phone) stripped = stripped.split(phone).join(" | ");
    if (linkedin) stripped = stripped.replace(new RegExp(linkedin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " | ");
    stripped = stripped.replace(/https?:\/\/\S+/gi, " | ");

    const segs = stripped
      .split(/\s*(?:\||\u2022|\u00b7|\s{2,})\s*/)
      .map((s) => s.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").trim())
      .filter(Boolean);

    const locSeg = segs.find(
      (s) =>
        /^[A-Za-z][A-Za-z\s.\-']{1,24},\s*[A-Za-z][A-Za-z\s.\-']{1,24}$/.test(s) &&
        !/@/.test(s) &&
        !/linkedin/i.test(s) &&
        !/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(s) &&
        !looksLikeJobTitle(s)
    );
    if (locSeg) {
      location = locSeg;
      break;
    }
  }

  // 4. Extract Summary (explicit section or header paragraph)
  let summary = buckets.summary
    .map((x) => x.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!summary) {
    const extraHeaderParas = headerNonContact
      .filter((x, idx) => {
        if (idx === nameIdx || idx === roleIdx) return false;
        if (location && x.text === location) return false;
        if (x.text.toLowerCase() === name.toLowerCase()) return false;
        if (role && x.text.toLowerCase() === role.toLowerCase()) return false;
        return x.text.length >= 45;
      })
      .map((x) => x.text);
    if (extraHeaderParas.length > 0) {
      summary = extraHeaderParas.join(" ").replace(/\s+/g, " ").trim();
    }
  }

  const experience = parseExperienceBlock(buckets.experience.map((x) => x.text));
  const education = parseEducationBlock(buckets.education.map((x) => x.text));
  const { skills, technicalSkills } = parseCategorizedSkills(
    buckets.skills.map((x) => x.text),
    buckets.technicalSkills.map((x) => x.text)
  );

  // Never allow job title to duplicate the person's name; fallback to latest experience role
  if (role && name && role.trim().toLowerCase() === name.trim().toLowerCase()) {
    role = "";
  }
  if (!role && experience[0]?.role) {
    role = experience[0].role;
  }

  // Fallback location from latest experience company line (e.g. "DigiPlus, Tehran, Iran")
  if (!location && experience[0]) {
    const combined = [experience[0].company, experience[0].location].filter(Boolean).join(", ");
    const m = combined.match(/([A-Za-z][A-Za-z\s.\-']+,\s*[A-Za-z][A-Za-z\s.\-']+)$/);
    if (m) {
      const parts = m[1].split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        location = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      }
    }
  }

  const certifications: ImportedCert[] = parseSimpleTriplets(buckets.certifications.map((x) => x.text))
    .slice(0, 8)
    .map((t, idx) => ({
      id: makeId("cert", idx),
      name: t.a,
      issuer: t.b,
      date: t.c,
    }));

  const courses: ImportedCourse[] = parseSimpleTriplets(buckets.courses.map((x) => x.text))
    .slice(0, 8)
    .map((t, idx) => ({
      id: makeId("crs", idx),
      title: t.a,
      institution: t.b,
      date: t.c,
    }));

  const awards: ImportedAward[] = parseSimpleTriplets(buckets.awards.map((x) => x.text))
    .slice(0, 8)
    .map((t, idx) => ({
      id: makeId("awd", idx),
      title: t.a,
      issuer: t.b,
      date: t.c,
    }));

  const volunteering: ImportedVolunteer[] = parseSimpleTriplets(buckets.volunteering.map((x) => x.text))
    .slice(0, 8)
    .map((t, idx) => ({
      id: makeId("vol", idx),
      role: t.a,
      organization: t.b,
      date: t.c,
      description: "",
    }));

  const references: ImportedReference[] = [];
  const refLines = buckets.references.map((x) => x.text);
  if (refLines.length > 0) {
    let curRef: ImportedReference | null = null;
    for (const ln of refLines) {
      if (/@/.test(ln)) {
        if (curRef) curRef.email = ln;
      } else if (/\d{3}[\s.-]\d{3}/.test(ln)) {
        if (curRef) curRef.phone = ln;
      } else if (!curRef || (curRef.name && (curRef.email || curRef.phone))) {
        if (curRef) references.push(curRef);
        curRef = { id: makeId("ref", references.length), name: ln, title: "", company: "", phone: "", email: "" };
      } else if (!curRef.title) {
        curRef.title = ln;
      } else if (!curRef.company) {
        curRef.company = ln;
      }
    }
    if (curRef) references.push(curRef);
  }

  const warnings: string[] = [];
  let confidence = 25;
  if (name) confidence += 15; else warnings.push("Could not confidently detect full name.");
  if (email || phone) confidence += 10; else warnings.push("No email or phone number detected.");
  if (summary.length >= 40) confidence += 10;
  if (experience.length > 0) confidence += 20; else warnings.push("No structured work experience section detected.");
  if (education.length > 0) confidence += 10;
  if (skills.length + technicalSkills.length > 0) confidence += 10;

  const bulletCount = experience.reduce((acc, e) => acc + e.bullets.length, 0);
  const { firstName, lastName } = splitFirstLast(name);

  return {
    parsed: {
      name,
      firstName,
      lastName,
      role,
      email,
      phone,
      location,
      linkedin,
      website,
      summary,
      experience,
      education,
      skills,
      technicalSkills,
      certifications,
      courses,
      awards,
      volunteering,
      references,
    },
    stats: {
      sourceType: meta.sourceType,
      fileName: meta.fileName,
      rawChars: fullText.length,
      lineCount: allTextLines.length,
      detectedSections,
      experienceCount: experience.length,
      bulletCount,
      educationCount: education.length,
      skillCount: skills.length + technicalSkills.length,
      certificationCount: certifications.length,
      confidence: Math.min(100, confidence),
      warnings,
    },
    rawTextPreview: fullText.slice(0, 1800),
    mode: "deterministic",
  };
}

export function parseResumeTextDeterministic(
  rawText: string,
  meta: { sourceType: ImportParseResult["stats"]["sourceType"]; fileName?: string }
): ImportParseResult {
  const lines = normalizeText(rawText)
    .split(/\r?\n/)
    .map((t) => collapseSpacedLetters(t.trim()))
    .filter(Boolean)
    .map((text, idx, arr) => ({
      text,
      fontSize: idx === 0 ? 18 : 10,
      page: 1,
      yRatio: arr.length > 1 ? idx / (arr.length - 1) : 0,
    }));
  return parseResumeLinesDeterministic(lines, meta);
}

export async function maybeEnhanceWithAI(
  rawText: string,
  base: ImportParseResult
): Promise<ImportParseResult> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey || rawText.trim().length < 80) return base;

  const baseUrl = (process.env.AI_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "deepseek-chat";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract resume text into strict JSON. Ignore any browser print headers/URLs/timestamps. Keep full name and job title strictly separate. Never invent facts or numbers. Return JSON with keys: name, role, email, phone, location, linkedin, website, summary, experience (array of {role, company, location, period, current, overview, bullets}), education (array of {degree, field, school, location, period, gpa}), skills (string[]), technicalSkills (string[]), certifications (array of {name, issuer, date}).",
          },
          { role: "user", content: rawText.slice(0, 14000) },
        ],
      }),
    });

    if (!res.ok) return base;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return base;
    const ai = JSON.parse(content);

    const exp: ImportedExperience[] = Array.isArray(ai.experience)
      ? ai.experience.map((e: any, i: number) => {
          const bullets = Array.isArray(e.bullets) ? e.bullets.map(String).filter(Boolean) : [];
          const overview = typeof e.overview === "string" ? e.overview : "";
          return {
            id: makeId("exp", i),
            role: String(e.role || ""),
            company: String(e.company || ""),
            location: String(e.location || ""),
            period: String(e.period || ""),
            current: Boolean(e.current || /present|current/i.test(String(e.period || ""))),
            overview,
            showOverview: Boolean(overview),
            bullets,
            description: [overview, ...bullets.map((b: string) => `\u2022 ${b}`)].filter(Boolean).join("\n"),
          };
        })
      : base.parsed.experience;

    const edu: ImportedEducation[] = Array.isArray(ai.education)
      ? ai.education.map((ed: any, i: number) => ({
          id: makeId("edu", i),
          degree: String(ed.degree || ""),
          field: String(ed.field || ""),
          school: String(ed.school || ""),
          location: String(ed.location || ""),
          period: String(ed.period || ""),
          gpa: ed.gpa ? String(ed.gpa) : undefined,
        }))
      : base.parsed.education;

    const finalName = ai.name || base.parsed.name;
    const { firstName, lastName } = splitFirstLast(finalName);

    const merged: ParsedResumeData = {
      ...base.parsed,
      name: finalName,
      firstName,
      lastName,
      role: ai.role || base.parsed.role,
      email: ai.email || base.parsed.email,
      phone: ai.phone || base.parsed.phone,
      location: ai.location || base.parsed.location,
      linkedin: ai.linkedin || base.parsed.linkedin,
      website: ai.website || base.parsed.website,
      summary: ai.summary || base.parsed.summary,
      experience: exp.length > 0 ? exp : base.parsed.experience,
      education: edu.length > 0 ? edu : base.parsed.education,
      skills: Array.isArray(ai.skills) && ai.skills.length > 0 ? ai.skills.map(String) : base.parsed.skills,
      technicalSkills:
        Array.isArray(ai.technicalSkills) && ai.technicalSkills.length > 0
          ? ai.technicalSkills.map(String)
          : base.parsed.technicalSkills,
      certifications:
        Array.isArray(ai.certifications) && ai.certifications.length > 0
          ? ai.certifications.map((ct: any, i: number) => ({
              id: makeId("cert", i),
              name: String(ct.name || ""),
              issuer: String(ct.issuer || ""),
              date: String(ct.date || ""),
            }))
          : base.parsed.certifications,
    };

    return {
      ...base,
      parsed: merged,
      stats: {
        ...base.stats,
        experienceCount: merged.experience.length,
        bulletCount: merged.experience.reduce((a, b) => a + b.bullets.length, 0),
        educationCount: merged.education.length,
        skillCount: merged.skills.length + merged.technicalSkills.length,
        certificationCount: merged.certifications.length,
        confidence: Math.min(100, Math.max(base.stats.confidence, 92)),
      },
      mode: "ai-enhanced",
    };
  } catch {
    return base;
  }
}