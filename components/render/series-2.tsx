"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList, BulletStylesOnce } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S2_FONT_CSS = `
@font-face {
  font-family: "S2LibreBaskerville";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/LibreBaskerville/LibreBaskerville-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S2Manrope";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Manrope-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S2Lato";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Lato-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S2Rubik";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Rubik/Rubik-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S2Rubik";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Rubik/Rubik-700-normal.ttf") format("truetype");
}
.s2-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s2-page * {
  box-sizing: border-box;
}
.s2-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s2-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s2-ed:hover {
  background-color: rgba(31, 60, 136, 0.08);
  box-shadow: 0 0 0 1px rgba(31, 60, 136, 0.35);
}
.s2-ed:focus {
  outline: none;
  background-color: rgba(31, 60, 136, 0.06);
  box-shadow: 0 0 0 1.5px #1F3C88;
}
.s2-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s2-ed,
  .s2-ed:hover,
  .s2-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 2 (Hard Rule 0)
const S2_COLORS = {
  ink: "#000000",
  topBar: "#002060",
  accent: "#1F3C88",
  profession: "#44546A",
  rule: "#DDE0F7",
  page: "#FFFFFF",
} as const;

const F_BASK = '"S2LibreBaskerville", "Libre Baskerville", Georgia, serif';
const F_MANROPE = '"S2Manrope", "Manrope", Arial, sans-serif';
const F_LATO = '"S2Lato", "Lato", Arial, sans-serif';
const F_RUBIK = '"S2Rubik", "Rubik", Arial, sans-serif';
const F_SCRIPT = '"Lumanosimo", cursive';

// Exact 2-Page Page 2 experience defaults (2 jobs) from resume-2p-a4.docx
const S2_2P_P2_EXPERIENCE = [
  {
    id: "s2-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Open with a short statement about how you successfully handled change, transitions, or uncertain situations while keeping results strong.",
    bullets: [
      "Explain how you quickly adapted to new tools, policies, or ways of working and helped others do the same.",
      "Give an example of guiding your team through a difficult transition while maintaining focus and morale.",
      "Describe how you maintained consistent results despite shifting priorities or limited resources.",
      "Mention how you kept communication open and addressed concerns during periods of change.",
    ],
  },
  {
    id: "s2-2p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Start with a short statement about your creativity, commitment to learning, and contribution to continuous improvement.",
    bullets: [
      "Provide an example of an innovative idea or process improvement you implemented and the measurable impact it had.",
      "Note how you actively built new skills through courses, workshops, projects, or mentorship and applied them.",
      "Describe how you spotted and acted on new opportunities that improved performance or created growth.",
    ],
  },
];

const S2_COVER_DEFAULTS = {
  intro1:
    "Opening paragraph: Capture attention. Explain why this role excites you and how your background makes you a strong fit. Be confident, personal, and genuine.",
  intro2:
    "Share why this specific role and company excite you. Connect your experience to their needs and show genuine interest.",
  p1: "I\u2019ve always been driven by curiosity and the desire to create meaningful results. The role of [Job Title] at [Company Name] feels like a natural next step that aligns with my passion for growth and delivering measurable impact.",
  bodyIntro:
    "Body paragraph: Highlight 3\u20135 strong results with numbers or clear outcomes that prove your value.",
  highlightsIntro: "Key accomplishments include:",
  bullets: [
    "Consistently exceeded sales targets by up to 35% year-over-year",
    "Guided cross-functional teams to deliver strategic client solutions",
    "Developed and implemented a new onboarding program that increased retention by 20%",
    "Built strong client partnerships resulting in long-term contracts",
  ],
  close1:
    "Closing paragraph: Focus on what you will bring to the company. Emphasize your strengths, mindset, and unique contribution.",
  close2: "End with a confident call to action and your contact details.",
  close3:
    "I believe success comes from listening deeply and acting decisively. I\u2019m confident my mix of strategy, creativity, and leadership can make an immediate impact at [Company Name].",
  close4:
    "I\u2019d love to discuss how my experience can support your team\u2019s success. Reach me at youremail@mail.com or (555)-555-5555.",
};

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

  const mergedClass = ["s2-ed", className].filter(Boolean).join(" ");
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

// Exact extracted Word vector SVG contact badges (19pt x 19pt)
function S2ContactBadge({ kind }: { kind: "phone" | "email" | "linkedin" | "location" }) {
  return (
    <img
      src={`/templates/2/icon-${kind}.png`}
      alt={kind}
      style={{
        width: "19.6pt",
        height: "19.6pt",
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

function S2Heading({
  lines,
  continued = false,
  fontScale = 1,
}: {
  lines: string[];
  continued?: boolean;
  fontScale?: number;
}) {
  return (
    <div
      style={{
        fontFamily: F_LATO,
        fontSize: pt(12.96, fontScale),
        fontWeight: 400,
        lineHeight: pt(18.7, fontScale),
        letterSpacing: pt(2.5, fontScale),
        color: S2_COLORS.accent,
        textTransform: "uppercase",
      }}
    >
      {lines.map((ln, idx) => (
        <div key={idx}>
          <span>{ln}</span>
          {continued && idx === lines.length - 1 && (
            <span
              style={{
                fontFamily: F_LATO,
                fontSize: pt(9.96, fontScale),
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: pt(1.95, fontScale),
                textTransform: "none",
                marginLeft: pt(5, fontScale),
              }}
            >
              Continued
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Identical Header across ALL 10 PDFs (1P, 2P P1-P2, 3P P1-P3, Cover, References)
function S2Header({
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
    "JENNIFER DAVIS"
  ).toUpperCase();
  const profession = (
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "YOUR PROFESSION"
  ).toUpperCase();

  const rightEdge = isLetter ? 582.0 : 564.2;
  const vRuleX = isLetter ? 195.75 : 194.1;
  const vRuleEnd = isLetter ? 777.0 : 827.25;

  return (
    <>
      {/* Top solid navy bar (#002060, 11.25pt) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "11.25pt",
          backgroundColor: S2_COLORS.topBar,
        }}
      />

      {/* Centered Name */}
      <div
        style={{
          position: "absolute",
          left: "29.9pt",
          top: "33.06pt",
          width: `${(rightEdge - 29.9).toFixed(2)}pt`,
          textAlign: "center",
        }}
      >
        <InlineEd
          value={fullName}
          editable={editable}
          placeholder="JENNIFER DAVIS"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{
            fontFamily: F_BASK,
            fontSize: pt(fullName.length > 22 ? +(26.04 * Math.max(0.52, Math.min(1, 21 / fullName.length))).toFixed(2) : 26.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(33.0, fontScale),
            letterSpacing: pt(fullName.length > 22 ? +(Math.max(1.0, 6.5 * Math.pow(Math.max(0.52, Math.min(1, 21 / fullName.length)), 2))).toFixed(2) : 6.5, fontScale),
            paddingLeft: pt(fullName.length > 22 ? +(Math.max(1.0, 6.5 * Math.pow(Math.max(0.52, Math.min(1, 21 / fullName.length)), 2))).toFixed(2) : 6.5, fontScale),
            color: S2_COLORS.ink,
            textTransform: "uppercase",
            textAlign: "center",
            whiteSpace: fullName.length > 44 ? "normal" : "nowrap",
          }}
        />
      </div>

      {/* Centered Profession */}
      <div
        style={{
          position: "absolute",
          left: "29.9pt",
          top: "81.31pt",
          width: `${(rightEdge - 29.9).toFixed(2)}pt`,
          textAlign: "center",
        }}
      >
        <InlineEd
          value={profession}
          editable={editable}
          placeholder="YOUR PROFESSION"
          onCommit={(v) => onPatch?.({ profession: v })}
          style={{
            fontFamily: F_MANROPE,
            fontSize: pt(profession.length > 42 ? 9.5 : 12.0, fontScale),
            fontWeight: 400,
            lineHeight: pt(profession.length > 42 ? 12.5 : 16.0, fontScale),
            letterSpacing: pt(profession.length > 42 ? 1.2 : 3.0, fontScale),
            paddingLeft: pt(profession.length > 42 ? 1.2 : 3.0, fontScale),
            color: S2_COLORS.profession,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        />
      </div>

      {/* Horizontal divider (#DDE0F7, 1.25pt) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "29.9pt",
          top: "114.75pt",
          width: `${(rightEdge - 29.9).toFixed(2)}pt`,
          height: 0,
          borderTop: `1.25pt solid ${S2_COLORS.rule}`,
        }}
      />

      {/* Vertical column divider (#DDE0F7, 1.25pt) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${vRuleX}pt`,
          top: "122.25pt",
          width: 0,
          height: `${(vRuleEnd - 122.25).toFixed(2)}pt`,
          borderLeft: `1.25pt solid ${S2_COLORS.rule}`,
        }}
      />
    </>
  );
}

function S2ContactBlock({
  content,
  fontScale = 1,
  editable = false,
  inFlow = false,
  onPatch,
}: {
  content: any;
  fontScale?: number;
  editable?: boolean;
  inFlow?: boolean;
  onPatch?: (patch: Partial<ResumeContent>) => void;
}) {
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
    { key: "phone", val: phone, ph: "(555) 555-5555", yPt: 122.8 },
    { key: "email", val: email, ph: "youremail@mail.com", yPt: 149.4 },
    { key: "linkedin", val: linkedin, ph: "Linkedin.com/name", yPt: 175.0 },
    { key: "location", val: location, ph: "City, State/Province", yPt: 199.0 },
  ];

  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div
      style={
        inFlow
          ? {
              width: "156pt",
              display: "flex",
              flexDirection: "column",
              gap: "6.2pt",
            }
          : {
              position: "absolute",
              left: "31.3pt",
              top: "122.8pt",
              width: "156pt",
              display: "flex",
              flexDirection: "column",
              gap: "6.2pt",
            }
      }
    >
      {rows.map((row) => (
        <div
          key={row.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10.5pt",
          }}
        >
          <S2ContactBadge kind={row.key} />
          <InlineEd
            value={row.val}
            editable={editable}
            placeholder={row.ph}
            onCommit={(v) => onPatch?.({ [row.key]: v } as Partial<ResumeContent>)}
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: F_RUBIK,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S2_COLORS.ink,
              overflowWrap: "anywhere",
            }}
          />
        </div>
      ))}
    </div>
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

function S2ExperienceItem({
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
          fontFamily: F_RUBIK,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S2_COLORS.ink,
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
          fontFamily: F_RUBIK,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S2_COLORS.ink,
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
            fontFamily: F_RUBIK,
            fontSize: fs,
            fontWeight: 400,
            lineHeight: lh,
            color: S2_COLORS.ink,
          }}
        />
      )}

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_RUBIK}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S2_COLORS.ink}
          marginTop={pt(8.1, fontScale)}
          markerSizePt={10.5 * fontScale}
        />
      )}
    </div>
  );
}

function S2CoursesBlock({
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "10pt",
              fontFamily: F_RUBIK,
              fontSize: fs,
              fontWeight: 700,
              lineHeight: lh,
              color: S2_COLORS.ink,
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
              fontFamily: F_RUBIK,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S2_COLORS.ink,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function Series2Exact({
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
  const rightX = isLetter ? 208.01 : 207.05;
  const rightEdge = isLetter ? 582.8 : 566.36;
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
  // In 2-Page mode, if user hasn't customized Page 2 jobs, use exact 2P Word jobs
  const isDefault3PJob4 =
    rawExp.length >= 5 &&
    (rawExp[3]?.summaryParagraph || "").includes("multiple projects, or fast-paced environments");
  const effectiveExp =
    is2P && isDefault3PJob4
      ? [...rawExp.slice(0, 3), ...S2_2P_P2_EXPERIENCE]
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
  // PAGE 3 (3P: Memberships & References left | Jobs 7-8 & Prof Dev right)
  // =========================================================================
  if (pageIndex >= 2) {
    const refHeadY = isLetter ? 365.5 : 389.62;
    const devHeadY = isLetter ? 595.95 : 645.87;
    const p3Exp = effectiveExp.slice(6, 8);

    const membershipsList: any[] =
      Array.isArray(c.memberships) && c.memberships.length > 0
        ? c.memberships.slice(0, 3)
        : [
            { id: "mb1", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
            { id: "mb2", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
            { id: "mb3", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
          ];

    const refsList: any[] =
      Array.isArray(c.references) && c.references.length > 0
        ? c.references.slice(0, 4)
        : [
            { id: "rf1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
            { id: "rf4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          ];

    return (
      <div className="s2-page" style={{ width: "100%", height: "100%", fontFamily: F_RUBIK }}>
        <style dangerouslySetInnerHTML={{ __html: S2_FONT_CSS }} />
        <S2Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* LEFT TOP: MEMBERSHIPS */}
        <div style={{ position: "absolute", left: "32.16pt", top: "126.19pt", width: "152pt" }}>
          <S2Heading lines={["MEMBERSHIPS"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.0, fontScale) }}>
            {membershipsList.map((m, idx) => (
              <div
                key={m.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale),
                  fontFamily: F_RUBIK,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S2_COLORS.ink,
                }}
              >
                <InlineEd
                  value={(m.organization || "NAME OF ORGANIZATION").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = membershipsList.map((it, i) => (i === idx ? { ...it, organization: v } : it));
                    patch({ memberships: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={m.role || "Your Role"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = membershipsList.map((it, i) => (i === idx ? { ...it, role: v } : it));
                    patch({ memberships: next });
                  }}
                />
                <InlineEd
                  value={m.description || "Description or Location"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = membershipsList.map((it, i) => (i === idx ? { ...it, description: v } : it));
                    patch({ memberships: next });
                  }}
                />
                <InlineEd
                  value={m.date || m.period || "Date Range"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = membershipsList.map((it, i) => (i === idx ? { ...it, date: v, period: v } : it));
                    patch({ memberships: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* LEFT BOTTOM: REFERENCES */}
        <div style={{ position: "absolute", left: "32.16pt", top: `${refHeadY}pt`, width: "152pt" }}>
          <S2Heading lines={["REFERENCES"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(6.5, fontScale) }}>
            {refsList.map((ref, idx) => (
              <div
                key={ref.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(27.2, fontScale),
                  fontFamily: F_RUBIK,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S2_COLORS.ink,
                }}
              >
                <InlineEd
                  value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
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

        {/* RIGHT TOP: PROFESSIONAL EXPERIENCE Continued */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.19pt", width: `${rightTextW}pt` }}>
          <S2Heading lines={["PROFESSIONAL EXPERIENCE"]} continued fontScale={fontScale} />
          <div style={{ marginTop: pt(6.6, fontScale) }}>
            {p3Exp.map((exp, idx) => (
              <S2ExperienceItem
                key={exp.id || `p3-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p3Exp.length - 1 ? 0 : 28.0}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 6, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM: PROFESSIONAL DEVELOPMENT */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
          <S2Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(7.2, fontScale) }}>
            <S2CoursesBlock
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
  // PAGE 2 (Left: Achievements & Awards, Volunteer Experience)
  // Right: 2P -> 2 jobs + Prof Dev | 3P -> 3 jobs
  // =========================================================================
  if (pageIndex === 1) {
    const volHeadY = isLetter ? 468.72 : 501.96;
    const devHeadY = isLetter ? 596.55 : 646.35;
    const p2Exp = is3P ? effectiveExp.slice(3, 6) : effectiveExp.slice(3, 5);

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
            { id: "vl1", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
            { id: "vl2", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
            { id: "vl3", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
            { id: "vl4", organization: "NAME OF ORGANIZATION", role: "Your Role", description: "Description or Location", date: "Date Range" },
          ];

    return (
      <div className="s2-page" style={{ width: "100%", height: "100%", fontFamily: F_RUBIK }}>
        <style dangerouslySetInnerHTML={{ __html: S2_FONT_CSS }} />
        <S2Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* LEFT TOP: ACHIEVEMENTS & AWARDS */}
        <div style={{ position: "absolute", left: "32.16pt", top: "126.19pt", width: "152pt" }}>
          <S2Heading lines={["ACHIEVEMENTS", "& AWARDS"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(8.2, fontScale) }}>
            {awardsList.map((aw, idx) => (
              <div
                key={aw.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.2, fontScale),
                  fontFamily: F_RUBIK,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S2_COLORS.ink,
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

        {/* LEFT BOTTOM: VOLUNTEER EXPERIENCE */}
        <div style={{ position: "absolute", left: "32.16pt", top: `${volHeadY}pt`, width: "152pt" }}>
          <S2Heading lines={["VOLUNTEER", "EXPERIENCE"]} fontScale={fontScale} />
          <div style={{ marginTop: pt(5.5, fontScale) }}>
            {volunteerList.map((vol, idx) => (
              <div
                key={vol.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8.1, fontScale),
                  fontFamily: F_RUBIK,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S2_COLORS.ink,
                }}
              >
                <InlineEd
                  value={(vol.organization || "NAME OF ORGANIZATION").toUpperCase()}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, organization: v } : it));
                    patch({ volunteering: next });
                  }}
                  style={{ fontWeight: 700, textTransform: "uppercase" }}
                />
                <InlineEd
                  value={vol.role || "Your Role"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, role: v } : it));
                    patch({ volunteering: next });
                  }}
                />
                <InlineEd
                  value={vol.description || "Description or Location"}
                  editable={editable}
                  onCommit={(v) => {
                    const next = volunteerList.map((it, i) => (i === idx ? { ...it, description: v } : it));
                    patch({ volunteering: next });
                  }}
                />
                <InlineEd
                  value={vol.date || vol.period || "Date Range"}
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

        {/* RIGHT TOP: PROFESSIONAL EXPERIENCE Continued */}
        <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.19pt", width: `${rightTextW}pt` }}>
          <S2Heading lines={["PROFESSIONAL EXPERIENCE"]} continued fontScale={fontScale} />
          <div style={{ marginTop: pt(8.1, fontScale) }}>
            {p2Exp.map((exp, idx) => (
              <S2ExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === p2Exp.length - 1 ? 0 : 28.0}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 3, nextExp)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT BOTTOM (2P only): PROFESSIONAL DEVELOPMENT */}
        {!is3P && (
          <div style={{ position: "absolute", left: `${rightX}pt`, top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
            <S2Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
            <div style={{ marginTop: pt(7.2, fontScale) }}>
              <S2CoursesBlock
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
  const skillsY = isLetter ? 261.1 : 259.54;
  const eduY = isLetter ? 564.72 : 586.44;
  const page1Exp = effectiveExp.slice(0, 3);

  const summaryText =
    (c.summary || "").trim() ||
    "Write 3\u20135 sentences that clearly summarize your strongest professional skills and the value you bring to an employer. Focus on the results you deliver and how your expertise helps organizations achieve their goals. Avoid outdated objective statements and keep the tone confident and results-oriented.";

  const proSkills: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : ["Time Management", "Critical Thinking", "Leadership", "Problem Solving", "Creativity", "Attention to Detail"];

  const techSkills: string[] = Array.isArray(c.technicalSkills)
    ? c.technicalSkills
    : ["Microsoft Office Suite", "Canva & Adobe Photoshop", "WordPress Basics", "SEO"];

  const eduList: any[] =
    Array.isArray(c.education) && c.education.length > 0
      ? c.education.slice(0, 3)
      : [
          { id: "ed1", degree: "DEGREE TITLE", school: "University Name - Location", date: "Graduation Year" },
          { id: "ed2", degree: "CERTIFICATION NAME", school: "Issuing Organization", date: "Year Earned" },
          { id: "ed3", degree: "COURSE OR PROGRAM", school: "Institution or Platform", date: "Completion Year" },
        ];

  const totalSkillCount = proSkills.length + techSkills.length;
  const denseLeft = totalSkillCount > 12;
  const contactMinH = (skillsY - 122.8 - (isLetter && denseLeft ? 14 : 0)).toFixed(2);
  const skillsMinH = (eduY - skillsY - (isLetter && denseLeft ? 34 : 0)).toFixed(2);
  const summaryMinH = (skillsY - 126.19).toFixed(2);
  const compactSkillGap = totalSkillCount > 14 ? (isLetter ? 0.6 : 1.8) : denseLeft ? 2.6 : 5.6;
  const skillLineH = totalSkillCount > 14 && isLetter ? pt(11.0, fontScale) : lh;
  const leftBlockPad = isLetter && denseLeft ? "7pt" : "14pt";

  return (
    <div className="s2-page" style={{ width: "100%", height: "100%", fontFamily: F_RUBIK, overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: S2_FONT_CSS }} />
      <BulletStylesOnce />
      <S2Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

      {/* LEFT FLOW COLUMN (Zero-Overlap: Contact -> Skills -> Education & Certifications) */}
      <div
        style={{
          position: "absolute",
          left: "31.3pt",
          top: "122.8pt",
          width: "156pt",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ minHeight: `${contactMinH}pt`, paddingBottom: leftBlockPad }}>
          <S2ContactBlock content={c} fontScale={fontScale} editable={editable} inFlow onPatch={patch} />
        </div>

        {isVisible("skills") && (
          <div style={{ paddingLeft: "0.86pt", minHeight: `${skillsMinH}pt`, paddingBottom: leftBlockPad }}>
            <S2Heading lines={["SKILLS"]} fontScale={fontScale} />

            {/* PROFESSIONAL */}
            <ul
              className="tpl-bullet-list"
              style={{
                marginTop: pt(8.2, fontScale),
                paddingLeft: "12pt",
                fontFamily: F_RUBIK,
                fontSize: fs,
                fontWeight: 700,
                lineHeight: lh,
                color: S2_COLORS.ink,
                "--bl-marker-size": `${(10.5 * fontScale).toFixed(2)}pt`,
                "--bl-marker-color": S2_COLORS.ink,
              } as React.CSSProperties}
            >
              <li style={{ paddingLeft: "1.5pt" }}>PROFESSIONAL</li>
            </ul>
            <div style={{ marginTop: pt(compactSkillGap, fontScale) }}>
              {proSkills.map((sk, idx) => (
                <InlineEd
                  key={idx}
                  value={sk}
                  editable={editable}
                  onCommit={(v) => {
                    const next = proSkills.map((it, i) => (i === idx ? v : it));
                    patch({ professionalSkills: next });
                  }}
                  style={{
                    fontFamily: F_RUBIK,
                    fontSize: fs,
                    fontWeight: 400,
                    lineHeight: skillLineH,
                    marginTop: idx === 0 ? "0pt" : pt(compactSkillGap, fontScale),
                    color: S2_COLORS.ink,
                  }}
                />
              ))}
            </div>

            {/* TECHNICAL (only rendered if present) */}
            {techSkills.length > 0 && (
              <>
                <ul
                  className="tpl-bullet-list"
                  style={{
                    marginTop: pt(isLetter && denseLeft ? 7.0 : proSkills.length > 8 ? 14.0 : 25.0, fontScale),
                    paddingLeft: "12pt",
                    fontFamily: F_RUBIK,
                    fontSize: fs,
                    fontWeight: 700,
                    lineHeight: lh,
                    color: S2_COLORS.ink,
                    "--bl-marker-size": `${(10.5 * fontScale).toFixed(2)}pt`,
                    "--bl-marker-color": S2_COLORS.ink,
                  } as React.CSSProperties}
                >
                  <li style={{ paddingLeft: "1.5pt" }}>TECHNICAL</li>
                </ul>
                <div style={{ marginTop: pt(compactSkillGap, fontScale) }}>
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
                        fontFamily: F_RUBIK,
                        fontSize: fs,
                        fontWeight: 400,
                        lineHeight: lh,
                        marginTop: idx === 0 ? "0pt" : pt(compactSkillGap, fontScale),
                        color: S2_COLORS.ink,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {isVisible("education") && (
          <div style={{ paddingLeft: "0.86pt" }}>
            <S2Heading lines={["EDUCATION &", "CERTIFICATIONS"]} fontScale={fontScale} />
            <div style={{ marginTop: pt(7.0, fontScale) }}>
              {eduList.map((ed, idx) => (
                <div
                  key={ed.id || idx}
                  style={{
                    marginTop: idx === 0 ? "0pt" : pt(isLetter && denseLeft ? 4.5 : 8.2, fontScale),
                    fontFamily: F_RUBIK,
                    fontSize: fs,
                    lineHeight: lh,
                    color: S2_COLORS.ink,
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
      </div>

      {/* RIGHT FLOW COLUMN (Zero-Overlap: Professional Summary -> Professional Experience) */}
      <div
        style={{
          position: "absolute",
          left: `${rightX}pt`,
          top: "126.19pt",
          width: `${rightTextW}pt`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isVisible("summary") && (
          <div style={{ minHeight: `${summaryMinH}pt`, paddingBottom: "14pt" }}>
            <S2Heading lines={["PROFESSIONAL SUMMARY"]} fontScale={fontScale} />
            <InlineEd
              value={summaryText}
              editable={editable}
              multiline
              placeholder="Professional summary..."
              onCommit={(v) => patch({ summary: v })}
              style={{
                marginTop: pt(6.6, fontScale),
                fontFamily: F_RUBIK,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                color: S2_COLORS.ink,
              }}
            />
          </div>
        )}

        {isVisible("experience") && (
          <div>
            <S2Heading lines={["PROFESSIONAL EXPERIENCE"]} fontScale={fontScale} />
            <div style={{ marginTop: pt(7.8, fontScale) }}>
              {page1Exp.map((exp, idx) => (
                <S2ExperienceItem
                  key={exp.id || `p1-exp-${idx}`}
                  exp={exp}
                  fontScale={fontScale}
                  marginBottomPt={idx === page1Exp.length - 1 ? 0 : 24.0}
                  editable={editable}
                  onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// COVER LETTER (Exact PDF metrics from cover-a4.pdf & cover-letter.pdf)
// =========================================================================
export function Series2CoverLetter({
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
  const rightX = isLetter ? 207.77 : 207.05;
  const rightEdge = isLetter ? 582.88 : 566.68;
  const rightTextW = rightEdge - rightX;
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });
  const patchCL = (partial: Record<string, any>) =>
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });

  const dateText = cl.date || "[Date]";
  const reSubject = cl.reSubject || cl.subjectLine || "RE: [Job Title]";
  const recipientName = cl.recipientName || "[Hiring Manager Name]";
  const companyName = cl.companyName || "Company Name";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const intro1 = cl.s2Intro1 ?? S2_COVER_DEFAULTS.intro1;
  const intro2 = cl.s2Intro2 ?? (cl.bodyParagraph || S2_COVER_DEFAULTS.intro2);
  const p1 = cl.s2P1 ?? (cl.openingParagraph || S2_COVER_DEFAULTS.p1);
  const bodyIntro = cl.s2BodyIntro ?? S2_COVER_DEFAULTS.bodyIntro;
  const highlightsIntro = cl.highlightsIntro || S2_COVER_DEFAULTS.highlightsIntro;
  const bullets: string[] =
    Array.isArray(cl.bulletHighlights) && cl.bulletHighlights.length > 0
      ? cl.bulletHighlights
      : Array.isArray(cl.highlights) && cl.highlights.length > 0
      ? cl.highlights
      : S2_COVER_DEFAULTS.bullets;
  const close1 = cl.s2Close1 ?? S2_COVER_DEFAULTS.close1;
  const close2 = cl.s2Close2 ?? S2_COVER_DEFAULTS.close2;
  const close3 = cl.s2Close3 ?? (cl.closingParagraph || S2_COVER_DEFAULTS.close3);
  const close4 = cl.s2Close4 ?? S2_COVER_DEFAULTS.close4;
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName.toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Jennifer Davis");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_RUBIK,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S2_COLORS.ink,
    margin: 0,
  };

  return (
    <div className="s2-page" style={{ width: "100%", height: "100%", fontFamily: F_RUBIK }}>
      <style dangerouslySetInnerHTML={{ __html: S2_FONT_CSS }} />
      <S2Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />
      <S2ContactBlock content={c} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.19pt", width: `${rightTextW}pt` }}>
        <InlineEd value={dateText} editable={editable} onCommit={(v) => patchCL({ date: v })} style={{ ...bodyStyle, textAlign: "right" }} />
        <InlineEd value={reSubject} editable={editable} onCommit={(v) => patchCL({ reSubject: v, subjectLine: v })} style={bodyStyle} />

        <div style={{ marginTop: pt(13.62, fontScale) }}>
          <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
          <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
        </div>

        <InlineEd value={greeting} editable={editable} onCommit={(v) => patchCL({ greeting: v, salutation: v })} style={{ ...bodyStyle, marginTop: pt(27.24, fontScale) }} />

        <InlineEd value={intro1} editable={editable} multiline onCommit={(v) => patchCL({ s2Intro1: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />
        <InlineEd value={intro2} editable={editable} multiline onCommit={(v) => patchCL({ s2Intro2: v, bodyParagraph: v })} style={bodyStyle} />
        <InlineEd value={p1} editable={editable} multiline onCommit={(v) => patchCL({ s2P1: v, openingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />

        <InlineEd value={bodyIntro} editable={editable} multiline onCommit={(v) => patchCL({ s2BodyIntro: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />
        <InlineEd value={highlightsIntro} editable={editable} onCommit={(v) => patchCL({ highlightsIntro: v })} style={bodyStyle} />

        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => patchCL({ bulletHighlights: next, highlights: next })}
          fontFamily={F_RUBIK}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S2_COLORS.ink}
          marginTop={pt(9.6, fontScale)}
          markerSizePt={10.5 * fontScale}
        />

        <InlineEd value={close1} editable={editable} multiline onCommit={(v) => patchCL({ s2Close1: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />
        <InlineEd value={close2} editable={editable} multiline onCommit={(v) => patchCL({ s2Close2: v })} style={bodyStyle} />
        <InlineEd value={close3} editable={editable} multiline onCommit={(v) => patchCL({ s2Close3: v, closingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />
        <InlineEd value={close4} editable={editable} multiline onCommit={(v) => patchCL({ s2Close4: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />

        <InlineEd value={signOff} editable={editable} onCommit={(v) => patchCL({ signOff: v })} style={{ ...bodyStyle, marginTop: pt(13.62, fontScale) }} />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          className="s2-signature"
          style={{
            marginTop: pt(14.0, fontScale),
            fontFamily: F_SCRIPT,
            fontSize: pt(20.04, fontScale),
            fontWeight: 700,
            lineHeight: pt(26.0, fontScale),
            color: S2_COLORS.ink,
          }}
        />
        <InlineEd value={signatureText} editable={editable} onCommit={(v) => patchCL({ signatureText: v })} style={{ ...bodyStyle, marginTop: pt(5.2, fontScale) }} />
      </div>
    </div>
  );
}

// =========================================================================
// REFERENCES (Exact PDF metrics from references-a4.pdf & references-letter.pdf)
// =========================================================================
export function Series2References({
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
  const rightX = isLetter ? 208.01 : 207.05;
  const rightEdge = isLetter ? 582.0 : 566.0;
  const lh = pt(13.62, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });

  const refs: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references.slice(0, 4)
      : [
          { id: "rf1", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf2", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf3", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "rf4", name: "REFERENCE NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const next = refs.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  return (
    <div className="s2-page" style={{ width: "100%", height: "100%", fontFamily: F_RUBIK }}>
      <style dangerouslySetInnerHTML={{ __html: S2_FONT_CSS }} />
      <S2Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />
      <S2ContactBlock content={c} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: `${rightX}pt`, top: "126.19pt", width: `${(rightEdge - rightX).toFixed(2)}pt` }}>
        <S2Heading lines={["REFERENCES"]} fontScale={fontScale} />
        <div style={{ marginTop: pt(6.6, fontScale), display: "flex", flexDirection: "column", gap: pt(27.24, fontScale) }}>
          {refs.map((ref, idx) => (
            <div key={ref.id || idx} style={{ fontFamily: F_RUBIK, fontSize: fs, lineHeight: lh, color: S2_COLORS.ink }}>
              <InlineEd
                value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
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