"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const IVY_FONT_CSS = `
@font-face {
  font-family: "IvyPlayfair";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/PlayfairDisplay-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "IvyPlayfair";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/PlayfairDisplay-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "IvyLato";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/fonts/Lato-Light.ttf") format("truetype");
}
@font-face {
  font-family: "IvyLato";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Lato-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "IvyLato";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Lato-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "IvyMerriweather";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Light.ttf") format("truetype");
}
@font-face {
  font-family: "IvyMerriweather";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "IvyMerriweather";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "IvySourceSans3";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/fonts/SourceSans3-Light.ttf") format("truetype");
}
@font-face {
  font-family: "IvySourceSans3";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/SourceSans3-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "IvySourceSans3";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/SourceSans3-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "IvyGreatVibes";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/GreatVibes-Regular.ttf") format("truetype");
}
.ivy-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.ivy-page * {
  box-sizing: border-box;
}
.ivy-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.ivy-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.ivy-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.ivy-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.ivy-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .ivy-ed,
  .ivy-ed:hover,
  .ivy-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word 2-Page experience entries (Resume-2Page-A4.docx & Resume-2Page-Letter.docx)
const IVY_2P_DEFAULT_EXPERIENCE = [
  {
    id: "ivy-2p-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Use this optional paragraph to summarize the role, highlight significant accomplishments, note your progression to the position (e.g., via promotion), or briefly describe the company if it\u2019s not widely known. You may omit this paragraph to proceed directly to the bullet points.",
    bullets: [
      "Showcase achievements that demonstrate value to the employer, such as driving revenue growth, reducing expenses, or enhancing efficiency. Use strong action verbs like \u201Cspearheaded\u201D or \u201Coptimized\u201D instead of passive phrases like \u201Cassigned to.\u201D",
      "Prioritize your most impactful and relevant accomplishments to engage the hiring manager. Include specific metrics where possible to quantify your contributions.",
      "Highlight leadership or innovative solutions that align with the company\u2019s objectives. Tailor examples to reflect skills that advance organizational goals.",
      "Emphasize your ability to manage projects or teams effectively, using clear examples of success. Quantify results to underscore your impact on the organization.",
      "Demonstrate your capacity to streamline operations or improve team performance. Provide concrete examples to illustrate your value to the employer.",
    ],
  },
  {
    id: "ivy-2p-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Review the job posting to identify essential skills, qualifications, or keywords emphasized by the employer. Incorporate these terms into your resume to align with the role\u2019s requirements and optimize ATS compatibility.",
      "Highlight achievements that demonstrate your fit for the role, using relevant examples. Ensure content reflects the posting\u2019s priorities to enhance selection chances.",
      "Use clear, keyword-rich descriptions of your accomplishments to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
      "Focus on results that meet organizational needs and align examples with the job.",
    ],
  },
  {
    id: "ivy-2p-exp-3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Maintain a professional email address (e.g., a Gmail account with your name) to convey credibility. Avoid outdated providers to project a modern image.",
      "Review your resume quickly to ensure key achievements and keywords stand out immediately. Bold critical accomplishments or skills to capture the reader\u2019s attention.",
      "Write your resume with clarity and purpose, focusing on achievements that convey your professional value and align with the target role.",
      "Ensure meticulous proofreading to eliminate errors, as inaccuracies can undermine your professionalism. Seek a second review if needed to maintain quality.",
    ],
  },
  {
    id: "ivy-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph: "",
    bullets: [
      "Present information in a clear, modern layout that emphasizes key achievements and aligns visually with professional resume standards.",
      "Focus on recent, relevant experience, omitting roles from over 15 years ago to keep content concise. Prioritize your most recent position to highlight current skills.",
      "Maintain a cohesive and professional document layout by ensuring visual balance, clear section separation, and consistent formatting throughout the resume.",
      "Emphasize your adaptability in addressing challenges or driving projects to completion. Include specific contributions that demonstrate your expertise.",
      "Showcase your ability to communicate effectively with stakeholders to achieve project goals. Provide examples that highlight successful outcomes.",
    ],
  },
];

// Exact colors extracted from Series 11 DOCX/PDF (Hard Rule 0)
const IVY_COLORS = {
  ink: "#000000",
  profession: "#7F7F7F",
  pipe: "#D0CECE",
  rule: "#CFCDCD",
  page: "#FFFFFF",
} as const;

const F_PLAYFAIR = '"IvyPlayfair", "Playfair Display", Georgia, serif';
const F_LATO = '"IvyLato", "Lato", Arial, sans-serif';
const F_MERRI = '"IvyMerriweather", "Merriweather", Georgia, serif';
const F_SOURCE = '"IvySourceSans3", "Source Sans 3", Arial, sans-serif';
const F_SCRIPT = '"IvyGreatVibes", "Great Vibes", cursive';

// Exact Word/PDF vertical rhythm measured by PyMuPDF across all 8 Series 11 PDFs:
// Body line advance = 14.46pt (9.96pt Merriweather 24pt Light @ 1.15x Word spacing)
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

  const mergedClass = ["ivy-ed", className].filter(Boolean).join(" ");
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

// PDF rules: y=110.38 and y=114.33 => 3.95pt center-to-center, stroke 0.5pt (#CFCDCD)
function IvyDoubleRule() {
  return (
    <div
      style={{
        width: "100%",
        height: "4.5pt",
        borderTop: `1px solid ${IVY_COLORS.rule}`,
        borderBottom: `1px solid ${IVY_COLORS.rule}`,
        boxSizing: "border-box",
      }}
    />
  );
}

// PDF heading box height = 16.5pt, rule centered at y+8.5pt, next text line starts at y+25.25pt (gap below heading = 8.75pt)
function IvySectionHeading({
  title,
  letterSpacingPt = 3.0,
  fontScale = 1,
  marginBottomPt = 8.75,
}: {
  title: string;
  letterSpacingPt?: number;
  fontScale?: number;
  marginBottomPt?: number;
}) {
  const ls = pt(letterSpacingPt, fontScale);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: pt(16.5, fontScale),
        gap: "7pt",
        marginBottom: pt(marginBottomPt, fontScale),
      }}
    >
      <div style={{ flex: 1, height: 0, borderTop: `1px solid ${IVY_COLORS.rule}` }} />
      <span
        style={{
          fontFamily: F_SOURCE,
          fontSize: pt(12, fontScale),
          fontWeight: 400,
          lineHeight: pt(16.5, fontScale),
          letterSpacing: ls,
          paddingLeft: ls,
          color: IVY_COLORS.ink,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, height: 0, borderTop: `1px solid ${IVY_COLORS.rule}` }} />
    </div>
  );
}

// Exact PDF header geometry (identical across all 8 PDFs):
// Name y=36.0 (h=47.3pt) -> Profession y=83.31 (h=15.0pt) -> Top double rule y=110.38..114.33
// Contact y=123.06 (h=14.46pt) -> Bottom double rule y=145.73..149.73
// Total header height from y=36.0 to y=149.73 = 113.73pt
function IvyMainHeader({
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
    "BLAKE TRUMAN";
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

  const nameLs = pt(6.5, fontScale);
  const profLs = pt(2.5, fontScale);

  return (
    <header style={{ width: "100%" }}>
      <InlineEd
        value={fullName.toUpperCase()}
        editable={editable}
        placeholder="BLAKE TRUMAN"
        onCommit={(v) => onPatch?.({ fullName: v })}
        style={{
          textAlign: "center",
          fontFamily: F_PLAYFAIR,
          fontSize: pt(27.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(38.0, fontScale),
          letterSpacing: nameLs,
          paddingLeft: nameLs,
          color: IVY_COLORS.ink,
          textTransform: "uppercase",
          marginBottom: pt(9.3, fontScale),
        }}
      />

      <InlineEd
        value={profession.toUpperCase()}
        editable={editable}
        placeholder="YOUR PROFESSION"
        onCommit={(v) => onPatch?.({ profession: v })}
        style={{
          textAlign: "center",
          fontFamily: F_LATO,
          fontSize: pt(9.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(12.2, fontScale),
          letterSpacing: profLs,
          paddingLeft: profLs,
          color: IVY_COLORS.profession,
          textTransform: "uppercase",
          marginBottom: pt(14.8, fontScale),
        }}
      />

      <IvyDoubleRule />

      <div
        style={{
          textAlign: "center",
          fontFamily: F_MERRI,
          fontSize: pt(9.96, fontScale),
          fontWeight: 300,
          lineHeight: pt(14.46, fontScale),
          color: IVY_COLORS.ink,
          paddingTop: pt(8.5, fontScale),
          paddingBottom: pt(8.3, fontScale),
        }}
      >
        {contactItems.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && (
              <span
                style={{
                  color: IVY_COLORS.pipe,
                  paddingLeft: "5.5pt",
                  paddingRight: "5.5pt",
                }}
              >
                |
              </span>
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

      <IvyDoubleRule />
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

function isUneditedSampleExperience(exps: any[]): boolean {
  if (!Array.isArray(exps) || exps.length !== 2) return false;
  return (
    exps[0]?.title === "ENTER YOUR JOB TITLE HERE" &&
    exps[1]?.title === "ENTER YOUR JOB TITLE HERE" &&
    exps[0]?.company === "Company Name / Location"
  );
}

function IvyExperienceItem({
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
  const lh = pt(14.46, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12pt",
          fontFamily: F_MERRI,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: IVY_COLORS.ink,
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
          fontFamily: F_MERRI,
          fontSize: fs,
          fontWeight: 300,
          lineHeight: lh,
          color: IVY_COLORS.ink,
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
            marginTop: pt(8.7, fontScale),
            fontFamily: F_MERRI,
            fontSize: fs,
            fontWeight: 300,
            lineHeight: lh,
            color: IVY_COLORS.ink,
          }}
        />
      )}

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_MERRI}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={300}
          color={IVY_COLORS.ink}
          marginTop={pt(8.7, fontScale)}
          markerSizePt={10.8 * fontScale}
        />
      )}
    </div>
  );
}

function IvyEducationSection({
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
  const lh = pt(14.46, fontScale);
  const fs = pt(9.96, fontScale);

  const rawEdu: any[] =
    Array.isArray(content?.education) && content.education.length > 0
      ? content.education
      : [
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
        ];

  const rawCerts: any[] = Array.isArray(content?.certifications) ? content.certifications : [];

  const updateEduAt = (idx: number, patchItem: any) => {
    const next = rawEdu.map((it, i) => (i === idx ? { ...it, ...patchItem } : it));
    onPatch?.({ education: next });
  };

  const updateCertAt = (idx: number, nextVal: any) => {
    const next = rawCerts.map((it, i) => (i === idx ? nextVal : it));
    onPatch?.({ certifications: next });
  };

  return (
    <section>
      <IvySectionHeading
        title="EDUCATION & CERTIFICATION"
        letterSpacingPt={2.4}
        fontScale={fontScale}
        marginBottomPt={8.75}
      />

      {rawEdu.map((ed, idx) => {
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
              marginTop: idx === 0 ? "0pt" : pt(8.7, fontScale),
              fontFamily: F_MERRI,
              fontSize: fs,
              lineHeight: lh,
              color: IVY_COLORS.ink,
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
                <span style={{ fontWeight: 700 }}>{" / "}</span>
              )}
              {(rightPart || editable) && (
                <InlineEd
                  inline
                  value={rightPart}
                  editable={editable}
                  placeholder="University Name - Location"
                  onCommit={(v) => updateEduAt(idx, { school: v, location: "" })}
                  style={{ fontWeight: 300 }}
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

      {rawCerts.map((cert, idx) => {
        const isStr = typeof cert === "string";
        const parts = isStr ? cert.split("/").map((s) => s.trim()) : [];
        const leftBold = isStr ? parts[0] || cert : cert.name || cert.title || "CERTIFICATION NAME";
        const leftLight = isStr
          ? parts.slice(1).join(" / ")
          : cert.issuer || cert.organization || cert.school || "";
        const dateVal = isStr ? "Date" : cert.date || cert.year || "Date";

        return (
          <div
            key={`cert-${idx}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12pt",
              marginTop: pt(8.7, fontScale),
              fontFamily: F_MERRI,
              fontSize: fs,
              lineHeight: lh,
              color: IVY_COLORS.ink,
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
              {leftLight && <span style={{ fontWeight: 700 }}>{" / "}</span>}
              {leftLight && (
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
                  style={{ fontWeight: 300 }}
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

export function Series11Exact({
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
  const lh = pt(14.46, fontScale);
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
  const effectiveExp = !is2P
    ? rawExp
    : isUneditedSampleExperience(rawExp)
    ? IVY_2P_DEFAULT_EXPERIENCE
    : rawExp.length < 3
    ? [...rawExp, ...IVY_2P_DEFAULT_EXPERIENCE.slice(2)]
    : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const summaryText =
    c.summary ||
    "Showcase your top accomplishments upfront, quantifying impacts with metrics to demonstrate tangible value. Use paragraphs or bullet points to highlight how your contributions drive business success, focusing on the benefits you deliver to the organization rather than personal objectives.";

  const skillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : Array.isArray(c.areasOfExpertise) && c.areasOfExpertise.length > 0
      ? c.areasOfExpertise
      : Array.isArray(c.skills) && c.skills.length > 0
      ? c.skills
      : [
          "Project Oversight",
          "Conflict Mediation",
          "Strategic Leadership",
          "Team Direction",
          "Effective Communication",
          "Process Enhancement",
          "Resource Optimization",
          "Customer Engagement",
        ];

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses
      : [
          {
            id: "ivy-crs-1",
            title: "COURSE / WORKSHOP / CLASS",
            institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
          {
            id: "ivy-crs-2",
            title: "COURSE / WORKSHOP / CLASS",
            institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
          {
            id: "ivy-crs-3",
            title: "COURSE / WORKSHOP / CLASS",
            institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
        ];

  const interestsList: string[] =
    Array.isArray(c.interests) && c.interests.length > 0
      ? c.interests
      : [
          "Learning conversational Spanish - Mentoring youth at community outreach programs",
          "Enthusiast of strategic board games - Perfecting artisanal sourdough bread - Kayaking on local rivers",
        ];

  // PAGE 2 (Exact PDF metrics from resume-2p-a4.pdf & resume-2p-letter.pdf)
  // Name y=35.96 (18pt Playfair) -> Double rule y=67.79..71.74 -> First job y=86.22
  if (pageIndex >= 1) {
    const page2Exp = effectiveExp.slice(2);
    const fullName =
      c.fullName || c.name || c.personal?.fullName || "BLAKE TRUMAN";
    const p2NameLs = pt(4.0, fontScale);

    return (
      <div
        className="ivy-page"
        style={{
          width: "100%",
          height: "100%",
          padding: `${marginPt}pt`,
          fontFamily: F_MERRI,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: IVY_FONT_CSS }} />

        <InlineEd
          value={fullName.toUpperCase()}
          editable={editable}
          placeholder="BLAKE TRUMAN"
          onCommit={(v) => patch({ fullName: v })}
          style={{
            textAlign: "left",
            fontFamily: F_PLAYFAIR,
            fontSize: pt(18, fontScale),
            fontWeight: 400,
            lineHeight: pt(24.0, fontScale),
            letterSpacing: p2NameLs,
            color: IVY_COLORS.ink,
            textTransform: "uppercase",
            marginBottom: pt(7.8, fontScale),
          }}
        />
        <IvyDoubleRule />

        {isVisible("experience") && page2Exp.length > 0 && (
          <section style={{ marginTop: pt(14.0, fontScale) }}>
            {page2Exp.map((exp, idx) => (
              <IvyExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === page2Exp.length - 1 ? (isLetter ? 14.4 : 15.5) : 17.4}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 2, nextExp)}
              />
            ))}
          </section>
        )}

        {isVisible("education") && (
          <div style={{ marginTop: page2Exp.length > 0 ? "0pt" : pt(14.0, fontScale) }}>
            <IvyEducationSection
              content={c}
              fontScale={fontScale}
              editable={editable}
              onPatch={patch}
            />
          </div>
        )}

        {isVisible("courses") && coursesList.length > 0 && (
          <section style={{ marginTop: pt(15.5, fontScale) }}>
            <IvySectionHeading
              title="PROFESSIONAL DEVELOPMENT"
              letterSpacingPt={3.0}
              fontScale={fontScale}
              marginBottomPt={8.75}
            />
            {coursesList.map((crs, idx) => (
              <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(8.7, fontScale) }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "12pt",
                    fontFamily: F_MERRI,
                    fontSize: fs,
                    fontWeight: 700,
                    lineHeight: lh,
                    color: IVY_COLORS.ink,
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
                    fontFamily: F_MERRI,
                    fontSize: fs,
                    fontWeight: 300,
                    lineHeight: lh,
                    color: IVY_COLORS.ink,
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {isVisible("interests") && interestsList.length > 0 && (
          <section style={{ marginTop: pt(15.5, fontScale) }}>
            <IvySectionHeading
              title="INTERESTS"
              letterSpacingPt={2.7}
              fontScale={fontScale}
              marginBottomPt={9.2}
            />
            <div
              style={{
                textAlign: "center",
                fontFamily: F_MERRI,
                fontSize: fs,
                fontWeight: 300,
                lineHeight: lh,
                color: IVY_COLORS.ink,
              }}
            >
              {interestsList.map((line, idx) => (
                <InlineEd
                  key={idx}
                  value={line}
                  editable={editable}
                  multiline
                  onCommit={(v) => {
                    const next = interestsList.map((it, i) => (i === idx ? v : it));
                    patch({ interests: next });
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // PAGE 1 (Exact PDF metrics from resume-1p-a4.pdf / letter & resume-2p-a4.pdf / letter)
  const page1Exp = effectiveExp.slice(0, 2);

  return (
    <div
      className="ivy-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_MERRI,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: IVY_FONT_CSS }} />

      <IvyMainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patch}
      />

      {isVisible("summary") && (
        <section style={{ marginTop: pt(is2P && isLetter ? 11.2 : 10.5, fontScale) }}>
          <IvySectionHeading
            title="PROFESSIONAL SUMMARY"
            letterSpacingPt={3.0}
            fontScale={fontScale}
            marginBottomPt={10.7}
          />
          <InlineEd
            value={summaryText}
            editable={editable}
            multiline
            placeholder="Professional summary..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              fontFamily: F_MERRI,
              fontSize: fs,
              fontWeight: 300,
              lineHeight: lh,
              color: IVY_COLORS.ink,
            }}
          />

          {isVisible("skills") && skillsList.length > 0 && (
            <div style={{ marginTop: pt(8.7, fontScale), textAlign: "center" }}>
              <div
                style={{
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  fontWeight: 300,
                  lineHeight: lh,
                  color: IVY_COLORS.ink,
                  marginBottom: pt(4.4, fontScale),
                }}
              >
                Areas of Expertise:
              </div>
              <InlineEd
                value={skillsList.join(" - ")}
                editable={editable}
                multiline
                placeholder="Skill 1 - Skill 2 - Skill 3"
                onCommit={(v) => {
                  const next = v
                    .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  patch({
                    professionalSkills: next,
                  });
                }}
                style={{
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  fontWeight: 300,
                  lineHeight: lh,
                  color: IVY_COLORS.ink,
                }}
              />
            </div>
          )}
        </section>
      )}

      {isVisible("experience") && page1Exp.length > 0 && (
        <section style={{ marginTop: pt(is2P && isLetter ? 15.5 : 14.4, fontScale) }}>
          <IvySectionHeading
            title="PROFESSIONAL EXPERIENCE"
            letterSpacingPt={3.0}
            fontScale={fontScale}
            marginBottomPt={8.8}
          />
          {page1Exp.map((exp, idx) => (
            <IvyExperienceItem
              key={exp.id || `p1-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === page1Exp.length - 1 ? (is2P ? 0 : isLetter ? 12.5 : 11.5) : 17.4}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
            />
          ))}
        </section>
      )}

      {!is2P && isVisible("education") && (
        <div style={{ marginTop: "0pt" }}>
          <IvyEducationSection
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
// Bottom rule y=149.73 -> Date y=167.58 (+17.85pt) -> Recipient y=196.50 (+14.46pt gap)
// -> Dear y=268.77 (+28.92pt gap) -> Each paragraph +14.46pt -> Quote +7.2pt
// -> ClosingNote (+14.46pt A4 / 0pt Letter) -> Sincerely +14.46pt
// -> GreatVibes 21.96pt Signature +14.46pt -> Typed name at dy=32.92pt
export function Series11CoverLetter({
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
  const isLetter = style?.pageSize === "Letter";
  const fontScale = style?.fontScale ? style.fontScale / 100 : 1;
  const marginPt = style?.pageMarginMm ? (style.pageMarginMm / 25.4) * 72 : 36;
  const lh = pt(14.46, fontScale);
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

  const paragraphs: string[] =
    Array.isArray(cl.paragraphs) && cl.paragraphs.length > 0
      ? cl.paragraphs
      : [
          cl.openingParagraph ||
            "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results.",
          cl.bodyParagraph ||
            "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance).",
          cl.closingParagraph ||
            "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:",
        ];

  const quote =
    cl.quote ||
    "\u201CI would welcome the opportunity to discuss how my skills and experience align with your company\u2019s objectives. Please feel free to contact me at (555) 555-5555 or youremail@mail.com.\u201D";
  const closingNote = cl.closingNote || "Thank you for your consideration.";
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName
          .toLowerCase()
          .replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Blake Truman");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_MERRI,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: IVY_COLORS.ink,
    margin: 0,
  };

  return (
    <div
      className="ivy-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_MERRI,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: IVY_FONT_CSS }} />

      <IvyMainHeader
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
          marginTop: pt(17.8, fontScale),
        }}
      />

      <div style={{ marginTop: pt(14.46, fontScale) }}>
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
        style={{ ...bodyStyle, marginTop: pt(28.9, fontScale) }}
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
          style={{ ...bodyStyle, marginTop: pt(14.46, fontScale) }}
        />
      ))}

      {quote && (
        <InlineEd
          value={quote}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ quote: v })}
          style={{ ...bodyStyle, marginTop: pt(7.2, fontScale) }}
        />
      )}

      {closingNote && (
        <InlineEd
          value={closingNote}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ closingNote: v })}
          style={{
            ...bodyStyle,
            marginTop: isLetter ? "0pt" : pt(14.46, fontScale),
          }}
        />
      )}

      <InlineEd
        value={signOff}
        editable={editable}
        onCommit={(v) => patchCL({ signOff: v })}
        style={{ ...bodyStyle, marginTop: pt(14.46, fontScale) }}
      />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        className="ivy-signature"
        style={{
          marginTop: pt(14.46, fontScale),
          fontFamily: F_SCRIPT,
          fontSize: pt(21.96, fontScale),
          fontWeight: 700,
          lineHeight: pt(29.0, fontScale),
          color: IVY_COLORS.ink,
        }}
      />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        style={{ ...bodyStyle, marginTop: pt(3.9, fontScale) }}
      />
    </div>
  );
}

// Exact PDF metrics from references-a4.pdf & references-letter.pdf:
// Bottom rule y=149.73 -> REFERENCES y=161.3 (+11.5pt) -> Ref1 y=188.1 (+10.3pt below heading)
// Each reference = 5 lines x 14.46pt, gap between blocks = 28.92pt (2 blank lines)
export function Series11References({
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
  const isLetter = style?.pageSize === "Letter";
  const fontScale = style?.fontScale ? style.fontScale / 100 : 1;
  const marginPt = style?.pageMarginMm ? (style.pageMarginMm / 25.4) * 72 : 36;
  const lh = pt(14.46, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => {
    onContentChange?.({ ...c, ...partial });
  };

  const refs: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references
      : [
          {
            id: "r1",
            name: "REFERENCE NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          },
          {
            id: "r2",
            name: "REFERENCE NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          },
          {
            id: "r3",
            name: "REFERENCE NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          },
          {
            id: "r4",
            name: "REFERENCE NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const next = refs.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  const refNameLs = pt(1.0, fontScale);

  return (
    <div
      className="ivy-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_MERRI,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: IVY_FONT_CSS }} />

      <IvyMainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <div style={{ marginTop: pt(isLetter ? 10.5 : 12.6, fontScale) }}>
        <IvySectionHeading
          title="REFERENCES"
          letterSpacingPt={2.7}
          fontScale={fontScale}
          marginBottomPt={isLetter ? 10.75 : 9.85}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: pt(28.92, fontScale),
        }}
      >
        {refs.map((ref, idx) => (
          <div
            key={ref.id || idx}
            style={{
              textAlign: "center",
              fontFamily: F_MERRI,
              fontSize: fs,
              fontWeight: 300,
              lineHeight: lh,
              color: IVY_COLORS.ink,
            }}
          >
            <InlineEd
              value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { name: v })}
              style={{
                fontWeight: 700,
                letterSpacing: refNameLs,
                paddingLeft: refNameLs,
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