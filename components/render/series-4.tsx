"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S4_FONT_CSS = `
@font-face {
  font-family: "S4Rubik";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Rubik/Rubik-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S4Nunito";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/Nunito/Nunito-500-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S4SourceSans3";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/SourceSans3-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S4Merriweather";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S4Merriweather";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S4GreatVibes";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/GreatVibes-Regular.ttf") format("truetype");
}
.s4-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s4-page * {
  box-sizing: border-box;
}
.s4-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s4-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s4-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s4-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s4-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s4-ed,
  .s4-ed:hover,
  .s4-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 4 (Hard Rule 0)
const S4_COLORS = {
  ink: "#000000",
  firstName: "#8496B0",
  lastName: "#767171",
  profession: "#44546A",
  rule: "#D0CECE",
  page: "#FFFFFF",
} as const;

const F_RUBIK = '"S4Rubik", "Rubik", Arial, sans-serif';
const F_NUNITO = '"S4Nunito", "Nunito", Arial, sans-serif';
const F_SOURCE = '"S4SourceSans3", "Source Sans 3", Arial, sans-serif';
const F_MERRI = '"S4Merriweather", "Merriweather", Georgia, serif';
const F_SCRIPT = '"S4GreatVibes", "Great Vibes", cursive';

// Exact 2-Page Page 2 experience defaults (2 jobs) from resume-2p-a4.docx
const S4_2P_P2_EXPERIENCE = [
  {
    id: "s4-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "A standout resume clearly connects your skills to business outcomes and shows how you create impact.",
    bullets: [
      "Demonstrate how your technical expertise solves organizational challenges and drives measurable progress in performance or efficiency.",
      "Explain how your analytical thinking, data-driven decisions, and proactive problem-solving contribute to better results and team alignment.",
      "Show how you integrate technical knowledge with business strategy to support objectives such as cost reduction, innovation, or customer satisfaction.",
      "Use clear, keyword-rich phrasing that enhances visibility on hiring systems and communicates your abilities with professionalism and precision.",
    ],
  },
  {
    id: "s4-2p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "A strong resume also tells the story of your growth and the tangible value you deliver.",
    bullets: [
      "Include examples of projects where your leadership or collaboration led to specific, quantifiable achievements in metrics such as revenue, quality, or productivity.",
      "Emphasize professional evolution through new responsibilities, certifications, or skill development that reflect adaptability and initiative.",
      "Use confident, active language to convey accountability, drive, and the ability to inspire trust among colleagues and decision-makers.",
    ],
  },
];

const S4_COVER_DEFAULTS = [
  "Use this space to write a personalized introduction to your future employer.",
  "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic.",
  "Start with a strong opening that explains why you\u2019re excited about this position and what makes you a great fit. Be genuine \u2014 share a bit about your motivation, your professional values, or a defining moment in your career that shaped your work style.",
  "In the next paragraph, describe what you\u2019ve accomplished in your field. Focus on the results you\u2019ve achieved and how your contributions made a difference. Use specific examples, but keep it conversational rather than technical.",
  "Then, explain what draws you to [Company Name] \u2014 perhaps their mission, culture, or approach to innovation. Show that you\u2019ve done your research and that you see yourself thriving there.",
  "Finally, close with a forward-looking statement. Express your enthusiasm to discuss the role further and invite them to contact you.",
  "Thank the reader for considering the application, and express enthusiasm for future communication.",
];

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

  const mergedClass = ["s4-ed", className].filter(Boolean).join(" ");
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

function S4HLine({ x0Pt, x1Pt, yPt }: { x0Pt: number; x1Pt: number; yPt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${x0Pt.toFixed(2)}pt`,
        top: `${yPt.toFixed(2)}pt`,
        width: `${(x1Pt - x0Pt).toFixed(2)}pt`,
        height: 0,
        borderTop: `0.75pt solid ${S4_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S4Heading({
  lines,
  align = "left",
  fontScale = 1,
}: {
  lines: string[];
  align?: "left" | "right" | "center";
  fontScale?: number;
}) {
  return (
    <div
      style={{
        fontFamily: F_SOURCE,
        fontSize: pt(14.52, fontScale),
        fontWeight: 400,
        lineHeight: pt(21.2, fontScale),
        letterSpacing: pt(2.9, fontScale),
        paddingLeft: align === "center" ? pt(2.9, fontScale) : undefined,
        color: S4_COLORS.ink,
        textTransform: "uppercase",
        textAlign: align,
      }}
    >
      {lines.map((ln, idx) => (
        <div key={idx}>{ln}</div>
      ))}
    </div>
  );
}

function splitNameParts(fullName: string): [string, string] {
  const parts = (fullName || "OLIVIA ANDERSON").trim().split(/\s+/);
  if (parts.length <= 1) return [parts[0] || "OLIVIA", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

// Header for Series 4: top 7.25pt #D0CECE bar + two-tone Rubik 28pt name + Nunito 12pt profession + optional contact bar
function S4Header({
  content,
  isLetter,
  showContactBar = true,
  showVerticalDivider = true,
  fontScale = 1,
  editable = false,
  onPatch,
}: {
  content: any;
  isLetter: boolean;
  showContactBar?: boolean;
  showVerticalDivider?: boolean;
  fontScale?: number;
  editable?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
  const fullName = (
    content?.fullName ||
    content?.name ||
    content?.personal?.fullName ||
    "OLIVIA ANDERSON"
  ).toUpperCase();
  const [firstName, lastName] = splitNameParts(fullName);

  const profession = (
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "YOUR PROFESSION"
  ).toUpperCase();

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

  const rightEdge = isLetter ? 582.0 : 565.5;
  const vRuleX = isLetter ? 194.25 : 194.1;
  const vRuleTop = showContactBar ? 148.5 : 122.25;
  const vRuleEnd = isLetter ? 776.55 : 825.5;

  return (
    <>
      {/* Top horizontal accent bar (#D0CECE, 7.25pt) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "7.25pt",
          backgroundColor: S4_COLORS.rule,
        }}
      />

      {/* Centered Two-Tone Name */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "33.26pt",
          width: `${(rightEdge - 30).toFixed(2)}pt`,
          textAlign: "center",
          fontFamily: F_RUBIK,
          fontSize: pt(27.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(34.0, fontScale),
          letterSpacing: pt(7.0, fontScale),
          paddingLeft: pt(7.0, fontScale),
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        <InlineEd
          inline
          value={firstName}
          editable={editable}
          placeholder="OLIVIA"
          onCommit={(v) => onPatch?.({ fullName: `${v.trim()} ${lastName}`.trim() })}
          style={{ color: S4_COLORS.firstName }}
        />
        {(lastName || editable) && <span> </span>}
        {(lastName || editable) && (
          <InlineEd
            inline
            value={lastName}
            editable={editable}
            placeholder="ANDERSON"
            onCommit={(v) => onPatch?.({ fullName: `${firstName} ${v.trim()}`.trim() })}
            style={{ color: S4_COLORS.lastName }}
          />
        )}
      </div>

      {/* Centered Profession */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "82.69pt",
          width: `${(rightEdge - 30).toFixed(2)}pt`,
          textAlign: "center",
        }}
      >
        <InlineEd
          value={profession}
          editable={editable}
          placeholder="YOUR PROFESSION"
          onCommit={(v) => onPatch?.({ profession: v })}
          style={{
            fontFamily: F_NUNITO,
            fontSize: pt(12.0, fontScale),
            fontWeight: 500,
            lineHeight: pt(16.0, fontScale),
            letterSpacing: pt(3.0, fontScale),
            paddingLeft: pt(3.0, fontScale),
            color: S4_COLORS.profession,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        />
      </div>

      {/* Header bottom rule */}
      <S4HLine x0Pt={30.0} x1Pt={rightEdge} yPt={114.75} />

      {/* Contact row (Page 1, Cover Letter, References) */}
      {showContactBar && (
        <>
          <div
            style={{
              position: "absolute",
              left: "30pt",
              top: isLetter ? "121.84pt" : "122.8pt",
              width: `${(rightEdge - 30).toFixed(2)}pt`,
              textAlign: "center",
              fontFamily: F_MERRI,
              fontSize: pt(9.0, fontScale),
              fontWeight: 400,
              lineHeight: pt(13.0, fontScale),
              color: S4_COLORS.ink,
            }}
          >
            {contactItems.map((item, idx) => (
              <React.Fragment key={item.key}>
                {idx > 0 && (
                  <span style={{ color: S4_COLORS.rule, paddingLeft: "7pt", paddingRight: "7pt" }}>
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
          <S4HLine x0Pt={30.0} x1Pt={rightEdge} yPt={140.27} />
        </>
      )}

      {/* Vertical column divider */}
      {showVerticalDivider && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${vRuleX}pt`,
            top: `${vRuleTop}pt`,
            width: 0,
            height: `${(vRuleEnd - vRuleTop).toFixed(2)}pt`,
            borderLeft: `0.75pt solid ${S4_COLORS.rule}`,
          }}
        />
      )}
    </>
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

function S4ExperienceItem({
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
    exp?.overview ||
    exp?.description ||
    ""
  ).trim();
  const bullets = normalizeBullets(exp);
  const lh = pt(13.02, fontScale);
  const fs = pt(9.0, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10pt",
          fontFamily: F_MERRI,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S4_COLORS.ink,
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
          fontWeight: 400,
          lineHeight: lh,
          color: S4_COLORS.ink,
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
            marginTop: pt(8.5, fontScale),
            fontFamily: F_MERRI,
            fontSize: fs,
            fontWeight: 400,
            lineHeight: lh,
            color: S4_COLORS.ink,
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
          fontWeight={400}
          color={S4_COLORS.ink}
          marginTop={pt(8.5, fontScale)}
          markerSizePt={9.8 * fontScale}
        />
      )}
    </div>
  );
}

function S4CoursesBlock({
  courses,
  fontScale,
  editable,
  onPatchCourses,
}: {
  courses: any[];
  fontScale: number;
  editable: boolean;
  onPatchCourses: (next: any[]) => void;
}) {
  const lh = pt(13.02, fontScale);
  const fs = pt(9.0, fontScale);

  return (
    <div>
      {courses.map((crs, idx) => (
        <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(8.6, fontScale) }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "10pt",
              fontFamily: F_MERRI,
              fontSize: fs,
              fontWeight: 700,
              lineHeight: lh,
              color: S4_COLORS.ink,
            }}
          >
            <InlineEd
              inline
              value={crs.title || crs.name || "COURSE / WORKSHOP / CLASS"}
              editable={editable}
              onCommit={(v) => {
                const next = courses.map((it, i) => (i === idx ? { ...it, title: v, name: v } : it));
                onPatchCourses(next);
              }}
            />
            <InlineEd
              inline
              value={(crs.date || "DATE").toUpperCase()}
              editable={editable}
              onCommit={(v) => {
                const next = courses.map((it, i) => (i === idx ? { ...it, date: v } : it));
                onPatchCourses(next);
              }}
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            />
          </div>
          <InlineEd
            value={crs.institution || crs.provider || "UNIVERSITY / COMPANY / PLATFORM / LOCATION"}
            editable={editable}
            onCommit={(v) => {
              const next = courses.map((it, i) => (i === idx ? { ...it, institution: v } : it));
              onPatchCourses(next);
            }}
            style={{
              fontFamily: F_MERRI,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S4_COLORS.ink,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function Series4Exact({
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
  const leftW = 144.8;
  const rightX = 216.05;
  const rightEdge = isLetter ? 581.5 : 564.2;
  const rightTextW = rightEdge - rightX;
  const lh = pt(13.02, fontScale);
  const fs = pt(9.0, fontScale);

  const isVisible = (id: string) => {
    if (!sectionOrder || sectionOrder.length === 0) return true;
    const found = sectionOrder.find((s) => s.id === id);
    return found ? found.visible !== false : true;
  };

  const patch = (partial: Partial<ResumeContent>) => {
    if (!onContentChange) return;
    onContentChange({ ...c, ...partial });
  };

  const is3P = totalPages >= 3;
  const is2P = totalPages === 2;

  const rawExp: any[] = Array.isArray(c.experience) ? c.experience : [];
  const isDefault3PJob4 =
    rawExp.length >= 5 &&
    (rawExp[3]?.summaryParagraph || "").startsWith("To ensure your resume stands out to recruiters");
  const effectiveExp =
    is2P && isDefault3PJob4
      ? [...rawExp.slice(0, 3), ...S4_2P_P2_EXPERIENCE]
      : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses.slice(0, 4)
      : [
          { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr4", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
        ];

  // =========================================================================
  // PAGE 3 (3P: Right-aligned References left | Jobs 7-8 & Prof Dev right)
  // =========================================================================
  if (pageIndex >= 2) {
    const devRuleY = isLetter ? 591.45 : 640.5;
    const devHeadY = isLetter ? 602.75 : 651.83;
    const p3Exp = effectiveExp.slice(6, 8);

    const refsList: any[] =
      Array.isArray(c.references) && c.references.length > 0
        ? c.references.slice(0, 4)
        : [
            { id: "rf1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          ];

    return (
      <div className="s4-page" style={{ width: "100%", height: "100%", fontFamily: F_MERRI }}>
        <style dangerouslySetInnerHTML={{ __html: S4_FONT_CSS }} />
        <S4Header content={c} isLetter={isLetter} showContactBar={false} fontScale={fontScale} editable={editable} onPatch={patch} />

        <S4HLine x0Pt={213.3} x1Pt={isLetter ? 582.0 : 565.5} yPt={devRuleY} />

        {/* LEFT (RIGHT-ALIGNED): REFERENCES */}
        <div style={{ position: "absolute", left: "30pt", top: "126.15pt", width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["REFERENCES"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(7.2, fontScale), display: "flex", flexDirection: "column", gap: pt(26.0, fontScale) }}>
            {refsList.map((ref, idx) => (
              <div key={ref.id || idx} style={{ fontFamily: F_MERRI, fontSize: fs, lineHeight: lh, color: S4_COLORS.ink, textAlign: "right" }}>
                <InlineEd
                  value={(ref.name || "FULL NAME HERE").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = refsList.map((it, i) => (i === idx ? { ...it, name: v } : it));
                    patch({ references: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={ref.title || ref.role || "Job Title"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = refsList.map((it, i) => (i === idx ? { ...it, title: v, role: v } : it));
                    patch({ references: next });
                  }}
                />
                <InlineEd
                  value={ref.company || ref.organization || "Company or Institution"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = refsList.map((it, i) => (i === idx ? { ...it, company: v, organization: v } : it));
                    patch({ references: next });
                  }}
                />
                <InlineEd
                  value={ref.phone || "(555) 555-5555"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = refsList.map((it, i) => (i === idx ? { ...it, phone: v } : it));
                    patch({ references: next });
                  }}
                />
                <InlineEd
                  value={ref.email || "reference@mail.com"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = refsList.map((it, i) => (i === idx ? { ...it, email: v } : it));
                    patch({ references: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT TOP: EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.15pt", width: `${rightTextW}pt` }}>
          <S4Heading lines={["EXPERIENCE CONTINUED"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.0, fontScale) }}>
            {p3Exp.map((exp, idx) => (
              <S4ExperienceItem
                key={exp.id || `p3-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p3Exp.length - 1 ? 0 : 17.5}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 6, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM: PROFESSIONAL DEVELOPMENT */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
          <S4Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.5, fontScale) }}>
            <S4CoursesBlock
              courses={coursesList}
              fontScale={fontScale}
              editable={editable}
              onPatchCourses={(next) => patch({ courses: next })}
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PAGE 2 (Left right-aligned: Technical Skills, Achievements & Awards, Community Involvement)
  // Right: 2P -> 2 jobs + Prof Dev | 3P -> 3 jobs
  // =========================================================================
  if (pageIndex === 1) {
    const achRuleY = isLetter ? 352.66 : 359.86;
    const achHeadY = isLetter ? 364.26 : 371.46;
    const commRuleY = isLetter ? 565.37 : 595.79;
    const commHeadY = isLetter ? 576.83 : 607.07;
    const devRuleY = isLetter ? 590.69 : 640.48;
    const devHeadY = isLetter ? 602.51 : 651.71;
    const p2Exp = is3P ? effectiveExp.slice(3, 6) : effectiveExp.slice(3, 5);

    const techSkills: string[] =
      Array.isArray(c.technicalSkills) && c.technicalSkills.length > 0
        ? c.technicalSkills
        : [
            "Python Programming",
            "SQL Database Management",
            "Tableau Data Visualization",
            "Salesforce CRM Management",
            "AutoCAD Design Software",
            "Jira Project Management",
            "AWS Cloud Computing",
          ];

    const awardsList: any[] =
      Array.isArray(c.awards) && c.awards.length > 0
        ? c.awards.slice(0, 3)
        : [
            { id: "aw1", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
            { id: "aw2", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
            { id: "aw3", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
          ];

    const volunteerList: any[] =
      Array.isArray(c.volunteering) && c.volunteering.length > 0
        ? c.volunteering.slice(0, 3)
        : [
            { id: "vl1", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
            { id: "vl2", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
            { id: "vl3", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
          ];

    return (
      <div className="s4-page" style={{ width: "100%", height: "100%", fontFamily: F_MERRI }}>
        <style dangerouslySetInnerHTML={{ __html: S4_FONT_CSS }} />
        <S4Header content={c} isLetter={isLetter} showContactBar={false} fontScale={fontScale} editable={editable} onPatch={patch} />

        <S4HLine x0Pt={30.0} x1Pt={175.0} yPt={achRuleY} />
        <S4HLine x0Pt={30.0} x1Pt={175.0} yPt={commRuleY} />
        {!is3P && <S4HLine x0Pt={213.3} x1Pt={isLetter ? 582.9 : 565.5} yPt={devRuleY} />}

        {/* LEFT TOP (RIGHT-ALIGNED): TECHNICAL SKILLS */}
        <div style={{ position: "absolute", left: "30pt", top: "126.15pt", width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["TECHNICAL", "SKILLS"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(8.1, fontScale) }}>
            {techSkills.map((sk, idx) => (
              <InlineEd
                key={idx}
                value={sk}
                editable={editable}
                onCommit={(v) => {
                  const next = techSkills.map((it, i) => (i === idx ? v : it));
                  patch({ technicalSkills: next });
                }}
                style={{
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  marginTop: idx === 0 ? "0pt" : pt(11.9, fontScale),
                  color: S4_COLORS.ink,
                  textAlign: "right",
                }}
              />
            ))}
          </div>
        </div>

        {/* LEFT MIDDLE (RIGHT-ALIGNED): ACHIEVEMENTS & AWARDS */}
        <div style={{ position: "absolute", left: "30pt", top: `${achHeadY}pt`, width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["ACHIEVEMENTS", "& AWARDS"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(6.5, fontScale) }}>
            {awardsList.map((aw, idx) => (
              <div
                key={aw.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.6, fontScale),
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S4_COLORS.ink,
                  textAlign: "right",
                }}
              >
                <InlineEd
                  value={(aw.title || "AWARD/ACHIEVEMENT").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = awardsList.map((it, i) => (i === idx ? { ...it, title: v } : it));
                    patch({ awards: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={aw.issuer || aw.organization || "Organization Name"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = awardsList.map((it, i) => (i === idx ? { ...it, issuer: v, organization: v } : it));
                    patch({ awards: next });
                  }}
                />
                <InlineEd
                  value={aw.date || "Date"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = awardsList.map((it, i) => (i === idx ? { ...it, date: v } : it));
                    patch({ awards: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* LEFT BOTTOM (RIGHT-ALIGNED): COMMUNITY INVOLVEMENT */}
        <div style={{ position: "absolute", left: "30pt", top: `${commHeadY}pt`, width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["COMMUNITY", "INVOLVEMENT"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(6.8, fontScale) }}>
            {volunteerList.map((vol, idx) => (
              <div
                key={vol.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.6, fontScale),
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S4_COLORS.ink,
                  textAlign: "right",
                }}
              >
                <InlineEd
                  value={(vol.role || "VOLUNTEER EXPERIENCE").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, role: v } : it));
                    patch({ volunteering: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={vol.organization || "Organization Name"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, organization: v } : it));
                    patch({ volunteering: next });
                  }}
                />
                <InlineEd
                  value={vol.date || vol.period || "Date"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, date: v, period: v } : it));
                    patch({ volunteering: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT TOP: EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.15pt", width: `${rightTextW}pt` }}>
          <S4Heading lines={["EXPERIENCE CONTINUED"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(6.6, fontScale) }}>
            {p2Exp.map((exp, idx) => (
              <S4ExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p2Exp.length - 1 ? 0 : 17.5}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 3, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM (2P only): PROFESSIONAL DEVELOPMENT */}
        {!is3P && (
          <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
            <S4Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
            <div style={{ marginTop: pt(8.5, fontScale) }}>
              <S4CoursesBlock
                courses={coursesList}
                fontScale={fontScale}
                editable={editable}
                onPatchCourses={(next) => patch({ courses: next })}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PAGE 1 (Identical across 1P, 2P P1, 3P P1)
  // =========================================================================
  const expRuleY = isLetter ? 271.06 : 273.61;
  const expHeadY = isLetter ? 282.78 : 285.42;
  const eduRuleY = isLetter ? 448.18 : 477.75;
  const eduHeadY = isLetter ? 459.8 : 489.32;
  const certRuleY = isLetter ? 599.84 : 630.61;
  const certHeadY = isLetter ? 611.15 : 641.99;
  const page1Exp = effectiveExp.slice(0, 3);

  const summaryText =
    (c.summary || "").trim() ||
    "Use this section to succinctly present your top strengths and key achievements, highlighting the measurable value you offer and clearly demonstrating how your skills contribute to the organization\u2019s goals. Focus on concrete accomplishments that illustrate your impact, and prioritize results and relevance to employers\u2019 needs, ensuring your profile stands out as a valuable asset to any team.";

  const skillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : [
          "Project Coordination",
          "Group Leadership",
          "Workflow Streamlining",
          "Client Interaction",
          "Data Interpretation",
          "Employee Onboarding",
          "Issue Resolution",
          "Cross-Team Collaboration",
          "Process Automation",
          "Schedule Management",
          "Record-Keeping",
        ];

  const eduList: any[] =
    Array.isArray(c.education) && c.education.length > 0
      ? c.education.slice(0, 2)
      : [
          { id: "ed1", degree: "DEGREE TITLE", school: "University Name, Location", date: "Graduation Year" },
          { id: "ed2", degree: "DEGREE TITLE", school: "University Name, Location", date: "Graduation Year" },
        ];

  const certsList: any[] =
    Array.isArray(c.certifications) && c.certifications.length > 0
      ? c.certifications.slice(0, 2)
      : [
          { id: "c1", name: "License Name", issuer: "Authority/Organization", date: "Date" },
          { id: "c2", name: "Certification Name", issuer: "Issuing Organization", date: "Date" },
        ];

  return (
    <div className="s4-page" style={{ width: "100%", height: "100%", fontFamily: F_MERRI }}>
      <style dangerouslySetInnerHTML={{ __html: S4_FONT_CSS }} />
      <S4Header content={c} isLetter={isLetter} showContactBar={true} fontScale={fontScale} editable={editable} onPatch={patch} />

      {/* Section divider rules */}
      <S4HLine x0Pt={213.0} x1Pt={isLetter ? 582.0 : 565.5} yPt={expRuleY} />
      <S4HLine x0Pt={30.0} x1Pt={175.0} yPt={eduRuleY} />
      <S4HLine x0Pt={30.0} x1Pt={175.0} yPt={certRuleY} />

      {/* LEFT TOP (RIGHT-ALIGNED): SKILLS */}
      {isVisible("skills") && (
        <div style={{ position: "absolute", left: "30pt", top: "152.19pt", width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["SKILLS"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(5.2, fontScale) }}>
            {skillsList.map((sk, idx) => (
              <InlineEd
                key={idx}
                value={sk}
                editable={editable}
                onCommit={(v) => {
                  const next = skillsList.map((it, i) => (i === idx ? v : it));
                  patch({ professionalSkills: next });
                }}
                style={{
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  marginTop: idx === 0 ? "0pt" : pt(11.9, fontScale),
                  color: S4_COLORS.ink,
                  textAlign: "right",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* LEFT MIDDLE (RIGHT-ALIGNED): EDUCATION */}
      {isVisible("education") && (
        <div style={{ position: "absolute", left: "30pt", top: `${eduHeadY}pt`, width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["EDUCATION"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(5.4, fontScale) }}>
            {eduList.map((ed, idx) => (
              <div
                key={ed.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.6, fontScale),
                  fontFamily: F_MERRI,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S4_COLORS.ink,
                  textAlign: "right",
                }}
              >
                <InlineEd
                  value={(ed.degree || "DEGREE TITLE").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = eduList.map((it, i) => (i === idx ? { ...it, degree: v } : it));
                    patch({ education: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={ed.school || "University Name, Location"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = eduList.map((it, i) => (i === idx ? { ...it, school: v } : it));
                    patch({ education: next });
                  }}
                />
                <InlineEd
                  value={ed.date || ed.period || "Graduation Year"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = eduList.map((it, i) => (i === idx ? { ...it, date: v, period: v } : it));
                    patch({ education: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEFT BOTTOM (RIGHT-ALIGNED): CERTIFICATION & LICENSE */}
      {isVisible("certifications") && (
        <div style={{ position: "absolute", left: "30pt", top: `${certHeadY}pt`, width: `${leftW}pt`, textAlign: "right" }}>
          <S4Heading lines={["CERTIFICATION", "& LICENSE"]} align="right" fontScale={fontScale} />
          <div style={{ marginTop: pt(8.5, fontScale) }}>
            {certsList.map((cert, idx) => {
              const isStr = typeof cert === "string";
              const nameVal = isStr ? cert : cert.name || cert.title || "Certification Name";
              const issuerVal = isStr ? "" : cert.issuer || cert.organization || "Issuing Organization";
              const dateVal = isStr ? "" : cert.date || "Date";
              const updateCert = (fields: Record<string, any>) => {
                const next = certsList.map((it, i) =>
                  i === idx ? (typeof it === "string" ? { id: `c${idx}`, name: it, ...fields } : { ...it, ...fields }) : it
                );
                patch({ certifications: next });
              };
              return (
                <div
                  key={cert?.id || idx}
                  style={{
                    marginTop: idx === 0 ? "0pt" : pt(8.6, fontScale),
                    fontFamily: F_MERRI,
                    fontSize: fs,
                    lineHeight: lh,
                    color: S4_COLORS.ink,
                    textAlign: "right",
                  }}
                >
                  <InlineEd value={nameVal} editable={editable} onCommit={(v) => updateCert({ name: v })} style={{ fontWeight: 700 }} />
                  <InlineEd value={issuerVal} editable={editable} onCommit={(v) => updateCert({ issuer: v })} />
                  <InlineEd value={dateVal} editable={editable} onCommit={(v) => updateCert({ date: v })} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RIGHT TOP: SUMMARY */}
      {isVisible("summary") && (
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "152.19pt", width: `${rightTextW}pt` }}>
          <S4Heading lines={["SUMMARY"]} fontScale={fontScale} />
          <InlineEd
            value={summaryText}
            editable={editable}
            multiline
            placeholder="Professional summary..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              marginTop: pt(5.2, fontScale),
              fontFamily: F_MERRI,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S4_COLORS.ink,
            }}
          />
        </div>
      )}

      {/* RIGHT BOTTOM: EXPERIENCE */}
      {isVisible("experience") && (
        <div style={{ position: "absolute", left: `${rightX}pt`, top: `${expHeadY}pt`, width: `${rightTextW}pt` }}>
          <S4Heading lines={["EXPERIENCE"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(5.6, fontScale) }}>
            {page1Exp.map((exp, idx) => (
              <S4ExperienceItem
                key={exp.id || `p1-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === page1Exp.length - 1 ? 0 : 17.5}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COVER LETTER (Exact PDF metrics: single-column below contact bar)
// =========================================================================
export function Series4CoverLetter({
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
  const rightEdge = isLetter ? 582.0 : 564.94;
  const bodyW = rightEdge - 33.0;
  const lh = pt(12.2, fontScale);
  const fs = pt(9.0, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });
  const patchCL = (partial: Record<string, any>) =>
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager Name";
  const companyName = cl.companyName || "Company Name";
  const companyAddress = cl.companyAddress || "Company Address";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const paragraphs: string[] =
    Array.isArray(cl.s4Paragraphs) && cl.s4Paragraphs.length > 0
      ? cl.s4Paragraphs
      : S4_COVER_DEFAULTS;

  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName.toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Olivia Anderson");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_MERRI,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S4_COLORS.ink,
    margin: 0,
  };

  return (
    <div className="s4-page" style={{ width: "100%", height: "100%", fontFamily: F_MERRI }}>
      <style dangerouslySetInnerHTML={{ __html: S4_FONT_CSS }} />
      <S4Header
        content={c}
        isLetter={isLetter}
        showContactBar={true}
        showVerticalDivider={false}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <div style={{ position: "absolute", left: "33pt", top: "150.5pt", width: `${bodyW}pt` }}>
        <InlineEd value={dateText} editable={editable} onCommit={(v) => patchCL({ date: v })} style={{ ...bodyStyle, textAlign: "right" }} />

        <div style={{ marginTop: pt(11.3, fontScale) }}>
          <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
          <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
          <InlineEd value={companyAddress} editable={editable} onCommit={(v) => patchCL({ companyAddress: v })} style={bodyStyle} />
        </div>

        <InlineEd value={greeting} editable={editable} onCommit={(v) => patchCL({ greeting: v, salutation: v })} style={{ ...bodyStyle, marginTop: pt(22.6, fontScale) }} />

        {paragraphs.map((p, idx) => (
          <InlineEd
            key={idx}
            value={p}
            editable={editable}
            multiline
            onCommit={(v) => {
              const next = paragraphs.map((it, i) => (i === idx ? v : it));
              patchCL({ s4Paragraphs: next, openingParagraph: next[0], bodyParagraph: next[1], closingParagraph: next[next.length - 1] });
            }}
            style={{ ...bodyStyle, marginTop: pt(idx === 1 ? 2.0 : 11.8, fontScale) }}
          />
        ))}

        <InlineEd value={signOff} editable={editable} onCommit={(v) => patchCL({ signOff: v })} style={{ ...bodyStyle, marginTop: pt(11.3, fontScale) }} />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          className="s4-signature"
          style={{
            marginTop: pt(12.2, fontScale),
            fontFamily: F_SCRIPT,
            fontSize: pt(20.04, fontScale),
            fontWeight: 700,
            lineHeight: pt(22.0, fontScale),
            color: S4_COLORS.ink,
          }}
        />
        <InlineEd value={signatureText} editable={editable} onCommit={(v) => patchCL({ signatureText: v })} style={{ ...bodyStyle, marginTop: pt(2.0, fontScale) }} />
      </div>
    </div>
  );
}

// =========================================================================
// REFERENCES (Exact PDF metrics: single-column CENTERED below contact bar)
// =========================================================================
export function Series4References({
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
  const rightEdge = isLetter ? 582.0 : 565.5;
  const lh = pt(13.02, fontScale);
  const fs = pt(9.0, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });

  const refs: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references.slice(0, 4)
      : [
          { id: "rf1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const next = refs.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  return (
    <div className="s4-page" style={{ width: "100%", height: "100%", fontFamily: F_MERRI }}>
      <style dangerouslySetInnerHTML={{ __html: S4_FONT_CSS }} />
      <S4Header
        content={c}
        isLetter={isLetter}
        showContactBar={true}
        showVerticalDivider={false}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <div style={{ position: "absolute", left: "30pt", top: "152.19pt", width: `${(rightEdge - 30).toFixed(2)}pt`, textAlign: "center" }}>
        <S4Heading lines={["REFERENCES"]} align="center" fontScale={fontScale} />
        <div style={{ marginTop: pt(6.5, fontScale), display: "flex", flexDirection: "column", alignItems: "center", gap: pt(26.0, fontScale) }}>
          {refs.map((ref, idx) => (
            <div key={ref.id || idx} style={{ fontFamily: F_MERRI, fontSize: fs, lineHeight: lh, color: S4_COLORS.ink, textAlign: "center" }}>
              <InlineEd
                value={(ref.name || "FULL NAME HERE").toUpperCase()}
                editable={editable}
                onCommit={(v) => updateRefAt(idx, { name: v })}
                style={{ fontWeight: 700, textTransform: "uppercase" }}
              />
              <InlineEd value={ref.title || ref.role || "Job Title"} editable={editable} onCommit={(v) => updateRefAt(idx, { title: v, role: v })} />
              <InlineEd value={ref.company || ref.organization || "Company or Institution"} editable={editable} onCommit={(v) => updateRefAt(idx, { company: v, organization: v })} />
              <InlineEd value={ref.phone || "(555) 555-5555"} editable={editable} onCommit={(v) => updateRefAt(idx, { phone: v })} />
              <InlineEd value={ref.email || "reference@mail.com"} editable={editable} onCommit={(v) => updateRefAt(idx, { email: v })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}