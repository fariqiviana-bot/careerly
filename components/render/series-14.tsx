"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList, BulletStylesOnce } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S14_FONT_CSS = `
@font-face {
  font-family: "S14Poppins";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Poppins-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S14Poppins";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/Poppins-Medium.ttf") format("truetype");
}
@font-face {
  font-family: "S14Poppins";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/Poppins-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S14SourceSans3";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/SourceSans3-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S14Inter";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/WorkSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S14Inter";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/WorkSans-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S14Courgette";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Courgette-Regular.ttf") format("truetype");
}
.s14-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s14-page * {
  box-sizing: border-box;
}
.s14-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s14-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s14-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s14-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s14-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s14-ed,
  .s14-ed:hover,
  .s14-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 14 (Hard Rule 0)
const S14_COLORS = {
  ink: "#000000",
  lastName: "#8496B0",
  profession: "#44546A",
  rule: "#D0CECE",
  page: "#FFFFFF",
} as const;

const F_POPPINS = '"S14Poppins", "Poppins", Arial, sans-serif';
const F_SOURCE = '"S14SourceSans3", "Source Sans 3", Arial, sans-serif';
const F_INTER = '"S14Inter", "Inter", Arial, sans-serif';
const F_SCRIPT = '"S14Courgette", "Courgette", cursive';

// Exact Word content from public/templates/14/*.docx
const S14_PROFILE_TEXT =
  "Use this section to highlight your most impressive achievements with specific numbers or measurable results. Focus on how your skills and experience created real value for previous projects or teams. Avoid writing about what you want\u2014instead, show employers exactly how you can help their company succeed.";

const S14_1P_EXPERIENCE = [
  {
    id: "s14-1p-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    bullets: [
      "Begin by clearly defining your role\u2019s main focus or challenge to provide context for your achievements.",
      "Briefly describe your environment or scale, such as team size or market reach, to add depth to experience.",
      "Highlight promotions, leadership, or major projects to show growth and credibility.",
      "Emphasize measurable results \u2014 like growth, savings, or performance gains.",
    ],
  },
  {
    id: "s14-1p-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Use action verbs like led, improved, implemented, or developed \u2014 avoid passive phrasing.",
      "Focus on results and achievements, not duties; quantify them when possible (%, $, or numbers).",
      "Arrange your bullet points strategically \u2014 put the most relevant and impressive accomplishments first.",
    ],
  },
  {
    id: "s14-1p-exp-3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Proofread carefully \u2014 errors or formatting issues can harm first impressions.",
      "Use a professional tone and layout; keep it clean, modern, and easy to read for both humans and ATS.",
      "Review your r\u00e9sum\u00e9 in 10 seconds \u2014 the top achievements should immediately stand out.",
    ],
  },
];

const S14_2P_EXPERIENCE = [
  {
    id: "s14-2p-exp-1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    bullets: [
      "Clearly state your position title, company name, location, and dates of employment. This establishes context and credibility right away.",
      "If you\u2019ve earned a promotion, switched departments, or taken on higher responsibilities, make sure that progression is visible. It demonstrates growth and reliability.",
      "In the introductory paragraph, summarize your position \u2014 mention the scope of your role, the size of the team or budget you handled, and the main focus of your work.",
      "For less-known companies, add one concise line describing their business area or industry (e.g., \u201CA regional logistics firm specializing in e-commerce distribution\u201D).",
      "Emphasize early what measurable value you added \u2014 perhaps you increased revenue, streamlined processes, launched new initiatives, or improved customer satisfaction.",
    ],
  },
  {
    id: "s14-2p-exp-2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Use active, impactful verbs such as led, developed, optimized, coordinated, executed, enhanced, or innovated. These words convey ownership and initiative, unlike passive phrases such as \u201Cresponsible for.\u201D",
      "Focus each bullet point on outcomes and contributions \u2014 not on job duties. Instead of listing what you were expected to do, describe what you actually achieved and how it benefited the organization.",
      "Whenever possible, quantify your success. Numbers instantly add credibility \u2014 \u201Cincreased client retention by 22%,\u201D \u201Creduced expenses by $45K annually,\u201D or \u201Cmanaged a $2M annual budget.\u201D",
      "Prioritize your bullet points strategically: place the most impressive and job-relevant accomplishments first so they immediately capture the reader\u2019s attention.",
    ],
  },
  {
    id: "s14-2p-exp-3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Carefully review the job description and highlight repeated keywords, technical skills, and qualifications. These are what the Applicant Tracking System (ATS) is programmed to identify.",
      "Integrate keywords naturally for balance between readability and optimization.",
      "Remember, about 70\u201380% of resumes get filtered out by ATS systems simply because they lack the right phrasing. Tailoring your content for each job application increases your chances dramatically.",
      "Use a simple and ATS-friendly format \u2014 consistent font, clear headings, and no complex graphics. When in doubt, submit your r\u00e9sum\u00e9 as both a clean Word file and a PDF version to ensure compatibility.",
    ],
  },
  {
    id: "s14-2p-exp-4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Include at least three bullet points for each position \u2014 too few might signal that your role wasn\u2019t substantial, even if it was. If you have more to say, use concise and impactful phrasing.",
      "Use present tense for your current job (\u201CManage,\u201D \u201CCoordinate,\u201D \u201CDesign\u201D) and past tense for previous roles (\u201CManaged,\u201D \u201CCoordinated,\u201D \u201CDesigned\u201D). This subtle consistency improves readability.",
      "Always write in an implied first-person voice. For example: \u201CLed a cross-functional team of 10,\u201D not \u201CWas responsible for leading.\u201D It sounds confident and direct.",
      "If you took on additional responsibilities outside your formal job description \u2014 such as mentoring new hires, assisting with strategic planning, or leading a special project \u2014 include them. These details highlight initiative and leadership.",
    ],
  },
  {
    id: "s14-2p-exp-5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Proofread thoroughly before sending. Even one typo or inconsistent spacing can undermine an otherwise outstanding resume. Use tools like Grammarly or ask a trusted professional to review it.",
      "Maintain professionalism across details \u2014 use a clean layout, a professional email address, and consistent formatting on every page. Small visual details communicate reliability.",
      "Do a final \u201C10-second scan\u201D test: glance at your resume quickly and see what stands out first. Your most relevant accomplishments, metrics, and keywords should instantly catch the reader\u2019s eye.",
    ],
  },
];

const S14_1P_PRO_SKILLS = [
  "Time Planning",
  "Critical Thinking",
  "Group Leadership",
  "Problem Resolution",
];
const S14_1P_TECH_SKILLS = [
  "Microsoft Office",
  "Adobe Photoshop",
  "SEO Strategies",
  "HTML & CSS Basics",
];

const S14_2P_PRO_SKILLS_LINES = [
  "Schedule Coordination - Time Planning - Critical Thinking - Group Leadership",
  "Problem Resolution - Decision Making - Adaptability - Attention to Detail",
  "Conflict Management - Strategic Decision-Making",
];
const S14_2P_TECH_SKILLS_LINES = [
  "Microsoft Office - Adobe Photoshop - SEO Strategies - HTML & CSS Basics",
  "Data Entry - Google Workspace - Data Processing",
];

const S14_COVER_DEFAULTS = {
  p1: "Share what inspires you about this role and how your journey aligns with the company\u2019s values. Keep the tone authentic and confident \u2014 this is your chance to make a memorable first impression.",
  p2: "Throughout my professional path, I\u2019ve been motivated by curiosity, creativity, and a drive to make ideas come to life. The opportunity to join [Company Name] as a [Job Title] excites me because it perfectly combines my passion for innovation with my commitment to delivering meaningful results that impact both people and performance.",
  p3: "Use this section to highlight your strongest accomplishments \u2014 focus on results that prove your impact.",
  highlightsIntro: "Key highlights include:",
  bullets: [
    "Spearheaded a project that enhanced team productivity by 30% through process optimization",
    "Delivered measurable growth in user engagement by designing data-informed strategies",
    "Collaborated across departments to launch initiatives that improved overall efficiency",
  ],
  c1: "To close, emphasize the value you bring. Explain how your experience, mindset, and enthusiasm make you a strong addition to the team.",
  c2: "I believe success comes from a balance of strategic thinking and hands-on execution. With a strong sense of ownership, adaptability, and collaboration, I\u2019m confident I can contribute to [Company Name]\u2019s mission and growth from day one.",
  c3: "I would welcome the chance to discuss how my background and ideas can add value to your team. You can reach me at youremail@mail.com or (555)-555-5555.",
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

  const mergedClass = ["s14-ed", className].filter(Boolean).join(" ");
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

// PDF double rule: y=82.65 & 86.85 (4.20pt), y=112.64 & 117.14 (4.50pt), stroke #D0CECE
function S14DoubleRule({ heightPt = 4.6 }: { heightPt?: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: `${heightPt}pt`,
        borderTop: `1px solid ${S14_COLORS.rule}`,
        borderBottom: `1px solid ${S14_COLORS.rule}`,
        boxSizing: "border-box",
      }}
    />
  );
}

// PDF section heading: left-aligned Source Sans 3 12.96pt ls=2.6pt + full-width rule #D0CECE underneath
// Rule sits at headingTop + 21.15pt; body starts at rule + marginBottomPt
function S14SectionHeading({
  title,
  fontScale = 1,
  marginBottomPt = 11.2,
}: {
  title: string;
  fontScale?: number;
  marginBottomPt?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        borderBottom: `1px solid ${S14_COLORS.rule}`,
        paddingBottom: pt(3.8, fontScale),
        marginBottom: pt(marginBottomPt, fontScale),
      }}
    >
      <span
        style={{
          fontFamily: F_SOURCE,
          fontSize: pt(12.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(17.3, fontScale),
          letterSpacing: pt(2.6, fontScale),
          color: S14_COLORS.ink,
          textTransform: "uppercase",
          display: "block",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function splitNameParts(fullName: string): [string, string] {
  const parts = (fullName || "JACKSON CALDWELL").trim().split(/\s+/);
  if (parts.length <= 1) return [parts[0] || "JACKSON", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

// Exact PDF Header (identical across all 8 PDFs):
// Name left (Poppins 20.04pt ls=5.35pt, first #000, last #8496B0) + Profession right (Poppins 9.96pt #44546A ls=2.65pt)
// Top double rule y=82.65..86.85 -> Contact y=93.00 (Poppins 9.96pt centered) -> Bottom double rule y=112.64..117.14
function S14MainHeader({
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
  const fullName = (
    content?.fullName ||
    content?.name ||
    content?.personal?.fullName ||
    "JACKSON CALDWELL"
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

  const nameLs = pt(5.35, fontScale);

  return (
    <header style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingTop: pt(2.0, fontScale),
          marginBottom: pt(17.6, fontScale),
        }}
      >
        <div
          style={{
            fontFamily: F_POPPINS,
            fontSize: pt(20.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(27.0, fontScale),
            letterSpacing: nameLs,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          <InlineEd
            inline
            value={firstName}
            editable={editable}
            placeholder="JACKSON"
            onCommit={(v) =>
              onPatch?.({ fullName: `${v.trim()} ${lastName}`.trim() })
            }
            style={{ color: S14_COLORS.ink }}
          />
          {(lastName || editable) && <span> </span>}
          {(lastName || editable) && (
            <InlineEd
              inline
              value={lastName}
              editable={editable}
              placeholder="CALDWELL"
              onCommit={(v) =>
                onPatch?.({ fullName: `${firstName} ${v.trim()}`.trim() })
              }
              style={{ color: S14_COLORS.lastName }}
            />
          )}
        </div>

        <InlineEd
          inline
          value={profession}
          editable={editable}
          placeholder="YOUR PROFESSION"
          onCommit={(v) => onPatch?.({ profession: v })}
          style={{
            fontFamily: F_POPPINS,
            fontSize: pt(9.96, fontScale),
            fontWeight: 400,
            lineHeight: pt(14.0, fontScale),
            letterSpacing: pt(2.65, fontScale),
            color: S14_COLORS.profession,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        />
      </div>

      <S14DoubleRule heightPt={4.5} />

      <div
        style={{
          textAlign: "center",
          fontFamily: F_POPPINS,
          fontSize: pt(9.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(13.92, fontScale),
          color: S14_COLORS.ink,
          paddingTop: pt(6.0, fontScale),
          paddingBottom: pt(5.8, fontScale),
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

      <S14DoubleRule heightPt={4.7} />
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

function S14ExperienceItem({
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
  const lh = pt(13.92, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12pt",
          fontFamily: F_INTER,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: lh,
          color: S14_COLORS.ink,
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
          fontFamily: F_INTER,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S14_COLORS.ink,
        }}
      />

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_INTER}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S14_COLORS.ink}
          marginTop={pt(7.0, fontScale)}
          markerSizePt={10.8 * fontScale}
        />
      )}
    </div>
  );
}

function S14SkillsSection({
  is2P,
  proText,
  techText,
  fontScale,
  editable,
  onCommitPro,
  onCommitTech,
}: {
  is2P: boolean;
  proText: string;
  techText: string;
  fontScale: number;
  editable: boolean;
  onCommitPro: (v: string) => void;
  onCommitTech: (v: string) => void;
}) {
  const lh = pt(13.92, fontScale);
  const fs = pt(9.96, fontScale);

  const proLines = proText.split("\n");
  const techLines = techText.split("\n");

  return (
    <section>
      <BulletStylesOnce />
      <S14SectionHeading title="SKILLS" fontScale={fontScale} marginBottomPt={11.3} />
      <ul
        className="tpl-bullet-list"
        style={{
          paddingLeft: "12pt",
          fontFamily: F_INTER,
          fontSize: fs,
          lineHeight: lh,
          color: S14_COLORS.ink,
          "--bl-marker-size": `${(10.8 * fontScale).toFixed(2)}pt`,
          "--bl-marker-color": S14_COLORS.ink,
        } as React.CSSProperties}
      >
        <li style={{ paddingLeft: "1.5pt" }}>
          <span style={{ fontWeight: 700 }}>PROFESSIONAL: </span>
          {is2P && !editable ? (
            <>
              <span style={{ fontWeight: 400 }}>{proLines[0]}</span>
              {proLines.slice(1).map((line, i) => (
                <div key={i} style={{ fontWeight: 400 }}>
                  {line}
                </div>
              ))}
            </>
          ) : (
            <InlineEd
              inline
              value={proText}
              editable={editable}
              multiline
              onCommit={onCommitPro}
              style={{ fontWeight: 400 }}
            />
          )}
        </li>
        {(techText.trim().length > 0 || editable) && (
        <li style={{ paddingLeft: "1.5pt", marginTop: pt(13.92, fontScale) }}>
          <span style={{ fontWeight: 700 }}>TECHNICAL: </span>
          {is2P && !editable ? (
            <>
              <span style={{ fontWeight: 400 }}>{techLines[0]}</span>
              {techLines.slice(1).map((line, i) => (
                <div key={i} style={{ fontWeight: 400 }}>
                  {line}
                </div>
              ))}
            </>
          ) : (
            <InlineEd
              inline
              value={techText}
              editable={editable}
              multiline
              onCommit={onCommitTech}
              style={{ fontWeight: 400 }}
            />
          )}
        </li>
        )}
      </ul>
    </section>
  );
}

function S14CoursesSection({
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
  const lh = pt(13.92, fontScale);
  const fs = pt(9.96, fontScale);

  return (
    <section>
      <S14SectionHeading
        title="PROFESSIONAL DEVELOPMENT"
        fontScale={fontScale}
        marginBottomPt={11.3}
      />
      {courses.map((crs, idx) => (
        <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(7.0, fontScale) }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12pt",
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 700,
              lineHeight: lh,
              color: S14_COLORS.ink,
            }}
          >
            <InlineEd
              inline
              value={crs.title || crs.name || "COURSE / WORKSHOP / CLASS"}
              editable={editable}
              onCommit={(v) => {
                const next = courses.map((it, i) =>
                  i === idx ? { ...it, title: v, name: v } : it
                );
                onPatchCourses(next);
              }}
            />
            <InlineEd
              inline
              value={crs.date === "DATE" ? "Date" : crs.date || "Date"}
              editable={editable}
              onCommit={(v) => {
                const next = courses.map((it, i) => (i === idx ? { ...it, date: v } : it));
                onPatchCourses(next);
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
              const next = courses.map((it, i) =>
                i === idx ? { ...it, institution: v } : it
              );
              onPatchCourses(next);
            }}
            style={{
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S14_COLORS.ink,
            }}
          />
        </div>
      ))}
    </section>
  );
}

export function Series14Exact({
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
  const lh = pt(13.92, fontScale);
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
      ? S14_2P_EXPERIENCE
      : S14_1P_EXPERIENCE
    : is2P && rawExp.length < 4
    ? [...rawExp, ...S14_2P_EXPERIENCE.slice(rawExp.length)]
    : rawExp;

  const updateExperienceAt = (globalIdx: number, nextItem: any) => {
    const nextList = effectiveExp.map((item, i) => (i === globalIdx ? nextItem : item));
    patch({ experience: nextList });
  };

  const rawSummary = (c.summary || "").trim();
  const isLegacyStoreSummary = rawSummary.startsWith("Begin with key accomplishments, leveraging measurable outcomes");
  const profileText = !rawSummary || isLegacyStoreSummary ? S14_PROFILE_TEXT : rawSummary;

  const rawProSkills: string[] = Array.isArray(c.professionalSkills) ? c.professionalSkills : [];
  const isLegacyProSkills =
    rawProSkills.length === 7 &&
    rawProSkills[0] === "Time Management" &&
    rawProSkills[1] === "Critical Thinking";

  const proSkillsText =
    rawProSkills.length > 0 && !isLegacyProSkills
      ? rawProSkills.join(" - ")
      : is2P
      ? S14_2P_PRO_SKILLS_LINES.join("\n")
      : S14_1P_PRO_SKILLS.join(" - ");

  const isCustomS14Doc =
    Boolean(c.fullName && String(c.fullName).trim()) &&
    String(c.fullName).trim().toLowerCase() !== "enter your name here" &&
    String(c.fullName).trim().toLowerCase() !== "jackson caldwell" &&
    !/^(enter your name|your name|name here|first last)/i.test(String(c.fullName).trim());

  const rawTechSkills: string[] = Array.isArray(c.technicalSkills) ? c.technicalSkills : [];
  const isLegacyTechSkills =
    rawTechSkills.length === 5 && rawTechSkills[0] === "Microsoft Office Suite";

  const techSkillsText =
    rawTechSkills.length > 0 && !isLegacyTechSkills
      ? rawTechSkills.join(" - ")
      : isCustomS14Doc
      ? ""
      : is2P
      ? S14_2P_TECH_SKILLS_LINES.join("\n")
      : S14_1P_TECH_SKILLS.join(" - ");

  const coursesList: any[] =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses.slice(0, 2)
      : isCustomS14Doc
      ? []
      : [
          {
            id: "s14-crs-1",
            title: "COURSE / WORKSHOP / CLASS",
            institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
          {
            id: "s14-crs-2",
            title: "COURSE / WORKSHOP / CLASS",
            institution: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
        ];

  // PAGE 2 (Exact PDF metrics from resume-2p-a4.pdf & resume-2p-letter.pdf)
  if (pageIndex >= 1) {
    const page2Exp = effectiveExp.slice(3);
    const fullName = (
      c.fullName ||
      c.name ||
      c.personal?.fullName ||
      "JACKSON CALDWELL"
    ).toUpperCase();
    const [firstName, lastName] = splitNameParts(fullName);

    // 3 rows in Word 2P EDUCATION & CERTIFICATION:
    // 1. DEGREE TITLE / University Name – Location
    // 2. CERTIFICATION NAME / Organization
    // 3. COURSE OR PROGRAM / Institution or Platform
    const rawEdu: any[] = Array.isArray(c.education) ? c.education : [];
    const rawCerts: any[] = Array.isArray(c.certifications) ? c.certifications : [];
    const eduRows: Array<{
      kind: "edu" | "cert";
      idx: number;
      bold: string;
      regular: string;
      date: string;
    }> = [];

    if (rawEdu.length > 0) {
      const ed0 = rawEdu[0];
      const sc0 = (ed0?.school || "University Name").trim();
      const loc0 = (ed0?.location || "").trim();
      eduRows.push({
        kind: "edu",
        idx: 0,
        bold: ed0?.degree || "DEGREE TITLE",
        regular: loc0 && !sc0.toLowerCase().includes(loc0.toLowerCase()) ? `${sc0} \u2013 ${loc0}` : sc0,
        date: ed0?.date || ed0?.period || "Date",
      });
    } else {
      eduRows.push({
        kind: "edu",
        idx: 0,
        bold: "DEGREE TITLE",
        regular: "University Name \u2013 Location",
        date: "Date",
      });
    }

    if (rawCerts.length > 0) {
      rawCerts.forEach((cert, ci) => {
        const isStr = typeof cert === "string";
        const parts = isStr ? cert.split("/").map((s) => s.trim()) : [];
        eduRows.push({
          kind: "cert",
          idx: ci,
          bold: isStr ? parts[0] || cert : cert.name || cert.title || "CERTIFICATION NAME",
          regular: isStr ? parts.slice(1).join(" / ") : cert.issuer || cert.organization || "Organization",
          date: isStr ? "Date" : cert.date || cert.year || "Date",
        });
      });
    } else {
      eduRows.push({
        kind: "cert",
        idx: 0,
        bold: "CERTIFICATION NAME",
        regular: "Organization",
        date: "Date",
      });
    }

    if (rawEdu.length > 1) {
      rawEdu.slice(1).forEach((ed, ei) => {
        const sc = (ed?.school || "Institution or Platform").trim();
        const loc = (ed?.location || "").trim();
        const isDefaultCourseRow =
          (ed?.degree || "").toUpperCase() === "COURSE OR PROGRAM" &&
          sc === "Institution or Platform";
        eduRows.push({
          kind: "edu",
          idx: ei + 1,
          bold: ed?.degree || "COURSE OR PROGRAM",
          regular:
            isDefaultCourseRow || !loc || sc.toLowerCase().includes(loc.toLowerCase())
              ? sc
              : `${sc} \u2013 ${loc}`,
          date: ed?.date || ed?.period || "Date",
        });
      });
    } else {
      eduRows.push({
        kind: "edu",
        idx: 1,
        bold: "COURSE OR PROGRAM",
        regular: "Institution or Platform",
        date: "Date",
      });
    }

    return (
      <div
        className="s14-page"
        style={{
          width: "100%",
          height: "100%",
          padding: `${marginPt}pt`,
          fontFamily: F_INTER,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: S14_FONT_CSS }} />

        {/* Page 2 Header: Poppins 14.04pt ls=3.75pt (two-tone) + double rule */}
        <div
          style={{
            fontFamily: F_POPPINS,
            fontSize: pt(14.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(19.0, fontScale),
            letterSpacing: pt(3.75, fontScale),
            textTransform: "uppercase",
            marginBottom: pt(8.6, fontScale),
          }}
        >
          <InlineEd
            inline
            value={firstName}
            editable={editable}
            onCommit={(v) => patch({ fullName: `${v.trim()} ${lastName}`.trim() })}
            style={{ color: S14_COLORS.ink }}
          />
          {(lastName || editable) && <span> </span>}
          {(lastName || editable) && (
            <InlineEd
              inline
              value={lastName}
              editable={editable}
              onCommit={(v) => patch({ fullName: `${firstName} ${v.trim()}`.trim() })}
              style={{ color: S14_COLORS.lastName }}
            />
          )}
        </div>
        <S14DoubleRule heightPt={4.5} />

        {/* Continued Experience (Jobs 4 & 5) */}
        {isVisible("experience") && page2Exp.length > 0 && (
          <section style={{ marginTop: pt(isLetter ? 12.2 : 12.9, fontScale) }}>
            {page2Exp.map((exp, idx) => (
              <S14ExperienceItem
                key={exp.id || `p2-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === page2Exp.length - 1 ? 18.1 : 19.5}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx + 3, nextExp)}
              />
            ))}
          </section>
        )}

        {/* EDUCATION & CERTIFICATION */}
        {isVisible("education") && (
          <section style={{ marginTop: page2Exp.length > 0 ? "0pt" : pt(14, fontScale) }}>
            <S14SectionHeading
              title="EDUCATION & CERTIFICATION"
              fontScale={fontScale}
              marginBottomPt={11.2}
            />
            {eduRows.map((row, rIdx) => (
              <div
                key={`${row.kind}-${row.idx}-${rIdx}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "12pt",
                  marginTop: rIdx === 0 ? "0pt" : pt(7.0, fontScale),
                  fontFamily: F_INTER,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S14_COLORS.ink,
                }}
              >
                <span>
                  <InlineEd
                    inline
                    value={row.bold}
                    editable={editable}
                    onCommit={(v) => {
                      if (row.kind === "edu") {
                        const baseEdu =
                          rawEdu.length > row.idx
                            ? [...rawEdu]
                            : [
                                ...rawEdu,
                                { id: `edu-${row.idx}`, degree: row.bold, school: row.regular, date: row.date },
                              ];
                        baseEdu[row.idx] = { ...baseEdu[row.idx], degree: v };
                        patch({ education: baseEdu });
                      } else {
                        const baseCerts =
                          rawCerts.length > row.idx
                            ? [...rawCerts]
                            : [{ id: "c1", name: row.bold, issuer: row.regular, date: row.date }];
                        const cur = baseCerts[row.idx];
                        baseCerts[row.idx] =
                          typeof cur === "string"
                            ? `${v} / ${row.regular}`
                            : { ...cur, name: v, title: v };
                        patch({ certifications: baseCerts });
                      }
                    }}
                    style={{ fontWeight: 700 }}
                  />
                  {(row.regular || editable) && (
                    <span style={{ fontWeight: 700 }}>{" / "}</span>
                  )}
                  {(row.regular || editable) && (
                    <InlineEd
                      inline
                      value={row.regular}
                      editable={editable}
                      onCommit={(v) => {
                        if (row.kind === "edu") {
                          const baseEdu = [...rawEdu];
                          if (baseEdu[row.idx]) {
                            baseEdu[row.idx] = { ...baseEdu[row.idx], school: v, location: "" };
                            patch({ education: baseEdu });
                          }
                        } else {
                          const baseCerts = [...rawCerts];
                          if (baseCerts[row.idx]) {
                            const cur = baseCerts[row.idx];
                            baseCerts[row.idx] =
                              typeof cur === "string"
                                ? `${row.bold} / ${v}`
                                : { ...cur, issuer: v, organization: v };
                            patch({ certifications: baseCerts });
                          }
                        }
                      }}
                      style={{ fontWeight: 400 }}
                    />
                  )}
                </span>
                <InlineEd
                  inline
                  value={row.date}
                  editable={editable}
                  onCommit={(v) => {
                    if (row.kind === "edu") {
                      const baseEdu = [...rawEdu];
                      if (baseEdu[row.idx]) {
                        baseEdu[row.idx] = { ...baseEdu[row.idx], date: v, period: v };
                        patch({ education: baseEdu });
                      }
                    } else {
                      const baseCerts = [...rawCerts];
                      if (baseCerts[row.idx] && typeof baseCerts[row.idx] === "object") {
                        baseCerts[row.idx] = { ...baseCerts[row.idx], date: v };
                        patch({ certifications: baseCerts });
                      }
                    }
                  }}
                  style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
                />
              </div>
            ))}
          </section>
        )}

        {/* SKILLS */}
        {isVisible("skills") && (
          <div style={{ marginTop: pt(18.1, fontScale) }}>
            <S14SkillsSection
              is2P={true}
              proText={proSkillsText}
              techText={techSkillsText}
              fontScale={fontScale}
              editable={editable}
              onCommitPro={(v) => {
                const next = v
                  .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                patch({ professionalSkills: next });
              }}
              onCommitTech={(v) => {
                const next = v
                  .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                patch({ technicalSkills: next });
              }}
            />
          </div>
        )}

        {/* PROFESSIONAL DEVELOPMENT */}
        {isVisible("courses") && coursesList.length > 0 && (
          <div style={{ marginTop: pt(18.1, fontScale) }}>
            <S14CoursesSection
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

  // PAGE 1 (1-Page Resume OR Page 1 of 2-Page Resume)
  const page1Exp = effectiveExp.slice(0, 3);

  return (
    <div
      className="s14-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_INTER,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S14_FONT_CSS }} />

      <S14MainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patch}
      />

      {/* PROFESSIONAL PROFILE */}
      {isVisible("summary") && (
        <section style={{ marginTop: pt(14.8, fontScale) }}>
          <S14SectionHeading
            title="PROFESSIONAL PROFILE"
            fontScale={fontScale}
            marginBottomPt={10.0}
          />
          <InlineEd
            value={profileText}
            editable={editable}
            multiline
            placeholder="Professional profile..."
            onCommit={(v) => patch({ summary: v })}
            style={{
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S14_COLORS.ink,
            }}
          />
        </section>
      )}

      {/* PROFESSIONAL EXPERIENCE */}
      {isVisible("experience") && page1Exp.length > 0 && (
        <section style={{ marginTop: pt(18.1, fontScale) }}>
          <S14SectionHeading
            title="PROFESSIONAL EXPERIENCE"
            fontScale={fontScale}
            marginBottomPt={11.3}
          />
          {page1Exp.map((exp, idx) => (
            <S14ExperienceItem
              key={exp.id || `p1-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === page1Exp.length - 1 ? (is2P ? 0 : 18.1) : 19.6}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
            />
          ))}
        </section>
      )}

      {/* 1-Page mode: SKILLS + PROFESSIONAL DEVELOPMENT */}
      {!is2P && isVisible("skills") && (
        <div style={{ marginTop: "0pt" }}>
          <S14SkillsSection
            is2P={false}
            proText={proSkillsText}
            techText={techSkillsText}
            fontScale={fontScale}
            editable={editable}
            onCommitPro={(v) => {
              const next = v
                .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                .map((s) => s.trim())
                .filter(Boolean);
              patch({ professionalSkills: next });
            }}
            onCommitTech={(v) => {
              const next = v
                .split(/\s*[\-\u2013\u2014|•,\n]\s*/)
                .map((s) => s.trim())
                .filter(Boolean);
              patch({ technicalSkills: next });
            }}
          />
        </div>
      )}

      {/* 1-Page mode: EDUCATION (for custom user resumes) */}
      {!is2P && isCustomS14Doc && isVisible("education") && Array.isArray(c.education) && c.education.length > 0 && (
        <section style={{ marginTop: pt(16, fontScale) }}>
          <S14SectionHeading
        title="EDUCATION"
        fontScale={fontScale}
        marginBottomPt={11.3}
      />
          <div style={{ marginTop: pt(6, fontScale) }}>
            {c.education.map((ed: any, idx: number) => (
              <div
                key={ed?.id || idx}
                style={{
                  marginTop: idx === 0 ? "0pt" : pt(8, fontScale),
                  fontSize: pt(10, fontScale),
                  lineHeight: pt(13.92, fontScale),
                  color: S14_COLORS.ink,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8pt" }}>
                  <span style={{ fontWeight: 700 }}>{ed?.degree || "DEGREE TITLE"}</span>
                  {(ed?.date || ed?.period) && <span>{ed?.date || ed?.period}</span>}
                </div>
                {ed?.school && (
                  <div style={{ fontWeight: 400 }}>
                    {ed.school}{ed?.location ? ` / ${ed.location}` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!is2P && isVisible("courses") && coursesList.length > 0 && (
        <div style={{ marginTop: pt(18.1, fontScale) }}>
          <S14CoursesSection
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

// Exact PDF metrics from cover-a4.pdf & cover-letter.pdf
export function Series14CoverLetter({
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
  const lh = pt(13.92, fontScale);
  const fs = pt(9.96, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => {
    onContentChange?.({ ...c, ...partial });
  };
  const patchCL = (partial: Record<string, any>) => {
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });
  };

  const isLegacyStoreCover =
    typeof cl.openingParagraph === "string" &&
    cl.openingParagraph.startsWith("I am writing to apply for the open position");

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager Name";
  const companyName = cl.companyName || "Company Name";
  const companyAddress = cl.companyAddress || "Company Address";
  const greeting = cl.greeting || cl.salutation || "Dear [Hiring Manager],";

  const p1 = cl.s14P1 ?? (!isLegacyStoreCover && cl.openingParagraph ? cl.openingParagraph : S14_COVER_DEFAULTS.p1);
  const p2 = cl.s14P2 ?? (!isLegacyStoreCover && cl.bodyParagraph ? cl.bodyParagraph : S14_COVER_DEFAULTS.p2);
  const p3 = cl.s14P3 ?? S14_COVER_DEFAULTS.p3;
  const highlightsIntro = cl.highlightsIntro || S14_COVER_DEFAULTS.highlightsIntro;
  const bullets: string[] =
    !isLegacyStoreCover && Array.isArray(cl.bulletHighlights) && cl.bulletHighlights.length > 0
      ? cl.bulletHighlights
      : S14_COVER_DEFAULTS.bullets;
  const c1 = cl.s14C1 ?? S14_COVER_DEFAULTS.c1;
  const c2 = cl.s14C2 ?? S14_COVER_DEFAULTS.c2;
  const c3 = cl.s14C3 ?? (!isLegacyStoreCover && cl.closingParagraph ? cl.closingParagraph : S14_COVER_DEFAULTS.c3);
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName
          .toLowerCase()
          .replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Jackson Caldwell");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_INTER,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S14_COLORS.ink,
    margin: 0,
  };

  return (
    <div
      className="s14-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_INTER,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S14_FONT_CSS }} />

      <S14MainHeader
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
          marginTop: pt(21.4, fontScale),
        }}
      />

      <div style={{ marginTop: pt(13.92, fontScale) }}>
        <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
        <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
        <InlineEd value={companyAddress} editable={editable} onCommit={(v) => patchCL({ companyAddress: v })} style={bodyStyle} />
      </div>

      <InlineEd
        value={greeting}
        editable={editable}
        onCommit={(v) => patchCL({ greeting: v, salutation: v })}
        style={{ ...bodyStyle, marginTop: pt(31.0, fontScale) }}
      />

      <InlineEd value={p1} editable={editable} multiline onCommit={(v) => patchCL({ s14P1: v, openingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(13.92, fontScale) }} />
      <InlineEd value={p2} editable={editable} multiline onCommit={(v) => patchCL({ s14P2: v, bodyParagraph: v })} style={{ ...bodyStyle, marginTop: pt(17.2, fontScale) }} />
      <InlineEd value={p3} editable={editable} multiline onCommit={(v) => patchCL({ s14P3: v })} style={{ ...bodyStyle, marginTop: pt(16.3, fontScale) }} />
      <InlineEd value={highlightsIntro} editable={editable} onCommit={(v) => patchCL({ highlightsIntro: v })} style={{ ...bodyStyle, marginTop: pt(0.8, fontScale) }} />

      <EditableBulletList
        bullets={bullets}
        editable={editable}
        onChange={(next) => patchCL({ bulletHighlights: next })}
        fontFamily={F_INTER}
        fontSize={fs}
        lineHeight={lh}
        fontWeight={400}
        color={S14_COLORS.ink}
        marginTop={pt(8.5, fontScale)}
        markerSizePt={10.8 * fontScale}
      />

      <InlineEd value={c1} editable={editable} multiline onCommit={(v) => patchCL({ s14C1: v })} style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }} />
      <InlineEd value={c2} editable={editable} multiline onCommit={(v) => patchCL({ s14C2: v })} style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }} />
      <InlineEd value={c3} editable={editable} multiline onCommit={(v) => patchCL({ s14C3: v, closingParagraph: v })} style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }} />

      <InlineEd value={signOff} editable={editable} onCommit={(v) => patchCL({ signOff: v })} style={{ ...bodyStyle, marginTop: pt(14.5, fontScale) }} />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        className="s14-signature"
        style={{
          marginTop: pt(13.8, fontScale),
          fontFamily: F_SCRIPT,
          fontSize: pt(18.0, fontScale),
          fontWeight: 700,
          lineHeight: pt(22.5, fontScale),
          color: S14_COLORS.ink,
        }}
      />

      <InlineEd
        value={signatureText}
        editable={editable}
        onCommit={(v) => patchCL({ signatureText: v })}
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S14_COLORS.ink,
          marginTop: pt(4.3, fontScale),
        }}
      />
    </div>
  );
}

// Exact PDF metrics from references-a4.pdf & references-letter.pdf (LEFT-ALIGNED)
export function Series14References({
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
  const lh = pt(13.92, fontScale);
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
      className="s14-page"
      style={{
        width: "100%",
        height: "100%",
        padding: `${marginPt}pt`,
        fontFamily: F_INTER,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: S14_FONT_CSS }} />

      <S14MainHeader
        content={c}
        fontScale={fontScale}
        editable={editable}
        onPatch={patchRoot}
      />

      <div style={{ marginTop: pt(14.8, fontScale) }}>
        <S14SectionHeading title="REFERENCES" fontScale={fontScale} marginBottomPt={11.2} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: pt(28.0, fontScale),
        }}
      >
        {refs.map((ref, idx) => (
          <div
            key={ref.id || idx}
            style={{
              textAlign: "left",
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S14_COLORS.ink,
            }}
          >
            <InlineEd
              value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { name: v })}
              style={{
                fontWeight: 700,
                letterSpacing: pt(1.0, fontScale),
                textTransform: "uppercase",
              }}
            />
            <InlineEd value={ref.title || ref.role || "Job Title"} editable={editable} onCommit={(v) => updateRefAt(idx, { title: v, role: v })} />
            <InlineEd value={ref.company || ref.organization || "Company or Institution"} editable={editable} onCommit={(v) => updateRefAt(idx, { company: v, organization: v })} />
            <InlineEd value={ref.phone || "(555) 555-5555"} editable={editable} onCommit={(v) => updateRefAt(idx, { phone: v })} />
            <InlineEd value={ref.email || "reference@mail.com"} editable={editable} onCommit={(v) => updateRefAt(idx, { email: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}