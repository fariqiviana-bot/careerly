"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S22_FONT_CSS = `
@font-face {
  font-family: "S22Merriweather";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S22Merriweather";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/fonts/Merriweather_24pt-Light.ttf") format("truetype");
}
@font-face {
  font-family: "S22Poppins";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Poppins-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S22OpenSans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/OpenSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S22SourceSans3";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/SourceSans3-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S22SourceSans3";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/SourceSans3-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S22GreatVibes";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/GreatVibes-Regular.ttf") format("truetype");
}
.s22-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s22-page * {
  box-sizing: border-box;
}
.s22-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s22-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s22-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s22-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s22-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s22-ed,
  .s22-ed:hover,
  .s22-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 22 (Hard Rule 0)
const S22_COLORS = {
  ink: "#000000",
  profession: "#44546A",
  rule: "#D0CECE",
  icon: "#A6A6A6",
  page: "#FFFFFF",
} as const;

const F_MERRI = '"S22Merriweather", "Merriweather", Georgia, serif';
const F_POPPINS = '"S22Poppins", "Poppins", Arial, sans-serif';
const F_OPEN = '"S22OpenSans", "Open Sans", Arial, sans-serif';
const F_SOURCE = '"S22SourceSans3", "Source Sans 3", Arial, sans-serif';
const F_SCRIPT = '"S22GreatVibes", "Great Vibes", cursive';

const DEFAULT_PHOTO_URL = "/templates/22/photo-theo.jpg";

// Exact Word content from public/templates/22/*.docx
const S22_SUMMARY_PARAGRAPHS = [
  "Use this space to write a brief introduction that highlights your key strengths, core abilities, and overall professional focus. Aim for 2\u20133 clear sentences that reflect the value you bring and the type of work you excel at.",
  "Keep the tone confident and concise while summarizing what sets you apart and what you aim to contribute in your next role.",
];

const S22_SKILLS_DEFAULT = [
  "Task Orchestration",
  "Group Direction",
  "Operational Streamlining",
  "Client Relations",
  "Data Evaluation",
  "Staff Integration",
  "Issue Resolution",
  "Inter-Team Collaboration",
  "Process Efficiency",
  "Versatility",
];

const S22_TECH_SKILLS_DEFAULT = [
  "Python Coding",
  "Tableau Data Analytics",
  "AutoCAD Design Tools",
  "Trello Task Management",
  "AWS Cloud Solutions",
];

const S22_P1_EXPERIENCE = [
  {
    id: "s22-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    bullets: [
      "Describe moments when you strengthened operations by organizing tasks, clarifying steps, or keeping your team on track.",
      "Highlight contributions where you supported smoother workflows by anticipating needs and preparing resources ahead of time.",
      "Include examples showing how you handled responsibilities consistently and maintained reliable progress during busy periods.",
      "Mention instances where your attention to detail improved accuracy, reduced errors, and enhanced overall work quality.",
      "Add examples demonstrating how your communication helped align expectations and kept colleagues informed during shared tasks.",
    ],
  },
  {
    id: "s22-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Provide examples of how you coordinated activities, followed through on commitments, and supported timely completion.",
      "Mention situations where your initiative simplified processes, resolved small obstacles, or made ongoing tasks easier for others.",
      "Highlight contributions that reflect your ability to adapt quickly, stay organized, and handle shifting priorities effectively.",
    ],
  },
  {
    id: "s22-exp-3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Note moments when you contributed to a positive team atmosphere by offering support, clarity, or steady collaboration.",
      "Show how your effort strengthened team results.",
    ],
  },
];

const S22_2P_P2_EXPERIENCE = [
  {
    id: "s22-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Demonstrate moments when you improved coordination by helping synchronize timelines, aligning shared tasks, or ensuring that dependencies were clearly understood.",
      "Showcase examples where you improved workflow clarity by outlining steps or organizing information.",
      "Illustrate situations where your reliability supported uninterrupted progress, especially when the team faced increased workload or shifting operational demands.",
      "Emphasize contributions that show your ability to spot emerging needs early, provide practical support, and ensure tasks are completed efficiently while maintaining team alignment.",
    ],
  },
  {
    id: "s22-2p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Present examples where your structured approach supported predictable outcomes, smoother transitions, reduced uncertainty, and improved overall team efficiency.",
      "Outline points showing how you reinforced accountability by monitoring progress, aligning efforts, and helping maintain momentum across shared responsibilities.",
      "Describe situations where your steady communication built trust, improved decisions, and strengthened engagement.",
      "Highlight moments when your adaptability and resourcefulness contributed to long-term workflow improvements and more dependable team performance.",
    ],
  },
];

const S22_3P_EXTRA_EXPERIENCE = [
  // Page 2 (3 jobs: indices 3, 4, 5)
  {
    id: "s22-3p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Demonstrate moments where you helped streamline daily routines by identifying inefficiencies and introducing small yet practical adjustments.",
      "Highlight situations where you ensured smooth task transitions by offering clarity, structure, and timely follow-ups.",
      "Describe times when you reinforced operational stability by helping teammates prioritize workload during busy or uncertain periods.",
      "Include examples where you contributed to improved task oversight by monitoring progress and ensuring essential steps were completed as planned.",
      "Mention instances where your reliable presence and steady organization helped maintain team focus and momentum.",
    ],
  },
  {
    id: "s22-3p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Show how you helped build stronger collaboration by facilitating information flow and ensuring everyone had the context they needed.",
      "Describe situations where you supported decision-making by providing clear input, prepared details, or organized relevant materials in advance.",
      "Highlight times when you strengthened team alignment by helping bridge communication gaps between colleagues or departments.",
      "Include examples where you reinforced shared goals by encouraging consistency, clarity, and mutual support across tasks.",
    ],
  },
  {
    id: "s22-3p-exp-6",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Mention moments when you assisted in resolving workflow challenges by offering practical solutions or organizing tasks into clear, manageable steps.",
      "Describe instances where your proactive awareness helped prevent delays, address emerging issues early, or maintain steady task progression.",
      "Highlight contributions where your structured approach improved continuity and reduced disruptions during shifting priorities.",
      "Provide examples showing how your steady performance supported a reliable, motivated team.",
    ],
  },
  // Page 3 (2 jobs: indices 6, 7)
  {
    id: "s22-3p-exp-7",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Show how you enhanced overall team readiness by creating simple checklists, reference guides, or structured notes that helped colleagues carry out tasks with more confidence and clarity.",
      "Describe moments when you helped uphold consistency by standardizing small but essential practices, ensuring that everyone followed the same reliable approach across similar tasks.",
      "Highlight times when you maintained workflow continuity by stabilizing task transitions and preventing overlooked details.",
      "Include examples showing how you helped reduce bottlenecks by identifying repetitive obstacles and proposing clear, actionable improvements that streamlined everyday work.",
    ],
  },
  {
    id: "s22-3p-exp-8",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Describe how you contributed to better team coordination by aligning timelines, confirming shared expectations, and ensuring all contributors stayed informed at key milestones, fostering seamless collaboration and reducing delays.",
      "Highlight moments when you supported decision-making by offering organized insights, summarizing key information, and preparing comparisons that clarified the best path forward.",
      "Include examples where your communication and support helped anticipate challenges, streamline processes, and maintain alignment, resulting in improved outcomes.",
    ],
  },
];

const S22_COVER_DEFAULTS = {
  p1: "Use this space to create a clear and polished introduction for your cover letter. Begin by briefly stating the position you\u2019re applying for, how you learned about the opportunity, and why the role genuinely interests you. Keep the tone confident, concise, and focused on the value you aim to bring throughout your message.",
  p2: "In the main section of your letter, highlight the experiences, strengths, and achievements that best align with the role. Choose examples that demonstrate your capabilities and reflect the type of contribution you\u2019re prepared to make. You can reference recent accomplishments, key skills, or moments where your work created measurable impact.",
  highlightsIntro: "To help guide your content, consider touching on points such as:",
  bullets: [
    "A professional achievement that shows your ability to deliver strong results",
    "A skill or strength that aligns directly with the role you\u2019re seeking",
    "A brief example of how you\u2019ve contributed to team success or improved daily operations",
  ],
  closing:
    "Close your letter by reinforcing your interest in the position and expressing appreciation for the reader\u2019s time and consideration. Mention that you welcome the opportunity to discuss how your background aligns with the needs of the organization.",
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

  const mergedClass = ["s22-ed", className].filter(Boolean).join(" ");
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

// Contact vector icons matching PDF drawings (#A6A6A6)
function S22ContactIcon({ kind }: { kind: "phone" | "email" | "linkedin" | "location" }) {
  const fill = S22_COLORS.icon;
  if (kind === "phone") {
    return (
      <svg width="10pt" height="14pt" viewBox="0 0 16 22" fill="none" aria-hidden="true" style={{ display: "block" }}>
        <rect x="2" y="1" width="12" height="20" rx="2.2" fill={fill} />
        <rect x="3.8" y="3.5" width="8.4" height="13.2" fill="#FFFFFF" />
        <circle cx="8" cy="18.7" r="1.1" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === "email") {
    return (
      <svg width="13.5pt" height="9.5pt" viewBox="0 0 20 14" fill="none" aria-hidden="true" style={{ display: "block" }}>
        <path d="M1 1.5L10 8.2L19 1.5V1H1V1.5Z" fill={fill} />
        <path d="M1 3.2V13H19V3.2L10 9.9L1 3.2Z" fill={fill} />
      </svg>
    );
  }
  if (kind === "linkedin") {
    return (
      <svg width="13.5pt" height="13.5pt" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ display: "block" }}>
        <circle cx="3.2" cy="3.2" r="2.2" fill={fill} />
        <rect x="1.3" y="7.2" width="3.8" height="11.5" fill={fill} />
        <path d="M7.6 7.2H11.2V8.9C11.9 7.8 13.2 6.9 15.1 6.9C18 6.9 19.2 8.7 19.2 11.7V18.7H15.4V12.5C15.4 10.9 14.8 10 13.5 10C12.2 10 11.4 10.9 11.4 12.5V18.7H7.6V7.2Z" fill={fill} />
      </svg>
    );
  }
  return (
    <svg width="10.5pt" height="13.5pt" viewBox="0 0 16 22" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path d="M8 0.5C3.86 0.5 0.5 3.86 0.5 8C0.5 13.25 8 21.5 8 21.5C8 21.5 15.5 13.25 15.5 8C15.5 3.86 12.14 0.5 8 0.5ZM8 10.8C6.45 10.8 5.2 9.55 5.2 8C5.2 6.45 6.45 5.2 8 5.2C9.55 5.2 10.8 6.45 10.8 8C10.8 9.55 9.55 10.8 8 10.8Z" fill={fill} />
    </svg>
  );
}

// Hollow circular node sitting at line intersections (PDF: 6.7x6.7pt, 1pt stroke #D0CECE)
function S22Node({ xPt, yPt }: { xPt: number; yPt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${(xPt - 3.35).toFixed(2)}pt`,
        top: `${(yPt - 3.35).toFixed(2)}pt`,
        width: "6.7pt",
        height: "6.7pt",
        borderRadius: "9999px",
        border: `1px solid ${S22_COLORS.rule}`,
        backgroundColor: "#FFFFFF",
        zIndex: 3,
      }}
    />
  );
}

function S22HLine({ x0Pt, x1Pt, yPt }: { x0Pt: number; x1Pt: number; yPt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${x0Pt.toFixed(2)}pt`,
        top: `${yPt.toFixed(2)}pt`,
        width: `${(x1Pt - x0Pt).toFixed(2)}pt`,
        height: 0,
        borderTop: `1px solid ${S22_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S22VLine({ xPt, y0Pt, y1Pt }: { xPt: number; y0Pt: number; y1Pt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${xPt.toFixed(2)}pt`,
        top: `${y0Pt.toFixed(2)}pt`,
        width: 0,
        height: `${(y1Pt - y0Pt).toFixed(2)}pt`,
        borderLeft: `1px solid ${S22_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S22Heading({
  title,
  continued = false,
  fontScale = 1,
  style,
}: {
  title: string;
  continued?: boolean;
  fontScale?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: F_OPEN,
        fontSize: pt(14, fontScale),
        fontWeight: 400,
        lineHeight: pt(19.0, fontScale),
        letterSpacing: pt(3.65, fontScale),
        color: S22_COLORS.ink,
        textTransform: "uppercase",
        ...style,
      }}
    >
      <span>{title}</span>
      {continued && (
        <span
          style={{
            fontFamily: F_MERRI,
            fontSize: pt(8, fontScale),
            fontStyle: "italic",
            fontWeight: 300,
            letterSpacing: pt(1.85, fontScale),
            marginLeft: pt(5, fontScale),
          }}
        >
          CONTINUED
        </span>
      )}
    </div>
  );
}

function resolvePhotoSrc(content: any): string {
  const url = (content?.photoUrl || content?.personal?.photoUrl || "").trim();
  if (!url || url.includes("preview-resume-")) return DEFAULT_PHOTO_URL;
  return url;
}

// Page 1 Header (identical across 1P, 2P P1, 3P P1, Cover Letter, References):
// Name at (31.3, 18.24) Merriweather 28pt ls=6.5pt
// Top double rule y=71.1 & 74.1 up to photo left edge
// Profession at (31.3, 80.82) Poppins 11pt #44546A ls=2.95pt
// Bottom double rule y=103.9 & 106.9 extending under photo edge
// Circular photo 107.7x107.7pt at y=13.75, x=460.2 (A4) / 477.3 (Letter)
function S22Page1Header({
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
    "THEO FINCH"
  ).toUpperCase();
  const profession = (
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "YOUR PROFESSION"
  ).toUpperCase();

  const photoX = isLetter ? 477.3 : 460.2;
  const topLineEnd = isLetter ? 477.3 : 460.5;
  const botLineEnd = isLetter ? 494.5 : 476.7;
  const photoSrc = resolvePhotoSrc(content);

  return (
    <>
      {/* Name */}
      <div
        style={{
          position: "absolute",
          left: "31.3pt",
          top: "18.24pt",
          width: `${(topLineEnd - 35).toFixed(2)}pt`,
          zIndex: 2,
        }}
      >
        <InlineEd
          value={fullName}
          editable={editable}
          placeholder="THEO FINCH"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{
            fontFamily: F_MERRI,
            fontSize: pt(28, fontScale),
            fontWeight: 400,
            lineHeight: pt(36.0, fontScale),
            letterSpacing: pt(6.5, fontScale),
            color: S22_COLORS.ink,
            textTransform: "uppercase",
          }}
        />
      </div>

      {/* Double rule below name */}
      <S22HLine x0Pt={29.7} x1Pt={topLineEnd} yPt={71.1} />
      <S22HLine x0Pt={29.7} x1Pt={topLineEnd} yPt={74.1} />

      {/* Profession */}
      <div
        style={{
          position: "absolute",
          left: "31.3pt",
          top: "80.82pt",
          width: `${(topLineEnd - 35).toFixed(2)}pt`,
          zIndex: 2,
        }}
      >
        <InlineEd
          value={profession}
          editable={editable}
          placeholder="YOUR PROFESSION"
          onCommit={(v) => onPatch?.({ profession: v })}
          style={{
            fontFamily: F_POPPINS,
            fontSize: pt(11, fontScale),
            fontWeight: 400,
            lineHeight: pt(15.5, fontScale),
            letterSpacing: pt(2.95, fontScale),
            color: S22_COLORS.profession,
            textTransform: "uppercase",
          }}
        />
      </div>

      {/* Double rule below profession */}
      <S22HLine x0Pt={30.0} x1Pt={botLineEnd} yPt={103.9} />
      <S22HLine x0Pt={30.0} x1Pt={botLineEnd} yPt={106.9} />

      {/* Circular Portrait Photo */}
      <div
        style={{
          position: "absolute",
          left: `${photoX}pt`,
          top: "13.75pt",
          width: "107.7pt",
          height: "107.7pt",
          borderRadius: "9999px",
          overflow: "hidden",
          zIndex: 4,
          backgroundColor: "#E5E7EB",
        }}
      >
        <img
          src={photoSrc}
          alt={fullName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
      </div>
    </>
  );
}

// Pages 2 & 3 Header: centered Merriweather 24pt ls=5.6pt + full-width double rule at y=65.7 & 69.0
function S22SubPageHeader({
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
    "THEO FINCH"
  ).toUpperCase();
  const rightEdge = isLetter ? 582.0 : 565.35;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "29.7pt",
          top: "19.24pt",
          width: `${(rightEdge - 29.7).toFixed(2)}pt`,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <InlineEd
          value={fullName}
          editable={editable}
          placeholder="THEO FINCH"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{
            fontFamily: F_MERRI,
            fontSize: pt(24, fontScale),
            fontWeight: 400,
            lineHeight: pt(31.0, fontScale),
            letterSpacing: pt(5.6, fontScale),
            paddingLeft: pt(5.6, fontScale),
            color: S22_COLORS.ink,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        />
      </div>
      <S22HLine x0Pt={29.7} x1Pt={rightEdge} yPt={65.75} />
      <S22HLine x0Pt={29.7} x1Pt={rightEdge} yPt={69.05} />
    </>
  );
}

function S22ContactSidebar({
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
    { key: "phone", val: phone, ph: "(555) 555-5555", yPt: 157.23 },
    { key: "email", val: email, ph: "youremail@mail.com", yPt: 182.68 },
    { key: "linkedin", val: linkedin, ph: "Linkedin.com/name", yPt: 208.13 },
    { key: "location", val: location, ph: "City, State/Province", yPt: 233.58 },
  ];

  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

  return (
    <>
      <div style={{ position: "absolute", left: "32.65pt", top: "128.16pt", width: "155pt" }}>
        <S22Heading title="CONTACT" fontScale={fontScale} />
      </div>

      {rows.map((row) => (
        <div
          key={row.key}
          style={{
            position: "absolute",
            left: "33.5pt",
            top: `${row.yPt}pt`,
            width: "156pt",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "26.3pt",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <S22ContactIcon kind={row.key} />
          </div>
          <InlineEd
            value={row.val}
            editable={editable}
            placeholder={row.ph}
            onCommit={(v) => onPatch?.({ [row.key]: v } as Partial<ResumeContent>)}
            style={{
              flex: 1,
              fontFamily: F_SOURCE,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S22_COLORS.ink,
              wordBreak: "break-word",
            }}
          />
        </div>
      ))}
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

function isLegacyStoreExtraExp(exps: any[]): boolean {
  if (!Array.isArray(exps) || exps.length < 4) return false;
  const b4 = normalizeBullets(exps[3])[0] || "";
  return b4.startsWith("Coordinated cross-team project schedules and resource allocation");
}

function S22ExperienceItem({
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
  const bullets = normalizeBullets(exp);
  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10pt",
          fontFamily: F_SOURCE,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S22_COLORS.ink,
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
          fontFamily: F_SOURCE,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S22_COLORS.ink,
        }}
      />

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_SOURCE}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S22_COLORS.ink}
          marginTop={pt(8.55, fontScale)}
          markerSizePt={11.2 * fontScale}
        />
      )}
    </div>
  );
}

function S22CoursesBlock({
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
  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

  return (
    <div>
      <S22Heading
        title="PROFESSIONAL DEVELOPMENT"
        fontScale={fontScale}
        style={{ marginBottom: pt(12.8, fontScale) }}
      />
      {courses.map((crs, idx) => (
        <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(9.95, fontScale) }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "10pt",
              fontFamily: F_SOURCE,
              fontSize: fs,
              fontWeight: 700,
              lineHeight: lh,
              color: S22_COLORS.ink,
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
              fontFamily: F_SOURCE,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S22_COLORS.ink,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function Series22Exact({
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
  const rightEdge = isLetter ? 582.0 : 565.35;
  const rightTextW = isLetter ? 362.1 : 344.9;
  const bottomRuleY = isLetter ? 774.15 : 822.6;
  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

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
  const extraDefaults = is3P
    ? S22_3P_EXTRA_EXPERIENCE
    : is2P
    ? S22_2P_P2_EXPERIENCE
    : [];
  const basePage1Exp = rawExp.length > 0 ? rawExp.slice(0, 3) : S22_P1_EXPERIENCE;

  const effectiveExp =
    !is2P && !is3P
      ? basePage1Exp
      : rawExp.length <= 3 || isLegacyStoreExtraExp(rawExp)
      ? [...basePage1Exp, ...extraDefaults]
      : rawExp.length < 3 + extraDefaults.length
      ? [...rawExp, ...extraDefaults.slice(rawExp.length - 3)]
      : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const skillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : S22_SKILLS_DEFAULT;

  const techSkillsList: string[] =
    Array.isArray(c.technicalSkills) && c.technicalSkills.length > 0
      ? c.technicalSkills
      : S22_TECH_SKILLS_DEFAULT;

  const eduList: any[] =
    Array.isArray(c.education) && c.education.length > 0
      ? c.education
      : [
          { id: "ed1", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
          { id: "ed2", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
          { id: "ed3", degree: "DEGREE TITLE", school: "University Name", location: "Location", date: "Graduation Year" },
        ];

  const awardsList: any[] =
    Array.isArray(c.awards) && c.awards.length > 0
      ? c.awards.slice(0, 4)
      : [
          { id: "a1", title: "AWARD/ACHIEVEMENT", organization: "Organization Name", date: "Date" },
          { id: "a2", title: "AWARD/ACHIEVEMENT", organization: "Organization Name", date: "Date" },
          { id: "a3", title: "AWARD/ACHIEVEMENT", organization: "Organization Name", date: "Date" },
          { id: "a4", title: "AWARD/ACHIEVEMENT", organization: "Organization Name", date: "Date" },
        ];

  const volunteerList: any[] =
    Array.isArray(c.volunteering) && c.volunteering.length > 0
      ? c.volunteering.slice(0, 3)
      : [
          { id: "v1", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
          { id: "v2", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
          { id: "v3", role: "VOLUNTEER EXPERIENCE", organization: "Organization Name", date: "Date" },
        ];

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses.slice(0, 3)
      : [
          { id: "cr1", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr2", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
          { id: "cr3", title: "COURSE / WORKSHOP / CLASS", institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION", date: "DATE" },
        ];

  const refsList: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references.slice(0, 4)
      : [
          { id: "r1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
        ];

  // =========================================================================
  // PAGE 3 (3-Page Resume: References left + Experience Continued & Dev right)
  // =========================================================================
  if (pageIndex >= 2) {
    const devDividerY = isLetter ? 585.25 : 635.65;
    const p3Exp = effectiveExp.slice(6, 8);

    return (
      <div className="s22-page" style={{ width: "100%", height: "100%", fontFamily: F_SOURCE }}>
        <style dangerouslySetInnerHTML={{ __html: S22_FONT_CSS }} />
        <S22SubPageHeader content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* Vertical divider + right-column divider above Professional Development */}
        <S22VLine xPt={194.1} y0Pt={87.4} y1Pt={devDividerY - 3.2} />
        <S22VLine xPt={194.1} y0Pt={devDividerY + 3.4} y1Pt={isLetter ? 776.7 : 825.5} />
        <S22HLine x0Pt={197.1} x1Pt={rightEdge} yPt={devDividerY} />
        <S22Node xPt={194.1} yPt={devDividerY} />

        {/* LEFT COLUMN: REFERENCES */}
        <div style={{ position: "absolute", left: "34.3pt", top: "90.26pt", width: "152pt" }}>
          <S22Heading title="REFERENCES" fontScale={fontScale} style={{ marginBottom: pt(12.3, fontScale) }} />
          {refsList.map((ref, idx) => (
            <div
              key={ref.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(31.3, fontScale),
                fontFamily: F_SOURCE,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                color: S22_COLORS.ink,
              }}
            >
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

        {/* RIGHT COLUMN TOP: EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: "215.8pt", top: "90.26pt", width: `${rightTextW}pt` }}>
          <S22Heading title="EXPERIENCE" continued fontScale={fontScale} style={{ marginBottom: pt(12.4, fontScale) }} />
          {p3Exp.map((exp, idx) => (
            <S22ExperienceItem
              key={exp.id || `p3-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === p3Exp.length - 1 ? 0 : 19.9}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx + 6, nextExp)}
            />
          ))}
        </div>

        {/* RIGHT COLUMN BOTTOM: PROFESSIONAL DEVELOPMENT */}
        <div style={{ position: "absolute", left: "215.8pt", top: `${(devDividerY + 8.9).toFixed(2)}pt`, width: `${rightTextW}pt` }}>
          <S22CoursesBlock
            courses={coursesList}
            fontScale={fontScale}
            editable={editable}
            onPatchCourses={(next) => patch({ courses: next })}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // PAGE 2 (2P: 2 jobs + Prof Dev | 3P: 3 jobs, no Prof Dev)
  // Left column: TECHNICAL SKILLS + ACHIEVEMENT + VOLUNTEER EXPERIENCE
  // =========================================================================
  if (pageIndex === 1) {
    const achDivY = isLetter ? 271.65 : 286.0;
    const volDivY = isLetter ? 547.4 : 572.2;
    const devDivY = isLetter ? 583.25 : 631.3;
    const p2Exp = is3P ? effectiveExp.slice(3, 6) : effectiveExp.slice(3, 5);

    return (
      <div className="s22-page" style={{ width: "100%", height: "100%", fontFamily: F_SOURCE }}>
        <style dangerouslySetInnerHTML={{ __html: S22_FONT_CSS }} />
        <S22SubPageHeader content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* Grid Dividers & Nodes */}
        <S22VLine xPt={194.0} y0Pt={87.1} y1Pt={achDivY - 3.2} />
        <S22HLine x0Pt={29.7} x1Pt={190.8} yPt={achDivY} />
        <S22Node xPt={194.0} yPt={achDivY} />

        <S22VLine xPt={194.0} y0Pt={achDivY + 3.4} y1Pt={volDivY - 3.2} />
        <S22HLine x0Pt={29.7} x1Pt={190.8} yPt={volDivY} />
        <S22Node xPt={194.0} yPt={volDivY} />

        {!is3P ? (
          <>
            <S22VLine xPt={194.0} y0Pt={volDivY + 3.4} y1Pt={devDivY - 3.2} />
            <S22HLine x0Pt={197.1} x1Pt={rightEdge} yPt={devDivY} />
            <S22Node xPt={194.0} yPt={devDivY} />
            <S22VLine xPt={194.0} y0Pt={devDivY + 3.4} y1Pt={isLetter ? 773.2 : 821.3} />
          </>
        ) : (
          <S22VLine xPt={194.0} y0Pt={volDivY + 3.4} y1Pt={isLetter ? 773.4 : 821.85} />
        )}

        {/* LEFT TOP: TECHNICAL SKILLS */}
        <div style={{ position: "absolute", left: "34.3pt", top: "90.11pt", width: "152pt" }}>
          <S22Heading title="TECHNICAL" fontScale={fontScale} />
          <S22Heading title="SKILLS" fontScale={fontScale} style={{ marginTop: pt(1.0, fontScale), marginBottom: pt(12.6, fontScale) }} />
          {techSkillsList.map((sk, idx) => (
            <InlineEd
              key={idx}
              value={sk}
              editable={editable}
              onCommit={(v) => {
                const next = techSkillsList.map((it, i) => (i === idx ? v : it));
                patch({ technicalSkills: next });
              }}
              style={{
                fontFamily: F_SOURCE,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                marginTop: idx === 0 ? "0pt" : pt(8.8, fontScale),
                color: S22_COLORS.ink,
              }}
            />
          ))}
        </div>

        {/* LEFT MIDDLE: ACHIEVEMENT */}
        <div style={{ position: "absolute", left: "34.3pt", top: `${(achDivY + 9.25).toFixed(2)}pt`, width: "152pt" }}>
          <S22Heading title="ACHIEVEMENT" fontScale={fontScale} style={{ marginBottom: pt(11.7, fontScale) }} />
          {awardsList.map((aw, idx) => (
            <div
              key={aw.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(10.0, fontScale),
                fontFamily: F_SOURCE,
                fontSize: fs,
                lineHeight: lh,
                color: S22_COLORS.ink,
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
                value={aw.organization || aw.issuer || "Organization Name"}
                editable={editable}
                onCommit={(v) => {
                  const next = awardsList.map((it, i) => (i === idx ? { ...it, organization: v, issuer: v } : it));
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

        {/* LEFT BOTTOM: VOLUNTEER EXPERIENCE */}
        <div style={{ position: "absolute", left: "34.3pt", top: `${(volDivY + (isLetter ? 9.46 : 12.76)).toFixed(2)}pt`, width: "152pt" }}>
          <S22Heading title="VOLUNTEER" fontScale={fontScale} />
          <S22Heading title="EXPERIENCE" fontScale={fontScale} style={{ marginBottom: pt(isLetter ? 12.8 : 9.5, fontScale) }} />
          {volunteerList.map((vol, idx) => (
            <div
              key={vol.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(10.0, fontScale),
                fontFamily: F_SOURCE,
                fontSize: fs,
                lineHeight: lh,
                color: S22_COLORS.ink,
              }}
            >
              <InlineEd
                value={(vol.role || vol.title || "VOLUNTEER EXPERIENCE").toUpperCase()}
                editable={editable}
                onCommit={(v) => {
                  const next = volunteerList.map((it, i) => (i === idx ? { ...it, role: v, title: v } : it));
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
                value={vol.date || "Date"}
                editable={editable}
                onCommit={(v) => {
                  const next = volunteerList.map((it, i) => (i === idx ? { ...it, date: v } : it));
                  patch({ volunteering: next });
                }}
              />
            </div>
          ))}
        </div>

        {/* RIGHT TOP: EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: "215.8pt", top: "89.76pt", width: `${rightTextW}pt` }}>
          <S22Heading title="EXPERIENCE" continued fontScale={fontScale} style={{ marginBottom: pt(12.3, fontScale) }} />
          {p2Exp.map((exp, idx) => (
            <S22ExperienceItem
              key={exp.id || `p2-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={
                idx === p2Exp.length - 1 ? 0 : is3P ? (isLetter ? 15.0 : 14.6) : 19.9
              }
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx + 3, nextExp)}
            />
          ))}
        </div>

        {/* RIGHT BOTTOM (2P only): PROFESSIONAL DEVELOPMENT */}
        {!is3P && (
          <div style={{ position: "absolute", left: "215.8pt", top: `${(devDivY + (isLetter ? 10.0 : 8.6)).toFixed(2)}pt`, width: `${rightTextW}pt` }}>
            <S22CoursesBlock
              courses={coursesList}
              fontScale={fontScale}
              editable={editable}
              onPatchCourses={(next) => patch({ courses: next })}
            />
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PAGE 1 (Identical across 1P, 2P P1, 3P P1)
  // =========================================================================
  const eduDivY = isLetter ? 560.55 : 583.8;
  const page1Exp = effectiveExp.slice(0, 3);

  const rawSummary = (c.summary || "").trim();
  const defaultSingleLineSummary = S22_SUMMARY_PARAGRAPHS.join(" ");
  const summaryDisplay =
    !rawSummary || rawSummary === defaultSingleLineSummary
      ? S22_SUMMARY_PARAGRAPHS.join("\n")
      : rawSummary;

  return (
    <div className="s22-page" style={{ width: "100%", height: "100%", fontFamily: F_SOURCE }}>
      <style dangerouslySetInnerHTML={{ __html: S22_FONT_CSS }} />

      <S22Page1Header
        content={c}
        isLetter={isLetter}
        fontScale={fontScale}
        editable={editable}
        onPatch={patch}
      />

      {/* Structural Cross-Lines & Nodes (exact PDF coordinates) */}
      <S22VLine xPt={194.0} y0Pt={125.35} y1Pt={266.0} />
      <S22HLine x0Pt={29.7} x1Pt={190.65} yPt={269.25} />
      <S22HLine x0Pt={197.3} x1Pt={rightEdge} yPt={269.25} />
      <S22Node xPt={194.0} yPt={269.25} />

      <S22VLine xPt={194.0} y0Pt={272.55} y1Pt={eduDivY - 3.2} />
      <S22HLine x0Pt={29.7} x1Pt={190.65} yPt={eduDivY} />
      <S22Node xPt={194.0} yPt={eduDivY} />
      <S22VLine xPt={194.0} y0Pt={eduDivY + 3.4} y1Pt={bottomRuleY} />

      {/* LEFT TOP: CONTACT */}
      <S22ContactSidebar content={c} fontScale={fontScale} editable={editable} onPatch={patch} />

      {/* RIGHT TOP: SUMMARY */}
      {isVisible("summary") && (
        <div style={{ position: "absolute", left: "215.8pt", top: "127.41pt", width: `${rightTextW}pt` }}>
          <S22Heading title="SUMMARY" fontScale={fontScale} style={{ marginBottom: pt(10.8, fontScale) }} />
          <InlineEd
            value={summaryDisplay}
            editable={editable}
            multiline
            placeholder="Professional summary..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              fontFamily: F_SOURCE,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S22_COLORS.ink,
            }}
          />
        </div>
      )}

      {/* LEFT MIDDLE: SKILLS */}
      {isVisible("skills") && (
        <div style={{ position: "absolute", left: "34.3pt", top: "280.01pt", width: "152pt" }}>
          <S22Heading title="SKILLS" fontScale={fontScale} style={{ marginBottom: pt(10.7, fontScale) }} />
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
                fontFamily: F_SOURCE,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                marginTop: idx === 0 ? "0pt" : pt(8.8, fontScale),
                color: S22_COLORS.ink,
              }}
            />
          ))}
        </div>
      )}

      {/* LEFT BOTTOM: EDUCATION */}
      {isVisible("education") && (
        <div style={{ position: "absolute", left: "34.3pt", top: `${(eduDivY + 10.4).toFixed(2)}pt`, width: "152pt" }}>
          <S22Heading title="EDUCATION" fontScale={fontScale} style={{ marginBottom: pt(11.0, fontScale) }} />
          {eduList.slice(0, 3).map((ed, idx) => {
            const school = (ed?.school || "University Name").trim();
            const loc = (ed?.location || "").trim();
            const schoolLine =
              loc && !school.toLowerCase().includes(loc.toLowerCase())
                ? `${school} - ${loc}`
                : school;
            return (
              <div
                key={ed.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(10.0, fontScale),
                  fontFamily: F_SOURCE,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S22_COLORS.ink,
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
                  value={schoolLine}
                  editable={editable}
                  onCommit={(v) => {
                    const next = eduList.map((it, i) => (i === idx ? { ...it, school: v, location: "" } : it));
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
            );
          })}
        </div>
      )}

      {/* RIGHT MAIN: EXPERIENCE */}
      {isVisible("experience") && (
        <div style={{ position: "absolute", left: "215.8pt", top: "280.01pt", width: `${rightTextW}pt` }}>
          <S22Heading title="EXPERIENCE" fontScale={fontScale} style={{ marginBottom: pt(10.6, fontScale) }} />
          {page1Exp.map((exp, idx) => (
            <S22ExperienceItem
              key={exp.id || `p1-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === page1Exp.length - 1 ? 0 : 19.9}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COVER LETTER (Exact PDF metrics from cover-a4.pdf & cover-letter.pdf)
// =========================================================================
export function Series22CoverLetter({
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
  const rightTextW = isLetter ? 362.1 : 344.9;
  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });
  const patchCL = (partial: Record<string, any>) =>
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });

  const LEGACY_S22_CL = {
    p1: "I am excited to submit my application for the open role at your organization. With a strong foundation in operational streamlining, task orchestration, and client relations, I am eager to bring my dedication and collaborative approach to your team.",
    p2: "In my previous positions, I have consistently improved workflow clarity, supported cross-functional teams, and delivered high-quality outcomes under tight deadlines.",
    intro: "Key highlights of my experience include:",
    b0: "Streamlined daily team operations and resource planning to improve on-time project delivery.",
    closing: "Thank you for your time and consideration. I welcome the opportunity to discuss how my background and work ethic align with your organization's needs.",
  };

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager Name";
  const companyName = cl.companyName || "Company Name";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const p1 =
    cl.s22P1 ??
    (cl.openingParagraph && cl.openingParagraph !== LEGACY_S22_CL.p1
      ? cl.openingParagraph
      : S22_COVER_DEFAULTS.p1);
  const p2 =
    cl.s22P2 ??
    (cl.bodyParagraph && cl.bodyParagraph !== LEGACY_S22_CL.p2
      ? cl.bodyParagraph
      : S22_COVER_DEFAULTS.p2);
  const highlightsIntro =
    cl.highlightsIntro && cl.highlightsIntro !== LEGACY_S22_CL.intro
      ? cl.highlightsIntro
      : S22_COVER_DEFAULTS.highlightsIntro;
  const bullets: string[] =
    Array.isArray(cl.bulletHighlights) &&
    cl.bulletHighlights.length > 0 &&
    cl.bulletHighlights[0] !== LEGACY_S22_CL.b0
      ? cl.bulletHighlights
      : S22_COVER_DEFAULTS.bullets;
  const closing =
    cl.s22Closing ??
    (cl.closingParagraph && cl.closingParagraph !== LEGACY_S22_CL.closing
      ? cl.closingParagraph
      : S22_COVER_DEFAULTS.closing);
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName.toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Theo Finch");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_SOURCE,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S22_COLORS.ink,
    margin: 0,
  };

  return (
    <div className="s22-page" style={{ width: "100%", height: "100%", fontFamily: F_SOURCE }}>
      <style dangerouslySetInnerHTML={{ __html: S22_FONT_CSS }} />
      <S22Page1Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      {/* Left sidebar divider (no horizontal line across right column) */}
      <S22VLine xPt={194.0} y0Pt={125.35} y1Pt={266.0} />
      <S22HLine x0Pt={29.7} x1Pt={190.65} yPt={269.25} />
      <S22Node xPt={194.0} yPt={269.25} />
      <S22VLine xPt={194.0} y0Pt={272.55} y1Pt={isLetter ? 775.2 : 824.1} />

      <S22ContactSidebar content={c} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      {/* Right Column: Letter Body */}
      <div style={{ position: "absolute", left: "215.8pt", top: "145.65pt", width: `${rightTextW}pt` }}>
        <InlineEd value={dateText} editable={editable} onCommit={(v) => patchCL({ date: v })} style={bodyStyle} />

        <div style={{ marginTop: pt(15.65, fontScale) }}>
          <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
          <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
        </div>

        <InlineEd
          value={greeting}
          editable={editable}
          onCommit={(v) => patchCL({ greeting: v, salutation: v })}
          style={{ ...bodyStyle, marginTop: pt(31.3, fontScale) }}
        />

        <InlineEd value={p1} editable={editable} multiline onCommit={(v) => patchCL({ s22P1: v, openingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(15.65, fontScale) }} />
        <InlineEd value={p2} editable={editable} multiline onCommit={(v) => patchCL({ s22P2: v, bodyParagraph: v })} style={{ ...bodyStyle, marginTop: pt(15.65, fontScale) }} />
        <InlineEd value={highlightsIntro} editable={editable} onCommit={(v) => patchCL({ highlightsIntro: v })} style={{ ...bodyStyle, marginTop: pt(15.65, fontScale) }} />

        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => patchCL({ bulletHighlights: next })}
          fontFamily={F_SOURCE}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S22_COLORS.ink}
          marginTop={pt(8.55, fontScale)}
          markerSizePt={11.2 * fontScale}
        />

        <InlineEd value={closing} editable={editable} multiline onCommit={(v) => patchCL({ s22Closing: v, closingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(15.65, fontScale) }} />

        <InlineEd value={signOff} editable={editable} onCommit={(v) => patchCL({ signOff: v })} style={{ ...bodyStyle, marginTop: pt(15.65, fontScale) }} />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          className="s22-signature"
          style={{
            marginTop: pt(7.9, fontScale),
            fontFamily: F_SCRIPT,
            fontSize: pt(22, fontScale),
            fontWeight: 700,
            lineHeight: pt(29.0, fontScale),
            color: S22_COLORS.ink,
          }}
        />

        <InlineEd value={signatureText} editable={editable} onCommit={(v) => patchCL({ signatureText: v })} style={{ ...bodyStyle, marginTop: pt(6.3, fontScale) }} />
      </div>
    </div>
  );
}

// =========================================================================
// REFERENCES (Exact PDF metrics from references-a4.pdf & references-letter.pdf)
// =========================================================================
export function Series22References({
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
  const rightTextW = isLetter ? 362.1 : 344.9;
  const lh = pt(15.65, fontScale);
  const fs = pt(11, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });

  const refs: any[] =
    Array.isArray(c.references) && c.references.length > 0
      ? c.references
      : [
          { id: "r1", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r2", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r3", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
          { id: "r4", name: "FULL NAME HERE", title: "Job Title", company: "Company or Institution", phone: "(555) 555-5555", email: "reference@mail.com" },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const next = refs.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  return (
    <div className="s22-page" style={{ width: "100%", height: "100%", fontFamily: F_SOURCE }}>
      <style dangerouslySetInnerHTML={{ __html: S22_FONT_CSS }} />
      <S22Page1Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <S22VLine xPt={194.0} y0Pt={125.35} y1Pt={266.0} />
      <S22HLine x0Pt={29.7} x1Pt={190.65} yPt={269.25} />
      <S22Node xPt={194.0} yPt={269.25} />
      <S22VLine xPt={194.0} y0Pt={272.55} y1Pt={isLetter ? 775.4 : 824.1} />

      <S22ContactSidebar content={c} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: "215.8pt", top: "128.16pt", width: `${rightTextW}pt` }}>
        <S22Heading title="REFERENCES" fontScale={fontScale} style={{ marginBottom: pt(10.0, fontScale) }} />

        <div style={{ display: "flex", flexDirection: "column", gap: pt(31.3, fontScale) }}>
          {refs.map((ref, idx) => (
            <div
              key={ref.id || idx}
              style={{
                fontFamily: F_SOURCE,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                color: S22_COLORS.ink,
              }}
            >
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