"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S3_FONT_CSS = `
@font-face {
  font-family: "S3Playfair";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/PlayfairDisplay-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S3Lato";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Lato-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S3Montserrat";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/Montserrat/Montserrat-500-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S3OpenSans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/OpenSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S3OpenSans";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/OpenSans-Bold.ttf") format("truetype");
}
.s3-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s3-page * {
  box-sizing: border-box;
}
.s3-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s3-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s3-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s3-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s3-ed,
  .s3-ed:hover,
  .s3-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 3 (Hard Rule 0)
const S3_COLORS = {
  ink: "#000000",
  profession: "#44546A",
  rule: "#D0CECE",
  page: "#FFFFFF",
} as const;

const F_PLAYFAIR = '"S3Playfair", "Playfair Display", Georgia, serif';
const F_LATO = '"S3Lato", "Lato", Arial, sans-serif';
const F_MONT = '"S3Montserrat", "Montserrat", Arial, sans-serif';
const F_OPEN = '"S3OpenSans", "Open Sans", Arial, sans-serif';
const F_SCRIPT = '"Pacifico", cursive';

// Exact 2-Page Page 2 experience defaults from resume-2p-a4.docx
const S3_2P_P2_EXPERIENCE = [
  {
    id: "s3-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "In this section, highlight recent roles where you consistently leveraged your skills to drive growth, innovation, and positive outcomes within the organization.",
    bullets: [
      "Highlight any recent promotions, expanded responsibilities, or leadership experiences.",
      "Emphasize your involvement in mentoring, cross-functional teamwork, or supporting organizational change.",
      "Provide examples such as leading a project, improving a process, or exceeding targets.",
      "Demonstrate problem-solving, innovation, and adaptability.",
      "Mention new approaches, technologies, or methods you implemented that had measurable impact.",
      "Reflect your continuous learning and ability to adapt to changing environments.",
    ],
  },
  {
    id: "s3-2p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Earlier roles should illustrate the foundation of your expertise and professional values, demonstrating versatile skills and a strong commitment to excellence.",
    bullets: [
      "Summarize foundational positions that built your expertise and professional character.",
      "Combine similar early-career roles for clarity, focusing on transferable skills like teamwork, communication, and reliability.",
      "Reinforce your career journey with a statement about your commitment to growth, excellence, and ongoing contribution.",
    ],
  },
];

const S3_COVER_DEFAULTS = [
  "Use this space to write a personalized introduction to your future employer.",
  "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic.",
  "Start with a strong opening that explains why you\u2019re excited about this position and what makes you a great fit. Be genuine \u2014 share a bit about your motivation, your professional values, or a defining moment in your career that shaped your work style.",
  "In the next paragraph, describe what you\u2019ve accomplished in your field. Focus on the results you\u2019ve achieved and how your contributions made a difference. Use specific examples, but keep it conversational rather than technical.",
  "Then, explain what draws you to [Company Name] \u2014 perhaps their mission, culture, or approach to innovation. Show that you\u2019ve done your research and that you see yourself thriving there.",
  "Finally, close with a forward-looking statement. Express your enthusiasm to discuss the role further and invite them to contact you.",
  "Thank the reader for their time and consideration, expressing enthusiasm to discuss the opportunity further.",
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

  const mergedClass = ["s3-ed", className].filter(Boolean).join(" ");
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

function S3HLine({ x0Pt, x1Pt, yPt }: { x0Pt: number; x1Pt: number; yPt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${x0Pt.toFixed(2)}pt`,
        top: `${yPt.toFixed(2)}pt`,
        width: `${(x1Pt - x0Pt).toFixed(2)}pt`,
        height: 0,
        borderTop: `0.75pt solid ${S3_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S3Heading({
  lines,
  fontScale = 1,
}: {
  lines: string[];
  fontScale?: number;
}) {
  return (
    <div
      style={{
        fontFamily: F_MONT,
        fontSize: pt(13.56, fontScale),
        fontWeight: 500,
        lineHeight: pt(17.2, fontScale),
        letterSpacing: pt(3.6, fontScale),
        color: S3_COLORS.ink,
        textTransform: "uppercase",
      }}
    >
      {lines.map((ln, idx) => (
        <div key={idx}>{ln}</div>
      ))}
    </div>
  );
}

// Identical Header across ALL 10 PDFs: | JAMES SMITH | + YOUR PROFESSION + horizontal & vertical dividers
function S3Header({
  content,
  isLetter,
  fontScale = 1,
  editable = false,
  onPatch,
}: {
  content: any;
  isLetter: boolean;
  fontScale?: number;
  editable?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
  const fullName = (
    content?.fullName ||
    content?.name ||
    content?.personal?.fullName ||
    "JAMES SMITH"
  ).toUpperCase();
  const profession = (
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "YOUR PROFESSION"
  ).toUpperCase();

  const rightEdge = isLetter ? 582.05 : 565.05;
  const vRuleX = isLetter ? 195.75 : 194.1;
  const vRuleEnd = isLetter ? 776.85 : 826.8;

  return (
    <>
      {/* Centered | JAMES SMITH | */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "29.51pt",
          width: `${(rightEdge - 30).toFixed(2)}pt`,
          textAlign: "center",
          fontFamily: F_PLAYFAIR,
          fontSize: pt(fullName.length > 18 ? +(27.96 * Math.max(0.46, Math.min(1, 17 / fullName.length))).toFixed(2) : 27.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(35.0, fontScale),
          letterSpacing: pt(fullName.length > 18 ? +(Math.max(0.8, 7.0 * Math.pow(Math.max(0.46, Math.min(1, 17 / fullName.length)), 2))).toFixed(2) : 7.0, fontScale),
          textTransform: "uppercase",
          whiteSpace: fullName.length > 44 ? "normal" : "nowrap",
        }}
      >
        <span style={{ color: S3_COLORS.rule }}>|</span>
        <InlineEd
          inline
          value={fullName}
          editable={editable}
          placeholder="JAMES SMITH"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{ color: S3_COLORS.ink, paddingLeft: pt(4.0, fontScale), paddingRight: pt(4.0, fontScale) }}
        />
        <span style={{ color: S3_COLORS.rule, letterSpacing: 0 }}>|</span>
      </div>

      {/* Centered Profession */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "78.78pt",
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
            fontFamily: F_LATO,
            fontSize: pt(profession.length > 42 ? 9.5 : 12.0, fontScale),
            fontWeight: 400,
            lineHeight: pt(profession.length > 42 ? 12.5 : 15.0, fontScale),
            letterSpacing: pt(profession.length > 42 ? 1.0 : 2.3, fontScale),
            paddingLeft: pt(profession.length > 42 ? 1.0 : 2.3, fontScale),
            color: S3_COLORS.profession,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        />
      </div>

      {/* Horizontal header divider */}
      <S3HLine x0Pt={30.0} x1Pt={rightEdge} yPt={isLetter ? 113.1 : 112.95} />

      {/* Vertical column divider */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${vRuleX}pt`,
          top: "120.9pt",
          width: 0,
          height: `${(vRuleEnd - 120.9).toFixed(2)}pt`,
          borderLeft: `0.75pt solid ${S3_COLORS.rule}`,
        }}
      />
    </>
  );
}

// Exact tight-cropped PDF contact icons (#A6A6A6) at exact PDF dimensions
const S3_ICON_SIZES: Record<"phone" | "email" | "linkedin" | "location", { w: string; h: string }> = {
  phone: { w: "9.6pt", h: "14.4pt" },
  email: { w: "13.6pt", h: "8.8pt" },
  linkedin: { w: "13.5pt", h: "13.5pt" },
  location: { w: "10.2pt", h: "13.6pt" },
};

function S3ContactSidebar({
  content,
  isLetter,
  fontScale = 1,
  editable = false,
  onPatch,
}: {
  content: any;
  isLetter: boolean;
  fontScale?: number;
  editable?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
  const leftX = isLetter ? 34.4 : 33.0;
  const phone = content?.phone ?? content?.personal?.phone ?? "(555) 555-5555";
  const email = content?.email ?? content?.personal?.email ?? "youremail@mail.com";
  const linkedin = content?.linkedin ?? content?.personal?.linkedin ?? "Linkedin.com/name";
  const location = content?.location ?? content?.personal?.location ?? "City, State/Province";

  const rows: Array<{
    key: "phone" | "email" | "linkedin" | "location";
    val: string;
    ph: string;
    yPt: number;
  }> = [
    { key: "phone", val: phone, ph: "(555) 555-5555", yPt: 150.29 },
    { key: "email", val: email, ph: "youremail@mail.com", yPt: 178.73 },
    { key: "linkedin", val: linkedin, ph: "Linkedin.com/name", yPt: 207.17 },
    { key: "location", val: location, ph: "City, State/Province", yPt: 235.49 },
  ];

  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <>
      <div style={{ position: "absolute", left: `${leftX}pt`, top: "124.89pt", width: "144pt" }}>
        <S3Heading lines={["CONTACT"]} fontScale={fontScale} />
      </div>

      {rows.map((row) => {
        const sz = S3_ICON_SIZES[row.key];
        return (
          <div
            key={row.key}
            style={{
              position: "absolute",
              left: `${leftX}pt`,
              top: `${row.yPt}pt`,
              width: "152pt",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "27.4pt",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <img
                src={`/templates/3/icon-${row.key}.png`}
                alt={row.key}
                style={{
                  width: sz.w,
                  height: sz.h,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
            <InlineEd
              value={row.val}
              editable={editable}
              placeholder={row.ph}
              onCommit={(v) => onPatch?.({ [row.key]: v } as Partial<ResumeContent>)}
              style={{
                flex: 1,
                fontFamily: F_OPEN,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                color: S3_COLORS.ink,
                wordBreak: "break-word",
              }}
            />
          </div>
        );
      })}
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

function S3ExperienceItem({
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
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10pt",
          fontFamily: F_OPEN,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S3_COLORS.ink,
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
          fontFamily: F_OPEN,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S3_COLORS.ink,
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
            fontFamily: F_OPEN,
            fontSize: fs,
            fontWeight: 400,
            lineHeight: lh,
            color: S3_COLORS.ink,
          }}
        />
      )}

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_OPEN}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S3_COLORS.ink}
          marginTop={pt(8.1, fontScale)}
          markerSizePt={10.5 * fontScale}
        />
      )}
    </div>
  );
}

function S3CoursesBlock({
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
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div>
      {courses.map((crs, idx) => (
        <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(8.2, fontScale) }}>
          <InlineEd
            value={crs.title || crs.name || "COURSE / WORKSHOP / CLASS"}
            editable={editable}
            onCommit={(v) => {
              const next = courses.map((it, i) => (i === idx ? { ...it, title: v, name: v } : it));
              onPatchCourses(next);
            }}
            style={{
              fontFamily: F_OPEN,
              fontSize: fs,
              fontWeight: 700,
              lineHeight: lh,
              color: S3_COLORS.ink,
            }}
          />
          <InlineEd
            value={crs.institution || crs.provider || "UNIVERSITY / COMPANY / PLATFORM / LOCATION"}
            editable={editable}
            onCommit={(v) => {
              const next = courses.map((it, i) => (i === idx ? { ...it, institution: v } : it));
              onPatchCourses(next);
            }}
            style={{
              fontFamily: F_OPEN,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S3_COLORS.ink,
            }}
          />
          <InlineEd
            value={(crs.date || "DATE").toUpperCase()}
            editable={editable}
            onCommit={(v) => {
              const next = courses.map((it, i) => (i === idx ? { ...it, date: v } : it));
              onPatchCourses(next);
            }}
            style={{
              fontFamily: F_OPEN,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S3_COLORS.ink,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function s3EstimateExpLines(exps: any[]): number {
  return exps.reduce((sum, e) => {
    const bs = Array.isArray(e?.bullets) ? e.bullets : [];
    const bulletLines = bs.reduce((acc: number, b: any) => {
      const len = String(b || "").trim().length;
      return acc + Math.max(1, Math.ceil(len / 64)) + 0.32;
    }, 0);
    return sum + 2.8 + bulletLines;
  }, 0);
}

export function Series3Exact({
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
  const leftX = isLetter ? 34.4 : 33.0;
  const rightX = 216.65;
  const rightEdge = isLetter ? 580.0 : 564.8;
  const rightTextW = rightEdge - rightX;
  const lh = pt(13.62, fontScale);
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

  const is3P = totalPages >= 3;
  const is2P = totalPages === 2;

  const rawExp: any[] = Array.isArray(c.experience) ? c.experience : [];
  const isDefault3PJob4 =
    rawExp.length >= 5 &&
    (rawExp[3]?.summaryParagraph || "").startsWith("As you expand your experience section");
  const effectiveExp =
    is2P && isDefault3PJob4
      ? [...rawExp.slice(0, 3), ...S3_2P_P2_EXPERIENCE]
      : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses.slice(0, 3)
      : [
          { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
        ];

  // =========================================================================
  // PAGE 3 (3P: References left | Jobs 7-8 & Prof Dev right)
  // =========================================================================
  const p1LineBudget = isLetter ? 31 : 36;
  const p1ThreeLines = s3EstimateExpLines(effectiveExp.slice(0, 3));
  const hasNextPage = is3P || (style?.pageCount ?? 1) >= 2;
  const p1Count = hasNextPage && effectiveExp.length >= 3 && p1ThreeLines > p1LineBudget ? 2 : 3;
  const p2End = p1Count + (is3P ? 3 : 2);
  if (pageIndex >= 2) {
    const devRuleY = isLetter ? 579.45 : 616.8;
    const devHeadY = isLetter ? 592.61 : 629.81;
    const p3Exp = effectiveExp.slice(p2End, p2End + 2);

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
      <div className="s3-page" style={{ width: "100%", height: "100%", fontFamily: F_OPEN }}>
        <style dangerouslySetInnerHTML={{ __html: S3_FONT_CSS }} />
        <S3Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        <S3HLine x0Pt={215.0} x1Pt={isLetter ? 582.0 : 565.05} yPt={devRuleY} />

        {/* LEFT: REFERENCES */}
        <div style={{ position: "absolute", left: `${leftX}pt`, top: "124.41pt", width: "152pt" }}>
          <S3Heading lines={["REFERENCES"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.6, fontScale), display: "flex", flexDirection: "column", gap: pt(27.2, fontScale) }}>
            {refsList.map((ref, idx) => (
              <div key={ref.id || idx} style={{ fontFamily: F_OPEN, fontSize: fs, lineHeight: lh, color: S3_COLORS.ink }}>
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
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "124.41pt", width: `${rightTextW}pt` }}>
          <S3Heading lines={["EXPERIENCE CONTINUED"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.8, fontScale) }}>
            {p3Exp.map((exp, idx) => (
              <S3ExperienceItem
                key={exp.id || `p3-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p3Exp.length - 1 ? 0 : 19.2}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + p2End, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM: PROFESSIONAL DEVELOPMENT */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
          <S3Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.5, fontScale) }}>
            <S3CoursesBlock
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
  // PAGE 2 (Left: Achievement, Community Involvement | Right: 2P -> 2 jobs + Dev, 3P -> 3 jobs)
  // =========================================================================
  if (pageIndex === 1) {
    const commRuleY = isLetter ? 445.78 : 452.68;
    const commHeadY = isLetter ? 457.22 : 465.62;
    const devRuleY = isLetter ? 580.22 : 616.96;
    const devHeadY = isLetter ? 592.97 : 629.81;
    const p2Exp = effectiveExp.slice(p1Count, p2End);

    const awardsList: any[] =
      Array.isArray(c.awards) && c.awards.length > 0
        ? c.awards.slice(0, 4)
        : [
            { id: "aw1", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
            { id: "aw2", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
            { id: "aw3", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
            { id: "aw4", title: "AWARD/ACHIEVEMENT", issuer: "Organization Name", date: "Date" },
          ];

    const volunteerList: any[] =
      Array.isArray(c.volunteering) && c.volunteering.length > 0
        ? c.volunteering.slice(0, 4)
        : [
            { id: "vl1", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
            { id: "vl2", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
            { id: "vl3", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
            { id: "vl4", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
          ];

    return (
      <div className="s3-page" style={{ width: "100%", height: "100%", fontFamily: F_OPEN }}>
        <style dangerouslySetInnerHTML={{ __html: S3_FONT_CSS }} />
        <S3Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        <S3HLine x0Pt={30.0} x1Pt={isLetter ? 175.5 : 174.0} yPt={commRuleY} />
        {!is3P && <S3HLine x0Pt={216.0} x1Pt={isLetter ? 582.0 : 566.85} yPt={devRuleY} />}

        {/* LEFT TOP: ACHIEVEMENT */}
        <div style={{ position: "absolute", left: `${leftX}pt`, top: "124.53pt", width: "145pt" }}>
          <S3Heading lines={["ACHIEVEMENT"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.4, fontScale) }}>
            {awardsList.map((aw, idx) => (
              <div
                key={aw.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale),
                  fontFamily: F_OPEN,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S3_COLORS.ink,
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

        {/* LEFT BOTTOM: COMMUNITY INVOLVEMENT */}
        <div style={{ position: "absolute", left: `${leftX}pt`, top: `${commHeadY}pt`, width: "145pt" }}>
          <S3Heading lines={["COMMUNITY", "INVOLVEMENT"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.2, fontScale) }}>
            {volunteerList.map((vol, idx) => (
              <div
                key={vol.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale),
                  fontFamily: F_OPEN,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S3_COLORS.ink,
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
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "124.89pt", width: `${rightTextW}pt` }}>
          <S3Heading lines={["EXPERIENCE CONTINUED"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(6.5, fontScale) }}>
            {p2Exp.map((exp, idx) => (
              <S3ExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p2Exp.length - 1 ? 0 : 19.2}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + p1Count, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM (2P only): PROFESSIONAL DEVELOPMENT */}
        {!is3P && (
          <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
            <S3Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
            <div style={{ marginTop: pt(7.5, fontScale) }}>
              <S3CoursesBlock
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
  const eduRuleY = isLetter ? 581.17 : 600.64;
  const eduHeadY = isLetter ? 592.73 : 613.01;
  const page1Exp = effectiveExp.slice(0, p1Count);
  const p1ActualLines = s3EstimateExpLines(page1Exp);
  const p1CompactRatio = p1ActualLines > p1LineBudget ? Math.max(0.72, Math.min(1, p1LineBudget / p1ActualLines)) : 1;
  const p1ExpFontScale = +(fontScale * p1CompactRatio).toFixed(4);
  const p1ExpGapPt = p1CompactRatio < 1 ? +(19.2 * p1CompactRatio * 0.55).toFixed(2) : 19.2;

  const summaryText =
    (c.summary || "").trim() ||
    "This section is dedicated to showcasing your most impactful skills and accomplishments. The emphasis is on demonstrating the concrete value you bring and how your contributions will directly support the organization's objectives.";

  const skillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : [
          "Project Management",
          "Team Leadership",
          "Process Optimization",
          "Stakeholder Engagement",
          "Data Analysis",
          "Onboarding & Training",
          "Problem-Solving",
          "Team Coordination",
          "Workflow Automation",
          "Time Management",
          "Documentation",
          "Adaptability",
        ];

  const eduList: any[] =
    Array.isArray(c.education) && c.education.length > 0
      ? c.education.slice(0, 3)
      : [
          { id: "ed1", degree: "DEGREE TITLE", school: "University Name - Location", date: "Graduation Year" },
          { id: "ed2", degree: "DEGREE TITLE", school: "University Name - Location", date: "Graduation Year" },
          { id: "ed3", degree: "DEGREE TITLE", school: "University Name - Location", date: "Graduation Year" },
        ];

  return (
    <div className="s3-page" style={{ width: "100%", height: "100%", fontFamily: F_OPEN }}>
      <style dangerouslySetInnerHTML={{ __html: S3_FONT_CSS }} />
      <S3Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

      {/* Section divider rules */}
      <S3HLine x0Pt={30.0} x1Pt={isLetter ? 175.5 : 173.85} yPt={274.71} />
      <S3HLine x0Pt={214.5} x1Pt={isLetter ? 582.0 : 565.05} yPt={274.71} />
      <S3HLine x0Pt={30.0} x1Pt={isLetter ? 175.5 : 174.0} yPt={eduRuleY} />

      {/* LEFT TOP: CONTACT */}
      <S3ContactSidebar content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

      {/* LEFT MIDDLE: SKILLS */}
      {isVisible("skills") && (
        <div style={{ position: "absolute", left: `${leftX}pt`, top: "286.92pt", width: "145pt" }}>
          <S3Heading lines={["SKILLS"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.1, fontScale) }}>
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
                  fontFamily: F_OPEN,
                  fontSize: fs,
                  fontWeight: 400,
                  lineHeight: lh,
                  marginTop: idx === 0 ? "0pt" : pt(8.2, fontScale),
                  color: S3_COLORS.ink,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* LEFT BOTTOM: EDUCATION */}
      {isVisible("education") && (
        <div style={{ position: "absolute", left: `${leftX}pt`, top: `${eduHeadY}pt`, width: "145pt" }}>
          <S3Heading lines={["EDUCATION"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.4, fontScale) }}>
            {eduList.map((ed, idx) => (
              <div
                key={ed.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.2, fontScale),
                  fontFamily: F_OPEN,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S3_COLORS.ink,
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
                  value={ed.school || "University Name - Location"}
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

      {/* RIGHT TOP: SUMMARY */}
      {isVisible("summary") && (
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "124.65pt", width: `${rightTextW}pt` }}>
          <S3Heading lines={["SUMMARY"]} fontScale={fontScale} />
          <InlineEd
            value={summaryText}
            editable={editable}
            multiline
            placeholder="Professional summary..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              marginTop: pt(8.2, fontScale),
              fontFamily: F_OPEN,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S3_COLORS.ink,
            }}
          />
        </div>
      )}

      {/* RIGHT BOTTOM: EXPERIENCE */}
      {isVisible("experience") && (
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "286.92pt", width: `${rightTextW}pt` }}>
          <S3Heading lines={["EXPERIENCE"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.0, fontScale) }}>
            {page1Exp.map((exp, idx) => (
              <S3ExperienceItem
                key={exp.id || `p1-exp-${idx}`}
                exp={exp}
                fontScale={p1ExpFontScale}
                marginBottomPt={idx === page1Exp.length - 1 ? 0 : p1ExpGapPt}
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
// COVER LETTER (Exact PDF metrics from cover-a4.pdf & cover-letter.pdf)
// =========================================================================
export function Series3CoverLetter({
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
  const rightX = isLetter ? 216.77 : 215.21;
  const rightEdge = isLetter ? 580.0 : 563.5;
  const rightTextW = rightEdge - rightX;
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });
  const patchCL = (partial: Record<string, any>) =>
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager Name";
  const companyName = cl.companyName || "Company Name";
  const companyAddress = cl.companyAddress || "Company Address";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const paragraphs: string[] =
    Array.isArray(cl.s3Paragraphs) && cl.s3Paragraphs.length > 0
      ? cl.s3Paragraphs
      : S3_COVER_DEFAULTS;

  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName.toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "James Smith");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_OPEN,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S3_COLORS.ink,
    margin: 0,
  };

  return (
    <div className="s3-page" style={{ width: "100%", height: "100%", fontFamily: F_OPEN }}>
      <style dangerouslySetInnerHTML={{ __html: S3_FONT_CSS }} />
      <S3Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />
      <S3ContactSidebar content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: `${rightX}pt`, top: "124.85pt", width: `${rightTextW}pt` }}>
        <InlineEd value={dateText} editable={editable} onCommit={(v) => patchCL({ date: v })} style={{ ...bodyStyle, textAlign: "right" }} />

        <div style={{ marginTop: pt(13.62, fontScale) }}>
          <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
          <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
          <InlineEd value={companyAddress} editable={editable} onCommit={(v) => patchCL({ companyAddress: v })} style={bodyStyle} />
        </div>

        <InlineEd value={greeting} editable={editable} onCommit={(v) => patchCL({ greeting: v, salutation: v })} style={{ ...bodyStyle, marginTop: pt(27.24, fontScale) }} />

        {paragraphs.map((p, idx) => (
          <InlineEd
            key={idx}
            value={p}
            editable={editable}
            multiline
            onCommit={(v) => {
              const next = paragraphs.map((it, i) => (i === idx ? v : it));
              patchCL({ s3Paragraphs: next, openingParagraph: next[0], bodyParagraph: next[1], closingParagraph: next[next.length - 1] });
            }}
            style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }}
          />
        ))}

        <InlineEd value={signOff} editable={editable} onCommit={(v) => patchCL({ signOff: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          style={{
            marginTop: pt(13.62, fontScale),
            fontFamily: F_SCRIPT,
            fontSize: pt(20.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(28.0, fontScale),
            color: S3_COLORS.ink,
          }}
        />
        <InlineEd value={signatureText} editable={editable} onCommit={(v) => patchCL({ signatureText: v })} style={{ ...bodyStyle, marginTop: pt(7.2, fontScale) }} />
      </div>
    </div>
  );
}

// =========================================================================
// REFERENCES (Exact PDF metrics from references-a4.pdf & references-letter.pdf)
// =========================================================================
export function Series3References({
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
  const rightX = 216.77;
  const rightEdge = isLetter ? 580.0 : 565.0;
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

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
    <div className="s3-page" style={{ width: "100%", height: "100%", fontFamily: F_OPEN }}>
      <style dangerouslySetInnerHTML={{ __html: S3_FONT_CSS }} />
      <S3Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />
      <S3ContactSidebar content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: `${rightX}pt`, top: "124.89pt", width: `${(rightEdge - rightX).toFixed(2)}pt` }}>
        <S3Heading lines={["REFERENCES"]} fontScale={fontScale} />
        <div style={{ marginTop: pt(8.1, fontScale), display: "flex", flexDirection: "column", gap: pt(27.24, fontScale) }}>
          {refs.map((ref, idx) => (
            <div key={ref.id || idx} style={{ fontFamily: F_OPEN, fontSize: fs, lineHeight: lh, color: S3_COLORS.ink }}>
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