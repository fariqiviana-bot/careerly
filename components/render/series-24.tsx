"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditableBulletList } from "./bullet-list";
import type {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
} from "@/lib/store";

const S24_FONT_CSS = `
@font-face {
  font-family: "S24Rubik";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Rubik/Rubik-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S24WorkSans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/WorkSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S24OpenSans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/OpenSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S24Roboto";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/Roboto/Roboto-400-normal.ttf") format("truetype");
}
@font-face {
  font-family: "S24Inter";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/WorkSans-Regular.ttf") format("truetype");
}
@font-face {
  font-family: "S24Inter";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/WorkSans-Bold.ttf") format("truetype");
}
@font-face {
  font-family: "S24LibreBaskerville";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/LibreBaskerville/LibreBaskerville-400-normal.ttf") format("truetype");
}
.s24-page {
  color: #000000;
  background-color: #FFFFFF;
  box-sizing: border-box;
  position: relative;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.s24-page * {
  box-sizing: border-box;
}
.s24-signature {
  font-synthesis: weight !important;
  font-synthesis-weight: auto !important;
}
.s24-ed {
  border-radius: 2px;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.s24-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.s24-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.s24-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
@media print {
  .s24-ed,
  .s24-ed:hover,
  .s24-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

// Exact Word/PDF colors for Series 24 (Hard Rule 0)
const S24_COLORS = {
  ink: "#000000",
  profession: "#44546A",
  rule: "#D0CECE",
  page: "#FFFFFF",
} as const;

const F_RUBIK = '"S24Rubik", "Rubik", Arial, sans-serif';
const F_WORK = '"S24WorkSans", "Work Sans", Arial, sans-serif';
const F_OPEN = '"S24OpenSans", "Open Sans", Arial, sans-serif';
const F_ROBOTO = '"S24Roboto", "Roboto", Arial, sans-serif';
const F_INTER = '"S24Inter", "Inter", Arial, sans-serif';
const F_BASK = '"S24LibreBaskerville", "Libre Baskerville", Georgia, serif';
const F_SCRIPT = '"Kaushan Script", cursive';

const EMBLEM_SRC = "/templates/24/emblem-healthcare.png";

// Exact Word defaults from public/templates/24/*.docx
const S24_SUMMARY_DEFAULT =
  "Dedicated and compassionate Registered Nurse with 6+ years of clinical experience delivering high-quality, patient-centered care within high-acuity emergency and acute care settings. Highly skilled in rapid triage, acute patient stabilization, complex wound management, and multidisciplinary care coordination. Proficient in Epic and Cerner EHR systems, with an unwavering commitment to clinical safety, infection control, and patient advocacy.";

const S24_P1_EXPERIENCE = [
  {
    id: "s24-exp-1",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    summaryParagraph:
      "Highlight clinical expertise, leadership, and measurable patient care achievements.",
    bullets: [
      "Delivered direct bedside care to 5\u20136 acute patients per shift, prioritizing safety.",
      "Streamlined treatment protocols to reduce patient readmissions.",
      "Supervised unit nursing staff to elevate clinical care and foster teamwork.",
      "Maintained precise EHR charting compliant with HIPAA standards.",
      "Led unit training to build essential staff clinical skills.",
    ],
  },
  {
    id: "s24-exp-2",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Mentored 8 new nurses, ensuring seamless onboarding and strict protocol compliance.",
      "Executed rapid triage assessments and acute care plans.",
      "Collaborated with multidisciplinary teams, achieving 94% patient satisfaction.",
      "Administered medications, IV infusions, and sterile treatments with high precision.",
    ],
  },
  {
    id: "s24-exp-3",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Monitored telemetry and vitals, promptly reporting acute changes.",
      "Assisted post-op patients with safe mobility, hygiene, and sterile wound care.",
      "Provided clear, compassionate discharge instructions to patients and families.",
      "Supported code response teams during critical unit emergencies.",
    ],
  },
];

const S24_2P_P2_EXPERIENCE = [
  {
    id: "s24-2p-exp-4",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Delivered exceptional patient care in the internal medicine unit, partnering with interdisciplinary teams to achieve superior clinical outcomes.",
      "Tracked patient conditions, including vital signs and symptoms, recording detailed observations in electronic health records (EHR).",
      "Performed medication administration, wound care, and IV therapy with precision and empathy to support patient recovery.",
      "Collaborated with physicians and healthcare teams to evaluate patient progress and adjust treatment plans based on clinical feedback.",
      "Ensured accurate, compliant EHR documentation, adhering to patient privacy and HIPAA regulations.",
      "Promoted patient education on treatment and recovery protocols, improving adherence and health outcomes.",
    ],
  },
  {
    id: "s24-2p-exp-5",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    summaryParagraph:
      "Highlight your clinical contributions and teamwork skills, emphasizing patient care and operational efficiency.",
    bullets: [
      "Provided comprehensive care to postoperative and general medical patients, focusing on comfort and effective recovery processes.",
      "Responded promptly to patient emergencies, including code situations, supporting stabilization and critical interventions.",
      "Educated patients and families on discharge instructions, home care, and medication protocols with clear, empathetic communication.",
      "Engaged in multidisciplinary meetings to align care strategies, enhancing patient outcomes and team coordination.",
    ],
  },
];

const S24_3P_EXTRA_EXPERIENCE = [
  // Page 2 (Jobs 4, 5, 6)
  {
    id: "s24-3p-exp-4",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Provided high-quality patient care in the internal medicine unit, collaborating with multidisciplinary teams to ensure optimal clinical outcomes.",
      "Monitored patient conditions, including vital signs and symptoms, documenting precise observations in electronic medical records (EMR) to support accurate, timely clinical decisions.",
      "Administered medications, performed wound care, and executed IV therapy with accuracy and compassion.",
      "Partnered with physicians and care teams to assess patient progress and refine treatment plans based on clinical responses.",
      "Maintained compliant and accurate electronic health records, adhering to patient confidentiality and HIPAA standards.",
      "Supported patient education on treatment plans and recovery processes, enhancing adherence and health outcomes.",
    ],
  },
  {
    id: "s24-3p-exp-5",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    summaryParagraph:
      "Highlight your clinical contributions and collaboration skills, focusing on patient care and operational efficiency.",
    bullets: [
      "Delivered comprehensive care to postoperative and general medical patients, prioritizing comfort and effective recovery.",
      "Responded swiftly to patient emergencies, including code situations, assisting in stabilization and critical interventions.",
      "Educated patients and families on discharge plans, home care, and medication protocols with clarity and empathy, ensuring they felt confident, informed, and fully prepared to manage recovery safely and effectively at home.",
      "Collaborated in multidisciplinary meetings to align care plans, optimizing patient outcomes and team coordination.",
    ],
  },
  {
    id: "s24-3p-exp-6",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Conducted precise monitoring of patient vital signs, including blood pressure and oxygen levels, promptly reporting abnormalities to clinical staff to support timely, informed care decisions.",
      "Supported physical examinations, specimen collection, and patient preparation for diagnostic procedures with efficiency.",
      "Assisted patients with daily care needs, including hygiene and mobility, ensuring dignity and comfort.",
      "Observed clinical procedures like wound care and IV placement, building foundational nursing knowledge.",
      "Maintained a safe, hygienic environment by adhering to infection control and hospital safety protocols.",
    ],
  },
  // Page 3 (Jobs 7, 8)
  {
    id: "s24-3p-exp-7",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Delivered compassionate, individualized care to a homebound patient with mobility limitations, tailoring strategies to enhance comfort, support movement, and promote a safer routine.",
      "Recognized consistently by family members for empathetic support, thoughtful communication, and creative problem-solving that improved the patient\u2019s overall experience and strengthened trust throughout the course of care.",
      "Fostered strong connections with patients and healthcare teams, promoting coordination and ensuring consistent, patient-focused care aligned with evolving needs.",
      "Demonstrated adaptability, calm judgment, and sound decision-making when managing emergencies or sudden shifts in patient condition, ensuring timely interventions.",
      "Maintained precise, comprehensive documentation and adhered closely to complex care plans, demonstrating strong attention to detail and a commitment to accuracy in every aspect of patient care.",
    ],
  },
  {
    id: "s24-3p-exp-8",
    title: "POSITION TITLE HERE",
    company: "Company/Hospital, City, State",
    period: "Date - Date",
    bullets: [
      "Provided high-quality care in high-pressure environments, excelling in teamwork and supporting efficient operations.",
      "Supported physicians by monitoring patient progress, recognizing changes in symptoms, and collaborating on adjustments to care plans that helped optimize clinical outcomes and enhance patient stability.",
      "Upheld rigorous safety and hygiene standards, applying meticulous clinical judgment to ensure patient well-being.",
      "Contributed to a positive, collaborative environment through strong communication and a supportive team approach.",
    ],
  },
];

const S24_AWARDS_DEFAULT = [
  { id: "aw1", title: "ACHIEVEMENT HERE", issuer: "Company or Hospital", date: "Date" },
  { id: "aw2", title: "ACHIEVEMENT HERE", issuer: "Company or Hospital", date: "Date" },
  { id: "aw3", title: "AWARD HERE", issuer: "Company or Hospital", date: "Date" },
  { id: "aw4", title: "HONORS", issuer: "University/School", date: "Date" },
];

const S24_VOLUNTEER_DEFAULT = [
  { id: "vl1", organization: "Charity/Organization", role: "Your Role", description: "Info about what you did", date: "Date" },
  { id: "vl2", organization: "Charity/Organization", role: "Your Role", description: "Info about what you did", date: "Date" },
  { id: "vl3", organization: "Charity/Organization", role: "Your Role", description: "Info about what you did", date: "Date" },
];

const S24_COVER_DEFAULTS = {
  opening:
    "As a dedicated and compassionate Registered Nurse with 6+ years of experience delivering acute patient care across both high-volume hospital units and outpatient settings, I am eager to join your healthcare team and contribute to your standards of clinical excellence. I bring a patient-first philosophy combined with strong clinical judgment, thriving both in fast-paced multidisciplinary teams and in self-directed care environments.",
  highlightsIntro: "My accomplishments include the following:",
  bullets: [
    "Led and mentored 8 newly licensed nurses, guiding clinical skill development, unit orientation, and adherence to safety protocols.",
    'Won unit "Nurse of the Quarter" award twice for clinical leadership, composure under pressure, and excellence in bedside care.',
    "Spearheaded the overhaul of shift handoff and charting documentation, reducing preventable clinical errors by 15%.",
    "Consistently recognized by patients, families, and supervisors for empathetic communication, achieving patient satisfaction ratings above 94%.",
  ],
  closing:
    "I bring to your organization solid clinical expertise, a proactive approach to patient safety, and a proven track record of compassionate care. I eagerly anticipate the opportunity to discuss the Registered Nurse position and explore how my experience aligns with the high-quality care your team delivers. Thank you for your time and consideration.",
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

  const mergedClass = ["s24-ed", className].filter(Boolean).join(" ");
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

function S24HLine({ x0Pt, x1Pt, yPt }: { x0Pt: number; x1Pt: number; yPt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${x0Pt.toFixed(2)}pt`,
        top: `${yPt.toFixed(2)}pt`,
        width: `${(x1Pt - x0Pt).toFixed(2)}pt`,
        height: 0,
        borderTop: `1px solid ${S24_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S24VLine({ xPt, y0Pt, y1Pt }: { xPt: number; y0Pt: number; y1Pt: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${xPt.toFixed(2)}pt`,
        top: `${y0Pt.toFixed(2)}pt`,
        width: 0,
        height: `${(y1Pt - y0Pt).toFixed(2)}pt`,
        borderLeft: `1px solid ${S24_COLORS.rule}`,
        zIndex: 1,
      }}
    />
  );
}

function S24Heading({
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
        fontFamily: F_ROBOTO,
        fontSize: pt(12.96, fontScale),
        fontWeight: 400,
        lineHeight: pt(19.1, fontScale),
        letterSpacing: pt(2.75, fontScale),
        color: S24_COLORS.ink,
        textTransform: "uppercase",
      }}
    >
      {lines.map((ln, idx) => (
        <div key={idx}>
          <span>{ln}</span>
          {continued && idx === lines.length - 1 && (
            <span
              style={{
                fontFamily: F_BASK,
                fontSize: pt(6.0, fontScale),
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: pt(1.5, fontScale),
                marginLeft: pt(4.5, fontScale),
              }}
            >
              CONTINUED
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Page 1 Header (identical across 1P, 2P P1, 3P P1, Cover Letter, References):
// Healthcare emblem (27.05, 4.6, 110.25x110.25pt)
// Name at (159.74, 28.56) Rubik 24pt ls=5.25pt
// Profession at (159.74, 72.89) Work Sans 11.04pt #44546A ls=3.0pt
// Double rule y=113.56 & 116.41 -> Contact centered y=123.29 (Open Sans 9.96pt, pipes #D0CECE) -> Double rule y=143.21 & 146.06
function S24Page1Header({
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
    "FLORENCE NIGHTINGALE"
  ).toUpperCase();
  const profession = (
    content?.profession ||
    content?.title ||
    content?.personal?.title ||
    "REGISTERED NURSE"
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

  const rightEdge = isLetter ? 584.4 : 567.9;

  return (
    <>
      {/* Healthcare Heart-Stethoscope Emblem */}
      <img
        src={EMBLEM_SRC}
        alt="Healthcare Emblem"
        style={{
          position: "absolute",
          left: "27.05pt",
          top: "4.6pt",
          width: "110.25pt",
          height: "110.25pt",
          objectFit: "contain",
          display: "block",
          zIndex: 2,
        }}
      />

      {/* Full Name */}
      <div
        style={{
          position: "absolute",
          left: "159.7pt",
          top: "28.56pt",
          width: `${(rightEdge - 159.7).toFixed(2)}pt`,
          zIndex: 2,
        }}
      >
        <InlineEd
          value={fullName}
          editable={editable}
          placeholder="FLORENCE NIGHTINGALE"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{
            fontFamily: F_RUBIK,
            fontSize: pt(24, fontScale),
            fontWeight: 400,
            lineHeight: pt(28.5, fontScale),
            letterSpacing: pt(5.25, fontScale),
            color: S24_COLORS.ink,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        />
      </div>

      {/* Profession */}
      <div
        style={{
          position: "absolute",
          left: "159.7pt",
          top: "72.89pt",
          width: `${(rightEdge - 159.7).toFixed(2)}pt`,
          zIndex: 2,
        }}
      >
        <InlineEd
          value={profession}
          editable={editable}
          placeholder="REGISTERED NURSE"
          onCommit={(v) => onPatch?.({ profession: v })}
          style={{
            fontFamily: F_WORK,
            fontSize: pt(11.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(14.5, fontScale),
            letterSpacing: pt(3.0, fontScale),
            color: S24_COLORS.profession,
            textTransform: "uppercase",
          }}
        />
      </div>

      {/* Top double rule */}
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={113.56} />
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={116.41} />

      {/* Centered Contact Row */}
      <div
        style={{
          position: "absolute",
          left: "27.3pt",
          top: "123.29pt",
          width: `${(rightEdge - 27.3).toFixed(2)}pt`,
          textAlign: "center",
          fontFamily: F_OPEN,
          fontSize: pt(9.96, fontScale),
          fontWeight: 400,
          lineHeight: pt(13.6, fontScale),
          color: S24_COLORS.ink,
          zIndex: 2,
        }}
      >
        {contactItems.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && (
              <span
                style={{
                  color: S24_COLORS.rule,
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

      {/* Bottom double rule */}
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={143.21} />
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={146.06} />
    </>
  );
}

// Pages 2 & 3 Header: Centered Rubik 20.04pt ls=4.5pt at y=28.54 + double rule at y=66.65 & 69.65
function S24SubPageHeader({
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
    "FLORENCE NIGHTINGALE"
  ).toUpperCase();
  const rightEdge = isLetter ? 584.4 : 567.9;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "27.3pt",
          top: "28.54pt",
          width: `${(rightEdge - 27.3).toFixed(2)}pt`,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <InlineEd
          value={fullName}
          editable={editable}
          placeholder="FLORENCE NIGHTINGALE"
          onCommit={(v) => onPatch?.({ fullName: v })}
          style={{
            fontFamily: F_RUBIK,
            fontSize: pt(20.04, fontScale),
            fontWeight: 400,
            lineHeight: pt(24.0, fontScale),
            letterSpacing: pt(4.5, fontScale),
            paddingLeft: pt(4.5, fontScale),
            color: S24_COLORS.ink,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        />
      </div>
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={66.65} />
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={69.65} />
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

function formatHospitalLine(exp: any): string {
  const company = (exp?.company || "").trim();
  const location = (exp?.location || "").trim();
  if (!location) return company;
  if (!company) return location;
  if (company.toLowerCase().includes(location.toLowerCase())) return company;
  return `${company}, ${location}`;
}

function isLegacyStoreExtraExp(exps: any[]): boolean {
  if (!Array.isArray(exps) || exps.length < 4) return false;
  const b4 = normalizeBullets(exps[3])[0] || "";
  return b4.startsWith("Coordinated care plans with physicians, specialists, and case managers");
}

function S24ExperienceItem({
  exp,
  fontScale,
  marginBottomPt,
  bulletDiamPt = 3.35,
  editable = false,
  onUpdateExp,
}: {
  exp: any;
  fontScale: number;
  marginBottomPt: number;
  bulletDiamPt?: number;
  editable?: boolean;
  onUpdateExp?: (nextExp: any) => void;
}) {
  const title = exp?.title || exp?.role || "POSITION TITLE HERE";
  const period = exp?.period || exp?.date || "Date - Date";
  const companyLine = formatHospitalLine(exp) || "Company/Hospital, City, State";
  const overview = (
    exp?.summaryParagraph ||
    exp?.overview ||
    exp?.description ||
    ""
  ).trim();
  const bullets = normalizeBullets(exp);
  const lh = pt(13.2, fontScale);
  const fs = pt(9.48, fontScale);

  return (
    <div style={{ marginBottom: pt(marginBottomPt, fontScale) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10pt",
          fontFamily: F_INTER,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S24_COLORS.ink,
        }}
      >
        <InlineEd
          inline
          value={title}
          editable={editable}
          placeholder="POSITION TITLE HERE"
          onCommit={(v) => onUpdateExp?.({ ...exp, title: v, role: v })}
        />
        <InlineEd
          inline
          value={period}
          editable={editable}
          placeholder="Date - Date"
          onCommit={(v) => onUpdateExp?.({ ...exp, period: v, date: v })}
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        />
      </div>

      <InlineEd
        value={companyLine}
        editable={editable}
        placeholder="Company/Hospital, City, State"
        onCommit={(v) => onUpdateExp?.({ ...exp, company: v, location: "" })}
        style={{
          fontFamily: F_INTER,
          fontSize: fs,
          fontWeight: 400,
          lineHeight: lh,
          color: S24_COLORS.ink,
        }}
      />

      {overview && (
        <InlineEd
          value={overview}
          editable={editable}
          multiline
          placeholder="Role highlight..."
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
            marginTop: pt(8.4, fontScale),
            fontFamily: F_INTER,
            fontSize: fs,
            fontWeight: 400,
            lineHeight: lh,
            color: S24_COLORS.ink,
          }}
        />
      )}

      {(bullets.length > 0 || editable) && (
        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => onUpdateExp?.({ ...exp, bullets: next })}
          fontFamily={F_INTER}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S24_COLORS.ink}
          marginTop={pt(8.4, fontScale)}
          markerSizePt={9.8 * fontScale}
        />
      )}
    </div>
  );
}

function S24CoursesBlock({
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
  const lh = pt(13.2, fontScale);
  const fs = pt(9.48, fontScale);

  return (
    <div>
      {courses.map((crs, idx) => (
        <div key={crs.id || idx} style={{ marginTop: idx === 0 ? "0pt" : pt(8.4, fontScale) }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "10pt",
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S24_COLORS.ink,
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
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S24_COLORS.ink,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Parse "BLS – Basic Life Support" into [codeLine, fullNameLine] to match the 4-5 line PDF format
function splitCertName(name: string): [string, string] {
  const s = (name || "").trim();
  const m = s.match(/^([A-Z]{2,6})\s*[\u2013\u2014\-:]\s*(.+)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [s, ""];
}

export function Series24Exact({
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
  const rightEdge = isLetter ? 584.4 : 567.9;
  const rightTextW = rightEdge - 217.49;
  const lh = pt(13.2, fontScale);
  const fs = pt(9.48, fontScale);

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
    ? S24_3P_EXTRA_EXPERIENCE
    : is2P
    ? S24_2P_P2_EXPERIENCE
    : [];
  const basePage1Exp = rawExp.length > 0 ? rawExp.slice(0, 3) : S24_P1_EXPERIENCE;

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

  const expertiseList: string[] =
    Array.isArray(c.areasOfExpertise) && c.areasOfExpertise.length > 0
      ? c.areasOfExpertise
      : [
          "Acute & Emergency Care",
          "Triage & Rapid Assessment",
          "Medication Administration",
          "IV Therapy & Blood Infusion",
          "Wound Care & Dressing",
          "Patient & Family Education",
          "Discharge Planning",
          "Infection Prevention",
          "EHR / EMR Documentation",
        ];

  const skillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : [
          "Clinical Judgment",
          "Patient Assessment",
          "Critical Care Response",
          "Epic & Cerner EHR",
          "Phlebotomy & Cannulation",
          "Tracheostomy Care",
          "Interdisciplinary Teamwork",
          "Compassionate Bedside Care",
        ];

  const affiliationsList: any[] =
    Array.isArray(c.memberships) && c.memberships.length > 0
      ? c.memberships.slice(0, 3)
      : [
          { id: "mb1", organization: "American Nurses Association", date: "2021\u2013Present" },
          { id: "mb2", organization: "NY Nurses Association", date: "2015\u2013Present" },
        ];

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
  // PAGE 3 (3-Page Resume: Achievements & Volunteer left | Jobs 7-8 & Dev right)
  // =========================================================================
  if (pageIndex >= 2) {
    const volHeadY = isLetter ? 419.56 : 445.12;
    const volRuleY = isLetter ? 462.5 : 488.15;
    const devHeadY = isLetter ? 564.88 : 614.59;
    const devRuleY = isLetter ? 585.95 : 635.6;
    const p3Exp = effectiveExp.slice(6, 8);

    const rawAwards: any[] = Array.isArray(c.awards) ? c.awards : [];
    const isLegacyAwards =
      rawAwards.length === 4 &&
      rawAwards[0]?.issuer === "Hospital / Healthcare System" &&
      rawAwards[3]?.title === "DAISY Award Nominee";
    const awardsList =
      rawAwards.length > 0 && !isLegacyAwards ? rawAwards.slice(0, 4) : S24_AWARDS_DEFAULT;

    const rawVol: any[] = Array.isArray(c.volunteering) ? c.volunteering : [];
    const isLegacyVol =
      rawVol.length === 3 && rawVol[1]?.organization === "Community Health Clinic";
    const volunteerList =
      rawVol.length > 0 && !isLegacyVol ? rawVol.slice(0, 3) : S24_VOLUNTEER_DEFAULT;

    return (
      <div className="s24-page" style={{ width: "100%", height: "100%", fontFamily: F_INTER }}>
        <style dangerouslySetInnerHTML={{ __html: S24_FONT_CSS }} />
        <S24SubPageHeader content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* Vertical divider + section rules */}
        <S24VLine xPt={194.85} y0Pt={82.4} y1Pt={isLetter ? 777.0 : 826.55} />
        <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={108.35} />
        <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={volRuleY} />
        <S24HLine x0Pt={215.55} x1Pt={rightEdge} yPt={108.35} />
        <S24HLine x0Pt={216.4} x1Pt={rightEdge} yPt={devRuleY} />

        {/* LEFT TOP: ACHIEVEMENTS */}
        <div style={{ position: "absolute", left: "30pt", top: "86.63pt", width: "145pt" }}>
          <S24Heading lines={["ACHIEVEMENTS"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "30pt", top: "119.47pt", width: "145pt" }}>
          {awardsList.map((aw, idx) => (
            <div
              key={aw.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(8.4, fontScale),
                fontFamily: F_INTER,
                fontSize: fs,
                lineHeight: lh,
                color: S24_COLORS.ink,
              }}
            >
              <InlineEd
                value={aw.title || "ACHIEVEMENT HERE"}
                editable={editable}
                onCommit={(v) => {
                  const next = awardsList.map((it, i) => (i === idx ? { ...it, title: v } : it));
                  patch({ awards: next });
                }}
              />
              <InlineEd
                value={aw.issuer || aw.organization || "Company or Hospital"}
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

        {/* LEFT BOTTOM: VOLUNTEER EXPERIENCE */}
        <div style={{ position: "absolute", left: "30pt", top: `${volHeadY}pt`, width: "145pt" }}>
          <S24Heading lines={["VOLUNTEER", "EXPERIENCE"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "30pt", top: `${(volRuleY + 11.5).toFixed(2)}pt`, width: "145pt" }}>
          {volunteerList.map((vol, idx) => (
            <div
              key={vol.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(8.4, fontScale),
                fontFamily: F_INTER,
                fontSize: fs,
                lineHeight: lh,
                color: S24_COLORS.ink,
              }}
            >
              <InlineEd
                value={vol.organization || "Charity/Organization"}
                editable={editable}
                onCommit={(v) => {
                  const next = volunteerList.map((it, i) => (i === idx ? { ...it, organization: v } : it));
                  patch({ volunteering: next });
                }}
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
                value={vol.description || "Info about what you did"}
                editable={editable}
                onCommit={(v) => {
                  const next = volunteerList.map((it, i) => (i === idx ? { ...it, description: v } : it));
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

        {/* RIGHT TOP: PROFESSIONAL EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: "217.49pt", top: "86.63pt", width: `${rightTextW}pt` }}>
          <S24Heading lines={["PROFESSIONAL EXPERIENCE"]} continued fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "217.49pt", top: "119.47pt", width: `${rightTextW}pt` }}>
          {p3Exp.map((exp, idx) => (
            <S24ExperienceItem
              key={exp.id || `p3-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === p3Exp.length - 1 ? 0 : 19.4}
              bulletDiamPt={3.35}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx + 6, nextExp)}
            />
          ))}
        </div>

        {/* RIGHT BOTTOM: PROFESSIONAL DEVELOPMENT */}
        <div style={{ position: "absolute", left: "217.49pt", top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
          <S24Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "217.49pt", top: `${(devRuleY + 11.1).toFixed(2)}pt`, width: `${rightTextW}pt` }}>
          <S24CoursesBlock
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
  // PAGE 2 (Left: Areas of Expertise, Skills, Professional Affiliations)
  // Right: 2P -> 2 jobs + Prof Dev | 3P -> 3 jobs
  // =========================================================================
  if (pageIndex === 1) {
    const skillsHeadY = isLetter ? 391.7 : 405.26;
    const skillsRuleY = isLetter ? 412.1 : 425.9;
    const affHeadY = isLetter ? 626.11 : 659.71;
    const affRuleY = isLetter ? 667.85 : 701.25;
    const devHeadY = isLetter ? 562.0 : 611.95;
    const devRuleY = isLetter ? 583.15 : 632.75;
    const p2Exp = is3P ? effectiveExp.slice(3, 6) : effectiveExp.slice(3, 5);

    return (
      <div className="s24-page" style={{ width: "100%", height: "100%", fontFamily: F_INTER }}>
        <style dangerouslySetInnerHTML={{ __html: S24_FONT_CSS }} />
        <S24SubPageHeader content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patch} />

        {/* Vertical divider + section rules */}
        <S24VLine xPt={194.85} y0Pt={81.5} y1Pt={isLetter ? 776.7 : 826.7} />
        <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={126.7} />
        <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={skillsRuleY} />
        <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={affRuleY} />
        <S24HLine x0Pt={215.55} x1Pt={rightEdge} yPt={107.65} />
        {!is3P && <S24HLine x0Pt={216.4} x1Pt={rightEdge} yPt={devRuleY} />}

        {/* LEFT TOP: AREAS OF EXPERTISE */}
        <div style={{ position: "absolute", left: "30pt", top: "85.91pt", width: "145pt" }}>
          <S24Heading lines={["AREAS OF", "EXPERTISE"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "30pt", top: "138.1pt", width: "145pt" }}>
          {expertiseList.map((item, idx) => (
            <InlineEd
              key={idx}
              value={item}
              editable={editable}
              onCommit={(v) => {
                const next = expertiseList.map((it, i) => (i === idx ? v : it));
                patch({ areasOfExpertise: next });
              }}
              style={{
                fontFamily: F_INTER,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                marginTop: idx === 0 ? "0pt" : pt(12.05, fontScale),
                color: S24_COLORS.ink,
              }}
            />
          ))}
        </div>

        {/* LEFT MIDDLE: SKILLS */}
        <div style={{ position: "absolute", left: "30pt", top: `${skillsHeadY}pt`, width: "145pt" }}>
          <S24Heading lines={["SKILLS"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "30pt", top: `${(skillsRuleY + 11.14).toFixed(2)}pt`, width: "145pt" }}>
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
                fontFamily: F_INTER,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                marginTop: idx === 0 ? "0pt" : pt(12.05, fontScale),
                color: S24_COLORS.ink,
              }}
            />
          ))}
        </div>

        {/* LEFT BOTTOM: PROFESSIONAL AFFILIATIONS */}
        <div style={{ position: "absolute", left: "30pt", top: `${affHeadY}pt`, width: "145pt" }}>
          <S24Heading lines={["PROFESSIONAL", "AFFILIATIONS"]} fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "30pt", top: `${(affRuleY + 11.4).toFixed(2)}pt`, width: "145pt" }}>
          {affiliationsList.map((aff, idx) => (
            <div
              key={aff.id || idx}
              style={{
                marginTop: idx === 0 ? "0pt" : pt(8.4, fontScale),
                fontFamily: F_INTER,
                fontSize: fs,
                lineHeight: lh,
                color: S24_COLORS.ink,
              }}
            >
              <InlineEd
                value={aff.organization || "Organization"}
                editable={editable}
                onCommit={(v) => {
                  const next = affiliationsList.map((it, i) => (i === idx ? { ...it, organization: v } : it));
                  patch({ memberships: next });
                }}
              />
              <InlineEd
                value={(aff.date || "2021\u2013Present").replace(/\s*\u2013\s*/g, "\u2013")}
                editable={editable}
                onCommit={(v) => {
                  const next = affiliationsList.map((it, i) => (i === idx ? { ...it, date: v } : it));
                  patch({ memberships: next });
                }}
              />
            </div>
          ))}
        </div>

        {/* RIGHT TOP: PROFESSIONAL EXPERIENCE CONTINUED */}
        <div style={{ position: "absolute", left: "217.49pt", top: "85.67pt", width: `${rightTextW}pt` }}>
          <S24Heading lines={["PROFESSIONAL EXPERIENCE"]} continued fontScale={fontScale} />
        </div>
        <div style={{ position: "absolute", left: "217.49pt", top: "119.71pt", width: `${rightTextW}pt` }}>
          {p2Exp.map((exp, idx) => (
            <S24ExperienceItem
              key={exp.id || `p2-exp-${idx}`}
              exp={exp}
              fontScale={fontScale}
              marginBottomPt={idx === p2Exp.length - 1 ? 0 : 19.4}
              bulletDiamPt={3.35}
              editable={editable}
              onUpdateExp={(nextExp) => updateExperienceAt(idx + 3, nextExp)}
            />
          ))}
        </div>

        {/* RIGHT BOTTOM (2P only): PROFESSIONAL DEVELOPMENT */}
        {!is3P && (
          <>
            <div style={{ position: "absolute", left: "217.49pt", top: `${devHeadY}pt`, width: `${rightTextW}pt` }}>
              <S24Heading lines={["PROFESSIONAL DEVELOPMENT"]} fontScale={fontScale} />
            </div>
            <div style={{ position: "absolute", left: "217.49pt", top: `${(devRuleY + 11.0).toFixed(2)}pt`, width: `${rightTextW}pt` }}>
              <S24CoursesBlock
                courses={coursesList}
                fontScale={fontScale}
                editable={editable}
                onPatchCourses={(next) => patch({ courses: next })}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // =========================================================================
  // PAGE 1 (Identical across 1P, 2P P1, 3P P1)
  // =========================================================================
  const certHeadY = isLetter ? 406.72 : 421.7;
  const certRuleY = isLetter ? 448.16 : 463.21;
  const page1Exp = effectiveExp.slice(0, 3);

  const summaryText = (c.summary || "").trim() || S24_SUMMARY_DEFAULT;

  const eduList: any[] =
    Array.isArray(c.education) && c.education.length > 0
      ? c.education
      : [
          { id: "ed1", degree: "Master of Science in Nursing", school: "University of Michigan", date: "Graduation Date" },
          { id: "ed2", degree: "Bachelor of Science in Nursing", school: "University of Washington", date: "Graduation Date" },
          { id: "ed3", degree: "Continuing Education:", school: "Patient Assessment", date: "Graduation Date" },
        ];

  const hasUserCerts = Array.isArray(c.certifications) && c.certifications.length > 0;
  const page1SkillsList: string[] =
    Array.isArray(c.professionalSkills) && c.professionalSkills.length > 0
      ? c.professionalSkills
      : Array.isArray((c as any).skills) && (c as any).skills.length > 0
      ? (c as any).skills
      : [];
  const showSkillsOnPage1 = !hasUserCerts && page1SkillsList.length > 0;

  const certsList: any[] =
    Array.isArray(c.certifications) && c.certifications.length > 0
      ? c.certifications
      : [
          { id: "c1", name: "BLS \u2013 Basic Life Support", issuer: "American Heart Association", date: "Expires July 2030" },
          { id: "c2", name: "ACLS \u2013 Advanced Cardiac Life Support", issuer: "American Heart Association", date: "Expires May 2029" },
          { id: "c3", name: "RN \u2013 Registered Nurse", issuer: "New York City", date: "Expires April 2032", licenseNumber: "License #222222" },
          { id: "c4", name: "CCRN \u2013 Certified Critical Care Nurse", issuer: "American Association of Critical Care Nurses", date: "Expires October 2028" },
        ];

  return (
    <div className="s24-page" style={{ width: "100%", height: "100%", fontFamily: F_INTER }}>
      <style dangerouslySetInnerHTML={{ __html: S24_FONT_CSS }} />

      <S24Page1Header
        content={c}
        isLetter={isLetter}
        fontScale={fontScale}
        editable={editable}
        onPatch={patch}
      />

      {/* Vertical divider + section rules (exact PDF coordinates) */}
      <S24VLine xPt={195.15} y0Pt={158.31} y1Pt={isLetter ? 773.96 : 823.86} />
      <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={183.61} />
      <S24HLine x0Pt={27.3} x1Pt={174.3} yPt={certRuleY} />
      <S24HLine x0Pt={215.55} x1Pt={rightEdge} yPt={183.61} />
      <S24HLine x0Pt={215.55} x1Pt={rightEdge} yPt={325.11} />

      {/* LEFT TOP: EDUCATION */}
      {isVisible("education") && (
        <>
          <div style={{ position: "absolute", left: "30pt", top: "162.59pt", width: "145pt" }}>
            <S24Heading lines={["EDUCATION"]} fontScale={fontScale} />
          </div>
          <div style={{ position: "absolute", left: "30pt", top: "194.83pt", width: "145pt" }}>
            {eduList.map((ed, idx) => {
              // Handle store's combined "Continuing Education: Patient Assessment" cleanly as 2 lines
              const rawDeg = (ed?.degree || "").trim();
              const rawSch = (ed?.school || "").trim();
              const isContCombined = !rawSch && rawDeg.startsWith("Continuing Education:");
              const line1 = isContCombined ? "Continuing Education:" : rawDeg || "DEGREE TITLE";
              const line2 = isContCombined
                ? rawDeg.replace(/^Continuing Education:\s*/, "")
                : rawSch;

              return (
                <div
                  key={ed.id || idx}
                  style={{
                    marginTop: idx === 0 ? "0pt" : pt(8.3, fontScale),
                    fontFamily: F_INTER,
                    fontSize: fs,
                    lineHeight: lh,
                    color: S24_COLORS.ink,
                  }}
                >
                  <InlineEd
                    value={line1}
                    editable={editable}
                    onCommit={(v) => {
                      const next = eduList.map((it, i) =>
                        i === idx
                          ? isContCombined
                            ? { ...it, degree: v, school: line2 }
                            : { ...it, degree: v }
                          : it
                      );
                      patch({ education: next });
                    }}
                  />
                  {(line2 || editable) && (
                    <InlineEd
                      value={line2}
                      editable={editable}
                      placeholder="University / Institution"
                      onCommit={(v) => {
                        const next = eduList.map((it, i) =>
                          i === idx
                            ? isContCombined
                              ? { ...it, degree: line1, school: v }
                              : { ...it, school: v }
                            : it
                        );
                        patch({ education: next });
                      }}
                    />
                  )}
                  <InlineEd
                    value={ed.date || ed.period || "Graduation Date"}
                    editable={editable}
                    onCommit={(v) => {
                      const next = eduList.map((it, i) =>
                        i === idx ? { ...it, date: v, period: v } : it
                      );
                      patch({ education: next });
                    }}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* LEFT BOTTOM: SKILLS (when user switched template with skills & no certs) OR CERTIFICATION & LICENSES */}
      {showSkillsOnPage1 && isVisible("skills") && (
        <>
          <div style={{ position: "absolute", left: "30pt", top: `${(certRuleY - 20.6).toFixed(2)}pt`, width: "145pt" }}>
            <S24Heading lines={["SKILLS"]} fontScale={fontScale} />
          </div>
          <div style={{ position: "absolute", left: "30pt", top: `${(certRuleY + 11.8).toFixed(2)}pt`, width: "145pt" }}>
            {page1SkillsList.map((sk, idx) => (
              <InlineEd
                key={idx}
                value={sk}
                editable={editable}
                onCommit={(v) => {
                  const next = page1SkillsList.map((it, i) => (i === idx ? v : it));
                  patch({ professionalSkills: next });
                }}
                style={{
                  fontFamily: F_INTER,
                  fontSize: fs,
                  lineHeight: lh,
                  color: S24_COLORS.ink,
                  marginTop: idx === 0 ? "0pt" : pt(6.5, fontScale),
                }}
              />
            ))}
          </div>
        </>
      )}
      {!showSkillsOnPage1 && isVisible("certifications") && (
        <>
          <div style={{ position: "absolute", left: "30pt", top: `${certHeadY}pt`, width: "145pt" }}>
            <S24Heading lines={["CERTIFICATION", "& LICENSES"]} fontScale={fontScale} />
          </div>
          <div style={{ position: "absolute", left: "30pt", top: `${(certRuleY + 11.8).toFixed(2)}pt`, width: "145pt" }}>
            {certsList.map((cert, idx) => {
              const isStr = typeof cert === "string";
              const rawName = isStr ? cert : cert.name || cert.title || "";
              const [codeLine, fullLine] = splitCertName(rawName);
              const issuer = isStr ? "" : cert.issuer || cert.organization || "";
              const dateVal = isStr ? "" : cert.date || cert.year || "";
              const licNum = isStr ? "" : cert.licenseNumber || "";

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
                    marginTop: idx === 0 ? "0pt" : pt(8.4, fontScale),
                    fontFamily: F_INTER,
                    fontSize: fs,
                    lineHeight: lh,
                    color: S24_COLORS.ink,
                  }}
                >
                  <InlineEd
                    value={codeLine}
                    editable={editable}
                    onCommit={(v) => updateCert({ name: fullLine ? `${v} \u2013 ${fullLine}` : v })}
                  />
                  {fullLine && (
                    <InlineEd
                      value={fullLine}
                      editable={editable}
                      onCommit={(v) => updateCert({ name: v ? `${codeLine} \u2013 ${v}` : codeLine })}
                    />
                  )}
                  {(issuer || editable) && (
                    <InlineEd
                      value={issuer}
                      editable={editable}
                      placeholder="Issuing Organization"
                      onCommit={(v) => updateCert({ issuer: v })}
                    />
                  )}
                  {(dateVal || editable) && (
                    <InlineEd
                      value={dateVal}
                      editable={editable}
                      placeholder="Expiration Date"
                      onCommit={(v) => updateCert({ date: v })}
                    />
                  )}
                  {licNum && (
                    <InlineEd
                      value={licNum}
                      editable={editable}
                      onCommit={(v) => updateCert({ licenseNumber: v })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* RIGHT TOP: SUMMARY */}
      {isVisible("summary") && (
        <>
          <div style={{ position: "absolute", left: "217.49pt", top: "162.59pt", width: `${rightTextW}pt` }}>
            <S24Heading lines={["SUMMARY"]} fontScale={fontScale} />
          </div>
          <div style={{ position: "absolute", left: "217.49pt", top: "194.83pt", width: `${rightTextW}pt` }}>
            <InlineEd
              value={summaryText}
              editable={editable}
              multiline
              placeholder="Clinical summary..."
              onCommit={(v) => patch({ summary: v })}
              style={{
                fontFamily: F_INTER,
                fontSize: fs,
                fontWeight: 400,
                lineHeight: lh,
                color: S24_COLORS.ink,
              }}
            />
          </div>
        </>
      )}

      {/* RIGHT BOTTOM: PROFESSIONAL EXPERIENCE */}
      {isVisible("experience") && (
        <>
          <div style={{ position: "absolute", left: "217.49pt", top: "304.1pt", width: `${rightTextW}pt` }}>
            <S24Heading lines={["PROFESSIONAL EXPERIENCE"]} fontScale={fontScale} />
          </div>
          <div style={{ position: "absolute", left: "217.49pt", top: "336.7pt", width: `${rightTextW}pt` }}>
            {page1Exp.map((exp, idx) => (
              <S24ExperienceItem
                key={exp.id || `p1-exp-${idx}`}
                exp={exp}
                fontScale={fontScale}
                marginBottomPt={idx === page1Exp.length - 1 ? 0 : 19.4}
                bulletDiamPt={3.35}
                editable={editable}
                onUpdateExp={(nextExp) => updateExperienceAt(idx, nextExp)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =========================================================================
// COVER LETTER (Exact PDF metrics from cover-a4.pdf & cover-letter.pdf)
// Single-column layout below Page 1 Header (x=30pt to rightEdge)
// =========================================================================
export function Series24CoverLetter({
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
  const rightEdge = isLetter ? 584.4 : 567.9;
  const bodyW = rightEdge - 30.0;
  const lh = pt(13.2, fontScale);
  const fs = pt(9.48, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });
  const patchCL = (partial: Record<string, any>) =>
    onContentChange?.({ ...c, coverLetter: { ...cl, ...partial } });

  const LEGACY_S24_CL = {
    opening:
      "I am writing to express my strong interest in the Registered Nurse position at your hospital. With over 6 years of hands-on clinical experience in acute and emergency care, I bring a steadfast commitment to patient safety, clinical excellence, and compassionate bedside care.",
    b0: "Delivered safe, patient-centered bedside care to 5\u20136 high-acuity patients per shift while maintaining 94% patient satisfaction.",
    closing:
      "I would welcome the opportunity to discuss how my clinical background, certifications (BLS, ACLS, CCRN), and dedication to patient advocacy can support your nursing unit. Thank you for your time and consideration.",
  };

  const dateText = cl.date || "Date Here";
  const recipientName = cl.recipientName || "Hiring Manager";
  const companyName = cl.companyName || "Name of Hospital / Company";
  const companyAddress = cl.companyAddress || "City, State";
  const greeting = cl.greeting || cl.salutation || "Dear Hiring Manager (or Dear Mr. Robertson):";

  const opening =
    cl.s24Opening ??
    (cl.openingParagraph && cl.openingParagraph !== LEGACY_S24_CL.opening
      ? cl.openingParagraph
      : S24_COVER_DEFAULTS.opening);
  const highlightsIntro = cl.highlightsIntro || S24_COVER_DEFAULTS.highlightsIntro;
  const bullets: string[] =
    Array.isArray(cl.bulletHighlights) &&
    cl.bulletHighlights.length > 0 &&
    cl.bulletHighlights[0] !== LEGACY_S24_CL.b0
      ? cl.bulletHighlights
      : S24_COVER_DEFAULTS.bullets;
  const closing =
    cl.s24Closing ??
    (cl.closingParagraph && cl.closingParagraph !== LEGACY_S24_CL.closing
      ? cl.closingParagraph
      : S24_COVER_DEFAULTS.closing);
  const signOff = cl.signOff || "Sincerely,";
  const signatureText =
    cl.signatureText ||
    (c.fullName
      ? c.fullName.toLowerCase().replace(/\b\w/g, (ch: string) => ch.toUpperCase())
      : "Florence Nightingale");

  const bodyStyle: React.CSSProperties = {
    fontFamily: F_INTER,
    fontSize: fs,
    fontWeight: 400,
    lineHeight: lh,
    color: S24_COLORS.ink,
    margin: 0,
  };

  return (
    <div className="s24-page" style={{ width: "100%", height: "100%", fontFamily: F_INTER }}>
      <style dangerouslySetInnerHTML={{ __html: S24_FONT_CSS }} />
      <S24Page1Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: "30pt", top: "162.07pt", width: `${bodyW}pt` }}>
        <InlineEd
          value={dateText}
          editable={editable}
          onCommit={(v) => patchCL({ date: v })}
          style={{ ...bodyStyle, textAlign: "right" }}
        />

        <div style={{ marginTop: pt(13.2, fontScale) }}>
          <InlineEd value={recipientName} editable={editable} onCommit={(v) => patchCL({ recipientName: v })} style={bodyStyle} />
          <InlineEd value={companyName} editable={editable} onCommit={(v) => patchCL({ companyName: v })} style={bodyStyle} />
          <InlineEd value={companyAddress} editable={editable} onCommit={(v) => patchCL({ companyAddress: v })} style={bodyStyle} />
        </div>

        <InlineEd
          value={greeting}
          editable={editable}
          onCommit={(v) => patchCL({ greeting: v, salutation: v })}
          style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }}
        />

        <InlineEd
          value={opening}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ s24Opening: v, openingParagraph: v })}
          style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }}
        />

        <InlineEd
          value={highlightsIntro}
          editable={editable}
          onCommit={(v) => patchCL({ highlightsIntro: v })}
          style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }}
        />

        <EditableBulletList
          bullets={bullets}
          editable={editable}
          onChange={(next) => patchCL({ bulletHighlights: next })}
          fontFamily={F_INTER}
          fontSize={fs}
          lineHeight={lh}
          fontWeight={400}
          color={S24_COLORS.ink}
          marginTop={pt(8.4, fontScale)}
          markerSizePt={9.8 * fontScale}
        />

        <InlineEd
          value={closing}
          editable={editable}
          multiline
          onCommit={(v) => patchCL({ s24Closing: v, closingParagraph: v })}
          style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }}
        />

        <InlineEd
          value={signOff}
          editable={editable}
          onCommit={(v) => patchCL({ signOff: v })}
          style={{ ...bodyStyle, marginTop: pt(13.2, fontScale) }}
        />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          className="s24-signature"
          style={{
            marginTop: pt(13.2, fontScale),
            fontFamily: F_SCRIPT,
            fontSize: pt(15.96, fontScale),
            fontWeight: 700,
            lineHeight: pt(22.0, fontScale),
            color: S24_COLORS.ink,
          }}
        />

        <InlineEd
          value={signatureText}
          editable={editable}
          onCommit={(v) => patchCL({ signatureText: v })}
          style={{ ...bodyStyle, marginTop: pt(4.6, fontScale) }}
        />
      </div>
    </div>
  );
}

// =========================================================================
// REFERENCES (Exact PDF metrics from references-a4.pdf & references-letter.pdf)
// Single-column left-aligned below Page 1 Header (4 references)
// =========================================================================
export function Series24References({
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
  const rightEdge = isLetter ? 584.4 : 567.9;
  const lh = pt(13.2, fontScale);
  const fs = pt(9.48, fontScale);

  const patchRoot = (partial: Partial<ResumeContent>) => onContentChange?.({ ...c, ...partial });

  const rawRefs: any[] = Array.isArray(c.references) && c.references.length > 0 ? c.references : [];
  const displayRefs =
    rawRefs.length > 0
      ? rawRefs.slice(0, 4)
      : [
          { id: "r1", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
          { id: "r2", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
          { id: "r3", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
          { id: "r4", name: "REFERENCE NAME HERE", title: "Relation to you professionally", company: "Company/Organization/Hospital", phone: "(555) 555-5555", email: "referenceemail@mail.com" },
        ];

  const updateRefAt = (idx: number, patchItem: any) => {
    const base = rawRefs.length >= 4 ? rawRefs : displayRefs;
    const next = base.map((r, i) => (i === idx ? { ...r, ...patchItem } : r));
    patchRoot({ references: next });
  };

  return (
    <div className="s24-page" style={{ width: "100%", height: "100%", fontFamily: F_INTER }}>
      <style dangerouslySetInnerHTML={{ __html: S24_FONT_CSS }} />
      <S24Page1Header content={c} isLetter={isLetter} fontScale={fontScale} editable={editable} onPatch={patchRoot} />

      <div style={{ position: "absolute", left: "30pt", top: "162.35pt", width: `${(rightEdge - 30).toFixed(2)}pt` }}>
        <S24Heading lines={["REFERENCES"]} fontScale={fontScale} />
      </div>
      <S24HLine x0Pt={27.3} x1Pt={rightEdge} yPt={183.61} />

      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "194.71pt",
          width: `${(rightEdge - 30).toFixed(2)}pt`,
          display: "flex",
          flexDirection: "column",
          gap: pt(26.4, fontScale),
        }}
      >
        {displayRefs.map((ref, idx) => (
          <div
            key={ref.id || idx}
            style={{
              fontFamily: F_INTER,
              fontSize: fs,
              fontWeight: 400,
              lineHeight: lh,
              color: S24_COLORS.ink,
            }}
          >
            <InlineEd
              value={(ref.name || "REFERENCE NAME HERE").toUpperCase()}
              editable={editable}
              onCommit={(v) => updateRefAt(idx, { name: v })}
              style={{ textTransform: "uppercase" }}
            />
            <InlineEd value={ref.title || ref.role || "Relation to you professionally"} editable={editable} onCommit={(v) => updateRefAt(idx, { title: v, role: v })} />
            <InlineEd value={ref.company || ref.organization || "Company/Organization/Hospital"} editable={editable} onCommit={(v) => updateRefAt(idx, { company: v, organization: v })} />
            <InlineEd value={ref.phone || "(555) 555-5555"} editable={editable} onCommit={(v) => updateRefAt(idx, { phone: v })} />
            <InlineEd value={ref.email || "referenceemail@mail.com"} editable={editable} onCommit={(v) => updateRefAt(idx, { email: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}