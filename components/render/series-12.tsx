"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList, BulletStylesOnce } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S12_FONT_CSS = `
@font-face {
  font-family: "S12Lato";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Lato-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S12Lato";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Lato-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S12Manrope";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Manrope-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S12WorkSans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/WorkSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S12WorkSans";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/WorkSans-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S12LibreBaskerville";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/LibreBaskerville/LibreBaskerville-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S12LibreBaskerville";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/LibreBaskerville/LibreBaskerville-700-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S12Parisienne";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Parisienne-Regular.ttf") format("truetype");
}
.s12-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s12-page * {
  box-sizing: border-box;
}
.s12-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s12-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s12-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s12-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s12-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s12-ed,
  .s12-ed:hover,
  .s12-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 12 (Hard Rule 0)
const S12_COLORS = {
  ink: "#000000",
  profession: "#44546A",
  rule: "#D0CECE",
  barBg: "#F2F8EE",
  page: "#FFFFFF",
} as const;

const F_LATO = '"S12Lato", "Lato", Arial, sans-serif';
const F_MANROPE = '"S12Manrope", "Manrope", Arial, sans-serif';
const F_WORK = '"S12WorkSans", "Work Sans", Arial, sans-serif';
const F_BASK = '"S12LibreBaskerville", "Libre Baskerville", Georgia, serif';
const F_SCRIPT = '"S12Parisienne", "Parisienne", cursive';

// Exact Word 1-Page & 2-Page content from public/templates/12/*.docx
const S12_SUMMARY_TEXT =
  "Lead with standout accomplishments using quantifiable metrics to highlight measurable impact and demonstrate contributions to organizational success. Present them in paragraph or bullet form to quickly convey your value, avoiding objectives and focusing on business results.";

const S12_EXPERTISE_DEFAULT = [
  "Initiative Management",
  "Dispute Resolution",
  "Visionary Planning",
  "Group Leadership",
  "Clear Communication",
  "Operational Improvement",
  "Budget Management",
  "Client Relations",
];

const S12_1P_EXPERIENCE = [
  {
    id: "s12-1p-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Include this optional paragraph to provide an overview of the role, spotlight key successes, describe your path to the position (e.g., through a promotion), or briefly introduce the company if it\u2019s not widely recognized. You may exclude this paragraph to move directly to the bullet points.",
    bullets: [
      "Highlight accomplishments that demonstrate value to the employer, such as increasing profitability, reducing expenses, or enhancing efficiency. Use powerful action verbs like \u201Cdirected\u201D or \u201Cimplemented\u201D instead of passive phrases like \u201Ctasked with.\u201D",
      "Prioritize your most impactful and relevant successes to engage the hiring manager. Include specific metrics where applicable to quantify your contributions.",
      "Emphasize outcomes that align with the employer\u2019s objectives, showcasing leadership and innovation. Tailor examples to highlight skills that drive organizational growth.",
      "Demonstrate your ability to lead projects or teams effectively, providing clear examples of achievement. Quantify results to reinforce your impact on the organization.",
    ],
  },
  {
    id: "s12-1p-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Examine job posting for essential skills, qualifications, or keywords from the employer. Incorporate these into your resume to match requirements and optimize ATS compatibility.",
      "Focus on accomplishments that showcase your suitability for the position, using relevant examples. Ensure content aligns with the job posting\u2019s priorities to improve selection chances.",
      "Use clear, keyword-rich descriptions of your achievements to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
    ],
  },
];

const S12_2P_EXPERIENCE = [
  {
    id: "s12-2p-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Include this optional paragraph to outline the role, spotlight key successes, explain your path to the position (e.g., via advancement), or briefly describe the company if it\u2019s lesser-known. You may skip this paragraph to move directly to the bullet points.",
    bullets: [
      "Highlight accomplishments that add value to the employer, such as boosting profitability, cutting costs, or streamlining processes. Use dynamic action verbs like \u201Cled\u201D or \u201Crefined\u201D instead of passive phrases like \u201Cresponsible for.\u201D",
      "Prioritize your most significant and relevant achievements to capture the hiring manager\u2019s interest. Incorporate specific metrics where applicable to demonstrate tangible impact.",
      "Focus on leadership or innovative approaches that align with the employer\u2019s goals. Tailor examples to showcase skills that drive organizational success.",
      "Demonstrate your ability to guide projects or teams effectively, providing clear examples of impact. Quantify outcomes to emphasize your contribution to the organization.",
      "Showcase your capacity to enhance operations or elevate team performance. Provide specific examples to illustrate your value to the employer.",
    ],
  },
  {
    id: "s12-2p-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Examine the job posting to identify critical skills, qualifications, or keywords highlighted by the employer. Integrate these terms into your resume to match the role\u2019s needs and enhance ATS compatibility.",
      "Emphasize achievements that reflect your suitability for the position, using relevant examples. Ensure content aligns with the job posting\u2019s priorities to improve selection chances.",
      "Use clear, keyword-rich descriptions of your accomplishments to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
      "Highlight results that demonstrate your ability to meet organizational objectives, such as improving workflows or collaboration. Tailor examples to the job\u2019s requirements.",
      "Show adaptability in challenges and highlight contributions demonstrating expertise.",
    ],
  },
  {
    id: "s12-2p-exp-3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Use a professional email address (e.g., a Gmail account with your name) to maintain credibility. Avoid outdated providers to convey a modern, professional image.",
      "Review your resume swiftly to confirm that key achievements and keywords are immediately noticeable. Emphasize critical accomplishments or skills by bolding them to capture the reader\u2019s attention. Ensure the content is clear and engaging to make a strong first impression. Tailor highlighted elements to align with the job posting\u2019s priorities for maximum impact.",
      "If space allows, include an Interests section with unique, specific details to foster a personal connection with the reader. Avoid generic terms and focus on distinctive preferences.",
      "Proofread thoroughly to eliminate errors, as inaccuracies can undermine your professionalism. Consider a second review to ensure high quality.",
    ],
  },
  {
    id: "s12-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Present information in a clear, modern layout that emphasizes key achievements and aligns visually with professional resume standards.",
      "Focus on recent and relevant professional experience to keep your resume concise and impactful. Prioritize your most current role to showcase your latest expertise and achievements. Exclude older positions that are less pertinent to the job you\u2019re applying for to maintain clarity. Tailor your content to align with the employer\u2019s needs, emphasizing skills that demonstrate your value.",
      "Maintain a cohesive and professional document layout by ensuring visual balance, clear section separation, and consistent formatting throughout the resume.",
    ],
  },
];

const S12_2P_PRO_SKILLS_DEFAULT = [
  "Schedule Optimization",
  "Analytical Thinking",
  "Team Coordination",
  "Issue Resolution",
  "Innovative Solutions",
  "Precision Focus",
];

const S12_2P_TECH_SKILLS_DEFAULT = [
  "Microsoft Office Tools",
  "Canva & Adobe Illustrator",
  "WordPress Essentials",
  "Digital Marketing Optimization",
];

const S12_COVER_PARAGRAPHS_DEFAULT = [
  "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results.",
  "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance).",
  "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:",
];

const S12_COVER_QUOTE_DEFAULT =
  "\u201CI would welcome the opportunity to discuss how my skills and experience align with your company\u2019s objectives. Please feel free to contact me at (555) 555-5555 or youremail@mail.com.\u201D";

const pt = (val: number, scale = 1) => `${(val * scale).toFixed(2)}pt`;

function InlineEd({
  value,
  onCommit,
  editable = false,
  multiline = false,
  inline = false,
  style,
  className,
  placeholder,
}: {
  value: string;
  onCommit?: (next: string) => void;
  editable?: boolean;
  multiline?: boolean;
  inline?: boolean;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = inline ? spanRef.current : divRef.current;
    if (el && !focused && el.innerText !== (value || "")) {
      el.innerText = value || "";
    }
  }, [value, focused, inline]);

  const finalStyle: React.CSSProperties = {
    ...style,
    whiteSpace: style?.whiteSpace ?? (multiline ? "pre-wrap" : undefined),
  };

  if (!editable || !onCommit) {
    return inline ? (
      <span style={finalStyle} className={className}>
        {value}
      </span>
    ) : (
      <div style={finalStyle} className={className}>
        {value}
      </div>
    );
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const clean = multiline ? text : text.replace(/[\r\n]+/g, " ");
    document.execCommand("insertText", false, clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.currentTarget.innerText = value || "";
      e.currentTarget.blur();
      return;
    }
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    setFocused(false);
    const raw = (e.currentTarget.innerText || "").replace(/\r/g, "");
    const next = multiline ? raw.replace(/\n$/, "") : raw.replace(/\n+/g, " ");
    if (next !== (value || "")) {
      onCommit(next);
    }
  };

  const mergedClass = ["s12-ed", className].filter(Boolean).join(" ");
  const editStyle: React.CSSProperties = {
    ...finalStyle,
    cursor: "text",
  };

  if (inline) {
    return (
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        data-ph={placeholder || ""}
        className={mergedClass}
        style={editStyle}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    );
  }

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      data-ph={placeholder || ""}
      className={mergedClass}
      style={editStyle}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
}

// PDF double line: y=104.59 and y=107.44..107.89 => 3.5pt total box with crisp 1px top/bottom borders (#D0CECE)
function S12DoubleRule() {
  return (
    <div
      style={{
        width: "100%",
        height: "3.6pt",
        borderTop: `1px solid ${S12_COLORS.rule}`,
        borderBottom: `1px solid ${S12_COLORS.rule}`,
        boxSizing: "border-box",
      }}
    />
  );
}

// PDF shaded section bar: y=147.26..168.86 (height = 21.60pt), fill #F2F8EE, Libre Baskerville Bold 11.04pt ls=2.95pt
// Text inside starts at barTop + 3.93pt; next body line starts at barBottom + 10.90pt
function S12SectionBar({
  title,
  fontScale = 1,
  marginBottomPt = 10.9,
}: {
  title: string;
  fontScale?: number;
  marginBottomPt?: number;
}) {
  const ls = pt(2.95, fontScale);
  return (
    <div
      style={{
        width: "calc(100% + 3.2pt)",
        marginLeft: "-1.6pt",
        height: pt(21.6, fontScale),
        backgroundColor: S12_COLORS.barBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: pt(marginBottomPt, fontScale),
      }}
    >
      <span
        style={{
          fontFamily: F_BASK,
          fontSize: pt(11.04, fontScale),
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: ls,
          paddingLeft: ls,
          color: S12_COLORS.ink,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </div>
  );
}

// Exact PDF Header geometry (identical across all 8 Series 12 PDFs):
// Name y=36.0 (Lato 27.96pt ls=7.15pt) -> Profession y=79.04 (Manrope 9.96pt #44546A ls=2.0pt)
// -> Double rule y=104.59..107.74 -> Contact y=114.72 (Work Sans 9.96pt, NO bottom double rule)
// Total header bottom (end of contact line) = 114.72 + 13.50 = 128.22pt
function S12MainHeader({
  content,
  fontScale = 1,
  editable = false,
  onPatch,
}: {
  content: any;
  fontScale?: number;
  editable?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
  const fullName =
    content?.fullName ||
    content?.name ||
    content?.personal?.fullName ||
    "JONAH ROMANO";
  const profession =
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "YOUR PROFESSION";

  const phone = content?.phone ?? content?.personal?.phone ?? "(555) 555-5555";
  const email = content?.email ?? content?.personal?.email ?? "youremail@mail.com";
  const linkedin = content?.linkedin ?? content?.personal?.linkedin ?? "Linkedin.com/name";
  const location = content?.location ?? content?.personal?.location ?? "City, State/Province";

  const rawContactItems: Array<{
    key: "phone" | "email" | "linkedin" | "location";
    val: string;
    ph: string;
  }> = [
    { key: "phone", val: phone, ph: "(555) 555-5555" },
    { key: "email", val: email, ph: "youremail@mail.com" },
    { key: "linkedin", val: linkedin, ph: "Linkedin.com/name" },
    { key: "location", val: location, ph: "City, State/Province" },
  ];
  const contactItems = rawContactItems.filter((x) => editable || Boolean(x.val));

  const nameLs = pt(7.15, fontScale);
  const profLs = pt(2.0, fontScale);

  return (
    <header style={{ width: "100%" }}>
      <InlineEd
        value={fullName.toUpperCase()}
        editable={editable}
        placeholder="JONAH ROMANO"
        onCommit={(v) => onPatch?.({ fullName: v })}
        style={{
          textAlign: "center",
          fontFamily: F_LATO,
          fontSize: pt(27.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(34.0, fontScale),
          letterSpacing: nameLs,
          paddingLeft: nameLs,
          color: S12_COLORS.ink,
          textTransform: "uppercase",
          marginBottom: pt(9.0, fontScale),
        }}
      />

      <InlineEd
        value={profession.toUpperCase()}
        editable={editable}
        placeholder="YOUR PROFESSION"
        onCommit={(v) => onPatch?.({ profession: v })}
        style={{
          textAlign: "center",
          fontFamily: F_MANROPE,
          fontSize: pt(9.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(12.2, fontScale),
          letterSpacing: profLs,
          paddingLeft: profLs,
          color: S12_COLORS.profession,
          textTransform: "uppercase",
          marginBottom: pt(13.3, fontScale),
        }}
      />

      <S12DoubleRule />

      <div
        style={{
          textAlign: "center",
          fontFamily: F_WORK,
          fontSize: pt(9.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(13.5, fontScale),
          color: S12_COLORS.ink,
          marginTop: pt(6.6, fontScale),
        }}
      >
        {contactItems.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && (
              <span style={{ paddingLeft: "5.5pt", paddingRight: "5.5pt" }}>|</span>
            )}
            <InlineEd
              inline
              value={item.val}
              editable={editable}
              placeholder={item.ph}
              onCommit={(v) => onPatch?.({ [item.key]: v } as Partial<ResumeContent>)}
            />
          </React.Fragment>
        ))}
      </div>
    </header>
  );
}

function normalizeBullets(exp: any): string[] {
  if (Array.isArray(exp?.bullets)) {
    return exp.bullets.filter((b: any) => typeof b === "string" && b.trim().length > 0);
  }
  if (typeof exp?.bullets === "string" && exp.bullets.trim()) {
    return exp.bullets
      .split("\n")
      .map((s: string) => s.replace(/^[\u2022\-*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function formatCompanyLine(exp: any): string {
  const company = (exp?.company || "").trim();
  const location = (exp?.location || "").trim();
  if (!location) return company;
  if (!company) return location;
  if (company.toLowerCase().includes(location.toLowerCase())) return company;
  return `${company} / ${location}`;
}

function isSamplePlaceholderExp(exps: any[]): boolean {
  if (!Array.isArray(exps) || exps.length === 0) return true;
  return exps.every(
    (e) =>
      (e?.title || e?.role || "") === "ENTER YOUR JOB TITLE HERE" &&
      ((e?.company || "") === "Company Name" || (e?.company || "") === "Company Name / Location")
  );
}

function S12ExperienceItem({
  exp,
  fontScale,
  marginBottomPt,
  editable = false,
  onUpdateExp,
}: {
  exp: any;
  fontScale: number;
  marginBottomPt: number;
  editable?: boolean;
  onUpdateExp?: (nextExp: any) => void;
}) {
  const title = exp?.title || exp?.role || "ENTER YOUR JOB TITLE HERE";
  const period = exp?.period || exp?.date || "Date \u2013 Date";
  const companyLine = formatCompanyLine(exp) || "Company Name / Location";
  const overview = (
    exp?.summaryParagraph ||
    exp?.description ||
    exp?.overview ||
    ""
  ).trim();
  const bullets = normalizeBullets(exp);
  const lh = pt(13.5, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12pt",
          fontFamily: F_WORK,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S12_COLORS.ink,
        }}
      >
        <InlineEd
          inline
          value={title}
          editable={editable}
          placeholder="ENTER YOUR JOB TITLE HERE"
          onCommit={(v) => onUpdateExp?.({ ...exp, title: v, role: v })}
        />
        <InlineEd
          inline
          value={period}
          editable={editable}
          placeholder="Date - Present"
          onCommit={(v) => onUpdateExp?.({ ...exp, period: v, date: v })}
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        />
      </div>

      <InlineEd
        value={companyLine}
        editable={editable}
        placeholder="Company Name / Location"
        onCommit={(v) => onUpdateExp?.({ ...exp, company: v, location: "" })}
        style={{
          fontFamily: F_WORK,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S12_COLORS.ink,
        }}
      />

      {overview && (
        <InlineEd
          value={overview}
          editable={editable}
          multiline
          placeholder="Role overview..."
          onCommit={(v) =>
            onUpdateExp?.({
              ...exp,
              summaryParagraph: v,
              overview: v,
              description: v,
              showOverview: Boolean(v.trim()),
            })
          }
          style={{
            marginTop: pt(8.1, fontScale),
            fontFamily: F_WORK,
            fontSize: fs,
            fontWeight: 400,
            lineHeight: lh,
            color: S12_COLORS.ink,
          }}
        />
      )}

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_WORK}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S12_COLORS.ink}
          marginTop={pt(8.1, fontScale)}
          markerSizePt={10.8 * fontScale}
        />
      )}
    </div>
  );
}

function S12EducationSection({
  content,
  fontScale,
  editable = false,
  onPatch,
}: {
  content: any;
  fontScale: number;
  editable?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
  const lh = pt(13.5, fontScale);
  const fs = pt(9.96, fontScale);

  const rawEdu: any[] = Array.isArray(content?.education) ? content.education : [];
  const rawCerts: any[] = Array.isArray(content?.certifications) ? content.certifications : [];

  // Word template has exactly 1 degree row + 1 certification row by default
  const isDefaultStoreDup =
    rawEdu.length === 2 &&
    rawEdu[0]?.degree === "DEGREE TITLE" &&
    rawEdu[1]?.degree === "DEGREE TITLE" &&
    rawCerts.length === 2 &&
    rawCerts[0]?.name === "CERTIFICATION NAME" &&
    rawCerts[1]?.name === "CERTIFICATION NAME";

  const displayEdu = isDefaultStoreDup
    ? [rawEdu[0]]
    : rawEdu.length > 0
    ? rawEdu
    : [{ id: "s12-edu-1", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Date" }];

  const displayCerts = isDefaultStoreDup
    ? [rawCerts[0]]
    : rawCerts.length > 0
    ? rawCerts
    : [{ id: "s12-cert-1", name: "CERTIFICATION NAME", issuer: "Organization", date: "Date" }];

  const updateEduAt = (idx: number, patchItem: any) => {
    const next = displayEdu.map((it, i) => (i === idx ? { ...it, ...patchItem } : it));
    onPatch?.({ education: next, certifications: displayCerts });
  };

  const updateCertAt = (idx: number, nextVal: any) => {
    const next = displayCerts.map((it, i) => (i === idx ? nextVal : it));
    onPatch?.({ education: displayEdu, certifications: next });
  };

  return (
    <section>
      <S12SectionBar
        title="EDUCATION & CERTIFICATION"
        fontScale={fontScale}
        marginBottomPt={10.9}
      />

      {displayEdu.map((ed, idx) => {
        const degree = (ed?.degree || "DEGREE TITLE").trim();
        const school = (ed?.school || "").trim();
        const loc = (ed?.location || "").trim();
        const rightPart =
          loc && !school.toLowerCase().includes(loc.toLowerCase())
            ? `${school} \u2013 ${loc}`
            : school;
        const dateVal = ed?.date || ed?.period || "Date";

        return (
          <div
            key={ed?.id || `edu-${idx}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12pt",
              marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale),
              fontFamily: F_WORK,
              fontSize: fs,
              lineHeight: lh,
              color: S12_COLORS.ink,
            }}
          >
            <span>
              <InlineEd
                inline
                value={degree}
                editable={editable}
                placeholder="DEGREE TITLE"
                onCommit={(v) => updateEduAt(idx, { degree: v })}
                style={{ fontWeight: 700 }}
              />
              {(rightPart || editable) && (
                <span style={{ fontWeight: 400 }}>{" / "}</span>
              )}
              {(rightPart || editable) && (
                <InlineEd
                  inline
                  value={rightPart}
                  editable={editable}
                  placeholder="University Name - Location"
                  onCommit={(v) => updateEduAt(idx, { school: v, location: "" })}
                  style={{ fontWeight: 400 }}
                />
              )}
            </span>
            <InlineEd
              inline
              value={dateVal}
              editable={editable}
              placeholder="Date"
              onCommit={(v) => updateEduAt(idx, { date: v, period: v })}
              style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
            />
          </div>
        );
      })}

      {displayCerts.map((cert, idx) => {
        const isStr = typeof cert === "string";
        const parts = isStr ? cert.split("/").map((s) => s.trim()) : [];
        const leftBold = isStr ? parts[0] || cert : cert.name || cert.title || "CERTIFICATION NAME";
        const leftLight = isStr
          ? parts.slice(1).join(" / ")
          : cert.issuer || cert.organization || cert.school || "";
        const dateVal = isStr ? "Date" : cert.date || cert.year || "Date";

        return (
          <div
            key={cert?.id || `cert-${idx}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12pt",
              marginTop: pt(8.1, fontScale),
              fontFamily: F_WORK,
              fontSize: fs,
              lineHeight: lh,
              color: S12_COLORS.ink,
            }}
          >
            <span>
              <InlineEd
                inline
                value={leftBold}
                editable={editable}
                onCommit={(v) =>
                  updateCertAt(
                    idx,
                    isStr
                      ? leftLight
                        ? `${v} / ${leftLight}`
                        : v
                      : { ...cert, name: v, title: v }
                  )
                }
                style={{ fontWeight: 700 }}
              />
              {(leftLight || editable) && <span style={{ fontWeight: 400 }}>{" / "}</span>}
              {(leftLight || editable) && (
                <InlineEd
                  inline
                  value={leftLight}
                  editable={editable}
                  onCommit={(v) =>
                    updateCertAt(
                      idx,
                      isStr
                        ? v
                          ? `${leftBold} / ${v}`
                          : leftBold
                        : { ...cert, issuer: v, organization: v }
                    )
                  }
                  style={{ fontWeight: 400 }}
                />
              )}
            </span>
            <InlineEd
              inline
              value={dateVal}
              editable={editable && !isStr}
              onCommit={(v) => updateCertAt(idx, { ...cert, date: v })}
              style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
            />
          </div>
        );
      })}
    </section>
  );
}

export function Series12Exact({
  content,
  style,
  sectionOrder,
  pageIndex = 0,
  totalPages = 1,
  editable = false,
  onContentChange,
}: {
  content: ResumeContent;
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  pageIndex?: number;
  totalPages?: number;
  editable?: boolean;
  onContentChange?: (next: ResumeContent) => void;
}) {
  const c: any = content || {};
  const isLetter = style?.pageSize === "Letter";
  const fontScale = style?.fontScale ? style.fontScale / 100 : 1;
  const marginPt = style?.pageMarginMm ? (style.pageMarginMm / 25.4) * 72 : 36;
  const lh = pt(13.5, fontScale);
  const fs = pt(9.96, fontScale);

  const isVisible = (id: string) => {
    if (!sectionOrder || sectionOrder.length === 0) return true;
    const found = sectionOrder.find((s) => s.id === id);
    return found ? found.visible !== false : true;
  };

  const patch = (partial: Partial<ResumeContent>) => {
    if (!onContentChange) return;
    onContentChange({ ...c, ...partial });
  };

  const is2P = totalPages >= 2;
  const rawExp: any[] = Array.isArray(c.experience) ? c.experience : [];
  const isUneditedSample = isSamplePlaceholderExp(rawExp);

  const effectiveExp = isUneditedSample
    ? is2P
      ? S12_2P_EXPERIENCE
      : S12_1P_EXPERIENCE
    : is2P && rawExp.length < 3
    ? [...rawExp, ...S12_2P_EXPERIENCE.slice(2)]
    : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const rawSummary = (c.summary || "").trim();
  const isLegacyStoreSummary = rawSummary.startsWith("Lead with standout achievements, using quantifiable outcomes");
  const summaryText = !rawSummary || isLegacyStoreSummary ? S12_SUMMARY_TEXT : rawSummary;

  const expertiseList: string[] =
    Array.isArray(c.areasOfExpertise) && c.areasOfExpertise.length > 0
      ? c.areasOfExpertise
      : S12_EXPERTISE_DEFAULT;

  const rawProSkills: string[] = Array.isArray(c.professionalSkills) ? c.professionalSkills : [];
  const isLegacyProSkills =
    rawProSkills.length === 8 && rawProSkills[0] === "Time Management" && rawProSkills[1] === "Critical Thinking";
  const proSkillsList =
    rawProSkills.length > 0 && !isLegacyProSkills ? rawProSkills : S12_2P_PRO_SKILLS_DEFAULT;

  const rawTechSkills: string[] = Array.isArray(c.technicalSkills) ? c.technicalSkills : [];
  const isLegacyTechSkills =
    rawTechSkills.length === 6 && rawTechSkills[0] === "Microsoft Office Suite";
  const techSkillsList =
    rawTechSkills.length > 0 && !isLegacyTechSkills ? rawTechSkills : S12_2P_TECH_SKILLS_DEFAULT;

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses
      : [
          { id: "s12-crs-1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "Date" },
          { id: "s12-crs-2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "Date" },
          { id: "s12-crs-3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "Date" },
        ];

  // PAGE 2 (Exact PDF metrics from resume-2p-a4.pdf & resume-2p-letter.pdf)
  // Name y=36.0 (Lato 18pt ls=4.6pt) -> Double rule y=62.5..65.6 (A4) / 63.7..66.7 (Letter) -> Job3 y=74.3 / 75.6
  if (pageIndex >= 1) {
    const page2Exp = effectiveExp.slice(2);
    const fullName =
      c.fullName || c.name || c.personal?.fullName || "JONAH ROMANO";
    const p2NameLs = pt(4.6, fontScale);

    return (
      <div
        className="s12-page"
        style={{
          width: "100%",
          height: "100%",
          padding: `${marginPt}pt`,
          fontFamily: F_WORK,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: S12_FONT_CSS }} />

        <InlineEd
          value={fullName.toUpperCase()}
          editable={editable}
          placeholder="JONAH ROMANO"
          onCommit={(v) => patch({ fullName: v })}
          style={{
            textAlign: "left",
            fontFamily: F_LATO,
            fontSize: pt(18, fontScale),
            fontWeight: 400,
            lineHeight: pt(21.5, fontScale),
            letterSpacing: p2NameLs,
            color: S12_COLORS.ink,
            textTransform: "uppercase",
            marginBottom: pt(isLetter ? 6.2 : 5.0, fontScale),
          }}
        />
        <S12DoubleRule />

        {isVisible("experience") && page2Exp.length > 0 && (
          <section style={{ marginTop: pt(8.5, fontScale) }}>
            {page2Exp.map((exp, idx) => (
              <S12ExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === page2Exp.length - 1 ? 12.2 : 18.9}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 2, nextExp)}
              />
            ))}
          </section>
        )}

        {isVisible("education") && (
          <div style={{ marginTop: page2Exp.length > 0 ? "0pt" : pt(10, fontScale) }}>
            <S12EducationSection
              content={c}
              fontScale={fontScale}
              editable={editable}
              onPatch={patch}
            />
          </div>
        )}

        {isVisible("courses") && coursesList.length > 0 && (
          <section style={{ marginTop: pt(12.2, fontScale) }}>
            <S12SectionBar
              title="PROFESSIONAL DEVELOPMENT"
              fontScale={fontScale}
              marginBottomPt={10.9}
            />
            {coursesList.map((crs, idx) => (
              <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale) }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "12pt",
                    fontFamily: F_WORK,
                    fontSize: fs,
                    fontWeight: 700,
                    lineHeight: lh,
                    color: S12_COLORS.ink,
                  }}
                >
                  <InlineEd
                    inline
                    value={crs.title || crs.name || "COURSE / WORKSHOP / CLASS"}
                    editable={editable}
                    onCommit={(v) => {
                      const next = coursesList.map((it, i) =>
                        i === idx ? { ...it, title: v, name: v } : it
                      );
                      patch({ courses: next });
                    }}
                  />
                  <InlineEd
                    inline
                    value={crs.date || "Date"}
                    editable={editable}
                    onCommit={(v) => {
                      const next = coursesList.map((it, i) =>
                        i === idx ? { ...it, date: v } : it
                      );
                      patch({ courses: next });
                    }}
                    style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                  />
                </div>
                <InlineEd
                  value={
                    crs.institution ||
                    crs.provider ||
                    "UNIVERSITY / COMPANY / PLATFORM / LOCATION"
                  }
                  editable={editable}
                  onCommit={(v) => {
                    const next = coursesList.map((it, i) =>
                      i === idx ? { ...it, institution: v } : it
                    );
                    patch({ courses: next });
                  }}
                  style={{
                    fontFamily: F_WORK,
                    fontSize: fs,
                    fontWeight: 400,
                    lineHeight: lh,
                    color: S12_COLORS.ink,
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {/* SKILLS section on Page 2 (exact Word 2-Page layout: PROFESSIONAL & TECHNICAL bullet headings) */}
        {isVisible("skills") && (
          <section style={{ marginTop: pt(12.2, fontScale) }}>
            <BulletStylesOnce />
            <S12SectionBar title="SKILLS" fontScale={fontScale} marginBottomPt={10.9} />

            {/* PROFESSIONAL */}
            <div>
              <ul className="tpl-bullet-list" style={{ paddingLeft: "10pt", fontFamily: F_WORK, fontSize: fs, fontWeight: 400, lineHeight: lh, color: S12_COLORS.ink, "--bl-marker-size": `${(10.8 * fontScale).toFixed(2)}pt`, "--bl-marker-color": S12_COLORS.ink } as React.CSSProperties}><li style={{ paddingLeft: "11.36pt" }}>PROFESSIONAL</li></ul>
              <InlineEd
                value={
                  !isLetter && proSkillsList.length === 6
                    ? `${proSkillsList.slice(0, 4).join(" - ")}\n${proSkillsList[4]} \u2013 ${proSkillsList[5]}`
                    : proSkillsList.join(" - ")
                }
                editable={editable}
                multiline
                onCommit={(v) => {
                  const next = v
                    .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  patch({ professionalSkills: next });
                }}
                style={{
                  paddingLeft: "7.08pt",
                  fontFamily: F_WORK,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  color: S12_COLORS.ink,
                }}
              />
            </div>

            {/* TECHNICAL */}
            <div style={{ marginTop: pt(8.1, fontScale) }}>
              <ul className="tpl-bullet-list" style={{ paddingLeft: "10pt", fontFamily: F_WORK, fontSize: fs, fontWeight: 400, lineHeight: lh, color: S12_COLORS.ink, "--bl-marker-size": `${(10.8 * fontScale).toFixed(2)}pt`, "--bl-marker-color": S12_COLORS.ink } as React.CSSProperties}><li style={{ paddingLeft: "11.36pt" }}>TECHNICAL</li></ul>
              <InlineEd
                value={techSkillsList.join(" - ")}
                editable={editable}
                multiline
                onCommit={(v) => {
                  const next = v
                    .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  patch({ technicalSkills: next });
                }}
                style={{
                  paddingLeft: "7.08pt",
                  fontFamily: F_WORK,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  color: S12_COLORS.ink,
                }}
              />
            </div>
          </section>
        )}
      </div>
    );
  }

  // PAGE 1 (1-Page Resume OR Page 1 of 2-Page Resume)
  const page1Exp = effectiveExp.slice(0, 2);

  // Word splits Areas of Expertise cleanly into 2 centered lines of 4 items each
  const expertiseText =
    expertiseList.length === 8
      ? `${expertiseList.slice(0, 4).join(" - ")}\n${expertiseList.slice(4).join(" - ")}`
      : expertiseList.join(" - ");

  return (
    <div
      className="s12-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_WORK,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S12_FONT_CSS }} />

      <S12MainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patch}
      />

      {/* PROFESSIONAL SUMMARY & Areas of Expertise */}
      {isVisible("summary") && (
        <section style={{ marginTop: pt(19.0, fontScale) }}>
          <S12SectionBar
            title="PROFESSIONAL SUMMARY"
            fontScale={fontScale}
            marginBottomPt={10.9}
          />
          <InlineEd
            value={summaryText}
            editable={editable}
            multiline
            placeholder="Professional summary..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              fontFamily: F_WORK,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S12_COLORS.ink,
            }}
          />

          {isVisible("skills") && expertiseList.length > 0 && (
            <div style={{ marginTop: pt(10.7, fontScale), textAlign: "center" }}>
              <div
                style={{
                  fontFamily: F_WORK,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  color: S12_COLORS.ink,
                  marginBottom: pt(6.8, fontScale),
                }}
              >
                Areas of Expertise:
              </div>
              <InlineEd
                value={expertiseText}
                editable={editable}
                multiline
                placeholder="Skill 1 - Skill 2 - Skill 3"
                onCommit={(v) => {
                  const next = v
                    .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  patch({ areasOfExpertise: next });
                }}
                style={{
                  fontFamily: F_WORK,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  color: S12_COLORS.ink,
                }}
              />
            </div>
          )}
        </section>
      )}

      {/* EXPERIENCE */}
      {isVisible("experience") && page1Exp.length > 0 && (
        <section style={{ marginTop: pt(12.2, fontScale) }}>
          <S12SectionBar
            title="EXPERIENCE"
            fontScale={fontScale}
            marginBottomPt={10.9}
          />
          {page1Exp.map((exp, idx) => (
            <S12ExperienceItem
              key={exp.id || `p1-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === page1Exp.length - 1 ? (is2P ? 0 : 12.2) : 18.9}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
            />
          ))}
        </section>
      )}

      {/* EDUCATION & CERTIFICATION (Page 1 only in 1-Page mode) */}
      {!is2P && isVisible("education") && (
        <div style={{ marginTop: "0pt" }}>
          <S12EducationSection
            content={c}
            fontScale={fontScale}
            editable={editable}
            onPatch={patch}
          />
        </div>
      )}
    </div>
  );
}

// Exact PDF metrics from cover-a4.pdf & cover-letter.pdf:
// Contact bottom y=128.22 -> Date y=155.40 (+27.18pt) -> Recipient y=182.28 (+13.5pt gap)
// -> Dear y=249.72 (+27.0pt gap) -> Paragraphs (+13.5pt gap) -> Quote (+8.1pt gap)
// -> ClosingNote (+13.5pt) -> Sincerely (+13.5pt) -> Parisienne 20.04pt Signature (+13.5pt) -> Name (+31.42pt from sig top)
export function Series12CoverLetter({
  content,
  style,
  editable = false,
  onContentChange,
}: {
  content: ResumeContent;
  style?: DocumentStyleSettings;
  editable?: boolean;
  onContentChange?: (next: ResumeContent) => void;
}) {
  const c: any = content || {};
  const cl: any = c.coverLetter || {};
  const fontScale = style?.fontScale ? style.fontScale / 100 : 1;
  const marginPt = style?.pageMarginMm ? (style.pageMarginMm / 25.4) * 72 : 36;
  const lh = pt(13.5, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => {
    onContentChange?.({ ...c, ...partial });
  };
  const patchCL = (partial: Record<string, any>) => {
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });
  };

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager Name";
  const companyName = cl.companyName || "Company Name";
  const companyAddress = cl.companyAddress || "Company Address";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const isLegacyStoreCover =
    typeof cl.openingParagraph === "string" &&
    cl.openingParagraph.startsWith("I am pleased to submit my application");

  const paragraphs: string[] =
    Array.isArray(cl.paragraphs) && cl.paragraphs.length > 0
      ? cl.paragraphs
      : !isLegacyStoreCover && cl.openingParagraph
      ? [cl.openingParagraph, cl.bodyParagraph || "", cl.closingParagraph || ""].filter(Boolean)
      : S12_COVER_PARAGRAPHS_DEFAULT;

  const quote = cl.quote || S12_COVER_QUOTE_DEFAULT;
  const closingNote = cl.closingNote || "Thank you for your consideration.";
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName
          .toLowerCase()
          .replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Jonah Romano");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_WORK,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S12_COLORS.ink,
    margin: 0,
  };

  return (
    <div
      className="s12-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_WORK,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S12_FONT_CSS }} />

      <S12MainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <InlineEd
        value={dateText}
        editable={editable}
        onCommit={(v) => patchCL({ date: v })}
        style={{
          ...bodyStyle,
          textAlign: "right",
          marginTop: pt(27.18, fontScale),
        }}
      />

      <div style={{ marginTop: pt(13.5, fontScale) }}>
        <InlineEd
          value={recipientName}
          editable={editable}
          onCommit={(v) => patchCL({ recipientName: v })}
          style={bodyStyle}
        />
        <InlineEd
          value={companyName}
          editable={editable}
          onCommit={(v) => patchCL({ companyName: v })}
          style={bodyStyle}
        />
        <InlineEd
          value={companyAddress}
          editable={editable}
          onCommit={(v) => patchCL({ companyAddress: v })}
          style={bodyStyle}
        />
      </div>

      <InlineEd
        value={greeting}
        editable={editable}
        onCommit={(v) => patchCL({ greeting: v, salutation: v })}
        style={{ ...bodyStyle, marginTop: pt(27.0, fontScale) }}
      />

      {paragraphs.map((p, idx) => (
        <InlineEd
          key={idx}
          value={p}
          editable={editable}
          multiline
          onCommit={(v) => {
            const next = paragraphs.map((it, i) => (i === idx ? v : it));
            patchCL({
              paragraphs: next,
              openingParagraph: next[0] || "",
              bodyParagraph: next[1] || "",
              closingParagraph: next[2] || "",
            });
          }}
          style={{ ...bodyStyle, marginTop: pt(13.5, fontScale) }}
        />
      ))}

      {quote && (
        <InlineEd
          value={quote}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ quote: v })}
          style={{ ...bodyStyle, marginTop: pt(8.1, fontScale) }}
        />
      )}

      {closingNote && (
        <InlineEd
          value={closingNote}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ closingNote: v })}
          style={{ ...bodyStyle, marginTop: pt(13.5, fontScale) }}
        />
      )}

      <InlineEd
        value={signOff}
        editable={editable}
        onCommit={(v) => patchCL({ signOff: v })}
        style={{ ...bodyStyle, marginTop: pt(13.5, fontScale) }}
      />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        className="s12-signature"
        style={{
          marginTop: pt(13.5, fontScale),
          fontFamily: F_SCRIPT,
          fontSize: pt(20.04, fontScale),
          fontWeight: 700,
          lineHeight: pt(27.4, fontScale),
          color: S12_COLORS.ink,
        }}
      />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        style={{ ...bodyStyle, marginTop: pt(4.0, fontScale) }}
      />
    </div>
  );
}

// Exact PDF metrics from references-a4.pdf & references-letter.pdf:
// Contact bottom y=128.22 -> REFERENCES bar y=147.26..168.86 (+19.04pt) -> Ref1 y=179.76 (+10.9pt)
// 5 lines x 13.5pt per reference, gap between blocks = 27.0pt (2 blank lines)
export function Series12References({
  content,
  style,
  editable = false,
  onContentChange,
}: {
  content: ResumeContent;
  style?: DocumentStyleSettings;
  editable?: boolean;
  onContentChange?: (next: ResumeContent) => void;
}) {
  const c: any = content || {};
  const fontScale = style?.fontScale ? style.fontScale / 100 : 1;
  const marginPt = style?.pageMarginMm ? (style.pageMarginMm / 25.4) * 72 : 36;
  const lh = pt(13.5, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => {
    onContentChange?.({ ...c, ...partial });
  };

  const refs: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references
      : [
          { id: "r1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const next = refs.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  return (
    <div
      className="s12-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_WORK,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S12_FONT_CSS }} />

      <S12MainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <div style={{ marginTop: pt(19.0, fontScale) }}>
        <S12SectionBar title="REFERENCES" fontScale={fontScale} marginBottomPt={10.9} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: pt(27.0, fontScale),
        }}
      >
        {refs.map((ref, idx) => (
          <div
            key={ref.id || idx}
            style={{
              textAlign: "center",
              fontFamily: F_WORK,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S12_COLORS.ink,
            }}
          >
            <InlineEd
              value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { name: v })}
              style={{
                fontWeight: 700,
                letterSpacing: pt(1.0, fontScale),
                paddingLeft: pt(1.0, fontScale),
                textTransform: "uppercase",
              }}
            />
            <InlineEd
              value={ref.title || ref.role || "Job Title"}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { title: v, role: v })}
            />
            <InlineEd
              value={ref.company || ref.organization || "Company or Institution"}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { company: v, organization: v })}
            />
            <InlineEd
              value={ref.phone || "(555) 555-5555"}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { phone: v })}
            />
            <InlineEd
              value={ref.email || "reference@mail.com"}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { email: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}