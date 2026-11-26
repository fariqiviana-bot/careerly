import fs from "fs";
import path from "path";
import JSZip from "jszip";

export type ExportDocKind = "resume" | "cover" | "references";

export interface DocxInjectInput {
  seriesId: string;
  kind: ExportDocKind;
  pageSize: "A4" | "Letter";
  pageCount?: 1 | 2 | 3;
  content: Record<string, any>;
}

const MAX_PAGES_BY_SERIES: Record<string, number> = {
  "2": 3,
  "3": 3,
  "4": 3,
  "11": 2,
  "12": 2,
  "14": 2,
  "22": 3,
  "24": 3,
};

const TEMPLATE_PERSONAS: Record<string, { fullName: string; first: string; last: string; role: string }> = {
  "2":  { fullName: "JENNIFER DAVIS",       first: "JENNIFER", last: "DAVIS",       role: "YOUR PROFESSION" },
  "3":  { fullName: "JAMES SMITH",          first: "JAMES",    last: "SMITH",       role: "YOUR PROFESSION" },
  "4":  { fullName: "OLIVIA ANDERSON",      first: "OLIVIA",   last: "ANDERSON",    role: "YOUR PROFESSION" },
  "11": { fullName: "BLAKE TRUMAN",         first: "BLAKE",    last: "TRUMAN",      role: "YOUR PROFESSION" },
  "12": { fullName: "JONAH ROMANO",         first: "JONAH",    last: "ROMANO",      role: "YOUR PROFESSION" },
  "14": { fullName: "JACKSON CALDWELL",     first: "JACKSON",  last: "CALDWELL",    role: "YOUR PROFESSION" },
  "22": { fullName: "THEO FINCH",           first: "THEO",     last: "FINCH",       role: "YOUR PROFESSION" },
  "24": { fullName: "FLORENCE NIGHTINGALE", first: "FLORENCE", last: "NIGHTINGALE", role: "REGISTERED NURSE" },
};

// Known sidebar skill placeholder items across 2-column master templates (handles out-of-order Word TextBoxes)
const KNOWN_PRO_SKILL_PLACEHOLDERS = new Set([
  "time management", "critical thinking", "leadership", "problem solving", "creativity", "attention to detail",
  "project management", "team leadership", "process optimization", "stakeholder engagement", "data analysis",
  "onboarding & training", "problem-solving", "team coordination", "workflow automation", "documentation", "adaptability",
  "project coordination", "group leadership", "workflow streamlining", "client interaction", "data interpretation",
  "employee onboarding", "issue resolution", "cross-team collaboration", "process automation", "schedule management", "record-keeping",
  "task orchestration", "group direction", "operational streamlining", "client relations", "data evaluation",
  "staff integration", "inter-team collaboration", "process efficiency", "versatility",
]);

const KNOWN_TECH_SKILL_PLACEHOLDERS = new Set([
  "microsoft office suite", "canva & adobe photoshop", "wordpress basics", "seo",
]);

function xmlEscape(text: string): string {
  return String(text || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlUnescape(text: string): string {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractParagraphText(pXml: string): string {
  const runs = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) =>
    xmlUnescape(m[1])
  );
  return runs.join("").replace(/\s+/g, " ").trim();
}

function replaceParagraphText(pXml: string, nextText: string): string {
  // Prefer the first non-whitespace <w:t> so leading unstyled space runs never steal formatting
  const matches = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  let targetIdx = matches.findIndex((m) => xmlUnescape(m[1]).trim().length > 0);
  if (targetIdx === -1) targetIdx = 0;

  let cur = -1;
  return pXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_m, attrs) => {
    cur++;
    if (cur === targetIdx) {
      const safeAttrs = attrs && attrs.includes("xml:space") ? attrs : ' xml:space="preserve"';
      return `<w:t${safeAttrs}>${xmlEscape(nextText)}</w:t>`;
    }
    return `<w:t></w:t>`;
  });
}

// Keep leading indentation spaces in continuation lines (e.g. Series 14 Page 2 skills)
function replaceIndentedContinuation(pXml: string, nextText: string): string {
  if (!nextText.trim()) return replaceParagraphText(pXml, "");
  const matches = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  const firstNonSpaceIdx = matches.findIndex((m) => xmlUnescape(m[1]).trim().length > 0);
  if (firstNonSpaceIdx <= 0) return replaceParagraphText(pXml, nextText);

  let cur = -1;
  return pXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (full, attrs) => {
    cur++;
    if (cur < firstNonSpaceIdx) return full; // preserve exact indent spaces
    if (cur === firstNonSpaceIdx) {
      const safeAttrs = attrs && attrs.includes("xml:space") ? attrs : ' xml:space="preserve"';
      return `<w:t${safeAttrs}>${xmlEscape(nextText)}</w:t>`;
    }
    return `<w:t></w:t>`;
  });
}

function ensurePageBreakBefore(pXml: string): string {
  if (/<w:pageBreakBefore\b/.test(pXml)) return pXml;
  if (/<w:pPr(?:\s[^>]*)?>/.test(pXml)) {
    return pXml.replace(/<w:pPr(\s[^>]*)?>/, `<w:pPr$1><w:pageBreakBefore/>`);
  }
  return pXml.replace(/<w:p(\s[^>]*)?>/, `<w:p$1><w:pPr><w:pageBreakBefore/></w:pPr>`);
}

function hasRunTab(pXml: string): boolean {
  const body = pXml.replace(/<w:pPr[\s\S]*?<\/w:pPr>/g, "");
  return /<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/.test(body);
}

function replaceAroundTag(
  pXml: string,
  tagRegex: RegExp,
  leftText: string,
  rightText: string
): string {
  // Search strictly outside <w:pPr>...</w:pPr> so tab-stop definitions (<w:tabs><w:tab .../></w:tabs>) are never matched
  const pPrEnd = pXml.match(/<\/w:pPr>/);
  const start = pPrEnd && pPrEnd.index !== undefined ? pPrEnd.index + pPrEnd[0].length : 0;
  const tail = pXml.slice(start);
  const m = tail.match(tagRegex);
  if (!m || m.index === undefined) {
    return replaceParagraphText(pXml, [leftText, rightText].filter(Boolean).join("  \u2014  "));
  }
  const splitIdx = start + m.index;
  const before = pXml.slice(0, splitIdx);
  const tag = m[0];
  const after = pXml.slice(splitIdx + tag.length);
  if (!/<w:t[\s>]/.test(before) || !/<w:t[\s>]/.test(after)) {
    return replaceParagraphText(pXml, [leftText, rightText].filter(Boolean).join("  \u2014  "));
  }
  return replaceParagraphText(before, leftText) + tag + replaceParagraphText(after, rightText);
}

// Preserve bold label run ("PROFESSIONAL: " / "TECHNICAL: ") and replace the skill list after it
function replaceAfterColonRun(pXml: string, prefixLabel: string, listText: string): string {
  const colonIdx = pXml.indexOf(":");
  if (colonIdx === -1) return replaceParagraphText(pXml, `${prefixLabel}: ${listText}`.trim());
  const tCloseAfterColon = pXml.indexOf("</w:t>", colonIdx);
  if (tCloseAfterColon === -1) return replaceParagraphText(pXml, `${prefixLabel}: ${listText}`.trim());
  const head = pXml.slice(0, tCloseAfterColon + 6);
  const tail = pXml.slice(tCloseAfterColon + 6);
  if (/<w:t[\s>]/.test(tail)) {
    return head + replaceParagraphText(tail, listText ? ` ${listText}` : "");
  }
  return replaceParagraphText(pXml, listText ? `${prefixLabel}: ${listText}` : "");
}

function replaceTwoToneName(pXml: string, firstName: string, lastName: string): string {
  const tMatches = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  if (tMatches.length < 2) {
    return replaceParagraphText(pXml, `${firstName} ${lastName}`.trim());
  }
  let idx = 0;
  return pXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_m, _attrs, inner) => {
    const raw = xmlUnescape(inner);
    if (!raw.trim()) return `<w:t xml:space="preserve">${inner}</w:t>`;
    idx++;
    if (idx === 1) {
      return `<w:t xml:space="preserve">${xmlEscape(lastName ? `${firstName} ` : firstName)}</w:t>`;
    }
    if (idx === 2) {
      return `<w:t xml:space="preserve">${xmlEscape(lastName)}</w:t>`;
    }
    return `<w:t></w:t>`;
  });
}

// Series 14 exact header: [FirstName (black 20pt)] [LastName (#8496B0 20pt)] [<w:tab/>] [Role (#44546A 10pt)]
function replaceSeries14Header(
  pXml: string,
  firstName: string,
  lastName: string,
  upperRole: string
): string {
  const pPrEnd = pXml.match(/<\/w:pPr>/);
  const start = pPrEnd && pPrEnd.index !== undefined ? pPrEnd.index + pPrEnd[0].length : 0;
  const tail = pXml.slice(start);
  const tabMatch = tail.match(/<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/);
  if (!tabMatch || tabMatch.index === undefined) {
    return replaceTwoToneName(pXml, firstName, lastName);
  }
  const splitIdx = start + tabMatch.index;
  const beforeTab = pXml.slice(0, splitIdx);
  const tabTag = tabMatch[0];
  const afterTab = pXml.slice(splitIdx + tabTag.length);
  return replaceTwoToneName(beforeTab, firstName, lastName) + tabTag + replaceParagraphText(afterTab, upperRole);
}

function replacePipeFramedName(pXml: string, fullName: string): string {
  let namePlaced = false;
  return pXml.replace(/<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_m, _attrs, inner) => {
    const raw = xmlUnescape(inner).trim();
    if (raw === "|") return `<w:t xml:space="preserve">|</w:t>`;
    if (!namePlaced && raw.length > 0) {
      namePlaced = true;
      return `<w:t xml:space="preserve"> ${xmlEscape(fullName)} </w:t>`;
    }
    return `<w:t></w:t>`;
  });
}

function getBullets(exp: any): string[] {
  if (Array.isArray(exp?.bullets) && exp.bullets.length > 0) {
    return exp.bullets.map((b: any) => String(b || "").trim()).filter(Boolean);
  }
  if (typeof exp?.description === "string" && exp.description.trim()) {
    return exp.description
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^[\u2022\-*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function splitFirstLast(fullName: string): [string, string] {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [parts[0] || "", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

export function resolveMasterDocxPath(input: {
  seriesId: string;
  kind: ExportDocKind;
  pageSize: "A4" | "Letter";
  pageCount?: 1 | 2 | 3;
}): string {
  const sId = MAX_PAGES_BY_SERIES[input.seriesId] ? input.seriesId : "11";
  const sz = input.pageSize === "Letter" ? "letter" : "a4";
  const maxP = MAX_PAGES_BY_SERIES[sId] || 2;
  const p = Math.max(1, Math.min(maxP, Number(input.pageCount || 1)));

  const fileName =
    input.kind === "cover"
      ? `cover-${sz}.docx`
      : input.kind === "references"
      ? `references-${sz}.docx`
      : `resume-${p}p-${sz}.docx`;

  const fullPath = path.join(process.cwd(), "public", "templates", sId, fileName);
  if (fs.existsSync(fullPath)) return fullPath;

  const fallback = path.join(process.cwd(), "public", "templates", sId, "resume-1p-a4.docx");
  if (fs.existsSync(fallback)) return fallback;
  throw new Error(`Master template file not found for Series ${sId} (${fileName})`);
}

function isSectionHeadingText(txt: string): boolean {
  const clean = txt.replace(/[^A-Za-z&\s]/g, "").replace(/\s+/g, " ").trim();
  if (!clean || clean.length > 42) return false;
  return /^(?:PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|SUMMARY|PROFESSIONAL PROFILE|PROFILE|CONTACT|SKILLS|AREAS OF EXPERTISE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EXPERIENCE CONTINUED|WORK EXPERIENCE|EDUCATION|EDUCATION\s*&\s*CERTIFICATIONS?|CERTIFICATIONS?|CERTIFICATIONS?\s*&\s*LICENSES?|LICENSES?\s*&\s*CERTIFICATIONS?|&\s*LICENSES?|&\s*LICENSE|PROFESSIONAL DEVELOPMENT|COURSES|ACHIEVEMENTS?|ACHIEVEMENTS?\s*&\s*AWARDS?|AWARDS?|COMMUNITY INVOLVEMENT|VOLUNTEERING|REFERENCES|PROFESSIONAL|TECHNICAL|CONTINUING EDUCATION)$/i.test(
    clean
  );
}

interface LeafParagraphSegment {
  start: number;
  end: number;
  xml: string;
  text: string;
  inTextBox?: boolean;
}

function runInjectionPass(
  segments: LeafParagraphSegment[],
  input: DocxInjectInput
): string[] {
  const c = input.content || {};
  const sId = input.seriesId;
  const persona = TEMPLATE_PERSONAS[sId] || TEMPLATE_PERSONAS["11"];

  const fullName = String(c.name || c.fullName || persona.fullName).trim();
  const upperName = fullName.toUpperCase();
  const [firstName, lastName] = splitFirstLast(upperName);
  const role = String(c.role || c.profession || persona.role).trim();
  const upperRole = role.toUpperCase();
  const phone = String(c.phone || "").trim();
  const email = String(c.email || "").trim();
  const linkedin = String(c.linkedin || "").trim();
  const location = String(c.location || "").trim();
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
  const areas: string[] =
    Array.isArray(c.areasOfExpertise) && c.areasOfExpertise.length > 0
      ? c.areasOfExpertise
      : proSkills;
  const certs: any[] = Array.isArray(c.certifications) ? c.certifications : [];
  const courses: any[] = Array.isArray(c.courses) ? c.courses : [];
  const awards: any[] = Array.isArray(c.awards) ? c.awards : [];
  const volunteering: any[] = Array.isArray(c.volunteering) ? c.volunteering : [];
  const references: any[] = Array.isArray(c.references) ? c.references : [];
  const cl: any = c.coverLetter || {};

  // For Series 14 1P (which has Professional Development instead of Education), fallback to education if courses is empty
  const devItems =
    courses.length > 0
      ? courses.map((cr) => ({
          title: cr.title || "",
          institution: cr.institution || "",
          date: cr.date || "",
        }))
      : education.map((ed) => ({
          title: ed.degree || "",
          institution: [ed.school, ed.location].filter(Boolean).join(", "),
          date: ed.period || ed.date || "",
        }));

  let nameOccurrence = 0;
  let expIdx = -1;
  let bulletIdx = 0;
  let eduIdx = -1;
  let certIdx = -1;
  let courseIdx = -1;
  let awardIdx = -1;
  let volIdx = -1;
  let refIdx = -1;
  let proSkillIdx = 0;
  let techSkillIdx = 0;
  let inTechSkills = false;
  let inSummary = false;
  let summaryInjected = false;
  let inSkills = false;
  let inExperience = false;
  let inReferences = false;
  let coverParaIdx = 0;

  const coverParagraphs: string[] = [
    cl.openingParagraph,
    cl.bodyParagraph,
    cl.highlightsIntro,
    ...(Array.isArray(cl.bulletHighlights) ? cl.bulletHighlights : []),
    cl.closingParagraph,
  ].filter((x) => typeof x === "string" && x.trim().length > 0);

  const inlineContactBar = [phone, email, linkedin, location].filter(Boolean).join("  |  ");

  return segments.map((seg) => {
    const t = seg.text;
    if (!t) return seg.xml;
    const upper = t.toUpperCase();
    const lower = t.toLowerCase();

    // 1. HEADER: Name & Profession (Preserves exact multi-run styles + locks Page 2/3 headers to top of new page)
    const wrapPageBreakIfRepeated = (outXml: string) => {
      nameOccurrence++;
      if (nameOccurrence >= 2 && !seg.inTextBox) {
        return ensurePageBreakBefore(outXml);
      }
      return outXml;
    };

    if (sId === "14" && upper.includes(persona.fullName) && upper.includes("YOUR PROFESSION")) {
      return wrapPageBreakIfRepeated(replaceSeries14Header(seg.xml, firstName, lastName, upperRole));
    }
    if (sId === "14" && upper.includes(persona.fullName)) {
      // Series 14 Page 2 header also uses 2-tone runs (firstName black 14pt + lastName #8496B0 14pt)
      return wrapPageBreakIfRepeated(replaceTwoToneName(seg.xml, firstName, lastName));
    }
    if (sId === "3" && upper.includes(persona.fullName)) {
      return wrapPageBreakIfRepeated(replacePipeFramedName(seg.xml, upperName));
    }
    if (sId === "4" && upper.includes(persona.fullName)) {
      return wrapPageBreakIfRepeated(replaceTwoToneName(seg.xml, firstName, lastName));
    }
    if (upper === persona.fullName || (upper.includes(persona.fullName) && t.length <= persona.fullName.length + 6)) {
      return wrapPageBreakIfRepeated(replaceParagraphText(seg.xml, upperName));
    }
    if (upper === persona.role || upper === "YOUR PROFESSION") {
      return replaceParagraphText(seg.xml, upperRole);
    }

    // 2. CONTACT DETAILS
    if (t.includes("(555) 555-5555") && lower.includes("youremail@mail.com")) {
      return replaceParagraphText(seg.xml, inlineContactBar);
    }
    if (t === "(555) 555-5555" && !inReferences) {
      return replaceParagraphText(seg.xml, phone);
    }
    if (lower === "youremail@mail.com") {
      return replaceParagraphText(seg.xml, email);
    }
    if (lower === "linkedin.com/name") {
      return replaceParagraphText(seg.xml, linkedin);
    }
    if (/^city,\s*state\/province$/i.test(t)) {
      return replaceParagraphText(seg.xml, location);
    }

    // 3. SECTION HEADING STATE TRACKING
    if (isSectionHeadingText(t)) {
      const h = upper.replace(/[^A-Z\s&]/g, "").replace(/\s+/g, " ").trim();
      if (h === "TECHNICAL") {
        inTechSkills = true;
        inSkills = true;
        inExperience = false;
        return seg.xml;
      }
      if (h === "PROFESSIONAL") {
        inTechSkills = false;
        inSkills = true;
        inExperience = false;
        return seg.xml;
      }
      inSummary = /SUMMARY|PROFILE/.test(h);
      inSkills = /SKILLS|AREAS OF EXPERTISE/.test(h);
      inExperience = /EXPERIENCE/.test(h);
      inReferences = /REFERENCES/.test(h);
      if (inSkills) inTechSkills = false;
      return seg.xml;
    }

    // 4. COVER LETTER SPECIFIC INJECTION
    if (input.kind === "cover") {
      if (/^date here$/i.test(t)) {
        return replaceParagraphText(
          seg.xml,
          cl.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        );
      }
      if (/^hiring manager name$/i.test(t)) return replaceParagraphText(seg.xml, cl.recipientName || "Hiring Manager");
      if (/^company name$/i.test(t)) return replaceParagraphText(seg.xml, cl.companyName || "");
      if (/^company address$/i.test(t)) return replaceParagraphText(seg.xml, cl.companyAddress || "");
      if (/^dear\s+/i.test(t)) return replaceParagraphText(seg.xml, cl.greeting || "Dear Hiring Manager,");
      if (/^sincerely,?$|^best regards,?$/i.test(t)) return replaceParagraphText(seg.xml, cl.signOff || "Sincerely,");
      if (lower === persona.fullName.toLowerCase()) {
        return replaceParagraphText(seg.xml, cl.signatureText || fullName);
      }
      if (t.length > 45 && coverParagraphs.length > 0) {
        const nextP = coverParagraphs[coverParaIdx] ?? "";
        coverParaIdx++;
        return replaceParagraphText(seg.xml, nextP);
      }
      return seg.xml;
    }

    // 5. REFERENCES INJECTION
    if (input.kind === "references" || inReferences) {
      if (/^full name here$/i.test(t) || /^reference name/i.test(t)) {
        refIdx++;
        const r = references[refIdx];
        return replaceParagraphText(seg.xml, r ? String(r.name || "").toUpperCase() : "");
      }
      if (/^job title$/i.test(t)) {
        const r = references[refIdx];
        return replaceParagraphText(seg.xml, r?.title || r?.role || "");
      }
      if (/^company or institution$/i.test(t)) {
        const r = references[refIdx];
        return replaceParagraphText(seg.xml, r?.company || r?.organization || "");
      }
      if (t === "(555) 555-5555") {
        const r = references[refIdx];
        return replaceParagraphText(seg.xml, r?.phone || "");
      }
      if (/^reference@mail\.com$/i.test(t)) {
        const r = references[refIdx];
        return replaceParagraphText(seg.xml, r?.email || "");
      }
    }

    // 6. INLINE SKILLS (Series 11, 12 Areas of Expertise + Series 14 PROFESSIONAL:/TECHNICAL: + 2P continuation lines)
    if (/^professional:\s+/i.test(t)) {
      const line1 = proSkills.slice(0, 4).join(" - ");
      return replaceAfterColonRun(seg.xml, "PROFESSIONAL", line1);
    }
    if (/^problem resolution\s*-\s*decision making/i.test(t)) {
      return replaceIndentedContinuation(seg.xml, proSkills.slice(4, 8).join(" - "));
    }
    if (/^conflict management\s*-\s*strategic decision/i.test(t)) {
      return replaceIndentedContinuation(seg.xml, proSkills.slice(8, 12).join(" - "));
    }
    if (/^technical:\s+/i.test(t)) {
      const srcTech = techSkills.length > 0 ? techSkills : proSkills.slice(0, 4);
      return replaceAfterColonRun(seg.xml, "TECHNICAL", srcTech.slice(0, 4).join(" - "));
    }
    if (/^data entry\s*-\s*google workspace/i.test(t)) {
      const srcTech = techSkills.length > 0 ? techSkills : [];
      return replaceIndentedContinuation(seg.xml, srcTech.slice(4, 8).join(" - "));
    }
    if (/project oversight\s*-\s*conflict mediation|initiative management\s*-\s*dispute resolution/i.test(t)) {
      const half = sId === "12" ? areas.slice(0, 4) : areas.slice(0, 8);
      return replaceParagraphText(seg.xml, half.join(" - "));
    }
    if (/clear communication\s*-\s*operational improvement/i.test(t)) {
      return replaceParagraphText(seg.xml, areas.slice(4, 8).join(" - "));
    }

    // 7. KNOWN SIDEBAR SKILL PLACEHOLDERS (Immune to Word TextBox ordering in Series 2, 3, 4, 22!)
    if (KNOWN_TECH_SKILL_PLACEHOLDERS.has(lower)) {
      inExperience = false;
      const nextSk = techSkills[techSkillIdx] ?? "";
      techSkillIdx++;
      return replaceParagraphText(seg.xml, nextSk);
    }
    if (KNOWN_PRO_SKILL_PLACEHOLDERS.has(lower)) {
      inExperience = false;
      const nextSk = proSkills[proSkillIdx] ?? "";
      proSkillIdx++;
      return replaceParagraphText(seg.xml, nextSk);
    }

    // 8. EDUCATION, CERTIFICATIONS, COURSES, AWARDS, VOLUNTEERING (Checked BEFORE generic experience bullets!)
    if (/^degree title|^master of science in nursing|^bachelor of science in nursing/i.test(t)) {
      inExperience = false;
      eduIdx++;
      const ed = education[eduIdx];
      if (hasRunTab(seg.xml)) {
        const left = ed ? [ed.degree, ed.school].filter(Boolean).join(" / ") : "";
        return replaceAroundTag(seg.xml, /<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/, left, ed?.period || ed?.date || "");
      }
      return replaceParagraphText(seg.xml, ed ? String(ed.degree || "").toUpperCase() : "");
    }
    if (/^university name|^university of michigan|^university of california|^university of washington/i.test(t)) {
      inExperience = false;
      const ed = education[eduIdx];
      const schoolLine = ed ? [ed.school, ed.location].filter(Boolean).join(", ") : "";
      const dateLine = ed?.period || ed?.date || "";
      if (seg.xml.includes("<w:br")) {
        return replaceAroundTag(seg.xml, /<w:br(?:\s[^>]*)?\/>/, schoolLine, dateLine);
      }
      if (/graduation\s*(?:year|date)/i.test(t)) {
        return replaceParagraphText(seg.xml, [schoolLine, dateLine].filter(Boolean).join(" | "));
      }
      return replaceParagraphText(seg.xml, schoolLine);
    }
    if (/^graduation (?:year|date)$/i.test(t)) {
      inExperience = false;
      const ed = education[eduIdx];
      return replaceParagraphText(seg.xml, ed?.period || ed?.date || "");
    }
    if (/^certification name|^license name|^registered nurse license/i.test(t)) {
      inExperience = false;
      certIdx++;
      const ct = certs[certIdx];
      if (hasRunTab(seg.xml)) {
        const left = ct ? [ct.name, ct.issuer].filter(Boolean).join(" / ") : "";
        return replaceAroundTag(seg.xml, /<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/, left, ct?.date || "");
      }
      return replaceParagraphText(seg.xml, ct?.name || "");
    }
    if (/^issuing organization$|^authority\/organization$/i.test(t)) {
      inExperience = false;
      const ct = certs[certIdx];
      return replaceParagraphText(seg.xml, ct?.issuer || "");
    }
    if (/^year earned$|^date$/i.test(t) && certIdx >= 0) {
      const ct = certs[certIdx];
      return replaceParagraphText(seg.xml, ct?.date || "");
    }
    if (/^course\s*\/\s*workshop|^course or program/i.test(t)) {
      inExperience = false;
      courseIdx++;
      const cr = devItems[courseIdx];
      if (hasRunTab(seg.xml)) {
        return replaceAroundTag(seg.xml, /<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/, cr?.title || "", cr?.date || "");
      }
      return replaceParagraphText(seg.xml, cr?.title || "");
    }
    if (/^university\s*\/\s*company\s*\/\s*platform|^institution or platform/i.test(t)) {
      inExperience = false;
      const cr = devItems[courseIdx];
      return replaceParagraphText(seg.xml, cr?.institution || "");
    }
    if (/^completion year$/i.test(t)) {
      inExperience = false;
      const cr = devItems[courseIdx];
      return replaceParagraphText(seg.xml, cr?.date || "");
    }
    if (/^award\/achievement$/i.test(t)) {
      inExperience = false;
      awardIdx++;
      const aw = awards[awardIdx];
      return replaceParagraphText(seg.xml, aw?.title || "");
    }
    if (/^volunteer experience$/i.test(t)) {
      inExperience = false;
      volIdx++;
      const vl = volunteering[volIdx];
      return replaceParagraphText(seg.xml, vl?.role || "");
    }

    // 9. SUMMARY INJECTION
    if (
      /^write 3[\u2013\-]5 sentences|^showcase your top accomplishments|^lead with standout accomplishments|^use this section to|^this section is dedicated to|^use this space to write a brief introduction|^dedicated and compassionate registered nurse/i.test(
        t
      ) ||
      (inSummary && !summaryInjected && t.length > 40)
    ) {
      if (!summaryInjected) {
        summaryInjected = true;
        inSummary = false;
        return replaceParagraphText(seg.xml, summary);
      }
    }
    if (/^keep the tone confident|^use paragraphs or bullet points/i.test(t)) {
      return replaceParagraphText(seg.xml, "");
    }

    // 10. WORK EXPERIENCE INJECTION (Explicitly re-enables inExperience even after interleaved SKILLS TextBox!)
    if (
      /enter your job title here|position title here|registered nurse\s*\(rn\)|emergency department nurse|clinical nurse/i.test(
        t
      )
    ) {
      inExperience = true;
      inSkills = false;
      inSummary = false;
      expIdx++;
      bulletIdx = 0;
      const e = experience[expIdx];
      const nextTitle = e ? String(e.role || e.title || "") : "";
      const nextPeriod = e ? String(e.period || "") : "";
      if (hasRunTab(seg.xml)) {
        return replaceAroundTag(seg.xml, /<w:tab\s*\/>|<w:ptab(?:\s[^>]*)?\/>/, nextTitle, nextPeriod);
      }
      return replaceParagraphText(seg.xml, nextTitle);
    }

    if (/^company name\s*\/\s*location$|^company\/hospital,\s*city,\s*state$|^st\.\s*mary|^cedars-sinai|^mount sinai/i.test(t)) {
      inExperience = true;
      const e = experience[expIdx];
      const compLine = e ? [e.company, e.location].filter(Boolean).join(", ") : "";
      return replaceParagraphText(seg.xml, compLine);
    }

    if (expIdx >= 0 && inExperience) {
      const e = experience[expIdx];
      const bullets = e ? getBullets(e) : [];
      const isOverviewPlaceholder =
        /^start with a short overview|^use this optional paragraph|^include this optional paragraph|^your experience section should highlight|^quantify your results whenever possible|^a polished resume shows professionalism|^a valuable resume shows you|^quantify your achievements to clearly|^tailor your resume to show how|^highlight clinical expertise, leadership|^in this section, highlight|^earlier roles should illustrate|^a standout resume/i.test(
          t
        );

      if (isOverviewPlaceholder) {
        return replaceParagraphText(seg.xml, e?.showOverview && e?.overview ? e.overview : "");
      }

      const isBulletPara = seg.xml.includes("<w:numPr>") || t.length > 26;
      if (isBulletPara) {
        const nextB = bullets[bulletIdx] ?? "";
        bulletIdx++;
        if (!nextB) {
          const strippedNum = seg.xml.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/g, "");
          return replaceParagraphText(strippedNum, "");
        }
        return replaceParagraphText(seg.xml, nextB);
      }
    }

    // 11. FALLBACK SIDEBAR SKILLS LISTS
    if (inSkills && t.length <= 42) {
      if (inTechSkills) {
        const nextSk = techSkills[techSkillIdx] ?? "";
        techSkillIdx++;
        return replaceParagraphText(seg.xml, nextSk);
      } else {
        const nextSk = proSkills[proSkillIdx] ?? "";
        proSkillIdx++;
        return replaceParagraphText(seg.xml, nextSk);
      }
    }

    return seg.xml;
  });
}

function injectDocumentXml(xml: string, input: DocxInjectInput): string {
  // Find all <mc:Fallback>...</mc:Fallback> spans so Choice & Fallback are injected independently
  const fallbackSpans: Array<{ start: number; end: number }> = [];
  const fbRegex = /<mc:Fallback[\s\S]*?<\/mc:Fallback>/g;
  let fbm: RegExpExecArray | null;
  while ((fbm = fbRegex.exec(xml)) !== null) {
    fallbackSpans.push({ start: fbm.index, end: fbm.index + fbm[0].length });
  }

  const txbxSpans: Array<{ start: number; end: number }> = [];
  const tbRegex = /<w:txbxContent[\s\S]*?<\/w:txbxContent>/g;
  let tbm: RegExpExecArray | null;
  while ((tbm = tbRegex.exec(xml)) !== null) {
    txbxSpans.push({ start: tbm.index, end: tbm.index + tbm[0].length });
  }

  const isInsideFallback = (pos: number) =>
    fallbackSpans.some((sp) => pos >= sp.start && pos < sp.end);
  const isInsideTextBox = (pos: number) =>
    txbxSpans.some((sp) => pos >= sp.start && pos < sp.end);

  // Match ONLY leaf <w:p> elements (never swallows outer paragraphs wrapping TextBoxes!)
  const leafPRegex = /<w:p(?:>|\s[^>]*[^\/]>)(?:(?!<w:p[\s>\/])[\s\S])*?<\/w:p>/g;
  const primarySegments: LeafParagraphSegment[] = [];
  const fallbackSegments: LeafParagraphSegment[] = [];
  let match: RegExpExecArray | null;

  while ((match = leafPRegex.exec(xml)) !== null) {
    const seg: LeafParagraphSegment = {
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
      text: extractParagraphText(match[0]),
      inTextBox: isInsideTextBox(match.index),
    };
    if (isInsideFallback(match.index)) {
      fallbackSegments.push(seg);
    } else {
      primarySegments.push(seg);
    }
  }

  const primaryUpdated = runInjectionPass(primarySegments, input);
  const fallbackUpdated =
    fallbackSegments.length > 0 ? runInjectionPass(fallbackSegments, input) : [];

  // Merge all edits sorted from end-to-start so byte offsets stay exact
  const edits: Array<{ start: number; end: number; nextXml: string }> = [];
  primarySegments.forEach((seg, i) => {
    if (primaryUpdated[i] !== seg.xml) {
      edits.push({ start: seg.start, end: seg.end, nextXml: primaryUpdated[i] });
    }
  });
  fallbackSegments.forEach((seg, i) => {
    if (fallbackUpdated[i] !== seg.xml) {
      edits.push({ start: seg.start, end: seg.end, nextXml: fallbackUpdated[i] });
    }
  });
  edits.sort((a, b) => b.start - a.start);

  let result = xml;
  for (const ed of edits) {
    result = result.slice(0, ed.start) + ed.nextXml + result.slice(ed.end);
  }
  return result;
}


// Normalize wide default Word bullet hanging indents (720/360 = 36pt/18pt) to natural resume spacing (320/180 = 16pt/9pt -> ~6pt clear gap)
function normalizeDocxBulletNumberingXml(numXml: string): string {
  return numXml.replace(/<w:lvl\s+w:ilvl="0"[^>]*>[\s\S]*?<\/w:lvl>/g, (lvl) => {
    if (!/w:val="bullet"/.test(lvl)) return lvl;
    let out = lvl.replace(/<w:ind\b[^>]*\/>/g, (indTag) => {
      const lM = indTag.match(/w:left="(\d+)"/);
      const hM = indTag.match(/w:hanging="(\d+)"/);
      const left = lM ? Number(lM[1]) : 0;
      const hang = hM ? Number(hM[1]) : 0;
      if (hang >= 240 || left >= 480) {
        return '<w:ind w:left="320" w:hanging="180"/>';
      }
      return indTag;
    });
    out = out.replace(/<w:tab\s+w:val="num"\s+w:pos="(\d+)"\s*\/>/g, (tabTag, pos) =>
      Number(pos) >= 480 ? '<w:tab w:val="num" w:pos="320"/>' : tabTag
    );
    return out;
  });
}

function normalizeDocxBulletParagraphIndents(docXml: string): string {
  return docXml.replace(/<w:p(?:>|\s[^>]*[^\/]>)(?:(?!<w:p[\s>\/])[\s\S])*?<\/w:p>/g, (pXml) => {
    if (!pXml.includes("<w:numPr>") || !pXml.includes("w:hanging=")) return pXml;
    return pXml.replace(/<w:ind\b[^>]*\/>/g, (indTag) => {
      const lM = indTag.match(/w:left="(\d+)"/);
      const hM = indTag.match(/w:hanging="(\d+)"/);
      const left = lM ? Number(lM[1]) : 0;
      const hang = hM ? Number(hM[1]) : 0;
      if (hang >= 240 || left >= 480) {
        return '<w:ind w:left="320" w:hanging="180"/>';
      }
      return indTag;
    });
  });
}

export async function generateInjectedDocxBuffer(input: DocxInjectInput): Promise<{
  buffer: Buffer;
  templateFile: string;
}> {
  const masterPath = resolveMasterDocxPath(input);
  const rawBuf = fs.readFileSync(masterPath);
  const zip = await JSZip.loadAsync(rawBuf);

  const docEntry = zip.files["word/document.xml"];
  if (!docEntry) {
    throw new Error("Master template missing word/document.xml");
  }
  const origXml = await docEntry.async("string");
  const injectedXml = normalizeDocxBulletParagraphIndents(injectDocumentXml(origXml, input));
  zip.file("word/document.xml", injectedXml);
  const numEntry = zip.files["word/numbering.xml"];
  if (numEntry) {
    const origNumXml = await numEntry.async("string");
    zip.file("word/numbering.xml", normalizeDocxBulletNumberingXml(origNumXml));
  }

  const outBuf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    buffer: outBuf,
    templateFile: path.basename(masterPath),
  };
}

export function buildPlainTextExport(content: Record<string, any>): string {
  const c = content || {};
  const lines: string[] = [];
  if (c.name) lines.push(String(c.name).toUpperCase());
  if (c.role) lines.push(String(c.role));
  const contact = [c.phone, c.email, c.linkedin, c.website, c.location].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);

  if (c.summary) {
    lines.push("", "PROFESSIONAL SUMMARY", "====================", String(c.summary));
  }

  const exp: any[] = Array.isArray(c.experience) ? c.experience.filter((e) => !e?.hidden) : [];
  if (exp.length > 0) {
    lines.push("", "PROFESSIONAL EXPERIENCE", "=======================");
    for (const e of exp) {
      lines.push(`${e.role || e.title || ""} | ${[e.company, e.location].filter(Boolean).join(", ")} | ${e.period || ""}`);
      if (e.showOverview && e.overview) lines.push(e.overview);
      for (const b of getBullets(e)) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  const edu: any[] = Array.isArray(c.education) ? c.education : [];
  if (edu.length > 0) {
    lines.push("EDUCATION", "=========");
    for (const ed of edu) {
      lines.push(`${ed.degree || ""} | ${ed.school || ""} | ${ed.period || ed.date || ""}`);
    }
    lines.push("");
  }

  const skills = Array.isArray(c.skills) ? c.skills.filter(Boolean) : [];
  const tech = Array.isArray(c.technicalSkills) ? c.technicalSkills.filter(Boolean) : [];
  if (skills.length > 0 || tech.length > 0) {
    lines.push("SKILLS", "======");
    if (skills.length > 0) lines.push(`Professional: ${skills.join(", ")}`);
    if (tech.length > 0) lines.push(`Technical: ${tech.join(", ")}`);
  }

  return lines.join("\n").trim() + "\n";
}

export async function generateBundleZipBuffer(input: {
  seriesId: string;
  pageSize: "A4" | "Letter";
  pageCount: 1 | 2 | 3;
  baseFileName: string;
  content: Record<string, any>;
}): Promise<Buffer> {
  const safeBase = input.baseFileName.replace(/[^a-zA-Z0-9_\-]/g, "_") || "Farnavi_Resume";
  const szTag = input.pageSize === "Letter" ? "US_Letter" : "A4";
  const bundle = new JSZip();

  const [resumeDocx, coverDocx, refsDocx] = await Promise.all([
    generateInjectedDocxBuffer({
      seriesId: input.seriesId,
      kind: "resume",
      pageSize: input.pageSize,
      pageCount: input.pageCount,
      content: input.content,
    }),
    generateInjectedDocxBuffer({
      seriesId: input.seriesId,
      kind: "cover",
      pageSize: input.pageSize,
      pageCount: 1,
      content: input.content,
    }),
    generateInjectedDocxBuffer({
      seriesId: input.seriesId,
      kind: "references",
      pageSize: input.pageSize,
      pageCount: 1,
      content: input.content,
    }),
  ]);

  bundle.file(`${safeBase}_Resume_${input.pageCount}P_${szTag}.docx`, resumeDocx.buffer);
  bundle.file(`${safeBase}_Cover_Letter_${szTag}.docx`, coverDocx.buffer);
  bundle.file(`${safeBase}_References_${szTag}.docx`, refsDocx.buffer);
  bundle.file(`${safeBase}_ATS_Plain_Text.txt`, buildPlainTextExport(input.content));
  bundle.file(
    "README.txt",
    [
      "FARNAVI RESUME STUDIO — COMPLETE APPLICATION PACKAGE",
      "====================================================",
      `Generated: ${new Date().toISOString()}`,
      `Template Series: ${input.seriesId} | Paper Size: ${input.pageSize}`,
      "",
      "Included files:",
      `1. ${safeBase}_Resume_${input.pageCount}P_${szTag}.docx (Live-injected master Word template)`,
      `2. ${safeBase}_Cover_Letter_${szTag}.docx (Matching Cover Letter in Word format)`,
      `3. ${safeBase}_References_${szTag}.docx (Matching References sheet in Word format)`,
      `4. ${safeBase}_ATS_Plain_Text.txt (Clean plain-text backup for ATS forms)`,
    ].join("\n")
  );

  return bundle.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}