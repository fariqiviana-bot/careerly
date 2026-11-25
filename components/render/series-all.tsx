"use client";
import { ElegantPhoneIcon, ElegantEmailIcon, ElegantLinkedInIcon, ElegantLocationIcon } from "./farnavi-icons";

import React from "react";
import {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
  ExperienceItem,
  CourseItem,
  AwardItem,
  VolunteerItem,
  MembershipItem,
  ReferenceItem,
} from "@/lib/store";
import { Phone, Mail, Linkedin, MapPin, Smartphone } from "lucide-react";
import { ExecutivePhoneIcon, ExecutiveEmailIcon, ExecutiveLinkedInIcon, ExecutiveHomeIcon } from "./farnavi-icons";

export interface SeriesRenderProps {
  content: ResumeContent;
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  pageIndex?: number;
}

function getPagePaddingStyle(style?: DocumentStyleSettings) {
  const marginMm = style?.pageMarginMm ?? 12.7;
  const px = Math.round(marginMm * 3.78);
  const scale = (style?.fontScale ?? 100) / 100;
  const lineSpacing = style?.lineSpacing ?? 1.35;
  return {
    padding: `${px}px`,
    fontSize: `${12.5 * scale}px`,
    lineHeight: lineSpacing,
  };
}

function getFullBleedBarStyle(style?: DocumentStyleSettings, heightPx = 15, bg = "#002060") {
  const marginMm = style?.pageMarginMm ?? 12.7;
  const px = Math.round(marginMm * 3.78);
  return {
    height: `${heightPx}px`,
    backgroundColor: bg,
    marginTop: `-${px}px`,
    marginLeft: `-${px}px`,
    marginRight: `-${px}px`,
    marginBottom: "18px",
  };
}

function isSectionVisible(sectionOrder: SectionLayoutItem[] | undefined, id: string) {
  if (!sectionOrder) return true;
  const found = sectionOrder.find((s) => s.id === id);
  return found ? found.visible : true;
}

export function getBullets(exp: { bullets?: string[]; description?: string }): string[] {
  if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
    return exp.bullets.map((b) => b.trim()).filter(Boolean);
  }
  if (!exp.description) return [];
  return exp.description.split(/\r?\n/).map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
}
function sliceExperienceForPage(items: ExperienceItem[], pageIndex: number, page1Count = 3) {
  if (pageIndex === 0) return items.slice(0, page1Count);
  if (pageIndex === 1) {
    const slice = items.slice(page1Count, page1Count + 2);
    return slice.length > 0 ? slice : items.slice(-2);
  }
  const slice = items.length >= 7 ? items.slice(5, 7) : items.slice(page1Count + 1, page1Count + 3);
  return slice.length > 0 ? slice : items.slice(-2);
}

// ============================================================================
// 1. EXECUTIVE (ID "2") - JENNIFER DAVIS (2-Column, Top #002060 Bar, 3 Pages)
// ============================================================================
type SectionKey = string;
type DocLayoutSettings = {
  paperSize?: "A4" | "Letter";
  targetPages?: number;
  activePageIndex?: number;
};
type Exp = {
  id: string;
  title?: string;
  role?: string;
  company: string;
  location?: string;
  period: string;
  overview?: string;
  bullets: string[];
  description?: string;
};
type Content = {
  name: string;
  fullName: string;
  role: string;
  profession: string;
  phone: string;
  email: string;
  linkedin: string;
  location: string;
  summary: string;
  skills: string[];
  professionalSkills: string[];
  technicalSkills: string[];
  experience: Exp[];
  education: { id: string; degree: string; school: string; year?: string; period?: string; location?: string }[];
  certifications: { id: string; name: string; issuer: string; date?: string }[];
  courses: { id: string; title: string; institution: string; year?: string }[];
  languages: { id?: string; name: string; level?: string; proficiency?: string }[];
  memberships: { id: string; role: string; organization: string; period?: string }[];
  awards: { id: string; title: string; issuer: string; year?: string; description?: string }[];
  volunteering: { id: string; role: string; organization: string; period?: string; description?: string }[];
  references: { id: string; name: string; title: string; company: string; phone?: string; email?: string; relationship?: string }[];
  coverLetter?: {
    date?: string;
    recipientName?: string;
    recipientTitle?: string;
    companyName?: string;
    companyAddress?: string;
    subjectLine?: string;
    salutation?: string;
    openingParagraph?: string;
    bodyParagraph1?: string;
    bodyParagraph2?: string;
    highlightsIntro?: string;
    highlights: string[];
    closingParagraph?: string;
    signOff?: string;
  };
  [key: string]: any;
};

function toExecContent(content?: ResumeContent): Content {
  const src: any = content || {};
  return {
    ...src,
    name: src.fullName || src.name || "",
    fullName: src.fullName || src.name || "",
    role: src.profession || src.role || "",
    profession: src.profession || src.role || "",
    phone: src.phone || "",
    email: src.email || "",
    linkedin: src.linkedin || "",
    location: src.location || "",
    summary: src.summary || "",
    skills: src.professionalSkills || src.skills || [],
    professionalSkills: src.professionalSkills || src.skills || [],
    technicalSkills: src.technicalSkills || [],
    experience: (src.experience || []).map((e: any) => ({
      ...e,
      title: e.title || e.role || "",
      role: e.role || e.title || "",
      bullets: getBullets(e),
    })),
    education: (src.education || []).map((ed: any) => ({
      ...ed,
      year: ed.year || ed.period || ed.date || "",
    })),
    certifications: src.certifications || [],
    courses: (src.courses || []).map((cr: any) => ({
      ...cr,
      year: cr.year || cr.date || "",
    })),
    languages: src.languages || [],
    memberships: (src.memberships || []).map((m: any) => ({
      ...m,
      period: m.period || m.date || "",
    })),
    awards: (src.awards || []).map((aw: any) => ({
      ...aw,
      year: aw.year || aw.date || "",
    })),
    volunteering: (src.volunteering || src.volunteer || []).map((vl: any) => ({
      ...vl,
      period: vl.period || vl.date || "",
    })),
    references: src.references || [],
    coverLetter: src.coverLetter,
  };
}

function toExecSettings(style?: DocumentStyleSettings, pageIndex?: number): DocLayoutSettings {
  return {
    paperSize: style?.pageSize === "Letter" ? "Letter" : "A4",
    targetPages: style?.pageCount || 3,
    activePageIndex: typeof pageIndex === "number" ? pageIndex : undefined,
  };
}

function PageSheet({
  pageIndex,
  settings,
  children,
}: {
  pageIndex: number;
  settings?: DocLayoutSettings;
  children: React.ReactNode;
}) {
  if (typeof settings?.activePageIndex === "number" && pageIndex !== settings.activePageIndex) {
    return null;
  }
  const isLetter = settings?.paperSize === "Letter";
  return (
    <div
      style={{
        position: "relative",
        width: isLetter ? "612pt" : "595.3pt",
        height: isLetter ? "792pt" : "841.9pt",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
const EXEC_TB_PAD: React.CSSProperties = {
  paddingTop: "3.6pt",
  paddingBottom: "3.6pt",
  paddingLeft: "7.2pt",
  paddingRight: "7.2pt",
  boxSizing: "border-box",
};

const EXEC_PAGE1_JOBS: any[] = [
  {
    id: "e1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Start with a short overview of your role and main responsibilities. Then add 3\u20134 strong achievement bullets below.",
    bullets: [
      "Describe a key achievement using numbers (e.g. reduced costs by X%, improved speed by Y%, increased revenue).",
      "Highlight leadership or project results. Include team size, timeline, and measurable outcome whenever possible.",
      "Show how you improved a process or system. Quantify the impact (time saved, productivity gain, error reduction).",
      "Mention collaboration with leadership or other departments and the positive result it created.",
    ],
  },
  {
    id: "e2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Explain how you improved efficiency or quality. Add a clear metric if available.",
      "Describe how you supported or developed others (mentoring, training, coaching) and the outcome.",
      "Share a tool, system, or process you introduced and the benefit it delivered.",
    ],
  },
  {
    id: "e3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    bullets: [
      "Show your ability to handle multiple priorities while maintaining quality and meeting deadlines.",
      "Describe a problem you identified and fixed. Include the improvement it created.",
      "Highlight cross-functional collaboration and how it helped the team or company succeed.",
    ],
  },
];

const EXEC_2P_PAGE2_JOBS: any[] = [
  {
    id: "e2p_1",
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
    id: "e2p_2",
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

const EXEC_3P_PAGE2_JOBS: any[] = [
  {
    id: "e3p_1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Open with a short statement about how you successfully handled change, multiple projects, or fast-paced environments while delivering consistent results.",
    bullets: [
      "Explain how you organized, prioritized, and tracked multiple projects or shifting priorities to keep everything on schedule.",
      "Give a clear example of quickly learning or implementing a new tool, process, or technology and the positive impact it created.",
      "Describe how you improved communication or collaboration between teams and the measurable benefit that resulted.",
    ],
  },
  {
    id: "e3p_2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Start with a brief statement about your approach to leading teams and developing people to achieve strong results.",
    bullets: [
      "Share a clear leadership result that includes team size, targets exceeded, and the quality level you maintained.",
      "Explain how you mentored or supported the professional growth of colleagues and the outcome of that support.",
      "Mention training sessions, workshops, or knowledge-sharing activities you designed or led and who benefited from them.",
      "Describe how you identified and solved a team or process problem and successfully restored progress or momentum.",
    ],
  },
  {
    id: "e3p_3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Write a short introduction about your commitment to continuous learning and professional growth and how it benefits your work.",
    bullets: [
      "List relevant courses, certifications, or training programs and briefly explain how you applied what you learned.",
      "Share a new method, tool, or practice you introduced that led to improved results or clearer goals.",
      "Explain how you stayed current with industry trends and actively shared useful knowledge with your colleagues.",
      "Mention professional groups, events, or networks you participated in and the practical value you brought back to your work.",
    ],
  },
];

const EXEC_3P_PAGE3_JOBS: any[] = [
  {
    id: "e3p_4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Open with how you contributed to strategy or long-term goals.",
    bullets: [
      "Describe your involvement in shaping vision, goals, or strategic plans.",
      "Give an example of supporting or leading a significant change or transformation.",
      "Highlight cross-functional projects or partnerships you drove and their impact.",
      "Explain how you identified risks early and helped the organization manage them.",
    ],
  },
  {
    id: "e3p_5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Start with your approach to innovation and continuous improvement.",
    bullets: [
      "Describe a new product, process, or service you developed or launched and the result.",
      "Share an example of solving a difficult problem with a creative or resourceful solution.",
      "Explain how you found and captured opportunities for greater efficiency or growth.",
      "Describe how you encouraged new ideas and innovation within your team.",
      "Mention how you measured and tracked the long-term success of the changes you made.",
    ],
  },
];

function ExecutiveHeaderAndFrame({
  c,
  isLetter,
  showContact,
}: {
  c: any;
  isLetter: boolean;
  showContact?: boolean;
}) {
  const nameLeft = isLetter ? "24.8pt" : "30.0pt";
  const nameWidth = isLetter ? "563.0pt" : "534.1pt";
  const profLeft = isLetter ? "24.6pt" : "30.0pt";
  const profWidth = isLetter ? "563.0pt" : "534.1pt";
  const hLineLeft = isLetter ? "29.6pt" : "29.9pt";
  const hLineWidth = isLetter ? "552.7pt" : "534.3pt";
  const vLineLeft = isLetter ? "195.8pt" : "194.1pt";
  const vLineHeight = isLetter ? "654.6pt" : "705.0pt";
  const contactTextLeft = isLetter ? "53.7pt" : "54.0pt";
  const contactTextWidth = isLetter ? "137.2pt" : "134.4pt";

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "11.25pt",
          backgroundColor: "#002060",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: nameLeft,
          top: "29.2pt",
          width: nameWidth,
          height: "42.0pt",
          ...EXEC_TB_PAD,
          textAlign: "center",
          fontFamily: '"Libre Baskerville", Georgia, serif',
          fontSize: "26pt",
          fontWeight: 400,
          color: "#000000",
          letterSpacing: "0.14em",
          lineHeight: "31pt",
          textTransform: "uppercase",
        }}
      >
        {c?.fullName || "JENNIFER DAVIS"}
      </div>

      <div
        style={{
          position: "absolute",
          left: profLeft,
          top: "77.4pt",
          width: profWidth,
          height: "26.2pt",
          ...EXEC_TB_PAD,
          textAlign: "center",
          fontFamily: '"Manrope", sans-serif',
          fontSize: "11pt",
          fontWeight: 400,
          color: "#44546A",
          letterSpacing: "0.26em",
          lineHeight: "14pt",
          textTransform: "uppercase",
        }}
      >
        {c?.profession || c?.title || "YOUR PROFESSION"}
      </div>

      <div
        style={{
          position: "absolute",
          left: hLineLeft,
          top: "114.7pt",
          width: hLineWidth,
          height: "1.25pt",
          backgroundColor: "#DDE0F7",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: vLineLeft,
          top: "122.2pt",
          width: "1.25pt",
          height: vLineHeight,
          backgroundColor: "#DDE0F7",
        }}
      />

      {showContact && (
        <div
          style={{
            position: "absolute",
            left: "30pt",
            top: "123pt",
            width: "160pt",
            display: "flex",
            flexDirection: "column",
            gap: "6pt",
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            fontWeight: 400,
            color: "#000000",
          }}
        >
          {[
            { icon: <ExecutivePhoneIcon size={29} />, text: c.phone || "(555) 555-5555" },
            { icon: <ExecutiveEmailIcon size={25} />, text: c.email || "youremail@mail.com" },
            { icon: <ExecutiveLinkedInIcon size={27} />, text: c.linkedin || "Linkedin.com/name" },
            { icon: <ExecutiveHomeIcon size={27} />, text: c.location || "City, State/Province" },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8pt",
              }}
            >
              <div
                style={{
                  width: "21pt",
                  height: "21pt",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </div>
              <span style={{ lineHeight: 1.2, wordBreak: "break-word" }}>{row.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ExecutiveExperienceBlock({ jobs }: { jobs: any[] }) {
  return (
    <div
      style={{
        fontFamily: '"Rubik", sans-serif',
        fontSize: "10pt",
        fontWeight: 400,
        color: "#000000",
        lineHeight: "13.8pt",
      }}
    >
      {jobs.map((job, idx) => {
        const companyText =
          !job?.company || job.company === "Company Name"
            ? "Company Name / Location"
            : job.company;
        const overviewText = job?.summaryParagraph || job?.overview;
        return (
          <div key={job?.id || idx}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontWeight: 700,
                color: "#000000",
                lineHeight: "13.8pt",
              }}
            >
              <span style={{ textTransform: "uppercase", fontWeight: 700 }}>
                {job?.title || "ENTER YOUR JOB TITLE HERE"}
              </span>
              <span style={{ whiteSpace: "nowrap", marginLeft: "8pt", fontWeight: 700 }}>
                {job?.period || "Date \u2013 Date"}
              </span>
            </div>

            <div style={{ fontWeight: 400, color: "#000000", lineHeight: "13.8pt" }}>
              {companyText}
            </div>

            <div style={{ height: "13.8pt" }} />

            {overviewText && (
              <>
                <div style={{ fontWeight: 400, color: "#000000", lineHeight: "13.8pt" }}>
                  {overviewText}
                </div>
                <div style={{ height: "13.8pt" }} />
              </>
            )}

            {job?.bullets && job.bullets.length > 0 && (
              <ul
                style={{
                  margin: 0,
                  marginLeft: "11pt",
                  paddingLeft: "2pt",
                  listStyleType: "disc",
                }}
              >
                {job.bullets.map((b: string, bIdx: number) => (
                  <li
                    key={bIdx}
                    style={{
                      lineHeight: "13.8pt",
                      marginBottom: "0pt",
                      paddingLeft: "2pt",
                    }}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {idx < jobs.length - 1 && <div style={{ height: "13.8pt" }} />}
          </div>
        );
      })}
    </div>
  );
}

export function Series2(props: any) {
  const c: any = props.content || props.c || {};
  const style: any = props.style || props.settings?.style || {};
  const settings: any = props.settings || {};
  const pageIndex: number = typeof props.pageIndex === "number" ? props.pageIndex : 0;
  const targetPages: number = props.targetPages || settings?.targetPages || style?.pageCount || style?.targetPages || 3;
  const isLetter: boolean =
    props.paperSize === "Letter" ||
    settings?.paperSize === "Letter" ||
    (style?.pageSize === "Letter" || style?.paperSize === "Letter");
  const onSelectSection = props.onSelectSection;

  const profSkills: string[] =
    c.skills && c.skills.length > 0
      ? c.skills.slice(0, 6)
      : [
          "Time Management",
          "Critical Thinking",
          "Leadership",
          "Problem Solving",
          "Creativity",
          "Attention to Detail",
        ];

  const techSkills: string[] =
    c.technicalSkills && c.technicalSkills.length > 0
      ? c.technicalSkills.slice(0, 4)
      : [
          "Microsoft Office Suite",
          "Canva & Adobe Photoshop",
          "WordPress Basics",
          "SEO",
        ];

  const rawEdu0School = c.education?.[0]?.school;
  const edu0School =
    !rawEdu0School || rawEdu0School === "University Name"
      ? "University Name - Location"
      : rawEdu0School;
  const rawEdu2Degree = c.education?.[2]?.degree;
  const edu2Degree =
    !rawEdu2Degree || rawEdu2Degree.includes("WORKSHOP")
      ? "COURSE OR PROGRAM"
      : rawEdu2Degree;
  const rawEdu2School = c.education?.[2]?.school;
  const edu2School =
    !rawEdu2School || rawEdu2School.includes("PLATFORM")
      ? "Institution or Platform"
      : rawEdu2School;
  const rawEdu2Year = c.education?.[2]?.year || c.education?.[2]?.date;
  const edu2Year =
    !rawEdu2Year || rawEdu2Year === "DATE"
      ? "Completion Year"
      : rawEdu2Year;

  const eduList = [
    {
      id: "ed1",
      degree: c.education?.[0]?.degree || "DEGREE TITLE",
      school: edu0School,
      year: c.education?.[0]?.year || c.education?.[0]?.date || "Graduation Year",
    },
    {
      id: "ed2",
      degree: c.education?.[1]?.degree || c.certifications?.[0]?.name || "CERTIFICATION NAME",
      school: c.education?.[1]?.school || c.certifications?.[0]?.issuer || "Issuing Organization",
      year: c.education?.[1]?.year || c.education?.[1]?.date || c.certifications?.[0]?.date || "Year Earned",
    },
    {
      id: "ed3",
      degree: edu2Degree,
      school: edu2School,
      year: edu2Year,
    },
  ];

  const allExp = c.experience && c.experience.length >= 3 ? c.experience : EXEC_PAGE1_JOBS;
  const page1Jobs = allExp.slice(0, 3);
  const page2Jobs =
    targetPages === 2
      ? EXEC_2P_PAGE2_JOBS
      : allExp.length >= 6
      ? allExp.slice(3, 6)
      : EXEC_3P_PAGE2_JOBS;
  const page3Jobs =
    allExp.length >= 8 ? allExp.slice(6, 8) : EXEC_3P_PAGE3_JOBS;

  const awardsList = [0, 1, 2, 3].map((idx) => {
    const item = c.awards?.[idx];
    const isOldDefault =
      !item ||
      item.title === "AWARD OR HONOR TITLE" ||
      item.title === "Award or Honor Title" ||
      item.title === "Performance Excellence Award";
    return {
      id: item?.id || `aw_${idx}`,
      title: isOldDefault ? "AWARD/ACHIEVEMENT" : item.title,
      issuer: isOldDefault ? "Organization Name" : item.issuer,
      year: isOldDefault ? "Date" : item.year || item.date || "Date",
    };
  });

  const volunteerList = [0, 1, 2, 3].map((idx) => {
    const item = c.volunteering?.[idx];
    const isOldDefault =
      !item ||
      item.role === "VOLUNTEER ROLE / TITLE" ||
      item.role === "Volunteer Role / Title";
    return {
      id: item?.id || `vl_${idx}`,
      organization: isOldDefault ? "NAME OF ORGANIZATION" : item.organization,
      role: isOldDefault ? "Your Role" : item.role,
      description: isOldDefault ? "Description or Location" : item.description || "Description or Location",
      period: isOldDefault ? "Date Range" : item.period || item.date || "Date Range",
    };
  });

  const profDevList = [0, 1, 2, 3].map((idx) => {
    const item = c.courses?.[idx];
    const isOldDefault =
      !item ||
      item.title === "Course or Training Name" ||
      item.title === "Course or Training Title" ||
      item.title === "Workshop or Seminar Title" ||
      item.title === "Online Program or Specialization" ||
      item.title === "Professional Development Course";
    return {
      id: item?.id || `pd_${idx}`,
      title: isOldDefault ? "COURSE / WORKSHOP / CLASS" : item.title,
      year: isOldDefault ? "DATE" : item.year || item.date || "DATE",
      institution: isOldDefault
        ? "UNIVERSITY / COMPANY / PLATFORM / LOCATION"
        : item.institution,
    };
  });

  const membershipsList = [0, 1, 2].map((idx) => {
    const item = c.memberships?.[idx];
    const isOldDefault =
      !item ||
      item.role === "Member" ||
      item.role === "Active Member" ||
      item.organization === "Professional Organization Name";
    return {
      id: item?.id || `mb_${idx}`,
      organization: isOldDefault ? "NAME OF ORGANIZATION" : item.organization,
      role: isOldDefault ? "Your Role" : item.role,
      description: item?.description || "Description or Location",
      period: isOldDefault ? "Date Range" : item.period || item.date || "Date Range",
    };
  });

  const refsList = [0, 1, 2, 3].map((idx) => {
    const item = c.references?.[idx];
    return {
      id: item?.id || `rf_${idx}`,
      name:
        !item?.name || item.name === "Reference Name"
          ? "REFERENCE NAME HERE"
          : item.name,
      title: item?.title || "Job Title",
      company:
        !item?.company || item.company === "Company Name"
          ? "Company or Institution"
          : item.company,
      phone: item?.phone || "(555) 555-5555",
      email: item?.email || "reference@mail.com",
    };
  });

  const headingStyle: React.CSSProperties = {
    fontFamily: '"Lato", sans-serif',
    fontSize: "13pt",
    fontWeight: 400,
    color: "#1F3C88",
    letterSpacing: "0.16em",
    lineHeight: "15.5pt",
    textTransform: "uppercase",
  };

  const leftColX = isLetter ? "24.6pt" : "24.8pt";
  const leftColW = isLetter ? "166.3pt" : "163.5pt";
  const rightColX = isLetter ? "200.6pt" : "199.5pt";
  const rightColW = isLetter ? "387.4pt" : "372.0pt";

  const pageBoxStyle: React.CSSProperties = {
    position: "relative",
    width: isLetter ? "612pt" : "595.3pt",
    height: isLetter ? "792pt" : "841.9pt",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  if (pageIndex === 1) {
    return (
      <div style={pageBoxStyle}>
        <ExecutiveHeaderAndFrame c={c} isLetter={isLetter} showContact={false} />

        <div
          onClick={() => onSelectSection?.("awards")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "122.2pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          <div>ACHIEVEMENTS</div>
          <div>&amp; AWARDS</div>
        </div>

        <div
          onClick={() => onSelectSection?.("awards")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "168.4pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.8pt",
            cursor: "pointer",
          }}
        >
          {awardsList.map((aw, idx) => (
            <div key={aw.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", lineHeight: "13.8pt" }}>{aw.title}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{aw.issuer}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{aw.year}</div>
              {idx < awardsList.length - 1 && <div style={{ height: "13.8pt" }} />}
            </div>
          ))}
        </div>

        <div
          onClick={() => onSelectSection?.("volunteering")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "453.5pt" : "480.6pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          <div>VOLUNTEER</div>
          <div>EXPERIENCE</div>
        </div>

        <div
          onClick={() => onSelectSection?.("volunteering")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "494.2pt" : "521.3pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.8pt",
            cursor: "pointer",
          }}
        >
          {volunteerList.map((vl, idx) => (
            <div key={vl.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", lineHeight: "13.8pt" }}>
                {vl.organization}
              </div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{vl.role}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{vl.description}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{vl.period}</div>
              {idx < volunteerList.length - 1 && <div style={{ height: "13.8pt" }} />}
            </div>
          ))}
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "122.2pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            display: "flex",
            alignItems: "baseline",
            cursor: "pointer",
          }}
        >
          <span style={headingStyle}>PROFESSIONAL EXPERIENCE</span>
          <span
            style={{
              fontFamily: '"Lato", sans-serif',
              fontSize: "10pt",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#1F3C88",
              letterSpacing: "0.14em",
              marginLeft: "10pt",
            }}
          >
            Continued
          </span>
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "149.8pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            cursor: "pointer",
          }}
        >
          <ExecutiveExperienceBlock jobs={page2Jobs} />
        </div>

        {targetPages === 2 && (
          <>
            <div
              onClick={() => onSelectSection?.("courses")}
              style={{
                position: "absolute",
                left: rightColX,
                top: isLetter ? "578.4pt" : "619.9pt",
                width: rightColW,
                ...EXEC_TB_PAD,
                ...headingStyle,
                cursor: "pointer",
              }}
            >
              PROFESSIONAL DEVELOPMENT
            </div>

            <div
              onClick={() => onSelectSection?.("courses")}
              style={{
                position: "absolute",
                left: rightColX,
                top: isLetter ? "603.3pt" : "645.1pt",
                width: rightColW,
                ...EXEC_TB_PAD,
                fontFamily: '"Rubik", sans-serif',
                fontSize: "10pt",
                color: "#000000",
                lineHeight: "13.8pt",
                cursor: "pointer",
              }}
            >
              {profDevList.map((pd, idx) => (
                <div key={pd.id || idx}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      lineHeight: "13.8pt",
                    }}
                  >
                    <span>{pd.title}</span>
                    <span style={{ whiteSpace: "nowrap", marginLeft: "8pt" }}>{pd.year}</span>
                  </div>
                  <div style={{ fontWeight: 400, textTransform: "uppercase", lineHeight: "13.8pt" }}>
                    {pd.institution}
                  </div>
                  {idx < profDevList.length - 1 && <div style={{ height: "13.8pt" }} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (pageIndex >= 2) {
    return (
      <div style={pageBoxStyle}>
        <ExecutiveHeaderAndFrame c={c} isLetter={isLetter} showContact={false} />

        <div
          onClick={() => onSelectSection?.("memberships")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "122.2pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          MEMBERSHIPS
        </div>

        <div
          onClick={() => onSelectSection?.("memberships")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "147.5pt" : "148.2pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.8pt",
            cursor: "pointer",
          }}
        >
          {membershipsList.map((mb, idx) => (
            <div key={mb.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", lineHeight: "13.8pt" }}>
                {mb.organization}
              </div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{mb.role}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{mb.description}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{mb.period}</div>
              {idx < membershipsList.length - 1 && <div style={{ height: "13.8pt" }} />}
            </div>
          ))}
        </div>

        <div
          onClick={() => onSelectSection?.("references")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "351.5pt" : "367.6pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          REFERENCES
        </div>

        <div
          onClick={() => onSelectSection?.("references")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "376.2pt" : "393.0pt",
            width: leftColW,
            ...EXEC_TB_PAD,
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.8pt",
            cursor: "pointer",
          }}
        >
          {refsList.map((rf, idx) => (
            <div key={rf.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase", lineHeight: "13.8pt" }}>
                {rf.name}
              </div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{rf.title}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{rf.company}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{rf.phone}</div>
              <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{rf.email}</div>
              {idx < refsList.length - 1 && <div style={{ height: "27.6pt" }} />}
            </div>
          ))}
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "122.2pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            display: "flex",
            alignItems: "baseline",
            cursor: "pointer",
          }}
        >
          <span style={headingStyle}>PROFESSIONAL EXPERIENCE</span>
          <span
            style={{
              fontFamily: '"Lato", sans-serif',
              fontSize: "10pt",
              fontStyle: "italic",
              fontWeight: 400,
              color: "#1F3C88",
              letterSpacing: "0.14em",
              marginLeft: "10pt",
            }}
          >
            Continued
          </span>
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "147.6pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            cursor: "pointer",
          }}
        >
          <ExecutiveExperienceBlock jobs={page3Jobs} />
        </div>

        <div
          onClick={() => onSelectSection?.("courses")}
          style={{
            position: "absolute",
            left: rightColX,
            top: isLetter ? "579.9pt" : "621.9pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          PROFESSIONAL DEVELOPMENT
        </div>

        <div
          onClick={() => onSelectSection?.("courses")}
          style={{
            position: "absolute",
            left: rightColX,
            top: isLetter ? "606.1pt" : "647.6pt",
            width: rightColW,
            ...EXEC_TB_PAD,
            fontFamily: '"Rubik", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.8pt",
            cursor: "pointer",
          }}
        >
          {profDevList.map((pd, idx) => (
            <div key={pd.id || idx}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  lineHeight: "13.8pt",
                }}
              >
                <span>{pd.title}</span>
                <span style={{ whiteSpace: "nowrap", marginLeft: "8pt" }}>{pd.year}</span>
              </div>
              <div style={{ fontWeight: 400, textTransform: "uppercase", lineHeight: "13.8pt" }}>
                {pd.institution}
              </div>
              {idx < profDevList.length - 1 && <div style={{ height: "13.8pt" }} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Page 1 (pageIndex === 0)
  return (
    <div style={pageBoxStyle}>
      <ExecutiveHeaderAndFrame c={c} isLetter={isLetter} showContact={true} />

      <div
        onClick={() => onSelectSection?.("summary")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "122.2pt",
          width: rightColW,
          ...EXEC_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        PROFESSIONAL SUMMARY
      </div>

      <div
        onClick={() => onSelectSection?.("summary")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "147.7pt",
          width: rightColW,
          ...EXEC_TB_PAD,
          fontFamily: '"Rubik", sans-serif',
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          lineHeight: "13.8pt",
          cursor: "pointer",
        }}
      >
        {c.summary}
      </div>

      <div
        onClick={() => onSelectSection?.("skills")}
        style={{
          position: "absolute",
          left: leftColX,
          top: isLetter ? "256.9pt" : "255.4pt",
          width: leftColW,
          ...EXEC_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        SKILLS
      </div>

      <div
        onClick={() => onSelectSection?.("skills")}
        style={{
          position: "absolute",
          left: "24.6pt",
          top: isLetter ? "284.1pt" : "281.8pt",
          width: leftColW,
          ...EXEC_TB_PAD,
          fontFamily: '"Rubik", sans-serif',
          fontSize: "10pt",
          color: "#000000",
          lineHeight: "19.5pt",
          cursor: "pointer",
        }}
      >
        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", lineHeight: "19.5pt" }}>
          <span style={{ display: "inline-block", width: "18pt", fontSize: "11pt" }}>{"\u2022"}</span>
          <span>PROFESSIONAL</span>
        </div>
        {profSkills.map((sk, i) => (
          <div key={i} style={{ paddingLeft: 0, fontWeight: 400, lineHeight: "19.5pt" }}>
            {sk}
          </div>
        ))}

        <div style={{ height: "16pt" }} />

        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", lineHeight: "19.5pt" }}>
          <span style={{ display: "inline-block", width: "18pt", fontSize: "11pt" }}>{"\u2022"}</span>
          <span>TECHNICAL</span>
        </div>
        {techSkills.map((sk, i) => (
          <div key={i} style={{ paddingLeft: 0, fontWeight: 400, lineHeight: "19.5pt" }}>
            {sk}
          </div>
        ))}
      </div>

      <div
        onClick={() => onSelectSection?.("education")}
        style={{
          position: "absolute",
          left: leftColX,
          top: isLetter ? "561.4pt" : "583.0pt",
          width: leftColW,
          ...EXEC_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        <div>EDUCATION &amp;</div>
        <div>CERTIFICATIONS</div>
      </div>

      <div
        onClick={() => onSelectSection?.("education")}
        style={{
          position: "absolute",
          left: leftColX,
          top: isLetter ? "606.0pt" : "627.8pt",
          width: leftColW,
          ...EXEC_TB_PAD,
          fontFamily: '"Rubik", sans-serif',
          fontSize: "10pt",
          color: "#000000",
          lineHeight: "13.8pt",
          cursor: "pointer",
        }}
      >
        {eduList.map((ed, idx) => (
          <div key={ed.id || idx}>
            <div style={{ fontWeight: 700, textTransform: "uppercase", lineHeight: "13.8pt" }}>{ed.degree}</div>
            <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{ed.school}</div>
            <div style={{ fontWeight: 400, lineHeight: "13.8pt" }}>{ed.year}</div>
            {idx < eduList.length - 1 && <div style={{ height: "13.8pt" }} />}
          </div>
        ))}
      </div>

      <div
        onClick={() => onSelectSection?.("experience")}
        style={{
          position: "absolute",
          left: rightColX,
          top: isLetter ? "257.0pt" : "255.4pt",
          width: rightColW,
          ...EXEC_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        PROFESSIONAL EXPERIENCE
      </div>

      <div
        onClick={() => onSelectSection?.("experience")}
        style={{
          position: "absolute",
          left: rightColX,
          top: isLetter ? "284.1pt" : "281.8pt",
          width: rightColW,
          ...EXEC_TB_PAD,
          cursor: "pointer",
        }}
      >
        <ExecutiveExperienceBlock jobs={page1Jobs} />
      </div>
    </div>
  );
}
const ELEGANT_TB_PAD: React.CSSProperties = {
  paddingTop: "3.6pt",
  paddingBottom: "3.6pt",
  paddingLeft: "7.2pt",
  paddingRight: "7.2pt",
  boxSizing: "border-box",
};

const ELEGANT_PAGE1_JOBS: any[] = [
  {
    id: "el_e1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "Your experience section should highlight not just what you did, but how your work created value. Keep each role focused, relevant, and results-driven.",
    bullets: [
      "Summarize your key responsibilities in 2\u20133 impactful sentences.",
      "Emphasize achievements that align with the role you\u2019re applying for.",
      "Use strong action verbs like led, improved, developed, or implemented.",
      "Focus on outcomes rather than daily duties.",
    ],
  },
  {
    id: "el_e2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Quantify your results whenever possible \u2014 numbers immediately build credibility and attract attention.",
    bullets: [
      "Use the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].",
      "Example: \u201CBoosted sales by 20% through a new client engagement strategy.\u201D",
      "Include metrics such as time saved, growth achieved, or efficiency improved.",
    ],
  },
  {
    id: "el_e3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "A polished resume shows professionalism and care. Review your work carefully before submitting.",
    bullets: [
      "Proofread for grammar, spelling, and formatting consistency.",
      "Double-check job titles, dates, and contact details.",
      "Keep your layout clean, balanced, and easy to read.",
    ],
  },
];

const ELEGANT_2P_PAGE2_JOBS: any[] = [
  {
    id: "el_2p_1",
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
    id: "el_2p_2",
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

const ELEGANT_3P_PAGE2_JOBS: any[] = [
  {
    id: "el_3p_1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "As you expand your experience section, focus on showing career progression and versatility. Employers value consistency, adaptability, and continuous growth across roles.",
    bullets: [
      "Highlight promotions, increased responsibilities, or expanded scope of work.",
      "Emphasize collaboration \u2014 mention cross-functional teamwork or mentoring others.",
      "Showcase how each role built upon the last, reflecting professional development.",
      "Use brief yet impactful statements to demonstrate initiative and reliability.",
    ],
  },
  {
    id: "el_3p_2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Strong experience entries don\u2019t just describe what you did \u2014 they show how you made a difference. Focus on problem-solving and innovation.",
    bullets: [
      "Illustrate moments where you identified issues and implemented effective solutions.",
      "Mention tools, systems, or methods you introduced that improved performance.",
      "Demonstrate adaptability in dynamic or fast-paced environments.",
      "Example: \u201CStreamlined reporting processes, cutting project turnaround time by 25%.\u201D",
    ],
  },
  {
    id: "el_3p_3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "To maintain a professional flow, ensure your continued experience section feels cohesive with the rest of your resume. Attention to structure and clarity enhances overall readability.",
    bullets: [
      "Keep formatting and spacing consistent with previous sections.",
      "Avoid redundancy \u2014 let each role contribute something new to your story.",
      "If you have older roles, summarize them briefly while keeping focus on relevance.",
      "End this section with roles that highlight both expertise and career growth, demonstrating how each step in your journey has prepared you for greater responsibilities and more impactful contributions.",
    ],
  },
];

const ELEGANT_3P_PAGE3_JOBS: any[] = [
  {
    id: "el_3p_4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "As you conclude your experience section, focus on leadership, strategic impact, and long-term achievements. This final segment should reinforce your growth trajectory and showcase the depth of your expertise.",
    bullets: [
      "Emphasize leadership roles, decision-making, and mentorship experience.",
      "Highlight contributions that influenced company direction, performance, or culture.",
      "Include strategic initiatives that demonstrate innovation and measurable results.",
      "Example: \u201CLed a cross-departmental initiative that improved client satisfaction by 40%.\u201D",
    ],
  },
  {
    id: "el_3p_5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Older or early-career roles can be summarized more briefly while maintaining professionalism and relevance. They help illustrate continuity and the foundation of your current strengths.",
    bullets: [
      "Combine early positions if they share similar responsibilities or focus areas.",
      "Use concise phrasing to maintain readability and visual flow.",
      "Focus on transferable skills such as teamwork, communication, and adaptability.",
      "Conclude this section with roles that demonstrate steady growth, proven reliability, and a sustained commitment to professional excellence.",
    ],
  },
];

function ElegantHeaderAndFrame({
  c,
  isLetter,
  showContact,
}: {
  c: any;
  isLetter: boolean;
  showContact?: boolean;
}) {
  const nameW = isLetter ? "560pt" : "544pt";
  const nameLeft = isLetter ? "26pt" : "25.6pt";
  const hLineW = isLetter ? "552pt" : "535pt";
  const vLineLeft = isLetter ? "195.8pt" : "194.1pt";
  const vLineH = isLetter ? "654pt" : "706pt";

  return (
    <>
      {/* Name: | JAMES SMITH | with #D0CECE vertical pipes */}
      <div
        style={{
          position: "absolute",
          left: nameLeft,
          top: "27pt",
          width: nameW,
          height: "45.8pt",
          ...ELEGANT_TB_PAD,
          textAlign: "center",
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: "28pt",
          fontWeight: 400,
          color: "#000000",
          letterSpacing: "0.18em",
          lineHeight: "34pt",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "#D0CECE", marginRight: "6pt" }}>|</span>
        <span>{c?.fullName || "JAMES SMITH"}</span>
        <span style={{ color: "#D0CECE", marginLeft: "6pt" }}>|</span>
      </div>

      {/* Profession: YOUR PROFESSION */}
      <div
        style={{
          position: "absolute",
          left: nameLeft,
          top: "76pt",
          width: nameW,
          height: "25.5pt",
          ...ELEGANT_TB_PAD,
          textAlign: "center",
          fontFamily: '"Lato", sans-serif',
          fontSize: "11pt",
          fontWeight: 400,
          color: "#44546A",
          letterSpacing: "0.26em",
          lineHeight: "14pt",
          textTransform: "uppercase",
        }}
      >
        {c?.profession || c?.title || "YOUR PROFESSION"}
      </div>

      {/* Top Horizontal Rule (#D0CECE) */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "112pt",
          width: hLineW,
          height: "0.75pt",
          backgroundColor: "#D0CECE",
        }}
      />

      {/* Vertical Divider Line (#D0CECE) */}
      <div
        style={{
          position: "absolute",
          left: vLineLeft,
          top: "120pt",
          width: "0.75pt",
          height: vLineH,
          backgroundColor: "#D0CECE",
        }}
      />

      {showContact && (
        <>
          <div
            style={{
              position: "absolute",
              left: isLetter ? "27.4pt" : "25.6pt",
              top: "121.9pt",
              width: "154.5pt",
              ...ELEGANT_TB_PAD,
              fontFamily: '"Montserrat", sans-serif',
              fontSize: "13.5pt",
              fontWeight: 500,
              color: "#000000",
              letterSpacing: "0.22em",
              lineHeight: "17pt",
              textTransform: "uppercase",
            }}
          >
            CONTACT
          </div>

          <div style={{ position: "absolute", left: "30pt", top: "149pt", width: "19.2pt", height: "19.2pt" }}>
            <ElegantPhoneIcon size={24} />
          </div>
          <div style={{ position: "absolute", left: "32.5pt", top: "177pt", width: "13.6pt", height: "13.6pt" }}>
            <ElegantEmailIcon size={18} />
          </div>
          <div style={{ position: "absolute", left: "32.5pt", top: "202pt", width: "13.6pt", height: "13.6pt" }}>
            <ElegantLinkedInIcon size={18} />
          </div>
          <div style={{ position: "absolute", left: "32.5pt", top: "228pt", width: "13.6pt", height: "13.6pt" }}>
            <ElegantLocationIcon size={18} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "53.2pt",
              top: "146.5pt",
              width: "127pt",
              ...ELEGANT_TB_PAD,
              fontFamily: '"Open Sans", sans-serif',
              fontSize: "10pt",
              fontWeight: 400,
              color: "#000000",
              lineHeight: "25.5pt",
            }}
          >
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c?.phone || "(555) 555-5555"}</div>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c?.email || "youremail@mail.com"}</div>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c?.linkedin || "Linkedin.com/name"}</div>
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c?.location || "City, State/Province"}</div>
          </div>
        </>
      )}
    </>
  );
}

function ElegantExperienceBlock({ jobs }: { jobs: any[] }) {
  return (
    <div
      style={{
        fontFamily: '"Open Sans", sans-serif',
        fontSize: "10pt",
        fontWeight: 400,
        color: "#000000",
        lineHeight: "13.6pt",
      }}
    >
      {jobs.map((job, idx) => {
        const companyText =
          !job?.company || job.company === "Company Name"
            ? "Company Name / Location"
            : job.company;
        const overviewText = job?.summaryParagraph || job?.overview;
        return (
          <div key={job?.id || idx}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontWeight: 700,
                color: "#000000",
                lineHeight: "13.6pt",
              }}
            >
              <span style={{ textTransform: "uppercase", fontWeight: 700 }}>
                {job?.title || "ENTER YOUR JOB TITLE HERE"}
              </span>
              <span style={{ whiteSpace: "nowrap", marginLeft: "8pt", fontWeight: 700 }}>
                {job?.period || "Date \u2013 Date"}
              </span>
            </div>

            <div style={{ fontWeight: 400, color: "#000000", lineHeight: "13.6pt" }}>
              {companyText}
            </div>

            <div style={{ height: "10pt" }} />

            {overviewText && (
              <>
                <div style={{ fontWeight: 400, color: "#000000", lineHeight: "13.6pt" }}>
                  {overviewText}
                </div>
                <div style={{ height: "10pt" }} />
              </>
            )}

            {job?.bullets && job.bullets.length > 0 && (
              <ul
                style={{
                  margin: 0,
                  marginLeft: "11pt",
                  paddingLeft: "2pt",
                  listStyleType: "disc",
                }}
              >
                {job.bullets.map((b: string, bIdx: number) => (
                  <li
                    key={bIdx}
                    style={{
                      lineHeight: "13.6pt",
                      marginBottom: "1pt",
                      paddingLeft: "2pt",
                    }}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {idx < jobs.length - 1 && <div style={{ height: "13.6pt" }} />}
          </div>
        );
      })}
    </div>
  );
}

export function Series3(props: any) {
  const c: any = props.content || props.c || {};
  const style: any = props.style || props.settings?.style || {};
  const settings: any = props.settings || {};
  const pageIndex: number = typeof props.pageIndex === "number" ? props.pageIndex : 0;
  const targetPages: number = props.targetPages || settings?.targetPages || style?.pageCount || style?.targetPages || 3;
  const isLetter: boolean =
    props.paperSize === "Letter" ||
    settings?.paperSize === "Letter" ||
    style?.pageSize === "Letter" ||
    style?.paperSize === "Letter";
  const onSelectSection = props.onSelectSection;

  const headingStyle: React.CSSProperties = {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: "13.5pt",
    fontWeight: 500,
    color: "#000000",
    letterSpacing: "0.22em",
    lineHeight: "17pt",
    textTransform: "uppercase",
  };

  const leftColX = isLetter ? "27.4pt" : "25.6pt";
  const leftColW = "154.5pt";
  const rightColX = "209.2pt";
  const rightColW = isLetter ? "375pt" : "360.3pt";
  const rightLineW = isLetter ? "366pt" : "350.6pt";

  const pageBoxStyle: React.CSSProperties = {
    position: "relative",
    width: isLetter ? "612pt" : "595.3pt",
    height: isLetter ? "792pt" : "841.9pt",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  const skillsList: string[] =
    c.skills && c.skills.length > 0
      ? c.skills.slice(0, 12)
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

  const eduList = [0, 1, 2].map((idx) => {
    const ed = c.education?.[idx];
    return {
      id: ed?.id || `el_ed_${idx}`,
      degree: ed?.degree || "DEGREE TITLE",
      school: !ed?.school || ed.school === "University Name" ? "University Name - Location" : ed.school,
      year: ed?.year || ed?.date || "Graduation Year",
    };
  });

  const allExp = c.experience && c.experience.length >= 3 ? c.experience : ELEGANT_PAGE1_JOBS;
  const page1Jobs = allExp.slice(0, 3);
  const page2Jobs =
    targetPages === 2
      ? ELEGANT_2P_PAGE2_JOBS
      : allExp.length >= 6
      ? allExp.slice(3, 6)
      : ELEGANT_3P_PAGE2_JOBS;
  const page3Jobs =
    allExp.length >= 8 ? allExp.slice(6, 8) : ELEGANT_3P_PAGE3_JOBS;

  const awardsList = [0, 1, 2, 3].map((idx) => {
    const item = c.awards?.[idx];
    const isOld = !item || item.title === "Award or Honor Title" || item.title === "Performance Excellence Award";
    return {
      id: item?.id || `el_aw_${idx}`,
      title: isOld ? "AWARD/ACHIEVEMENT" : item.title,
      issuer: isOld ? "Organization Name" : item.issuer,
      year: isOld ? "Date" : item.year || item.date || "Date",
    };
  });

  const volunteerList = [0, 1, 2, 3].map((idx) => {
    const item = c.volunteering?.[idx];
    const isOld = !item || item.role === "Volunteer Role / Title" || item.role === "Community Coordinator";
    return {
      id: item?.id || `el_vl_${idx}`,
      title: isOld ? "VOLUNTEER EXPERIENCE" : item.role || "VOLUNTEER EXPERIENCE",
      organization: isOld ? "Organization Name" : item.organization,
      year: isOld ? "Date" : item.period || item.date || "Date",
    };
  });

  const profDevList = [0, 1, 2].map((idx) => {
    const item = c.courses?.[idx];
    const isOld = !item || item.title === "Course or Training Title" || item.title === "Professional Workshop Name";
    return {
      id: item?.id || `el_pd_${idx}`,
      title: isOld ? "COURSE / WORKSHOP / CLASS" : item.title,
      institution: isOld ? "UNIVERSITY / COMPANY / PLATFORM / LOCATION" : item.institution,
      year: isOld ? "DATE" : item.year || item.date || "DATE",
    };
  });

  const refsList = [0, 1, 2, 3].map((idx) => {
    const item = c.references?.[idx];
    const isOld = !item || item.name === "Reference Name" || item.name === "REFERENCE NAME HERE";
    return {
      id: item?.id || `el_rf_${idx}`,
      name: isOld ? "FULL NAME HERE" : item.name,
      title: item?.title || "Job Title",
      company: !item?.company || item.company === "Company Name" ? "Company or Institution" : item.company,
      phone: item?.phone || "(555) 555-5555",
      email: item?.email || "reference@mail.com",
    };
  });

  // PAGE 2
  if (pageIndex === 1) {
    return (
      <div style={pageBoxStyle}>
        <ElegantHeaderAndFrame c={c} isLetter={isLetter} showContact={false} />

        {/* ACHIEVEMENTS */}
        <div
          onClick={() => onSelectSection?.("awards")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "121.9pt",
            width: "164.2pt",
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          ACHIEVEMENTS
        </div>

        <div
          onClick={() => onSelectSection?.("awards")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "146.8pt",
            width: leftColW,
            ...ELEGANT_TB_PAD,
            fontFamily: '"Open Sans", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.6pt",
            cursor: "pointer",
          }}
        >
          {awardsList.map((aw, idx) => (
            <div key={aw.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{aw.title}</div>
              <div>{aw.issuer}</div>
              <div>{aw.year}</div>
              {idx < awardsList.length - 1 && <div style={{ height: "12pt" }} />}
            </div>
          ))}
        </div>

        {/* Left Horizontal Divider above COMMUNITY INVOLVEMENT */}
        <div
          style={{
            position: "absolute",
            left: "30pt",
            top: isLetter ? "440pt" : "448pt",
            width: "144pt",
            height: "0.75pt",
            backgroundColor: "#D0CECE",
          }}
        />

        {/* COMMUNITY INVOLVEMENT */}
        <div
          onClick={() => onSelectSection?.("volunteering")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "452pt" : "460.7pt",
            width: leftColW,
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          <div>COMMUNITY</div>
          <div>INVOLVEMENT</div>
        </div>

        <div
          onClick={() => onSelectSection?.("volunteering")}
          style={{
            position: "absolute",
            left: leftColX,
            top: isLetter ? "494pt" : "502.7pt",
            width: leftColW,
            ...ELEGANT_TB_PAD,
            fontFamily: '"Open Sans", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.6pt",
            cursor: "pointer",
          }}
        >
          {volunteerList.map((vl, idx) => (
            <div key={vl.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{vl.title}</div>
              <div>{vl.organization}</div>
              <div>{vl.year}</div>
              {idx < volunteerList.length - 1 && <div style={{ height: "12pt" }} />}
            </div>
          ))}
        </div>

        {/* EXPERIENCE CONTINUED */}
        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "121.9pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          EXPERIENCE CONTINUED
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "144pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            cursor: "pointer",
          }}
        >
          <ElegantExperienceBlock jobs={page2Jobs} />
        </div>

        {/* In 2-Page mode ONLY: PROFESSIONAL DEVELOPMENT at bottom right */}
        {targetPages === 2 && (
          <>
            <div
              style={{
                position: "absolute",
                left: "214.5pt",
                top: isLetter ? "575pt" : "612pt",
                width: rightLineW,
                height: "0.75pt",
                backgroundColor: "#D0CECE",
              }}
            />

            <div
              onClick={() => onSelectSection?.("courses")}
              style={{
                position: "absolute",
                left: rightColX,
                top: isLetter ? "586.9pt" : "623.6pt",
                width: rightColW,
                ...ELEGANT_TB_PAD,
                ...headingStyle,
                cursor: "pointer",
              }}
            >
              PROFESSIONAL DEVELOPMENT
            </div>

            <div
              onClick={() => onSelectSection?.("courses")}
              style={{
                position: "absolute",
                left: rightColX,
                top: isLetter ? "610.9pt" : "647.7pt",
                width: rightColW,
                ...ELEGANT_TB_PAD,
                fontFamily: '"Open Sans", sans-serif',
                fontSize: "10pt",
                color: "#000000",
                lineHeight: "13.6pt",
                cursor: "pointer",
              }}
            >
              {profDevList.map((pd, idx) => (
                <div key={pd.id || idx}>
                  <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{pd.title}</div>
                  <div style={{ textTransform: "uppercase" }}>{pd.institution}</div>
                  <div style={{ textTransform: "uppercase" }}>{pd.year}</div>
                  {idx < profDevList.length - 1 && <div style={{ height: "12pt" }} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // PAGE 3
  if (pageIndex >= 2) {
    return (
      <div style={pageBoxStyle}>
        <ElegantHeaderAndFrame c={c} isLetter={isLetter} showContact={false} />

        {/* REFERENCES (Left Column) */}
        <div
          onClick={() => onSelectSection?.("references")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "121.9pt",
            width: leftColW,
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          REFERENCES
        </div>

        <div
          onClick={() => onSelectSection?.("references")}
          style={{
            position: "absolute",
            left: leftColX,
            top: "146.6pt",
            width: leftColW,
            ...ELEGANT_TB_PAD,
            fontFamily: '"Open Sans", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.6pt",
            cursor: "pointer",
          }}
        >
          {refsList.map((rf, idx) => (
            <div key={rf.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{rf.name}</div>
              <div>{rf.title}</div>
              <div>{rf.company}</div>
              <div>{rf.phone}</div>
              <div>{rf.email}</div>
              {idx < refsList.length - 1 && <div style={{ height: "27.2pt" }} />}
            </div>
          ))}
        </div>

        {/* EXPERIENCE CONTINUED (Right Column) */}
        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "121.9pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          EXPERIENCE CONTINUED
        </div>

        <div
          onClick={() => onSelectSection?.("experience")}
          style={{
            position: "absolute",
            left: rightColX,
            top: "146.7pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            cursor: "pointer",
          }}
        >
          <ElegantExperienceBlock jobs={page3Jobs} />
        </div>

        {/* Right Horizontal Divider above PROFESSIONAL DEVELOPMENT */}
        <div
          style={{
            position: "absolute",
            left: "214.5pt",
            top: isLetter ? "578pt" : "616pt",
            width: rightLineW,
            height: "0.75pt",
            backgroundColor: "#D0CECE",
          }}
        />

        {/* PROFESSIONAL DEVELOPMENT (Bottom Right) */}
        <div
          onClick={() => onSelectSection?.("courses")}
          style={{
            position: "absolute",
            left: rightColX,
            top: isLetter ? "590.3pt" : "627.4pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            ...headingStyle,
            cursor: "pointer",
          }}
        >
          PROFESSIONAL DEVELOPMENT
        </div>

        <div
          onClick={() => onSelectSection?.("courses")}
          style={{
            position: "absolute",
            left: rightColX,
            top: isLetter ? "614.3pt" : "651.8pt",
            width: rightColW,
            ...ELEGANT_TB_PAD,
            fontFamily: '"Open Sans", sans-serif',
            fontSize: "10pt",
            color: "#000000",
            lineHeight: "13.6pt",
            cursor: "pointer",
          }}
        >
          {profDevList.map((pd, idx) => (
            <div key={pd.id || idx}>
              <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{pd.title}</div>
              <div style={{ textTransform: "uppercase" }}>{pd.institution}</div>
              <div style={{ textTransform: "uppercase" }}>{pd.year}</div>
              {idx < profDevList.length - 1 && <div style={{ height: "12pt" }} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PAGE 1 (pageIndex === 0)
  return (
    <div style={pageBoxStyle}>
      <ElegantHeaderAndFrame c={c} isLetter={isLetter} showContact={true} />

      {/* SUMMARY */}
      <div
        onClick={() => onSelectSection?.("summary")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "121.9pt",
          width: rightColW,
          ...ELEGANT_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        SUMMARY
      </div>

      <div
        onClick={() => onSelectSection?.("summary")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "146.8pt",
          width: rightColW,
          ...ELEGANT_TB_PAD,
          fontFamily: '"Open Sans", sans-serif',
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          lineHeight: "14pt",
          cursor: "pointer",
        }}
      >
        {c.summary ||
          "This section is dedicated to showcasing your most impactful skills and accomplishments. The emphasis is on demonstrating the concrete value you bring and how your contributions will directly support the organization's objectives."}
      </div>

      {/* Left Horizontal Rule above SKILLS */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "272pt",
          width: "143.8pt",
          height: "0.75pt",
          backgroundColor: "#D0CECE",
        }}
      />

      {/* Right Horizontal Rule above EXPERIENCE */}
      <div
        style={{
          position: "absolute",
          left: "214.5pt",
          top: "272pt",
          width: rightLineW,
          height: "0.75pt",
          backgroundColor: "#D0CECE",
        }}
      />

      {/* SKILLS */}
      <div
        onClick={() => onSelectSection?.("skills")}
        style={{
          position: "absolute",
          left: leftColX,
          top: "283.1pt",
          width: leftColW,
          ...ELEGANT_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        SKILLS
      </div>

      <div
        onClick={() => onSelectSection?.("skills")}
        style={{
          position: "absolute",
          left: leftColX,
          top: "307.7pt",
          width: leftColW,
          ...ELEGANT_TB_PAD,
          fontFamily: '"Open Sans", sans-serif',
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          lineHeight: isLetter ? "20.2pt" : "21.8pt",
          cursor: "pointer",
        }}
      >
        {skillsList.map((sk, idx) => (
          <div key={idx}>{sk}</div>
        ))}
      </div>

      {/* Left Horizontal Rule above EDUCATION */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: isLetter ? "574pt" : "594pt",
          width: "144pt",
          height: "0.75pt",
          backgroundColor: "#D0CECE",
        }}
      />

      {/* EDUCATION */}
      <div
        onClick={() => onSelectSection?.("education")}
        style={{
          position: "absolute",
          left: leftColX,
          top: isLetter ? "584pt" : "604pt",
          width: leftColW,
          ...ELEGANT_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        EDUCATION
      </div>

      <div
        onClick={() => onSelectSection?.("education")}
        style={{
          position: "absolute",
          left: leftColX,
          top: isLetter ? "610.5pt" : "631pt",
          width: leftColW,
          ...ELEGANT_TB_PAD,
          fontFamily: '"Open Sans", sans-serif',
          fontSize: "10pt",
          color: "#000000",
          lineHeight: "13.6pt",
          cursor: "pointer",
        }}
      >
        {eduList.map((ed, idx) => (
          <div key={ed.id || idx}>
            <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{ed.degree}</div>
            <div>{ed.school}</div>
            <div>{ed.year}</div>
            {idx < eduList.length - 1 && <div style={{ height: "11pt" }} />}
          </div>
        ))}
      </div>

      {/* EXPERIENCE */}
      <div
        onClick={() => onSelectSection?.("experience")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "283.1pt",
          width: rightColW,
          ...ELEGANT_TB_PAD,
          ...headingStyle,
          cursor: "pointer",
        }}
      >
        EXPERIENCE
      </div>

      <div
        onClick={() => onSelectSection?.("experience")}
        style={{
          position: "absolute",
          left: rightColX,
          top: "307.7pt",
          width: rightColW,
          ...ELEGANT_TB_PAD,
          cursor: "pointer",
        }}
      >
        <ElegantExperienceBlock jobs={page1Jobs} />
      </div>
    </div>
  );
}
const DOUBLE_TB_PAD: React.CSSProperties = {
  paddingTop: "3.6pt",
  paddingBottom: "3.6pt",
  paddingLeft: "7.2pt",
  paddingRight: "7.2pt",
  boxSizing: "border-box",
};

const DOUBLE_PAGE1_JOBS: any[] = [
  {
    id: "dc_e1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Present",
    summaryParagraph:
      "A valuable resume shows you as a results-driven professional whose strengths match employer needs and deliver measurable impact.",
    bullets: [
      "Pinpoint your 3 to 5 most relevant skills that distinguish you in your field.",
      "Use precise, industry-specific terminology to make your expertise clear.",
      "Demonstrate both technical competencies and interpersonal abilities essential to success.",
      "Connect your skills to authentic workplace demands and context.",
      "Incorporate relevant keywords from job postings to optimize your resume for hiring platforms.",
    ],
  },
  {
    id: "dc_e2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Quantify your achievements to clearly show your professional value.",
    bullets: [
      "Spotlight measurable accomplishments, using data and outcomes to support your claims.",
      "Describe projects or initiatives where your involvement was pivotal to success, detailing your role and impact on outcomes.",
      "Select achievements that are tailored to the position you desire, showing your fit and value.",
    ],
  },
  {
    id: "dc_e3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Tailor your resume to show how you can help the team succeed, positioning yourself as an essential asset.",
    bullets: [
      "Match your strengths and achievements to the job requirements.",
      "Emphasize how your expertise drives organizational success, prioritizing employer needs over generic objectives.",
      "Write clearly and confidently, choosing active, value-adding language.",
    ],
  },
];

const DOUBLE_2P_PAGE2_JOBS: any[] = [
  {
    id: "dc_2p_1",
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
    id: "dc_2p_2",
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

const DOUBLE_3P_PAGE2_JOBS: any[] = [
  {
    id: "dc_3p_1",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "To ensure your resume stands out to recruiters and hiring managers, focus on communicating your professional story with authenticity and impact. Your goal is to make your background relevant and memorable.",
    bullets: [
      "Begin each resume section with a strong, action-focused headline that highlights your accomplishments.",
      "Emphasize distinctive career experiences, specialized projects, or unique accomplishments that set you apart from other applicants.",
      "Incorporate well-crafted, concise summaries that effectively communicate your professional goals, values, and career trajectory.",
      "Provide context for your achievements to showcase depth and range.",
      "Include relevant certifications or training to demonstrate ongoing professional development.",
    ],
  },
  {
    id: "dc_3p_2",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Show prospective employers you\u2019re invested in both your work and the workplace. Your ability to collaborate, adapt, and contribute to company culture matters.",
    bullets: [
      "Mention teamwork and collaboration on successful projects.",
      "Highlight your adaptability and eagerness to learn new technologies or processes, demonstrating your readiness to embrace change and grow with evolving business needs.",
      "Include concise references to your leadership experiences, mentoring activities, and cross-functional contributions to showcase your ability to inspire others and collaborate effectively across teams.",
    ],
  },
  {
    id: "dc_3p_3",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Demonstrate professionalism by ensuring your resume communicates clearly and looks polished. Presentation can influence perception as much as content.",
    bullets: [
      "Maintain a clean, consistent formatting style with clear headings and organized sections to ensure your resume is visually appealing and easy for employers to read.",
      "Review your resume thoroughly to identify and correct any spelling, grammar, or punctuation errors, ensuring your document is polished and professional.",
      "Carefully avoid excessive jargon in your resume, instead choosing clear and accessible language that is specifically tailored to resonate with the requirements of the role and the industry.",
      "Use white space and clear headings to organize your resume and make key information easy to find.",
    ],
  },
];

const DOUBLE_3P_PAGE3_JOBS: any[] = [
  {
    id: "dc_3p_4",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Polish the final details of your resume to create a professional impression and make your application stand out.",
    bullets: [
      "Choose uniform and appropriate font styles and sizes across all sections to ensure a polished, consistent, and visually pleasing appearance.",
      "Make sure all text and sections are neatly aligned and evenly spaced to give your resume a balanced, organized, and professional layout.",
      "Use well-structured bullet points throughout your resume to break up information, making each accomplishment or responsibility clear and easy to digest for the reader.",
      "Add clickable links to your LinkedIn, portfolio, or website to give employers quick access to your work or credentials.",
      "Display your contact information\u2014such as phone number, email, and LinkedIn\u2014clearly at the top of your resume, ensuring it is current and easy for employers to find.",
    ],
  },
  {
    id: "dc_3p_5",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    period: "Date \u2013 Date",
    summaryParagraph:
      "Showcase qualities that align you with the company\u2019s culture to illustrate your potential as a team member.",
    bullets: [
      "Elaborate on your communication abilities and relationship-building skills, providing examples of successful collaborations or stakeholder interactions.",
      "Demonstrate a sense of accountability by describing occasions where you proactively identified challenges or solved problems to support team or company goals.",
      "Show enthusiasm for the role and highlight how your values and experience align with the organization\u2019s mission.",
    ],
  },
];

function DoubleColumnHeaderAndFrame({
  c,
  isLetter,
  showContactBar,
  showVerticalLine,
}: {
  c: any;
  isLetter: boolean;
  showContactBar?: boolean;
  showVerticalLine?: boolean;
}) {
  const fullName = (c?.fullName || "OLIVIA ANDERSON").trim();
  const parts = fullName.split(/\s+/);
  const firstWord = parts[0] || "OLIVIA";
  const restWords = parts.slice(1).join(" ") || "ANDERSON";

  const contentW = isLetter ? "552pt" : "535.5pt";
  const vLineLeft = isLetter ? "195.8pt" : "194.1pt";
  const vLineTop = showContactBar ? "148pt" : "122pt";
  const vLineH = isLetter
    ? showContactBar ? "624pt" : "650pt"
    : showContactBar ? "676.8pt" : "700pt";

  return (
    <>
      {/* Top Soft Grey Bar (#D9D9D9) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "7.25pt",
          backgroundColor: "#D9D9D9",
        }}
      />

      {/* Two-Tone Centered Name (OLIVIA in #8496B0, ANDERSON in #767171) */}
      <div
        style={{
          position: "absolute",
          left: "26pt",
          top: "30pt",
          width: isLetter ? "560pt" : "543.3pt",
          height: "45.8pt",
          ...DOUBLE_TB_PAD,
          textAlign: "center",
          fontFamily: '"Rubik", sans-serif',
          fontSize: "28pt",
          fontWeight: 400,
          letterSpacing: "0.22em",
          lineHeight: "34pt",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "#8496B0" }}>{firstWord}</span>
        {restWords && <span style={{ color: "#767171", marginLeft: "10pt" }}>{restWords}</span>}
      </div>

      {/* Profession Subtitle */}
      <div
        style={{
          position: "absolute",
          left: "26pt",
          top: "79pt",
          width: isLetter ? "560pt" : "543.3pt",
          height: "30.8pt",
          ...DOUBLE_TB_PAD,
          textAlign: "center",
          fontFamily: '"Nunito", sans-serif',
          fontSize: "11pt",
          fontWeight: 500,
          color: "#44546A",
          letterSpacing: "0.28em",
          lineHeight: "14pt",
          textTransform: "uppercase",
        }}
      >
        {c?.profession || c?.title || "YOUR PROFESSION"}
      </div>

      {/* Horizontal Divider below Profession */}
      <div
        style={{
          position: "absolute",
          left: "30pt",
          top: "112pt",
          width: contentW,
          height: "0.75pt",
          backgroundColor: "#D9D9D9",
        }}
      />

      {showContactBar && (
        <>
          <div
            style={{
              position: "absolute",
              left: "26pt",
              top: "117pt",
              width: isLetter ? "560pt" : "543.3pt",
              height: "20.8pt",
              ...DOUBLE_TB_PAD,
              textAlign: "center",
              fontFamily: '"Merriweather", Georgia, serif',
              fontSize: "9pt",
              fontWeight: 400,
              color: "#000000",
              lineHeight: "12pt",
              whiteSpace: "nowrap",
            }}
          >
            <span>{c?.phone || "(555) 555-5555"}</span>
            <span style={{ color: "#D9D9D9", margin: "0 10pt" }}>|</span>
            <span>{c?.email || "youremail@mail.com"}</span>
            <span style={{ color: "#D9D9D9", margin: "0 10pt" }}>|</span>
            <span>{c?.linkedin || "Linkedin.com/name"}</span>
            <span style={{ color: "#D9D9D9", margin: "0 10pt" }}>|</span>
            <span>{c?.location || "City, State/Province"}</span>
          </div>

          <div
            style={{
              position: "absolute",
              left: "30pt",
              top: "139pt",
              width: contentW,
              height: "0.75pt",
              backgroundColor: "#D9D9D9",
            }}
          />
        </>
      )}

      {showVerticalLine && (
        <div
          style={{
            position: "absolute",
            left: vLineLeft,
            top: vLineTop,
            width: "0.75pt",
            height: vLineH,
            backgroundColor: "#D9D9D9",
          }}
        />
      )}
    </>
  );
}

function DoubleColumnExperienceBlock({ jobs, isLetter = false }: { jobs: any[]; isLetter?: boolean }) {
  return (
    <div
      style={{
        fontFamily: '"Merriweather", Georgia, serif',
        fontSize: "9pt",
        fontWeight: 400,
        color: "#000000",
        lineHeight: "12.6pt",
      }}
    >
      {jobs.map((job, idx) => {
        const companyText =
          !job?.company || job.company === "Company Name"
            ? "Company Name / Location"
            : job.company;
        const overviewText = job?.summaryParagraph || job?.overview;
        return (
          <div key={job?.id || idx}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontWeight: 700,
                color: "#000000",
                lineHeight: "12.6pt",
              }}
            >
              <span style={{ textTransform: "uppercase", fontWeight: 700 }}>
                {job?.title || "ENTER YOUR JOB TITLE HERE"}
              </span>
              <span style={{ whiteSpace: "nowrap", marginLeft: "8pt", fontWeight: 700 }}>
                {job?.period || "Date \u2013 Date"}
              </span>
            </div>

            <div style={{ fontWeight: 400, color: "#000000", lineHeight: "12.6pt" }}>
              {companyText}
            </div>

            <div style={{ height: "9pt" }} />

            {overviewText && (
              <>
                <div style={{ fontWeight: 400, color: "#000000", lineHeight: "12.6pt" }}>
                  {overviewText}
                </div>
                <div style={{ height: "9pt" }} />
              </>
            )}

            {job?.bullets && job.bullets.length > 0 && (
              <ul
                style={{
                  margin: 0,
                  marginLeft: "11pt",
                  paddingLeft: "2pt",
                  listStyleType: "disc",
                }}
              >
                {job.bullets.map((b: string, bIdx: number) => (
                  <li
                    key={bIdx}
                    style={{
                      lineHeight: "12.6pt",
                      marginBottom: "1pt",
                      paddingLeft: "2pt",
                    }}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {idx < jobs.length - 1 && <div style={{ height: "13pt" }} />}
          </div>
        );
      })}
    </div>
  );
}

const DC_P1_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Present",
    company: "Company Name / Location",
    summary:
      "A valuable resume shows you as a results-driven professional whose strengths match employer needs and deliver measurable impact.",
    bullets: [
      "Pinpoint your 3 to 5 most relevant skills that distinguish you in your field.",
      "Use precise, industry-specific terminology to make your expertise clear.",
      "Demonstrate both technical competencies and interpersonal abilities essential to success.",
      "Connect your skills to authentic workplace demands and context.",
      "Incorporate relevant keywords from job postings to optimize your resume for hiring platforms.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary: "Quantify your achievements to clearly show your professional value.",
    bullets: [
      "Spotlight measurable accomplishments, using data and outcomes to support your claims.",
      "Describe projects or initiatives where your involvement was pivotal to success, detailing your role and impact on outcomes.",
      "Select achievements that are tailored to the position you desire, showing your fit and value.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "Tailor your resume to show how you can help the team succeed, positioning yourself as an essential asset.",
    bullets: [
      "Match your strengths and achievements to the job requirements.",
      "Emphasize how your expertise drives organizational success, prioritizing employer needs over generic objectives.",
      "Write clearly and confidently, choosing active, value-adding language.",
    ],
  },
];

const DC_2P_P2_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "A standout resume clearly connects your skills to business outcomes and shows how you create impact.",
    bullets: [
      "Demonstrate how your technical expertise solves organizational challenges and drives measurable progress in performance or efficiency.",
      "Explain how your analytical thinking, data-driven decisions, and proactive problem-solving contribute to better results and team alignment.",
      "Show how you integrate technical knowledge with business strategy to support objectives such as cost reduction, innovation, or customer satisfaction.",
      "Use clear, keyword-rich phrasing that enhances visibility on hiring systems and communicates your abilities with professionalism and precision.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "A strong resume also tells the story of your growth and the tangible value you deliver.",
    bullets: [
      "Include examples of projects where your leadership or collaboration led to specific, quantifiable achievements in metrics such as revenue, quality, or productivity.",
      "Emphasize professional evolution through new responsibilities, certifications, or skill development that reflect adaptability and initiative.",
      "Use confident, active language to convey accountability, drive, and the ability to inspire trust among colleagues and decision-makers.",
    ],
  },
];

const DC_3P_P2_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "To ensure your resume stands out to recruiters and hiring managers, focus on communicating your professional story with authenticity and impact. Your goal is to make your background relevant and memorable.",
    bullets: [
      "Begin each resume section with a strong, action-focused headline that highlights your accomplishments.",
      "Emphasize distinctive career experiences, specialized projects, or unique accomplishments that set you apart from other applicants.",
      "Incorporate well-crafted, concise summaries that effectively communicate your professional goals, values, and career trajectory.",
      "Provide context for your achievements to showcase depth and range.",
      "Include relevant certifications or training to demonstrate ongoing professional development.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "Show prospective employers you\u2019re invested in both your work and the workplace. Your ability to collaborate, adapt, and contribute to company culture matters.",
    bullets: [
      "Mention teamwork and collaboration on successful projects.",
      "Highlight your adaptability and eagerness to learn new technologies or processes, demonstrating your readiness to embrace change and grow with evolving business needs.",
      "Include concise references to your leadership experiences, mentoring activities, and cross-functional contributions to showcase your ability to inspire others and collaborate effectively across teams.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "Demonstrate professionalism by ensuring your resume communicates clearly and looks polished. Presentation can influence perception as much as content.",
    bullets: [
      "Maintain a clean, consistent formatting style with clear headings and organized sections to ensure your resume is visually appealing and easy for employers to read.",
      "Review your resume thoroughly to identify and correct any spelling, grammar, or punctuation errors, ensuring your document is polished and professional.",
      "Carefully avoid excessive jargon in your resume, instead choosing clear and accessible language that is specifically tailored to resonate with the requirements of the role and the industry.",
      "Use white space and clear headings to organize your resume and make key information easy to find.",
    ],
  },
];

const DC_3P_P3_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "Polish the final details of your resume to create a professional impression and make your application stand out.",
    bullets: [
      "Choose uniform and appropriate font styles and sizes across all sections to ensure a polished, consistent, and visually pleasing appearance.",
      "Make sure all text and sections are neatly aligned and evenly spaced to give your resume a balanced, organized, and professional layout.",
      "Use well-structured bullet points throughout your resume to break up information, making each accomplishment or responsibility clear and easy to digest for the reader.",
      "Add clickable links to your LinkedIn, portfolio, or website to give employers quick access to your work or credentials.",
      "Display your contact information\u2014such as phone number, email, and LinkedIn\u2014clearly at the top of your resume, ensuring it is current and easy for employers to find.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    summary:
      "Showcase qualities that align you with the company\u2019s culture to illustrate your potential as a team member.",
    bullets: [
      "Elaborate on your communication abilities and relationship-building skills, providing examples of successful collaborations or stakeholder interactions.",
      "Demonstrate a sense of accountability by describing occasions where you proactively identified challenges or solved problems to support team or company goals.",
      "Show enthusiasm for the role and highlight how your values and experience align with the organization\u2019s mission.",
    ],
  },
];

function DoubleColHeader({
  content,
  style,
  showContact,
  isA4,
}: {
  content: any;
  style: any;
  showContact: boolean;
  isA4: boolean;
}) {
  const fullName = (content?.fullName || content?.name || "OLIVIA ANDERSON").trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = (nameParts[0] || "OLIVIA").toUpperCase();
  const lastName = (nameParts.slice(1).join(" ") || "ANDERSON").toUpperCase();
  const profession = (content?.profession || "YOUR PROFESSION").toUpperCase();
  const accentFirst = style?.accentColor || "#8496B0";
  const contactParts = [
    content?.phone || "(555) 555-5555",
    content?.email || "youremail@mail.com",
    content?.linkedin || "Linkedin.com/name",
    content?.location || "City, State/Province",
  ].filter(Boolean);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: showContact ? "16pt" : "14pt" }}>
        <div
          style={{
            fontFamily: "'Rubik', sans-serif",
            fontSize: "28pt",
            fontWeight: 400,
            letterSpacing: "7pt",
            lineHeight: 1.15,
            marginBottom: "12pt",
          }}
        >
          <span style={{ color: accentFirst }}>{firstName}</span>{" "}
          <span style={{ color: "#767171" }}>{lastName}</span>
        </div>
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "12pt",
            fontWeight: 500,
            letterSpacing: "3pt",
            color: "#44546A",
            lineHeight: 1.2,
          }}
        >
          {profession}
        </div>
      </div>

      {showContact ? (
        <div
          style={{
            borderTop: "1px solid #CFCDCD",
            borderBottom: "1px solid #CFCDCD",
            padding: "7pt 0",
            textAlign: "center",
            fontFamily: "'Merriweather', Georgia, serif",
            fontSize: "9pt",
            fontWeight: 300,
            lineHeight: 1.25,
            marginBottom: isA4 ? "18pt" : "14pt",
          }}
        >
          {contactParts.map((item: string, idx: number) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: "#D0CECE", margin: "0 10pt" }}>|</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{ borderTop: "1px solid #CFCDCD", marginBottom: isA4 ? "14pt" : "11pt" }} />
      )}
    </div>
  );
}

export function Series4({ content, style, pageIndex = 0, totalPages }: any) {
  const effPages = Number(totalPages || style?.pageCount || (pageIndex >= 2 ? 3 : pageIndex === 1 ? 2 : 1));
  const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
  const bodyFont = "'Merriweather', Georgia, serif";
  const headingFont = "'Source Sans 3', sans-serif";
  const lh =
    pageIndex === 1 && effPages === 3
      ? isA4
        ? "12.2pt"
        : "11.5pt"
      : isA4
        ? "14.2pt"
        : "12.8pt";

  const skills =
    Array.isArray(content?.skills) && content.skills.length > 0
      ? content.skills.slice(0, 11)
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

  const techSkills =
    Array.isArray(content?.technicalSkills) && content.technicalSkills.length > 0
      ? content.technicalSkills.slice(0, 7)
      : [
          "Python Programming",
          "SQL Database Management",
          "Tableau Data Visualization",
          "Salesforce CRM Management",
          "AutoCAD Design Software",
          "Jira Project Management",
          "AWS Cloud Computing",
        ];

  const eduList =
    Array.isArray(content?.education) && content.education.length > 0
      ? content.education.slice(0, 2)
      : [
          { degree: "DEGREE TITLE", school: "University Name, Location", period: "Graduation Year" },
          { degree: "DEGREE TITLE", school: "University Name, Location", period: "Graduation Year" },
        ];

  const certList =
    Array.isArray(content?.certifications) && content.certifications.length > 0
      ? content.certifications.slice(0, 2)
      : [
          { name: "License Name", org: "Authority/Organization", date: "Date" },
          { name: "Certification Name", org: "Issuing Organization", date: "Date" },
        ];

  const awards =
    Array.isArray(content?.awards) && content.awards.length > 0
      ? content.awards.slice(0, 3)
      : [0, 1, 2].map(() => ({
          title: "AWARD/ACHIEVEMENT",
          org: "Organization Name",
          date: "Date",
        }));

  const volunteering =
    Array.isArray(content?.volunteering) && content.volunteering.length > 0
      ? content.volunteering.slice(0, 3)
      : [0, 1, 2].map(() => ({
          role: "VOLUNTEER EXPERIENCE",
          org: "Organization Name",
          date: "Date",
        }));

  const courses =
    Array.isArray(content?.courses) && content.courses.length > 0
      ? content.courses.slice(0, 4)
      : [0, 1, 2, 3].map(() => ({
          title: "COURSE / WORKSHOP / CLASS",
          org: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
          date: "DATE",
        }));

  const refs =
    Array.isArray(content?.references) && content.references.length > 0
      ? content.references.slice(0, 4)
      : [0, 1, 2, 3].map(() => ({
          name: "FULL NAME HERE",
          title: "Job Title",
          company: "Company or Institution",
          phone: "(555) 555-5555",
          email: "reference@mail.com",
        }));

  const userExp = Array.isArray(content?.experience) ? content.experience : [];
  const hasCustomExp =
    userExp.length > 0 &&
    userExp.some(
      (e: any) =>
        e?.title && !String(e.title).toUpperCase().includes("ENTER YOUR JOB TITLE")
    );

  const mapExp = (e: any) => ({
    title: e.title || "ENTER YOUR JOB TITLE HERE",
    period: e.period || "Date \u2013 Date",
    company: [e.company, e.location].filter(Boolean).join(" / ") || "Company Name / Location",
    summary: e.summary || "",
    bullets: Array.isArray(e.bullets) ? e.bullets : [],
  });

  const jobsP1 = hasCustomExp ? userExp.slice(0, 3).map(mapExp) : DC_P1_JOBS;
  const jobsP2 =
    effPages === 3
      ? hasCustomExp
        ? userExp.slice(3, 6).map(mapExp)
        : DC_3P_P2_JOBS
      : hasCustomExp
        ? userExp.slice(3, 5).map(mapExp)
        : DC_2P_P2_JOBS;
  const jobsP3 = hasCustomExp ? userExp.slice(6, 8).map(mapExp) : DC_3P_P3_JOBS;

  const headingStyle: React.CSSProperties = {
    fontFamily: headingFont,
    fontSize: "14.5pt",
    fontWeight: 400,
    letterSpacing: "2.9pt",
    color: "#000000",
    lineHeight: 1.2,
    textTransform: "uppercase",
    marginBottom: isA4 ? "9pt" : "7pt",
  };

  const hDivider: React.CSSProperties = {
    borderTop: "1px solid #CFCDCD",
    margin: isA4 ? "18pt 0 14pt" : "15pt 0 12pt",
  };

  const renderJob = (exp: any, i: number, compact = false) => (
    <div
      key={i}
      style={{
        marginTop: i === 0 ? 0 : compact ? (isA4 ? "12pt" : "9pt") : isA4 ? "18pt" : "14pt",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontWeight: 700,
        }}
      >
        <span>{exp.title}</span>
        <span style={{ whiteSpace: "nowrap" }}>{exp.period}</span>
      </div>
      <div style={{ marginBottom: compact ? "5pt" : "8pt" }}>{exp.company}</div>
      {exp.summary ? (
        <div style={{ marginBottom: compact ? "5pt" : "8pt" }}>{exp.summary}</div>
      ) : null}
      {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: "13.5pt",
            listStyleType: "disc",
            listStylePosition: "outside",
          }}
        >
          {exp.bullets.map((b: string, bi: number) => (
            <li key={bi} style={{ paddingLeft: "1.5pt", marginBottom: 0 }}>
              {b}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
        color: "#000000",
        fontFamily: bodyFont,
        fontSize: "9.4pt",
        fontWeight: 300,
        lineHeight: lh,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: "6.5pt", backgroundColor: "#D0CECE", flexShrink: 0 }} />

      <div
        style={{
          flex: 1,
          padding: isA4 ? "20pt 30pt 26pt" : "16pt 30pt 20pt",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <DoubleColHeader
          content={content}
          style={style}
          showContact={pageIndex === 0}
          isA4={isA4}
        />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Left Column (28.5%, right-aligned) */}
          <div
            style={{
              width: "28.5%",
              paddingRight: "15pt",
              borderRight: "1px solid #CFCDCD",
              textAlign: "right",
              boxSizing: "border-box",
            }}
          >
            {pageIndex === 0 ? (
              <>
                <div style={headingStyle}>SKILLS</div>
                <div>
                  {skills.map((sk: string, i: number) => (
                    <div
                      key={i}
                      style={{ marginBottom: i === skills.length - 1 ? 0 : isA4 ? "13pt" : "10.5pt" }}
                    >
                      {sk}
                    </div>
                  ))}
                </div>

                <div style={hDivider} />

                <div style={headingStyle}>EDUCATION</div>
                <div>
                  {eduList.map((ed: any, i: number) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "14pt" : "12pt" }}>
                      <div style={{ fontWeight: 700 }}>{ed.degree || "DEGREE TITLE"}</div>
                      <div>{ed.school || "University Name, Location"}</div>
                      <div>{ed.period || ed.year || "Graduation Year"}</div>
                    </div>
                  ))}
                </div>

                <div style={hDivider} />

                <div style={headingStyle}>
                  CERTIFICATION
                  <br />
                  &amp; LICENSE
                </div>
                <div>
                  {certList.map((ct: any, i: number) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "14pt" : "12pt" }}>
                      <div style={{ fontWeight: 700 }}>{ct.name || "Certification Name"}</div>
                      <div>{ct.org || "Issuing Organization"}</div>
                      <div>{ct.date || "Date"}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : pageIndex === 1 ? (
              <>
                <div style={headingStyle}>
                  TECHNICAL
                  <br />
                  SKILLS
                </div>
                <div>
                  {techSkills.map((sk: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: i === techSkills.length - 1 ? 0 : isA4 ? "13pt" : "10.5pt",
                      }}
                    >
                      {sk}
                    </div>
                  ))}
                </div>

                <div style={hDivider} />

                <div style={headingStyle}>
                  ACHIEVEMENTS
                  <br />
                  &amp; AWARDS
                </div>
                <div>
                  {awards.map((aw: any, i: number) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "14pt" : "12pt" }}>
                      <div style={{ fontWeight: 700 }}>{aw.title || "AWARD/ACHIEVEMENT"}</div>
                      <div>{aw.org || "Organization Name"}</div>
                      <div>{aw.date || "Date"}</div>
                    </div>
                  ))}
                </div>

                <div style={hDivider} />

                <div style={headingStyle}>
                  COMMUNITY
                  <br />
                  INVOLVEMENT
                </div>
                <div>
                  {volunteering.map((vl: any, i: number) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "14pt" : "12pt" }}>
                      <div style={{ fontWeight: 700 }}>
                        {vl.role || vl.title || "VOLUNTEER EXPERIENCE"}
                      </div>
                      <div>{vl.org || "Organization Name"}</div>
                      <div>{vl.date || "Date"}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={headingStyle}>REFERENCES</div>
                <div>
                  {refs.map((r: any, i: number) => (
                    <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "22pt" : "16pt" }}>
                      <div style={{ fontWeight: 700 }}>{r.name || "FULL NAME HERE"}</div>
                      <div>{r.title || "Job Title"}</div>
                      <div>{r.company || "Company or Institution"}</div>
                      <div>{r.phone || "(555) 555-5555"}</div>
                      <div>{r.email || "reference@mail.com"}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column (71.5%) */}
          <div style={{ width: "71.5%", paddingLeft: "15pt", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            {pageIndex === 0 ? (
              <>
                <div style={headingStyle}>SUMMARY</div>
                <div>
                  {content?.summary ||
                    "Use this section to succinctly present your top strengths and key achievements, highlighting the measurable value you offer and clearly demonstrating how your skills contribute to the organization\u2019s goals. Focus on concrete accomplishments that illustrate your impact, and prioritize results and relevance to employers\u2019 needs, ensuring your profile stands out as a valuable asset to any team."}
                </div>

                <div style={{ borderTop: "1px solid #CFCDCD", margin: isA4 ? "28pt 0 14pt" : "24pt 0 12pt" }} />

                <div style={headingStyle}>EXPERIENCE</div>
                {jobsP1.map((job: any, i: number) => renderJob(job, i, false))}
              </>
            ) : pageIndex === 1 ? (
              <>
                <div style={headingStyle}>EXPERIENCE CONTINUED</div>
                {jobsP2.map((job: any, i: number) => renderJob(job, i, effPages === 3))}

                {effPages !== 3 ? (
                  <>
                    <div style={{ ...hDivider, marginTop: "auto", paddingTop: isA4 ? "10pt" : "6pt" }} />
                    <div style={headingStyle}>PROFESSIONAL DEVELOPMENT</div>
                    {courses.map((cr: any, i: number) => (
                      <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "10pt" : "7pt" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                          <span>{cr.title || "COURSE / WORKSHOP / CLASS"}</span>
                          <span>{(cr.date || "DATE").toUpperCase()}</span>
                        </div>
                        <div>{cr.org || "UNIVERSITY / COMPANY / PLATFORM / LOCATION"}</div>
                      </div>
                    ))}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <div style={headingStyle}>EXPERIENCE CONTINUED</div>
                {jobsP3.map((job: any, i: number) => renderJob(job, i, false))}

                <div style={{ ...hDivider, marginTop: "auto", paddingTop: isA4 ? "10pt" : "6pt" }} />
                <div style={headingStyle}>PROFESSIONAL DEVELOPMENT</div>
                {courses.map((cr: any, i: number) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : isA4 ? "10pt" : "7pt" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>{cr.title || "COURSE / WORKSHOP / CLASS"}</span>
                      <span>{(cr.date || "DATE").toUpperCase()}</span>
                    </div>
                    <div>{cr.org || "UNIVERSITY / COMPANY / PLATFORM / LOCATION"}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IvyPage1Header({
  c,
  isLetter,
  bottomGap,
}: {
  c: any;
  isLetter: boolean;
  bottomGap?: string;
}) {
  const fullName = (c?.fullName || c?.name || "BLAKE TRUMAN").toUpperCase();
  const profession = (c?.profession || "YOUR PROFESSION").toUpperCase();
  const parts = [
    c?.phone || "(555) 555-5555",
    c?.email || "youremail@mail.com",
    c?.linkedin || "Linkedin.com/name",
    c?.location || "City, State/Province",
  ].filter(Boolean);

  return (
    <div style={{ marginBottom: bottomGap || (isLetter ? "12pt" : "14pt") }}>
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "28pt",
          fontWeight: 400,
          letterSpacing: "5.5pt",
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.15,
          marginBottom: "3pt",
        }}
      >
        {fullName}
      </div>
      <div
        style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: "10pt",
          fontWeight: 400,
          letterSpacing: "2.4pt",
          color: "#7F7F7F",
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: "7pt",
        }}
      >
        {profession}
      </div>
      <div
        style={{
          height: "5.5pt",
          borderTop: "1px solid #CFCDCD",
          borderBottom: "1px solid #CFCDCD",
          marginBottom: "7pt",
        }}
      />
      <div
        style={{
          fontFamily: "'Merriweather', Georgia, serif",
          fontSize: "9.5pt",
          fontWeight: 300,
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {parts.map((item: string, idx: number) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span style={{ color: "#BFBFBF", margin: "0 6pt" }}>|</span>
            )}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function IvySectionHeading({
  title,
  letterSpacing,
  marginTop,
  marginBottom,
}: {
  title: string;
  letterSpacing?: string;
  marginTop?: string;
  marginBottom?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10pt",
        marginTop: marginTop ?? "11pt",
        marginBottom: marginBottom ?? "8pt",
      }}
    >
      <div style={{ flex: 1, borderTop: "1px solid #CFCDCD" }} />
      <span
        style={{
          fontFamily: "'Source Sans 3', sans-serif",
          fontSize: "12pt",
          fontWeight: 400,
          letterSpacing: letterSpacing || "2.7pt",
          color: "#000000",
          whiteSpace: "nowrap",
          lineHeight: 1.15,
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1, borderTop: "1px solid #CFCDCD" }} />
    </div>
  );
}

const IVY_1P_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Present",
    company: "Company Name / Location",
    intro:
      "Use this optional paragraph to summarize the role, highlight major accomplishments, note your progression to the position (e.g., via promotion), or briefly introduce the company if it\u2019s lesser-known. You may skip this paragraph to proceed directly to the bullet points.",
    bullets: [
      "Emphasize achievements that showcase value to the employer, such as boosting revenue, cutting costs, or streamlining operations. Use dynamic action verbs like \u201Corchestrated\u201D or \u201Cexecuted\u201D instead of passive phrases like \u201Cresponsible for.\u201D",
      "Highlight your most significant and relevant accomplishments first to capture attention. Incorporate specific metrics where possible to demonstrate measurable impact.",
      "Focus on results that align with the hiring company\u2019s goals, emphasizing leadership and innovation. Tailor contributions to reflect skills that enhance organizational success.",
      "Show your ability to lead projects or teams with clear, quantified examples of success.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Analyze the job posting to identify key skills, qualifications, or keywords emphasized by the employer. Integrate these terms into your resume to align with the role\u2019s requirements and improve ATS compatibility.",
      "Prioritize achievements that demonstrate your ability to meet the job\u2019s demands, using relevant examples. Ensure content reflects the posting\u2019s priorities to increase selection chances.",
      "Maintain ATS-friendly formatting by using clear, keyword-rich descriptions of your accomplishments. Submit the resume in either Word or PDF format for compatibility.",
    ],
  },
];

const IVY_2P_P1_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Present",
    company: "Company Name / Location",
    intro:
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
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Review the job posting to identify essential skills, qualifications, or keywords emphasized by the employer. Incorporate these terms into your resume to align with the role\u2019s requirements and optimize ATS compatibility.",
      "Highlight achievements that demonstrate your fit for the role, using relevant examples. Ensure content reflects the posting\u2019s priorities to enhance selection chances.",
      "Use clear, keyword-rich descriptions of your accomplishments to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
      "Focus on results that meet organizational needs and align examples with the job.",
    ],
  },
];

const IVY_2P_P2_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Maintain a professional email address (e.g., a Gmail account with your name) to convey credibility. Avoid outdated providers to project a modern image.",
      "Review your resume quickly to ensure key achievements and keywords stand out immediately. Bold critical accomplishments or skills to capture the reader\u2019s attention.",
      "Write your resume with clarity and purpose, focusing on achievements that convey your professional value and align with the target role.",
      "Ensure meticulous proofreading to eliminate errors, as inaccuracies can undermine your professionalism. Seek a second review if needed to maintain quality.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Present information in a clear, modern layout that emphasizes key achievements and aligns visually with professional resume standards.",
      "Focus on recent, relevant experience, omitting roles from over 15 years ago to keep content concise. Prioritize your most recent position to highlight current skills.",
      "Maintain a cohesive and professional document layout by ensuring visual balance, clear section separation, and consistent formatting throughout the resume.",
      "Emphasize your adaptability in addressing challenges or driving projects to completion. Include specific contributions that demonstrate your expertise.",
      "Showcase your ability to communicate effectively with stakeholders to achieve project goals. Provide examples that highlight successful outcomes.",
    ],
  },
];

export function Series11({ content: c, style: s, pageIndex, totalPages }: any) {
  const isLetter = String(s?.pageSize || "A4").toLowerCase() === "letter";
  const bodyFont = "'Merriweather', Georgia, serif";
  const bodySize = isLetter ? "9.5pt" : "9.8pt";
  const lh = isLetter ? 1.38 : 1.44;
  const fullName = (c?.fullName || c?.name || "BLAKE TRUMAN").toUpperCase();

  const summaryText =
    c?.summary ||
    "Showcase your top accomplishments upfront, quantifying impacts with metrics to demonstrate tangible value. Use paragraphs or bullet points to highlight how your contributions drive business success, focusing on the benefits you deliver to the organization rather than personal objectives.";

  const renderJob = (job: any, idx: number) => (
    <div key={idx} style={{ marginTop: idx === 0 ? 0 : isLetter ? "11pt" : "14pt" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontWeight: 700,
        }}
      >
        <span>{job.title}</span>
        <span style={{ whiteSpace: "nowrap" }}>{job.period}</span>
      </div>
      <div>{job.company}</div>
      {job.intro ? (
        <div style={{ marginTop: isLetter ? "5pt" : "7pt" }}>{job.intro}</div>
      ) : null}
      <ul
        style={{
          margin: 0,
          marginTop: isLetter ? "5pt" : "7pt",
          paddingLeft: "13.5pt",
          listStyleType: "disc",
          listStylePosition: "outside",
        }}
      >
        {(job.bullets || []).map((b: string, i: number) => (
          <li key={i} style={{ marginBottom: 0 }}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );

  if (pageIndex === 0) {
    const jobs = totalPages === 1 ? IVY_1P_JOBS : IVY_2P_P1_JOBS;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "36pt",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          fontFamily: bodyFont,
          fontSize: bodySize,
          fontWeight: 300,
          color: "#000000",
          lineHeight: lh,
        }}
      >
        <IvyPage1Header c={c} isLetter={isLetter} bottomGap={isLetter ? "11pt" : "13pt"} />
        <IvySectionHeading title="PROFESSIONAL SUMMARY" marginTop="0" marginBottom={isLetter ? "7pt" : "9pt"} />
        <div>{summaryText}</div>
        <div style={{ textAlign: "center", marginTop: isLetter ? "7pt" : "9pt" }}>
          <div>Areas of Expertise:</div>
          <div style={{ marginTop: "4pt" }}>
            Project Oversight - Conflict Mediation - Strategic Leadership - Team Direction
          </div>
          <div>
            Effective Communication - Process Enhancement - Resource Optimization - Customer Engagement
          </div>
        </div>
        <IvySectionHeading title="PROFESSIONAL EXPERIENCE" marginTop={isLetter ? "10pt" : "12pt"} marginBottom={isLetter ? "7pt" : "9pt"} />
        {jobs.map(renderJob)}
        {totalPages === 1 ? (
          <>
            <IvySectionHeading title="EDUCATION & CERTIFICATION" marginTop={isLetter ? "10pt" : "12pt"} marginBottom={isLetter ? "7pt" : "9pt"} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>DEGREE TITLE / University Name {"\u2013"} Location</span>
              <span>Date</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "6pt" }}>
              <span>CERTIFICATION NAME / Organization</span>
              <span>Date</span>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "36pt",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        fontFamily: bodyFont,
        fontSize: bodySize,
        fontWeight: 300,
        color: "#000000",
        lineHeight: isLetter ? 1.32 : 1.4,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "18pt",
          fontWeight: 400,
          letterSpacing: "4pt",
          color: "#000000",
          lineHeight: 1.15,
          marginBottom: "5pt",
        }}
      >
        {fullName}
      </div>
      <div
        style={{
          height: "5.5pt",
          borderTop: "1px solid #CFCDCD",
          borderBottom: "1px solid #CFCDCD",
          marginBottom: isLetter ? "10pt" : "13pt",
        }}
      />
      {IVY_2P_P2_JOBS.map(renderJob)}
      <IvySectionHeading title="EDUCATION & CERTIFICATION" marginTop={isLetter ? "9pt" : "12pt"} marginBottom={isLetter ? "6pt" : "8pt"} />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
        <span>DEGREE TITLE / University Name {"\u2013"} Location</span>
        <span>Date</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "5pt" }}>
        <span>CERTIFICATION NAME / Organization</span>
        <span>Date</span>
      </div>
      <IvySectionHeading title="PROFESSIONAL DEVELOPMENT" marginTop={isLetter ? "9pt" : "12pt"} marginBottom={isLetter ? "6pt" : "8pt"} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : "6pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>COURSE / WORKSHOP / CLASS</span>
            <span>Date</span>
          </div>
          <div>UNIVERSITY / COMPANY / PLATFORM / LOCATION</div>
        </div>
      ))}
      <IvySectionHeading title="INTERESTS" marginTop={isLetter ? "9pt" : "12pt"} marginBottom={isLetter ? "6pt" : "8pt"} />
      <div style={{ textAlign: "center" }}>
        <div>Learning conversational Spanish - Mentoring youth at community outreach programs</div>
        <div>Enthusiast of strategic board games - Perfecting artisanal sourdough bread - Kayaking on local rivers</div>
      </div>
    </div>
  );
}

const SINGLE_1P_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Present",
    company: "Company Name / Location",
    intro:
      "Include this optional paragraph to provide an overview of the role, spotlight key successes, describe your path to the position (e.g., through a promotion), or briefly introduce the company if it\u2019s not widely recognized. You may exclude this paragraph to move directly to the bullet points.",
    bullets: [
      "Highlight accomplishments that demonstrate value to the employer, such as increasing profitability, reducing expenses, or enhancing efficiency. Use powerful action verbs like \u201Cdirected\u201D or \u201Cimplemented\u201D instead of passive phrases like \u201Ctasked with.\u201D",
      "Prioritize your most impactful and relevant successes to engage the hiring manager. Include specific metrics where applicable to quantify your contributions.",
      "Emphasize outcomes that align with the employer\u2019s objectives, showcasing leadership and innovation. Tailor examples to highlight skills that drive organizational growth.",
      "Demonstrate your ability to lead projects or teams effectively, providing clear examples of achievement. Quantify results to reinforce your impact on the organization.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Examine job posting for essential skills, qualifications, or keywords from the employer. Incorporate these into your resume to match requirements and optimize ATS compatibility.",
      "Focus on accomplishments that showcase your suitability for the position, using relevant examples. Ensure content aligns with the job posting\u2019s priorities to improve selection chances.",
      "Use clear, keyword-rich descriptions of your achievements to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
    ],
  },
];

const SINGLE_2P_PAGE1_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Present",
    company: "Company Name / Location",
    intro:
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
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Examine the job posting to identify critical skills, qualifications, or keywords highlighted by the employer. Integrate these terms into your resume to match the role\u2019s needs and enhance ATS compatibility.",
      "Emphasize achievements that reflect your suitability for the position, using relevant examples. Ensure content aligns with the job posting\u2019s priorities to improve selection chances.",
      "Use clear, keyword-rich descriptions of your accomplishments to ensure ATS compatibility. Submit the resume in either Word or PDF format for seamless processing.",
      "Highlight results that demonstrate your ability to meet organizational objectives, such as improving workflows or collaboration. Tailor examples to the job\u2019s requirements.",
      "Show adaptability in challenges and highlight contributions demonstrating expertise.",
    ],
  },
];

const SINGLE_2P_PAGE2_JOBS = [
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Use a professional email address (e.g., a Gmail account with your name) to maintain credibility. Avoid outdated providers to convey a modern, professional image.",
      "Review your resume swiftly to confirm that key achievements and keywords are immediately noticeable. Emphasize critical accomplishments or skills by bolding them to capture the reader\u2019s attention. Ensure the content is clear and engaging to make a strong first impression. Tailor highlighted elements to align with the job posting\u2019s priorities for maximum impact.",
      "If space allows, include an Interests section with unique, specific details to foster a personal connection with the reader. Avoid generic terms and focus on distinctive preferences.",
      "Proofread thoroughly to eliminate errors, as inaccuracies can undermine your professionalism. Consider a second review to ensure high quality.",
    ],
  },
  {
    title: "ENTER YOUR JOB TITLE HERE",
    period: "Date \u2013 Date",
    company: "Company Name / Location",
    intro: "",
    bullets: [
      "Present information in a clear, modern layout that emphasizes key achievements and aligns visually with professional resume standards.",
      "Focus on recent and relevant professional experience to keep your resume concise and impactful. Prioritize your most current role to showcase your latest expertise and achievements. Exclude older positions that are less pertinent to the job you\u2019re applying for to maintain clarity. Tailor your content to align with the employer\u2019s needs, emphasizing skills that demonstrate your value.",
      "Maintain a cohesive and professional document layout by ensuring visual balance, clear section separation, and consistent formatting throughout the resume.",
    ],
  },
];

function SinglePage1Header({ c }: { c: ResumeContent }) {
  const fullName = (c.fullName || c.name || "JONAH ROMANO").toUpperCase();
  const profession = (c.profession || "YOUR PROFESSION").toUpperCase();
  const parts = [
    c.phone || "(555) 555-5555",
    c.email || "youremail@mail.com",
    c.linkedin || "Linkedin.com/name",
    c.location || "City, State/Province",
  ].filter(Boolean);

  return (
    <div>
      <div
        style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: "28pt",
          fontWeight: 400,
          letterSpacing: "7.15pt",
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.15,
          marginBottom: "4pt",
        }}
      >
        {fullName}
      </div>
      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "10pt",
          fontWeight: 400,
          letterSpacing: "2pt",
          color: "#44546A",
          textAlign: "center",
          lineHeight: 1.2,
          marginBottom: "4pt",
        }}
      >
        {profession}
      </div>
      <div
        style={{
          height: "4.5pt",
          borderTop: "1px solid #CFCDCD",
          borderBottom: "1px solid #CFCDCD",
          margin: "3pt 0 7pt",
        }}
      />
      <div
        style={{
          fontFamily: "'Work Sans', sans-serif",
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {parts.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span style={{ color: "#D0CECE", margin: "0 6pt" }}>|</span>
            )}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SingleSectionBanner({ title }: { title: string }) {
  return (
    <div
      style={{
        backgroundColor: "#F2F8EE",
        padding: "4.5pt 0",
        textAlign: "center",
        fontFamily: "'Libre Baskerville', Georgia, serif",
        fontSize: "11pt",
        fontWeight: 700,
        letterSpacing: "2.95pt",
        color: "#000000",
        lineHeight: 1.2,
      }}
    >
      {title}
    </div>
  );
}

function SingleExperienceBlock({
  job,
  isA4,
  lineHeight,
}: {
  job: {
    title: string;
    period: string;
    company: string;
    intro?: string;
    bullets: string[];
  };
  isA4: boolean;
  lineHeight: number;
}) {
  return (
    <div
      style={{
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "10pt",
        fontWeight: 400,
        color: "#000000",
        lineHeight,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontWeight: 700,
        }}
      >
        <span>{job.title}</span>
        <span style={{ whiteSpace: "nowrap" }}>{job.period}</span>
      </div>
      <div>{job.company}</div>
      {job.intro ? (
        <div style={{ marginTop: isA4 ? "8pt" : "6pt" }}>{job.intro}</div>
      ) : null}
      {job.bullets.length > 0 ? (
        <ul
          style={{
            margin: 0,
            marginTop: isA4 ? "8pt" : "6pt",
            paddingLeft: "13.5pt",
            listStyleType: "disc",
            listStylePosition: "outside",
          }}
        >
          {job.bullets.map((b, i) => (
            <li key={i} style={{ marginBottom: 0 }}>
              {b}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Series12({ content: c, style: s, pageIndex, totalPages }: any) {
  const isA4 = String(s?.pageSize || "A4").toLowerCase() !== "letter";
  const bodyFont = "'Work Sans', sans-serif";
  const lhP1 = totalPages === 1 ? (isA4 ? 1.38 : 1.31) : (isA4 ? 1.37 : 1.27);
  const lhP2 = isA4 ? 1.35 : 1.25;
  const fullName = (c.fullName || c.name || "JONAH ROMANO").toUpperCase();

  const summaryText =
    c.summary ||
    "Lead with standout accomplishments using quantifiable metrics to highlight measurable impact and demonstrate contributions to organizational success. Present them in paragraph or bullet form to quickly convey your value, avoiding objectives and focusing on business results.";

  const expertiseLine1 =
    "Initiative Management - Dispute Resolution - Visionary Planning - Group Leadership";
  const expertiseLine2 =
    "Clear Communication - Operational Improvement - Budget Management - Client Relations";

  const userExp = Array.isArray(c.experience) ? c.experience : [];
  const hasCustomExp =
    userExp.length > 0 &&
    userExp.some(
      (e: any) =>
        e.title &&
        !e.title.toUpperCase().includes("ENTER YOUR JOB TITLE")
    );

  const mapJob = (e: ResumeContent["experience"][number]) => ({
    title: e.title || "ENTER YOUR JOB TITLE HERE",
    period: e.period || "Date \u2013 Date",
    company: [e.company, e.location].filter(Boolean).join(" / ") || "Company Name / Location",
    intro: e.summary || "",
    bullets: Array.isArray(e.bullets) ? e.bullets : [],
  });

  if (pageIndex === 0) {
    const jobs =
      totalPages === 1
        ? hasCustomExp
          ? userExp.slice(0, 2).map(mapJob)
          : SINGLE_1P_JOBS
        : hasCustomExp
          ? userExp.slice(0, 2).map(mapJob)
          : SINGLE_2P_PAGE1_JOBS;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "36pt",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          fontFamily: bodyFont,
          fontSize: "10pt",
          color: "#000000",
          lineHeight: lhP1,
        }}
      >
        <SinglePage1Header c={c} />

        <div style={{ marginTop: isA4 ? "16pt" : "13pt" }}>
          <SingleSectionBanner title="PROFESSIONAL SUMMARY" />
        </div>

        <div style={{ marginTop: isA4 ? "10pt" : "8pt" }}>{summaryText}</div>

        <div
          style={{
            marginTop: isA4 ? "10pt" : "8pt",
            textAlign: "center",
          }}
        >
          <div>Areas of Expertise:</div>
          <div style={{ marginTop: isA4 ? "6pt" : "5pt" }}>{expertiseLine1}</div>
          <div>{expertiseLine2}</div>
        </div>

        <div style={{ marginTop: isA4 ? "12pt" : "10pt" }}>
          <SingleSectionBanner title="EXPERIENCE" />
        </div>

        <div style={{ marginTop: isA4 ? "10pt" : "8pt" }}>
          {jobs.map((job: any, idx: number) => (
            <div
              key={idx}
              style={{ marginTop: idx === 0 ? 0 : isA4 ? "16pt" : "12pt" }}
            >
              <SingleExperienceBlock job={job} isA4={isA4} lineHeight={lhP1} />
            </div>
          ))}
        </div>

        {totalPages === 1 ? (
          <>
            <div style={{ marginTop: isA4 ? "12pt" : "10pt" }}>
              <SingleSectionBanner title="EDUCATION&CERTIFICATION" />
            </div>
            <div style={{ marginTop: isA4 ? "10pt" : "8pt" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span>
                  <strong>DEGREE TITLE</strong> / University Name {"\u2013"} Location
                </span>
                <strong>Date</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: isA4 ? "8pt" : "6pt",
                }}
              >
                <span>
                  <strong>CERTIFICATION NAME</strong> / Organization
                </span>
                <strong>Date</strong>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // Page 2 (2P)
  const jobsP2 = hasCustomExp
    ? userExp.slice(2, 4).map(mapJob)
    : SINGLE_2P_PAGE2_JOBS;

  const courses =
    Array.isArray(c.courses) && c.courses.length > 0
      ? c.courses.slice(0, 3)
      : [
          {
            title: "COURSE / WORKSHOP / CLASS",
            org: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
          {
            title: "COURSE / WORKSHOP / CLASS",
            org: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
          {
            title: "COURSE / WORKSHOP / CLASS",
            org: "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
            date: "Date",
          },
        ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "36pt",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        fontFamily: bodyFont,
        fontSize: "10pt",
        color: "#000000",
        lineHeight: lhP2,
      }}
    >
      <div
        style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: "18pt",
          fontWeight: 400,
          letterSpacing: "4.6pt",
          color: "#000000",
          lineHeight: 1.15,
          marginBottom: "4pt",
        }}
      >
        {fullName}
      </div>
      <div
        style={{
          height: "4.5pt",
          borderTop: "1px solid #CFCDCD",
          borderBottom: "1px solid #CFCDCD",
          marginBottom: isA4 ? "14pt" : "10pt",
        }}
      />

      {jobsP2.map((job: any, idx: number) => (
        <div
          key={idx}
          style={{ marginTop: idx === 0 ? 0 : isA4 ? "16pt" : "12pt" }}
        >
          <SingleExperienceBlock job={job} isA4={isA4} lineHeight={lhP2} />
        </div>
      ))}

      <div style={{ marginTop: isA4 ? "12pt" : "9pt" }}>
        <SingleSectionBanner title="EDUCATION&CERTIFICATION" />
      </div>
      <div style={{ marginTop: isA4 ? "10pt" : "7pt" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span>
            <strong>DEGREE TITLE</strong> / University Name {"\u2013"} Location
          </span>
          <strong>Date</strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: isA4 ? "8pt" : "6pt",
          }}
        >
          <span>
            <strong>CERTIFICATION NAME</strong> / Organization
          </span>
          <strong>Date</strong>
        </div>
      </div>

      <div style={{ marginTop: isA4 ? "12pt" : "9pt" }}>
        <SingleSectionBanner title="PROFESSIONAL DEVELOPMENT" />
      </div>
      <div style={{ marginTop: isA4 ? "10pt" : "7pt" }}>
        {courses.map((cr: any, idx: number) => (
          <div
            key={idx}
            style={{ marginTop: idx === 0 ? 0 : isA4 ? "8pt" : "6pt" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontWeight: 700,
              }}
            >
              <span>{cr.title || "COURSE / WORKSHOP / CLASS"}</span>
              <span style={{ whiteSpace: "nowrap" }}>{cr.date || "Date"}</span>
            </div>
            <div>
              {cr.org || "UNIVERSITY / COMPANY / PLATFORM / LOCATION"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: isA4 ? "12pt" : "9pt" }}>
        <SingleSectionBanner title="SKILLS" />
      </div>
      <div style={{ marginTop: isA4 ? "10pt" : "7pt" }}>
        <ul
          style={{
            margin: 0,
            paddingLeft: "13.5pt",
            listStyleType: "disc",
            listStylePosition: "outside",
          }}
        >
          <li>PROFESSIONAL</li>
        </ul>
        <div style={{ paddingLeft: "7pt" }}>
          <div>
            Schedule Optimization - Analytical Thinking - Team Coordination - Issue Resolution
          </div>
          <div>Innovative Solutions {"\u2013"} Precision Focus</div>
        </div>

        <ul
          style={{
            margin: 0,
            marginTop: isA4 ? "8pt" : "6pt",
            paddingLeft: "13.5pt",
            listStyleType: "disc",
            listStylePosition: "outside",
          }}
        >
          <li>TECHNICAL</li>
        </ul>
        <div style={{ paddingLeft: "7pt" }}>
          Microsoft Office Tools - Canva &amp; Adobe Illustrator - WordPress Essentials - Digital Marketing Optimization
        </div>
      </div>
    </div>
  );
}
const MINIMAL_1P_JOBS: any[] = [
  {
    id: "min-1p-1",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Present",
    bullets: [
      "Begin by clearly defining your role\u2019s main focus or challenge to provide context for your achievements.",
      "Briefly describe your environment or scale, such as team size or market reach, to add depth to experience.",
      "Highlight promotions, leadership, or major projects to show growth and credibility.",
      "Emphasize measurable results \u2014 like growth, savings, or performance gains.",
    ],
  },
  {
    id: "min-1p-2",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Use action verbs like led, improved, implemented, or developed \u2014 avoid passive phrasing.",
      "Focus on results and achievements, not duties; quantify them when possible (%, $, or numbers).",
      "Arrange your bullet points strategically \u2014 put the most relevant and impressive accomplishments first.",
    ],
  },
  {
    id: "min-1p-3",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Proofread carefully \u2014 errors or formatting issues can harm first impressions.",
      "Use a professional tone and layout; keep it clean, modern, and easy to read for both humans and ATS.",
      "Review your r\u00E9sum\u00E9 in 10 seconds \u2014 the top achievements should immediately stand out.",
    ],
  },
];

const MINIMAL_2P_PAGE1_JOBS: any[] = [
  {
    id: "min-2p-1",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Present",
    bullets: [
      "Clearly state your position title, company name, location, and dates of employment. This establishes context and credibility right away.",
      "If you\u2019ve earned a promotion, switched departments, or taken on higher responsibilities, make sure that progression is visible. It demonstrates growth and reliability.",
      "In the introductory paragraph, summarize your position \u2014 mention the scope of your role, the size of the team or budget you handled, and the main focus of your work.",
      "For less-known companies, add one concise line describing their business area or industry (e.g., \u201CA regional logistics firm specializing in e-commerce distribution\u201D).",
      "Emphasize early what measurable value you added \u2014 perhaps you increased revenue, streamlined processes, launched new initiatives, or improved customer satisfaction.",
    ],
  },
  {
    id: "min-2p-2",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Use active, impactful verbs such as led, developed, optimized, coordinated, executed, enhanced, or innovated. These words convey ownership and initiative, unlike passive phrases such as \u201Cresponsible for.\u201D",
      "Focus each bullet point on outcomes and contributions \u2014 not on job duties. Instead of listing what you were expected to do, describe what you actually achieved and how it benefited the organization.",
      "Whenever possible, quantify your success. Numbers instantly add credibility \u2014 \u201Cincreased client retention by 22%,\u201D \u201Creduced expenses by $45K annually,\u201D or \u201Cmanaged a $2M annual budget.\u201D",
      "Prioritize your bullet points strategically: place the most impressive and job-relevant accomplishments first so they immediately capture the reader\u2019s attention.",
    ],
  },
  {
    id: "min-2p-3",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Carefully review the job description and highlight repeated keywords, technical skills, and qualifications. These are what the Applicant Tracking System (ATS) is programmed to identify.",
      "Integrate keywords naturally for balance between readability and optimization.",
      "Remember, about 70\u201380% of resumes get filtered out by ATS systems simply because they lack the right phrasing. Tailoring your content for each job application increases your chances dramatically.",
      "Use a simple and ATS-friendly format \u2014 consistent font, clear headings, and no complex graphics. When in doubt, submit your r\u00E9sum\u00E9 as both a clean Word file and a PDF version to ensure compatibility.",
    ],
  },
];

const MINIMAL_2P_PAGE2_JOBS: any[] = [
  {
    id: "min-2p-4",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Include at least three bullet points for each position \u2014 too few might signal that your role wasn\u2019t substantial, even if it was. If you have more to say, use concise and impactful phrasing.",
      "Use present tense for your current job (\u201CManage,\u201D \u201CCoordinate,\u201D \u201CDesign\u201D) and past tense for previous roles (\u201CManaged,\u201D \u201CCoordinated,\u201D \u201CDesigned\u201D). This subtle consistency improves readability.",
      "Always write in an implied first-person voice. For example: \u201CLed a cross-functional team of 10,\u201D not \u201CWas responsible for leading.\u201D It sounds confident and direct.",
      "If you took on additional responsibilities outside your formal job description \u2014 such as mentoring new hires, assisting with strategic planning, or leading a special project \u2014 include them. These details highlight initiative and leadership.",
    ],
  },
  {
    id: "min-2p-5",
    role: "ENTER YOUR JOB TITLE HERE",
    title: "ENTER YOUR JOB TITLE HERE",
    company: "Company Name / Location",
    date: "Date \u2013 Date",
    bullets: [
      "Proofread thoroughly before sending. Even one typo or inconsistent spacing can undermine an otherwise outstanding resume. Use tools like Grammarly or ask a trusted professional to review it.",
      "Maintain professionalism across details \u2014 use a clean layout, a professional email address, and consistent formatting on every page. Small visual details communicate reliability.",
      "Do a final \u201C10-second scan\u201D test: glance at your resume quickly and see what stands out first. Your most relevant accomplishments, metrics, and keywords should instantly catch the reader\u2019s eye.",
    ],
  },
];

function MinimalDoubleRule({ margin = "0" }: { margin?: string }) {
  return (
    <div style={{ width: "100%", margin }}>
      <div style={{ width: "100%", height: "0.5pt", backgroundColor: "#E7E6E6" }} />
      <div style={{ width: "100%", height: "0.5pt", backgroundColor: "#E7E6E6", marginTop: "3.5pt" }} />
    </div>
  );
}

function MinimalSectionHeading({
  title,
  onClick,
}: {
  title: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        fontFamily: "'Source Sans 3', sans-serif",
        fontSize: "13pt",
        fontWeight: 400,
        letterSpacing: "2.5pt",
        color: "#000000",
        textTransform: "uppercase",
        paddingBottom: "4pt",
        borderBottom: "0.5pt solid #E7E6E6",
        marginTop: "10pt",
        marginBottom: "7pt",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {title}
    </div>
  );
}

function MinimalPage1Header({ c }: { c: any }) {
  const fullName = (c?.personal?.fullName || "JACKSON CALDWELL").trim();
  const parts = fullName.split(/\s+/);
  const firstName = (parts[0] || "JACKSON").toUpperCase();
  const lastName = (parts.slice(1).join(" ") || "CALDWELL").toUpperCase();
  const profession = (c?.personal?.title || "YOUR PROFESSION").toUpperCase();
  const contactItems = [
    c?.personal?.phone || "(555) 555-5555",
    c?.personal?.email || "youremail@mail.com",
    c?.personal?.linkedin || "Linkedin.com/name",
    c?.personal?.location || "City, State/Province",
  ].filter(Boolean);

  return (
    <div style={{ width: "100%", marginBottom: "10pt" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "8pt",
        }}
      >
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "20pt",
            fontWeight: 400,
            letterSpacing: "4pt",
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: "#000000" }}>{firstName} </span>
          <span style={{ color: "#8496B0" }}>{lastName}</span>
        </div>
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "9.5pt",
            fontWeight: 400,
            letterSpacing: "2.5pt",
            color: "#44546A",
            whiteSpace: "nowrap",
          }}
        >
          {profession}
        </div>
      </div>
      <MinimalDoubleRule margin="0 0 6pt 0" />
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "9pt",
          fontWeight: 400,
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {contactItems.map((item: string, idx: number) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ color: "#D0CECE", margin: "0 7pt" }}>|</span>}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
      <MinimalDoubleRule margin="6pt 0 0 0" />
    </div>
  );
}

function MinimalExperienceBlock({ jobs }: { jobs: any[] }) {
  return (
    <div>
      {jobs.map((job: any, idx: number) => (
        <div key={job.id || idx} style={{ marginBottom: idx < jobs.length - 1 ? "9pt" : "0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontFamily: "'Inter', sans-serif",
              fontSize: "9.2pt",
              lineHeight: 1.38,
              color: "#000000",
            }}
          >
            <span style={{ fontWeight: 700 }}>{job.role || job.title}</span>
            <span style={{ fontWeight: 700, whiteSpace: "nowrap", marginLeft: "8pt" }}>
              {job.date}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "9.2pt",
              fontWeight: 400,
              lineHeight: 1.38,
              color: "#000000",
              marginBottom: "4pt",
            }}
          >
            {job.company}
          </div>
          {Array.isArray(job.bullets) && job.bullets.length > 0 && (
            <div>
              {job.bullets.map((b: string, bIdx: number) => (
                <div
                  key={bIdx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    paddingLeft: "16pt",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "9.2pt",
                    fontWeight: 400,
                    lineHeight: 1.38,
                    color: "#000000",
                    marginBottom: bIdx < job.bullets.length - 1 ? "2pt" : "0",
                  }}
                >
                  <span style={{ width: "14pt", flexShrink: 0 }}>{"\u2022"}</span>
                  <span style={{ flex: 1 }}>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export function Series14(props: any) {
  const c: any = props.content || props.c || {};
  const style: any = props.style || props.settings?.style || {};
  const settings: any = props.settings || {};
  const pageIndex: number = typeof props.pageIndex === "number" ? props.pageIndex : 0;
  const targetPages: number = props.targetPages || settings?.targetPages || style?.pageCount || style?.targetPages || 1;
  const isLetter: boolean =
    props.paperSize === "Letter" ||
    settings?.paperSize === "Letter" ||
    style?.pageSize === "Letter" ||
    style?.paperSize === "Letter";
  const onSelectSection = props.onSelectSection;

  const pageBoxStyle: React.CSSProperties = {
    position: "relative",
    width: isLetter ? "612pt" : "595.3pt",
    height: isLetter ? "792pt" : "841.9pt",
    backgroundColor: "#FFFFFF",
    padding: isLetter ? "24pt 36pt" : "28pt 36pt",
    overflow: "hidden",
    boxSizing: "border-box",
    fontFamily: '"Inter", sans-serif',
    fontSize: "9.2pt",
    fontWeight: 400,
    color: "#000000",
    lineHeight: "13pt",
  };

  const fullName = (c?.fullName || "JACKSON CALDWELL").trim();
  const parts = fullName.split(/\s+/);
  const firstWord = parts[0] || "JACKSON";
  const restWords = parts.slice(1).join(" ") || "CALDWELL";

  const isDefaultExp = !c.experience || c.experience.length === 0 || c.experience[0]?.title === "ENTER YOUR JOB TITLE HERE";
  const page1Jobs = targetPages >= 2 ? (isDefaultExp ? MINIMAL_2P_PAGE1_JOBS : c.experience.slice(0, 3)) : (isDefaultExp ? MINIMAL_1P_JOBS : c.experience.slice(0, 3));
  const page2Jobs = isDefaultExp ? MINIMAL_2P_PAGE2_JOBS : c.experience.slice(3, 5);

  const profDevList = [0, 1].map((idx) => ({
    id: `mn_pd_${idx}`,
    title: c.courses?.[idx]?.title || "COURSE / WORKSHOP / CLASS",
    institution: c.courses?.[idx]?.institution || "UNIVERSITY / COMPANY / PLATFORM / LOCATION",
    year: c.courses?.[idx]?.year || c.courses?.[idx]?.date || "Date",
  }));

  if (pageIndex >= 1) {
    return (
      <div style={pageBoxStyle}>
        <div style={{ fontFamily: '"Poppins", sans-serif', fontSize: "15pt", fontWeight: 400, letterSpacing: "0.20em", textTransform: "uppercase", marginBottom: "6pt" }}>
          <span style={{ color: "#000000" }}>{firstWord}</span>
          {restWords && <span style={{ color: "#8496B0", marginLeft: "8pt" }}>{restWords}</span>}
        </div>
        <MinimalDoubleRule margin="0 0 10pt 0" />
        <div onClick={() => onSelectSection?.("experience")} style={{ cursor: "pointer" }}>
          <MinimalExperienceBlock jobs={page2Jobs} />
        </div>
        <MinimalSectionHeading title="EDUCATION & CERTIFICATION" onClick={() => onSelectSection?.("education")} />
        <div onClick={() => onSelectSection?.("education")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4pt" }}>
            <span><strong style={{ fontWeight: 700 }}>{c.education?.[0]?.degree || "DEGREE TITLE"}</strong> / {c.education?.[0]?.school || "University Name \u2013 Location"}</span>
            <strong style={{ fontWeight: 700 }}>{c.education?.[0]?.year || c.education?.[0]?.date || "Date"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4pt" }}>
            <span><strong style={{ fontWeight: 700 }}>{c.certifications?.[0]?.name || "CERTIFICATION NAME"}</strong> / {c.certifications?.[0]?.issuer || "Organization"}</span>
            <strong style={{ fontWeight: 700 }}>{c.certifications?.[0]?.date || "Date"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong style={{ fontWeight: 700 }}>COURSE OR PROGRAM</strong> / Institution or Platform</span>
            <strong style={{ fontWeight: 700 }}>Date</strong>
          </div>
        </div>
        <MinimalSectionHeading title="SKILLS" onClick={() => onSelectSection?.("skills")} />
        <ul onClick={() => onSelectSection?.("skills")} style={{ margin: 0, marginLeft: "11pt", paddingLeft: "2pt", listStyleType: "disc", cursor: "pointer" }}>
          <li style={{ marginBottom: "5pt", lineHeight: "13.5pt" }}>
            <strong style={{ fontWeight: 700 }}>PROFESSIONAL:</strong> Schedule Coordination - Time Planning - Critical Thinking - Group Leadership - Problem Resolution - Decision Making - Adaptability - Attention to Detail - Conflict Management - Strategic Decision-Making
          </li>
          <li style={{ lineHeight: "13.5pt" }}>
            <strong style={{ fontWeight: 700 }}>TECHNICAL:</strong> Microsoft Office - Adobe Photoshop - SEO Strategies - HTML &amp; CSS Basics - Data Entry - Google Workspace - Data Processing
          </li>
        </ul>
        <MinimalSectionHeading title="PROFESSIONAL DEVELOPMENT" onClick={() => onSelectSection?.("courses")} />
        <div onClick={() => onSelectSection?.("courses")} style={{ cursor: "pointer" }}>
          {profDevList.map((pd, idx) => (
            <div key={pd.id} style={{ marginBottom: idx < profDevList.length - 1 ? "6pt" : "0pt" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span style={{ textTransform: "uppercase" }}>{pd.title}</span><span>{pd.year}</span>
              </div>
              <div style={{ textTransform: "uppercase" }}>{pd.institution}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={pageBoxStyle}>
      <MinimalPage1Header c={c} />
      <MinimalSectionHeading title="PROFESSIONAL PROFILE" onClick={() => onSelectSection?.("summary")} />
      <div onClick={() => onSelectSection?.("summary")} style={{ cursor: "pointer", marginBottom: "4pt" }}>
        {c.summary || "Use this section to highlight your most impressive achievements with specific numbers or measurable results. Focus on how your skills and experience created real value for previous projects or teams. Avoid writing about what you want\u2014instead, show employers exactly how you can help their company succeed."}
      </div>
      <MinimalSectionHeading title="PROFESSIONAL EXPERIENCE" onClick={() => onSelectSection?.("experience")} />
      <div onClick={() => onSelectSection?.("experience")} style={{ cursor: "pointer" }}>
        <MinimalExperienceBlock jobs={page1Jobs} />
      </div>
      {targetPages <= 1 && (
        <>
          <MinimalSectionHeading title="SKILLS" onClick={() => onSelectSection?.("skills")} />
          <ul onClick={() => onSelectSection?.("skills")} style={{ margin: 0, marginLeft: "11pt", paddingLeft: "2pt", listStyleType: "disc", cursor: "pointer" }}>
            <li style={{ marginBottom: "5pt", lineHeight: "13.5pt" }}>
              <strong style={{ fontWeight: 700 }}>PROFESSIONAL:</strong> Time Planning - Critical Thinking - Group Leadership - Problem Resolution
            </li>
            <li style={{ lineHeight: "13.5pt" }}>
              <strong style={{ fontWeight: 700 }}>TECHNICAL:</strong> Microsoft Office - Adobe Photoshop - SEO Strategies - HTML &amp; CSS Basics
            </li>
          </ul>
          <MinimalSectionHeading title="PROFESSIONAL DEVELOPMENT" onClick={() => onSelectSection?.("courses")} />
          <div onClick={() => onSelectSection?.("courses")} style={{ cursor: "pointer" }}>
            {profDevList.map((pd, idx) => (
              <div key={pd.id} style={{ marginBottom: idx < profDevList.length - 1 ? "6pt" : "0pt" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span style={{ textTransform: "uppercase" }}>{pd.title}</span><span>{pd.year}</span>
                </div>
                <div style={{ textTransform: "uppercase" }}>{pd.institution}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export function Series22({ content, style, sectionOrder, pageIndex = 0 }: SeriesRenderProps) {
  const showPhoto = style?.showPhoto ?? true;
  const expItems = sliceExperienceForPage(content.experience, pageIndex, 3);
  const awards: AwardItem[] = content.awards || [];
  const volunteering: VolunteerItem[] = content.volunteering || [];
  const courses: CourseItem[] = content.courses || [];

  return (
    <div
      className="w-full h-full bg-white text-[#000000] select-text overflow-hidden"
      style={{ fontFamily: "'Open Sans', sans-serif", ...getPagePaddingStyle(style) }}
    >
      {pageIndex === 0 ? (
        /* Page 1 Header: Left Name + Double Rule Profession, Right Circular Photo */
        <div className="relative flex items-center justify-between pb-[12px]">
          <div className="flex-1 pr-4">
            <h1
              className="text-[32px] font-normal tracking-[0.16em] uppercase mb-2"
              style={{ fontFamily: "'Merriweather', serif" }}
            >
              {content.fullName}
            </h1>
            <div className="border-y-[3px] border-double border-[#CFCDCD] py-[6px]">
              <p
                className="text-[12px] tracking-[0.26em] uppercase text-[#44546A]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {content.profession}
              </p>
            </div>
          </div>
          {showPhoto && (
            <div className="w-[126px] h-[126px] rounded-full overflow-hidden border-2 border-[#E5E5E5] shadow-sm shrink-0 bg-[#E8E6E1]">
              <img
                src="/templates/22/preview-resume-1p-a4.png"
                alt={content.fullName}
                className="w-full h-full object-cover"
                style={{ objectPosition: "86% 6%", transform: "scale(3.4)" }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Page 2 & 3 Header: Centered THEO FINCH (24pt) + Double Rule */
        <div className="text-center pb-[12px] border-b-[3px] border-double border-[#CFCDCD] mb-[10px]">
          <h1
            className="text-[26px] font-normal tracking-[0.16em] uppercase"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            {content.fullName}
          </h1>
        </div>
      )}

      {/* Two-Column Grid with Hollow Circle Intersection Nodes */}
      <div className="grid grid-cols-[31%_69%] pt-[6px] relative h-[calc(100%-148px)]">
        {/* LEFT COLUMN */}
        <div className="pr-[16px] border-r border-[#CFCDCD] relative">
          {pageIndex === 0 && (
            <>
              <div className="pb-[16px] border-b border-[#CFCDCD] relative">
                <h2 className="text-[15px] font-normal tracking-[0.22em] uppercase mb-2.5">
                  CONTACT
                </h2>
                <div className="space-y-[7px] text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#7F7F7F]" />
                    <span>{content.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-[#7F7F7F]" />
                    <span className="truncate">{content.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 font-bold text-[#7F7F7F] flex items-center justify-center text-[10px]">
                      in
                    </span>
                    <span className="truncate">{content.linkedin}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7F7F7F]" />
                    <span>{content.location}</span>
                  </div>
                </div>
                <span className="w-[9px] h-[9px] rounded-full border border-[#CFCDCD] bg-white absolute -bottom-[5px] -right-[5px] z-10" />
              </div>

              {isSectionVisible(sectionOrder, "skills") && (
                <div className="py-[16px] border-b border-[#CFCDCD] relative">
                  <h2 className="text-[15px] font-normal tracking-[0.22em] uppercase mb-2.5">
                    SKILLS
                  </h2>
                  <ul className="space-y-[5px] text-[11px]">
                    {content.professionalSkills.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                  <span className="w-[9px] h-[9px] rounded-full border border-[#CFCDCD] bg-white absolute -bottom-[5px] -right-[5px] z-10" />
                </div>
              )}

              {(style?.pageCount || 1) === 1 && isSectionVisible(sectionOrder, "education") && (
                <div className="pt-[16px]">
                  <h2 className="text-[15px] font-normal tracking-[0.22em] uppercase mb-2.5">
                    EDUCATION
                  </h2>
                  <div className="space-y-3 text-[11px]">
                    {content.education.map((ed) => (
                      <div key={ed.id}>
                        <p className="font-bold uppercase">{ed.degree}</p>
                        <p>
                          {ed.school}
                          {ed.location ? ` - ${ed.location}` : ""}
                        </p>
                        <p className="text-[#595959]">{ed.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {pageIndex === 1 && (
            <>
              <div className="pb-[14px] border-b border-[#CFCDCD] relative">
                <h2 className="text-[14px] font-normal tracking-[0.20em] uppercase mb-2 leading-snug">
                  TECHNICAL<br />
                  SKILLS
                </h2>
                <ul className="space-y-[4px] text-[11px]">
                  {(content.technicalSkills.length > 0
                    ? content.technicalSkills
                    : content.professionalSkills.slice(0, 5)
                  ).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
                <span className="w-[9px] h-[9px] rounded-full border border-[#CFCDCD] bg-white absolute -bottom-[5px] -right-[5px] z-10" />
              </div>

              <div className="py-[14px] border-b border-[#CFCDCD] relative">
                <h2 className="text-[14px] font-normal tracking-[0.20em] uppercase mb-2">
                  ACHIEVEMENTS
                </h2>
                <div className="space-y-2.5 text-[11px]">
                  {awards.map((aw) => (
                    <div key={aw.id}>
                      <p className="font-bold uppercase">{aw.title}</p>
                      <p>{aw.issuer}</p>
                      <p className="text-[#595959]">{aw.date}</p>
                    </div>
                  ))}
                </div>
                <span className="w-[9px] h-[9px] rounded-full border border-[#CFCDCD] bg-white absolute -bottom-[5px] -right-[5px] z-10" />
              </div>

              <div className="pt-[14px]">
                <h2 className="text-[14px] font-normal tracking-[0.18em] uppercase mb-2 leading-snug">
                  VOLUNTEER<br />
                  EXPERIENCE
                </h2>
                <div className="space-y-2.5 text-[11px]">
                  {volunteering.map((vl) => (
                    <div key={vl.id}>
                      <p className="font-bold uppercase">{vl.organization}</p>
                      <p>{vl.role}</p>
                      <p className="text-[#595959]">{vl.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {pageIndex >= 2 && (
            <>
              <div className="pb-[14px] border-b border-[#CFCDCD] relative">
                <h2 className="text-[14px] font-normal tracking-[0.20em] uppercase mb-2">
                  ACHIEVEMENTS
                </h2>
                <div className="space-y-2 text-[11px]">
                  {awards.slice(0, 2).map((aw) => (
                    <div key={aw.id}>
                      <p className="font-bold uppercase">{aw.title}</p>
                      <p>{aw.issuer}</p>
                      <p className="text-[#595959]">{aw.date}</p>
                    </div>
                  ))}
                </div>
                <span className="w-[9px] h-[9px] rounded-full border border-[#CFCDCD] bg-white absolute -bottom-[5px] -right-[5px] z-10" />
              </div>

              <div className="pt-[14px]">
                <h2 className="text-[14px] font-normal tracking-[0.20em] uppercase mb-2.5">
                  REFERENCES
                </h2>
                <div className="space-y-2.5 text-[11px]">
                  {content.references.slice(0, 4).map((ref) => (
                    <div key={ref.id}>
                      <p className="font-bold uppercase">{ref.name}</p>
                      <p>{ref.title}</p>
                      <p className="text-[#44546A]">{ref.company}</p>
                      <p className="text-[#595959]">{ref.phone}</p>
                      <p className="text-[#595959]">{ref.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="pl-[20px]">
          {pageIndex === 0 && isSectionVisible(sectionOrder, "summary") && (
            <div className="pb-[16px] border-b border-[#CFCDCD]">
              <h2 className="text-[15px] font-normal tracking-[0.22em] uppercase mb-2">
                SUMMARY
              </h2>
              <p className="text-[11px] text-justify">{content.summary}</p>
            </div>
          )}

          {isSectionVisible(sectionOrder, "experience") && (
            <div className={pageIndex === 0 ? "pt-[16px]" : "pb-[16px] border-b border-[#CFCDCD]"}>
              <h2 className="text-[15px] font-normal tracking-[0.22em] uppercase mb-2.5">
                {pageIndex === 0 ? "EXPERIENCE" : "EXPERIENCE CONTINUED"}
              </h2>
              <div className="space-y-[12px]">
                {expItems.map((exp) => (
                  <div key={exp.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="uppercase">{exp.title}</span>
                      <span>{exp.period}</span>
                    </div>
                    <p className="mb-1">
                      {exp.company}
                      {exp.location ? ` / ${exp.location}` : ""}
                    </p>
                    <ul className="list-disc pl-4 space-y-[2.5px]">
                      {exp.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pageIndex >= 1 && (
            <div className="pt-[16px]">
              <h2 className="text-[15px] font-normal tracking-[0.20em] uppercase mb-2.5">
                PROFESSIONAL DEVELOPMENT
              </h2>
              <div className="space-y-2.5 text-[11px]">
                {courses.map((cr) => (
                  <div key={cr.id}>
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="uppercase">{cr.title}</span>
                      <span>{cr.date}</span>
                    </div>
                    <p className="text-[#44546A]">{cr.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MODERN (ID "24") - FLORENCE NIGHTINGALE (Heart-ECG Emblem, 3 Pages)
// ============================================================================
export function Series24({ content, style, sectionOrder, pageIndex = 0 }: SeriesRenderProps) {
  const showEmblem = style?.showEmblem ?? true;
  const expItems = sliceExperienceForPage(content.experience, pageIndex, 3);
  const awards: AwardItem[] = content.awards || [];
  const volunteering: VolunteerItem[] = content.volunteering || [];
  const memberships: MembershipItem[] = content.memberships || [];
  const courses: CourseItem[] = content.courses || [];

  return (
    <div
      className="w-full h-full bg-white text-[#000000] select-text overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", ...getPagePaddingStyle(style) }}
    >
      {pageIndex === 0 ? (
        <>
          {/* Page 1 Header with Heart-ECG Emblem */}
          <div className="flex items-center gap-6 pb-[14px]">
            {showEmblem && (
              <div className="w-[116px] h-[68px] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 140 85" className="w-full h-full fill-none stroke-[#000000]" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M52 24 C42 10, 18 14, 18 34 C18 52, 52 74, 52 74 C52 74, 86 52, 86 34 C86 14, 62 10, 52 24 Z" />
                  <path d="M18 44 L34 44 L41 27 L49 60 L56 44 L96 44 L103 31 L110 57 L116 44 L132 44" />
                </svg>
              </div>
            )}
            <div>
              <h1
                className="text-[28px] font-normal tracking-[0.20em] uppercase"
                style={{ fontFamily: "'Rubik', sans-serif" }}
              >
                {content.fullName}
              </h1>
              <p
                className="text-[12.5px] tracking-[0.26em] uppercase text-[#44546A] mt-1.5"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                {content.profession}
              </p>
            </div>
          </div>

          {/* Double-Line Contact Bar */}
          <div className="border-y-[3px] border-double border-[#CFCDCD] py-[7px] flex justify-center items-center gap-5 text-[11px] mb-[14px]">
            <span>{content.phone}</span>
            <span className="text-[#D9D9D9]">|</span>
            <span>{content.email}</span>
            <span className="text-[#D9D9D9]">|</span>
            <span>{content.linkedin}</span>
            <span className="text-[#D9D9D9]">|</span>
            <span>{content.location}</span>
          </div>
        </>
      ) : (
        /* Page 2 & 3 Header: Centered FLORENCE NIGHTINGALE (20pt) + Double Rule */
        <div className="text-center pb-[12px] border-b-[3px] border-double border-[#CFCDCD] mb-[14px]">
          <h1
            className="text-[23px] font-normal tracking-[0.20em] uppercase"
            style={{ fontFamily: "'Rubik', sans-serif" }}
          >
            {content.fullName}
          </h1>
        </div>
      )}

      {/* Two-Column Body */}
      <div className="grid grid-cols-[31%_69%] h-[calc(100%-132px)]">
        {/* LEFT COLUMN */}
        <div className="pr-[16px] border-r border-[#CFCDCD] space-y-[18px]">
          {pageIndex === 0 && (
            <>
              {(style?.pageCount || 1) === 1 && isSectionVisible(sectionOrder, "education") && (
                <div>
                  <h2
                    className="text-[14px] font-normal tracking-[0.22em] uppercase pb-1.5 mb-2.5 border-b border-[#CFCDCD]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    EDUCATION
                  </h2>
                  <div className="space-y-3 text-[11px]">
                    {content.education.map((ed) => (
                      <div key={ed.id}>
                        <p className="font-medium">{ed.degree}</p>
                        {ed.school && <p>{ed.school}</p>}
                        <p className="text-[#595959]">{ed.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSectionVisible(sectionOrder, "certifications") && (
                <div>
                  <h2
                    className="text-[14px] font-normal tracking-[0.22em] uppercase pb-1.5 mb-2.5 border-b border-[#CFCDCD] leading-snug"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    CERTIFICATION<br />& LICENSES
                  </h2>
                  <div className="space-y-3 text-[11px]">
                    {content.certifications.map((cert) => (
                      <div key={cert.id}>
                        <p className="font-semibold">{cert.name}</p>
                        <p>{cert.issuer}</p>
                        <p className="text-[#595959]">{cert.date}</p>
                        {cert.licenseNumber && <p>{cert.licenseNumber}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {pageIndex === 1 && (
            <>
              {/* Page 2 Left Column: AREAS OF EXPERTISE + SKILLS + PROFESSIONAL AFFILIATIONS */}
              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.20em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  AREAS OF EXPERTISE
                </h2>
                <ul className="space-y-[4px] text-[11px]">
                  {content.areasOfExpertise.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.20em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  SKILLS
                </h2>
                <ul className="space-y-[4px] text-[11px]">
                  {content.professionalSkills.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.18em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD] leading-snug"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  PROFESSIONAL<br />
                  AFFILIATIONS
                </h2>
                <div className="space-y-2 text-[11px]">
                  {memberships.map((mb) => (
                    <div key={mb.id}>
                      <p className="font-semibold">{mb.organization}</p>
                      <p className="text-[#595959]">{mb.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {pageIndex >= 2 && (
            <>
              {/* Page 3 Left Column: ACHIEVEMENTS + VOLUNTEER EXPERIENCE + PROFESSIONAL AFFILIATIONS */}
              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.20em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  ACHIEVEMENTS
                </h2>
                <div className="space-y-2 text-[11px]">
                  {awards.map((aw) => (
                    <div key={aw.id}>
                      <p className="font-semibold uppercase">{aw.title}</p>
                      <p>{aw.issuer}</p>
                      <p className="text-[#595959]">{aw.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.18em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD] leading-snug"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  VOLUNTEER<br />
                  EXPERIENCE
                </h2>
                <div className="space-y-2 text-[11px]">
                  {volunteering.map((vl) => (
                    <div key={vl.id}>
                      <p className="font-semibold">{vl.organization}</p>
                      <p>{vl.role}</p>
                      <p className="text-[#595959]">{vl.description}</p>
                      <p className="text-[#595959]">{vl.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2
                  className="text-[13.5px] font-normal tracking-[0.18em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD] leading-snug"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  PROFESSIONAL<br />
                  AFFILIATIONS
                </h2>
                <div className="space-y-2 text-[11px]">
                  {memberships.map((mb) => (
                    <div key={mb.id}>
                      <p className="font-semibold">{mb.organization}</p>
                      <p className="text-[#595959]">{mb.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="pl-[20px] space-y-[16px]">
          {pageIndex === 0 && isSectionVisible(sectionOrder, "summary") && (
            <div>
              <h2
                className="text-[14px] font-normal tracking-[0.22em] uppercase pb-1.5 mb-2 border-b border-[#CFCDCD]"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                SUMMARY
              </h2>
              <p className="text-[11px] text-justify">{content.summary}</p>
            </div>
          )}

          {isSectionVisible(sectionOrder, "experience") && (
            <div>
              <h2
                className="text-[14px] font-normal tracking-[0.22em] uppercase pb-1.5 mb-2.5 border-b border-[#CFCDCD]"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {pageIndex === 0
                  ? "PROFESSIONAL EXPERIENCE"
                  : "PROFESSIONAL EXPERIENCE CONTINUED"}
              </h2>
              <div className="space-y-[12px]">
                {expItems.map((exp) => (
                  <div key={exp.id} className="text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="uppercase font-medium">{exp.title}</span>
                      <span>{exp.period}</span>
                    </div>
                    <p className="mb-1 text-[#202124]">
                      {exp.company}
                      {exp.location ? `, ${exp.location}` : ""}
                    </p>
                    {exp.summaryParagraph && <p className="mb-1">{exp.summaryParagraph}</p>}
                    <ul className="list-disc pl-4 space-y-[2px]">
                      {exp.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pageIndex >= 1 && (
            <div>
              <h2
                className="text-[14px] font-normal tracking-[0.20em] uppercase pb-1.5 mb-2.5 border-b border-[#CFCDCD]"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                PROFESSIONAL DEVELOPMENT
              </h2>
              <div className="space-y-2.5 text-[11px]">
                {courses.map((cr) => (
                  <div key={cr.id}>
                    <div className="flex justify-between items-baseline font-medium">
                      <span className="uppercase">{cr.title}</span>
                      <span>{cr.date}</span>
                    </div>
                    <p className="text-[#44546A]">{cr.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ElegantSheetShell({
  c,
  isA4,
  rightContent,
}: {
  c: any;
  isA4: boolean;
  rightContent: React.ReactNode;
}) {
  const fullName = (c?.fullName || c?.name || "JAMES SMITH").toUpperCase();
  const profession = (c?.profession || "YOUR PROFESSION").toUpperCase();
  const phone = c?.phone || "(555) 555-5555";
  const email = c?.email || "youremail@mail.com";
  const linkedin = c?.linkedin || "Linkedin.com/name";
  const location = c?.location || "City, State/Province";

  const iconStyle: React.CSSProperties = {
    width: "19.2pt",
    height: "19.2pt",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
        color: "#000000",
        padding: isA4 ? "28pt 30pt 26pt" : "22pt 30pt 22pt",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Open Sans', sans-serif",
        fontSize: "9.5pt",
        fontWeight: 400,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "28pt",
            fontWeight: 400,
            letterSpacing: "7pt",
            lineHeight: 1.15,
            color: "#000000",
          }}
        >
          <span style={{ color: "#D0CECE", marginRight: "8pt" }}>|</span>
          {fullName}
          <span style={{ color: "#D0CECE", marginLeft: "4pt" }}>|</span>
        </div>
        <div
          style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "12pt",
            fontWeight: 400,
            letterSpacing: "2.3pt",
            color: "#44546A",
            marginTop: "6pt",
            lineHeight: 1.2,
          }}
        >
          {profession}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #CFCDCD",
          margin: isA4 ? "14pt 0 12pt" : "12pt 0 10pt",
        }}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div
          style={{
            width: "29.5%",
            paddingRight: "14pt",
            borderRight: "1px solid #CFCDCD",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "13.5pt",
              fontWeight: 500,
              letterSpacing: "3.6pt",
              color: "#000000",
              lineHeight: 1.2,
              marginBottom: "14pt",
            }}
          >
            CONTACT
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "11pt" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
              <span style={iconStyle}>
                <svg viewBox="0 0 32 32" width="19.2pt" height="19.2pt" fill="#A6A6A6">
                  <path d="M21.999 4 9.999 4C8.895 4 8 4.896 8 6L8 26C8 27.104 8.895 28 9.999 28L21.999 28C23.104 28 24 27.104 24 26L24 6C24 4.896 23.104 4 21.999 4ZM13 5 18 5 18.062 6 13 6 13 5ZM15.979 26.5C15.427 26.5 14.979 26.053 14.979 25.5 14.979 24.947 15.427 24.5 15.979 24.5 16.532 24.5 16.979 24.947 16.979 25.5 16.979 26.053 16.531 26.5 15.979 26.5ZM21.999 23 9.999 23 10.02 7 21.999 7 21.999 23Z" />
                </svg>
              </span>
              <span>{phone}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
              <span style={iconStyle}>
                <svg viewBox="0 0 491.52 491.52" width="13.6pt" height="13.6pt" fill="#A6A6A6">
                  <path d="M0 96.693 0 394.808 194.5 245.771Z" />
                  <path d="M11.998 85.916 245.722 265.06 479.449 85.916Z" />
                  <path d="M296.946 245.77 491.52 394.864 491.52 96.639Z" />
                  <path d="M283.933 255.777 250.542 281.338C249.121 282.425 247.422 282.971 245.723 282.971 244.023 282.971 242.324 282.425 240.903 281.338L207.517 255.777 11.987 405.604 479.461 405.604 283.933 255.777Z" />
                </svg>
              </span>
              <span style={{ wordBreak: "break-word" }}>{email}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
              <span style={iconStyle}>
                <svg viewBox="-271 283.9 256 235.1" width="13.6pt" height="13.6pt" fill="#A6A6A6">
                  <rect x="-264.4" y="359.3" width="49.9" height="159.7" />
                  <path d="M-240.5 283.9C-258.9 283.9-271 295.8-271 311.6-271 327.1-259.3 339.3-241.2 339.3L-240.8 339.3C-222 339.3-210.3 327-210.4 311.6-210.8 295.8-222.1 283.9-240.5 283.9Z" />
                  <path d="M-78.2 357.8C-106.8 357.8-124.7 373.4-128 384.4L-128 359.3-184.1 359.3C-183.4 372.6-184.1 519-184.1 519L-128 519-128 432.7C-128 427.8-128.2 423-126.8 419.6-123 410-114.7 400-99.8 400-80.3 400-71.5 414.8-71.5 436.4L-71.5 519-14.9 519-14.9 430.2C-14.9 380.8-42.7 357.8-78.2 357.8Z" />
                </svg>
              </span>
              <span style={{ wordBreak: "break-word" }}>{linkedin}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
              <span style={iconStyle}>
                <svg viewBox="0 0 64 64" width="13.6pt" height="13.6pt" fill="#A6A6A6">
                  <path d="M32 0C18.746 0 8 10.746 8 24 8 29.219 9.711 34.008 12.555 37.93 12.606 38.024 12.614 38.129 12.672 38.219L28.672 62.219C29.414 63.332 30.664 64 32 64 33.336 64 34.586 63.332 35.328 62.219L51.328 38.219C51.387 38.129 51.394 38.024 51.445 37.93 54.289 34.008 56 29.219 56 24 56 10.746 45.254 0 32 0ZM32 32C27.582 32 24 28.418 24 24 24 19.582 27.582 16 32 16 36.418 16 40 19.582 40 24 40 28.418 36.418 32 32 32Z" />
                </svg>
              </span>
              <span>{location}</span>
            </div>
          </div>
        </div>

        <div style={{ width: "70.5%", paddingLeft: "16pt", boxSizing: "border-box" }}>
          {rightContent}
        </div>
      </div>
    </div>
  );
}
export function CoverLetterSheet(props: any) {
  const content = props.content || props.c || {}; const seriesId = props.seriesId || "2"; const style = props.style || props.settings?.style || {}; const paperSize = props.paperSize || style?.pageSize;
  const c: any = content || {};
  if (String(seriesId) === "3") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const cl = content?.coverLetter;
    const sigName = content?.fullName || content?.name || "James Smith";
    const pGap = isA4 ? "12pt" : "9pt";

    return (
      <ElegantSheetShell
        c={c}
        isA4={isA4}
        rightContent={
          <div style={{ lineHeight: isA4 ? 1.48 : 1.38 }}>
            <div style={{ textAlign: "right" }}>{cl?.date || "Date Here"}</div>

            <div style={{ marginTop: isA4 ? "12pt" : "8pt" }}>
              <div>{cl?.recipientName || "Hiring Manager Name"}</div>
              <div>{cl?.company || "Company Name"}</div>
              <div>{cl?.companyAddress || "Company Address"}</div>
            </div>

            <div style={{ marginTop: isA4 ? "20pt" : "14pt" }}>
              {cl?.salutation || "Dear [Hiring Manager],"}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[0] ||
                "Use this space to write a personalized introduction to your future employer."}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[1] ||
                "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic."}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[2] ||
                "Start with a strong opening that explains why you\u2019re excited about this position and what makes you a great fit. Be genuine \u2014 share a bit about your motivation, your professional values, or a defining moment in your career that shaped your work style."}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[3] ||
                "In the next paragraph, describe what you\u2019ve accomplished in your field. Focus on the results you\u2019ve achieved and how your contributions made a difference. Use specific examples, but keep it conversational rather than technical."}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[4] ||
                "Then, explain what draws you to [Company Name] \u2014 perhaps their mission, culture, or approach to innovation. Show that you\u2019ve done your research and that you see yourself thriving there."}
            </div>

            <div style={{ marginTop: pGap }}>
              {cl?.paragraphs?.[5] ||
                "Finally, close with a forward-looking statement. Express your enthusiasm to discuss the role further and invite them to contact you."}
            </div>

            <div style={{ marginTop: pGap }}>
              Thank the reader for their time and consideration, expressing enthusiasm to discuss the opportunity further.
            </div>

            <div style={{ marginTop: pGap }}>{cl?.closing || "Sincerely,"}</div>

            <div
              style={{
                marginTop: isA4 ? "12pt" : "8pt",
                fontFamily: "'Pacifico', cursive",
                fontSize: "20pt",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.2,
              }}
            >
              {sigName}
            </div>
            <div style={{ marginTop: "3pt" }}>{sigName}</div>
          </div>
        }
      />
    );
  }
  if (seriesId === "4") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const cl = c.coverLetter;
    const sigName = c.fullName || c.name || "Olivia Anderson";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          color: "#000000",
          fontFamily: "'Merriweather', Georgia, serif",
          fontSize: "9.5pt",
          fontWeight: 300,
          lineHeight: isA4 ? 1.48 : 1.4,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ width: "100%", height: "6.5pt", backgroundColor: "#D0CECE", flexShrink: 0 }} />
        <div style={{ flex: 1, padding: isA4 ? "20pt 30pt 30pt" : "16pt 30pt 24pt", boxSizing: "border-box" }}>
          <DoubleColHeader content={c} style={style} showContact={true} isA4={isA4} />

          <div style={{ textAlign: "right", marginTop: "6pt" }}>
            {cl?.date || "Date Here"}
          </div>

          <div style={{ marginTop: "10pt" }}>
            <div>{cl?.recipientName || "Hiring Manager Name"}</div>
            <div>{cl?.company || "Company Name"}</div>
            <div>{cl?.companyAddress || "Company Address"}</div>
          </div>

          <div style={{ marginTop: "22pt" }}>
            {cl?.salutation || "Dear [Hiring Manager],"}
          </div>

          <div style={{ marginTop: "12pt" }}>
            {cl?.paragraphs?.[0] ||
              "Use this space to write a personalized introduction to your future employer."}
            <br />
            {cl?.paragraphs?.[1] ||
              "Your cover letter should tell a short story \u2014 one that connects who you are with the opportunity you\u2019re pursuing. Keep your tone confident, friendly, and authentic."}
          </div>

          <div style={{ marginTop: "12pt" }}>
            {cl?.paragraphs?.[2] ||
              "Start with a strong opening that explains why you\u2019re excited about this position and what makes you a great fit. Be genuine \u2014 share a bit about your motivation, your professional values, or a defining moment in your career that shaped your work style."}
          </div>

          <div style={{ marginTop: "12pt" }}>
            {cl?.paragraphs?.[3] ||
              "In the next paragraph, describe what you\u2019ve accomplished in your field. Focus on the results you\u2019ve achieved and how your contributions made a difference. Use specific examples, but keep it conversational rather than technical."}
          </div>

          <div style={{ marginTop: "12pt" }}>
            {cl?.paragraphs?.[4] ||
              "Then, explain what draws you to [Company Name] \u2014 perhaps their mission, culture, or approach to innovation. Show that you\u2019ve done your research and that you see yourself thriving there."}
          </div>

          <div style={{ marginTop: "12pt" }}>
            {cl?.paragraphs?.[5] ||
              "Finally, close with a forward-looking statement. Express your enthusiasm to discuss the role further and invite them to contact you."}
          </div>

          <div style={{ marginTop: "12pt" }}>
            Thank the reader for considering the application, and express enthusiasm for future communication.
          </div>

          <div style={{ marginTop: "12pt" }}>{cl?.closing || "Sincerely,"}</div>

          <div
            style={{
              marginTop: "14pt",
              fontFamily: "'Great Vibes', cursive",
              fontSize: "22pt",
              fontWeight: 400,
              color: "#000000",
              lineHeight: 1.15,
            }}
          >
            {sigName}
          </div>
          <div style={{ marginTop: "3pt" }}>{sigName}</div>
        </div>
      </div>
    );
  }
  if (seriesId === "11") {
    const isLetter = (paperSize || style?.pageSize) === "Letter";
    const pageW = isLetter ? "612pt" : "595.3pt";
    const pageH = isLetter ? "792pt" : "841.9pt";
    const cl = c?.coverLetter || {};
    const senderName = cl.signatureText || c?.fullName || c?.name || c?.personal?.fullName || "Blake Truman";
    const pGap = isLetter ? "11pt" : "12.5pt";
    const bodyStyle: React.CSSProperties = {
      fontFamily: "'Merriweather', Georgia, serif",
      fontSize: isLetter ? "9.5pt" : "9.85pt",
      fontWeight: 300,
      lineHeight: 1.48,
      color: "#000000",
    };

    const defaultParagraphs = [
      "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results.",
      "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance).",
      "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:",
    ];

    const paragraphs =
      Array.isArray(cl.paragraphs) && cl.paragraphs.length > 0
        ? cl.paragraphs
        : defaultParagraphs;

    return (
      <div
        style={{
          width: pageW,
          height: pageH,
          padding: "36pt 36pt 36pt 36pt",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          color: "#000000",
          overflow: "hidden",
        }}
      >
        <IvyPage1Header c={c} isLetter={isLetter} bottomGap={isLetter ? "20pt" : "24pt"} />

        <div style={{ ...bodyStyle, textAlign: "right", marginBottom: pGap }}>
          {cl.date || "Date Here"}
        </div>

        <div style={{ ...bodyStyle, marginBottom: isLetter ? "20pt" : "23pt" }}>
          <div>{cl.recipientName || "Hiring Manager Name"}</div>
          <div>{cl.companyName || "Company Name"}</div>
          <div>{cl.companyAddress || "Company Address"}</div>
        </div>

        <div style={{ ...bodyStyle, marginBottom: pGap }}>
          {cl.salutation || cl.greeting || "Dear [Hiring Manager],"}
        </div>

        {paragraphs.map((pText: string, i: number) => (
          <div
            key={i}
            style={{
              ...bodyStyle,
              marginBottom: i === paragraphs.length - 1 ? "6pt" : pGap,
            }}
          >
            {pText}
          </div>
        ))}

        <div style={{ ...bodyStyle, marginBottom: isLetter ? "4pt" : pGap }}>
          {cl.quote ||
            "\u201CI would welcome the opportunity to discuss how my skills and experience align with your company\u2019s objectives. Please feel free to contact me at (555) 555-5555 or youremail@mail.com.\u201D"}
        </div>

        <div style={{ ...bodyStyle, marginBottom: pGap }}>
          {cl.closingNote || "Thank you for your consideration."}
        </div>

        <div style={{ ...bodyStyle, marginBottom: pGap }}>
          {cl.signOff || "Sincerely,"}
        </div>

        <div
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: "24pt",
            fontWeight: 400,
            WebkitTextStroke: "0.2pt #000000",
            color: "#000000",
            lineHeight: 1.2,
            marginBottom: "2pt",
          }}
        >
          {senderName}
        </div>
        <div style={bodyStyle}>{senderName}</div>
      </div>
    );
  }
  if (seriesId === "12") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const cl = c.coverLetter;
    const sigName = c.fullName || c.name || "Jonah Romano";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "36pt",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          fontFamily: "'Work Sans', sans-serif",
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          lineHeight: isA4 ? 1.42 : 1.38,
        }}
      >
        <SinglePage1Header c={c} />

        <div style={{ marginTop: "28pt", textAlign: "right" }}>
          {cl?.date || "Date Here"}
        </div>

        <div style={{ marginTop: "14pt" }}>
          <div>{cl?.recipientName || "Hiring Manager Name"}</div>
          <div>{cl?.company || "Company Name"}</div>
          <div>{cl?.companyAddress || "Company Address"}</div>
        </div>

        <div style={{ marginTop: "26pt" }}>
          {cl?.salutation || "Dear [Hiring Manager],"}
        </div>

        <div style={{ marginTop: "14pt" }}>
          {cl?.paragraphs?.[0] ||
            "Begin your letter with a strong and confident opening statement. Introduce yourself and mention the specific position title and company name to show you\u2019ve tailored the letter. Briefly highlight what makes you a great fit \u2014 for example, your leadership experience, ability to manage complex projects, or commitment to achieving results."}
        </div>

        <div style={{ marginTop: "14pt" }}>
          {cl?.paragraphs?.[1] ||
            "In the next paragraph, connect your background to the company\u2019s goals. Explain why you\u2019re drawn to this organization \u2014 such as its reputation for innovation, growth, or positive impact in its industry. Demonstrate how your experience directly supports their mission by sharing one or two measurable accomplishments (e.g., increasing efficiency, reducing costs, driving performance)."}
        </div>

        <div style={{ marginTop: "14pt" }}>
          {cl?.paragraphs?.[2] ||
            "Close your letter with a professional and forward-looking tone. Reaffirm your enthusiasm and invite further discussion. For instance:"}
        </div>

        <div style={{ marginTop: "7pt" }}>
          {cl?.paragraphs?.[3] ||
            "\u201CI would welcome the opportunity to discuss how my skills and experience align with your company\u2019s objectives. Please feel free to contact me at (555) 555-5555 or youremail@mail.com.\u201D"}
        </div>

        <div style={{ marginTop: "14pt" }}>Thank you for your consideration.</div>

        <div style={{ marginTop: "14pt" }}>{cl?.closing || "Sincerely,"}</div>

        <div
          style={{
            marginTop: "14pt",
            fontFamily: "'Parisienne', cursive",
            fontSize: "20pt",
            fontWeight: 700,
            color: "#000000",
            lineHeight: 1.2,
          }}
        >
          {sigName}
        </div>
        <div style={{ marginTop: "2pt" }}>{sigName}</div>
      </div>
    );
  }
  if (seriesId === "2") {
    const isLetter = (paperSize || style?.pageSize) === "Letter";
    const pageW = isLetter ? "612pt" : "595.3pt";
    const pageH = isLetter ? "792pt" : "841.9pt";
    const vLineX = isLetter ? "195.8pt" : "194.1pt";
    const leftW = isLetter ? "158pt" : "156pt";
    const rightX = isLetter ? "208pt" : "206.7pt";
    const rightW = isLetter ? "368pt" : "357.6pt";

    const fullName = (c?.fullName || c?.name || c?.personal?.fullName || "JENNIFER DAVIS").toUpperCase();
    const profession = (c?.profession || c?.title || c?.personal?.title || "YOUR PROFESSION").toUpperCase();
    const phone = c?.phone || c?.personal?.phone || "(555) 555-5555";
    const email = c?.email || c?.personal?.email || "youremail@mail.com";
    const linkedin = c?.linkedin || c?.personal?.linkedin || "Linkedin.com/name";
    const location = c?.location || c?.personal?.location || "City, State/Province";
    const cl = c?.coverLetter || {};
    const sigName = cl.signatureText || "Jennifer Davis";

    const bodySize = "10pt";
    const lineH = isLetter ? 1.32 : 1.44;
    const pGap = isLetter ? "7.5pt" : "11pt";

    const bodyTextStyle: React.CSSProperties = {
      fontFamily: "'Rubik', sans-serif",
      fontSize: bodySize,
      fontWeight: 400,
      lineHeight: lineH,
      color: "#000000",
    };

    const contactRows = [
      { icon: <ExecutivePhoneIcon size={29} />, text: phone },
      { icon: <ExecutiveEmailIcon size={25} />, text: email },
      { icon: <ExecutiveLinkedInIcon size={27} />, text: linkedin },
      { icon: <ExecutiveHomeIcon size={27} />, text: location },
    ];

    const accomplishments = [
      "Consistently exceeded sales targets by up to 35% year-over-year",
      "Guided cross-functional teams to deliver strategic client solutions",
      "Developed and implemented a new onboarding program that increased retention by 20%",
      "Built strong client partnerships resulting in long-term contracts",
    ];

    return (
      <div
        style={{
          width: pageW,
          height: pageH,
          backgroundColor: "#FFFFFF",
          color: "#000000",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          fontFamily: "'Rubik', sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "11.25pt",
            backgroundColor: "#002060",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "29pt",
            left: "30pt",
            right: "30pt",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: "26pt",
              fontWeight: 400,
              letterSpacing: "4.5pt",
              paddingLeft: "4.5pt",
              color: "#000000",
              lineHeight: 1.15,
              marginBottom: "11pt",
            }}
          >
            {fullName}
          </div>
          <div
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "11pt",
              fontWeight: 400,
              letterSpacing: "3pt",
              paddingLeft: "6pt",
              color: "#44546A",
              lineHeight: 1.2,
            }}
          >
            {profession}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "112pt",
            left: "30pt",
            right: "30pt",
            height: 0,
            borderTop: "1pt solid #DDE0F7",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "120pt",
            bottom: "24pt",
            left: vLineX,
            width: 0,
            borderLeft: "1pt solid #DDE0F7",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "122pt",
            left: "30pt",
            width: leftW,
            display: "flex",
            flexDirection: "column",
            gap: "6.5pt",
          }}
        >
          {contactRows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10pt",
              }}
            >
              <div
                style={{
                  width: "21pt",
                  height: "21pt",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </div>
              <span
                style={{
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: "10pt",
                  fontWeight: 400,
                  lineHeight: 1.25,
                  color: "#000000",
                  wordBreak: "break-word",
                }}
              >
                {row.text}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: "122pt",
            left: rightX,
            width: rightW,
            ...bodyTextStyle,
          }}
        >
          <div style={{ textAlign: "right", marginBottom: "1pt" }}>
            {cl.date || "[Date]"}
          </div>
          <div style={{ marginBottom: pGap }}>
            {cl.reSubject || "RE: [Job Title]"}
          </div>

          <div style={{ marginBottom: isLetter ? "14pt" : "18pt" }}>
            <div>{cl.recipientName || "[Hiring Manager Name]"}</div>
            <div>{cl.companyName || "Company Name"}</div>
          </div>

          <div style={{ marginBottom: pGap }}>
            {cl.greeting || "Dear [Hiring Manager],"}
          </div>

          <div>
            {"Opening paragraph: Capture attention. Explain why this role excites you and how your background makes you a strong fit. Be confident, personal, and genuine."}
          </div>
          <div style={{ marginBottom: pGap }}>
            {"Share why this specific role and company excite you. Connect your experience to their needs and show genuine interest."}
          </div>

          <div style={{ marginBottom: pGap }}>
            {"I\u2019ve always been driven by curiosity and the desire to create meaningful results. The role of [Job Title] at [Company Name] feels like a natural next step that aligns with my passion for growth and delivering measurable impact."}
          </div>

          <div>
            {"Body paragraph: Highlight 3\u20135 strong results with numbers or clear outcomes that prove your value."}
          </div>
          <div style={{ marginBottom: pGap }}>
            {"Key accomplishments include:"}
          </div>

          <ul
            style={{
              listStyleType: "disc",
              listStylePosition: "outside",
              margin: `0 0 ${pGap} 0`,
              paddingLeft: "13.5pt",
            }}
          >
            {accomplishments.map((item, i) => (
              <li key={i} style={{ paddingLeft: "1.5pt", marginBottom: i < accomplishments.length - 1 ? "1.5pt" : "0" }}>
                {item}
              </li>
            ))}
          </ul>

          <div>
            {"Closing paragraph: Focus on what you will bring to the company. Emphasize your strengths, mindset, and unique contribution."}
          </div>
          <div style={{ marginBottom: pGap }}>
            {"End with a confident call to action and your contact details."}
          </div>

          <div style={{ marginBottom: pGap }}>
            {"I believe success comes from listening deeply and acting decisively. I\u2019m confident my mix of strategy, creativity, and leadership can make an immediate impact at [Company Name]."}
          </div>

          <div style={{ marginBottom: pGap }}>
            {"I\u2019d love to discuss how my experience can support your team\u2019s success. Reach me at youremail@mail.com or (555)-555-5555."}
          </div>

          <div style={{ marginBottom: isLetter ? "10pt" : "12pt" }}>
            {cl.signOff || "Sincerely,"}
          </div>

          <div
            style={{
              fontFamily: "'Lumanosimo', cursive",
              fontSize: isLetter ? "18pt" : "20pt",
              fontWeight: 700,
              color: "#000000",
              lineHeight: 1.25,
              marginBottom: "2pt",
            }}
          >
            {sigName}
          </div>
          <div>{sigName}</div>
        </div>
      </div>
    );
  }

}

export function ReferencesSheet(props: any) {
  const c: any = props.content || props.c || {};
  const seriesId: string = props.seriesId || "2";
  const style: any = props.style || props.settings?.style || {};
  const isLetter = (props.paperSize || style?.pageSize) === "Letter";
  const pageW = isLetter ? "612pt" : "595.3pt";
  const pageH = isLetter ? "792pt" : "841.9pt";

  const makeRefs = (defaultName: string) =>
    [0, 1, 2, 3].map((idx) => {
      const item = c?.references?.[idx];
      return {
        id: item?.id || `ref_${idx}`,
        name: !item?.name || item.name === "Reference Name" ? defaultName : item.name,
        title: item?.title || "Job Title",
        company: item?.company || "Company or Institution",
        phone: item?.phone || "(555) 555-5555",
        email: item?.email || "reference@mail.com",
      };
    });

  if (seriesId === "4") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const refs =
      Array.isArray(c.references) && c.references.length > 0
        ? c.references.slice(0, 4)
        : [0, 1, 2, 3].map(() => ({
            name: "FULL NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          }));

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          color: "#000000",
          fontFamily: "'Merriweather', Georgia, serif",
          fontSize: "9.5pt",
          fontWeight: 300,
          lineHeight: isA4 ? 1.48 : 1.4,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ width: "100%", height: "6.5pt", backgroundColor: "#D0CECE", flexShrink: 0 }} />
        <div style={{ flex: 1, padding: isA4 ? "20pt 30pt 30pt" : "16pt 30pt 24pt", boxSizing: "border-box" }}>
          <DoubleColHeader content={c} style={style} showContact={true} isA4={isA4} />

          <div
            style={{
              textAlign: "center",
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "14.5pt",
              fontWeight: 400,
              letterSpacing: "2.9pt",
              color: "#000000",
              marginBottom: isA4 ? "14pt" : "10pt",
            }}
          >
            REFERENCES
          </div>

          <div style={{ textAlign: "center" }}>
            {refs.map((r: any, idx: number) => (
              <div key={idx} style={{ marginTop: idx === 0 ? 0 : isA4 ? "26pt" : "20pt" }}>
                <div style={{ fontWeight: 700 }}>{r.name || "FULL NAME HERE"}</div>
                <div>{r.title || "Job Title"}</div>
                <div>{r.company || "Company or Institution"}</div>
                <div>{r.phone || "(555) 555-5555"}</div>
                <div>{r.email || "reference@mail.com"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (String(seriesId) === "3") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const refs =
      Array.isArray(c?.references) && c.references.length > 0
        ? c.references.slice(0, 4)
        : [0, 1, 2, 3].map(() => ({
            name: "FULL NAME HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          }));

    return (
      <ElegantSheetShell
        c={c}
        isA4={isA4}
        rightContent={
          <div style={{ lineHeight: isA4 ? 1.45 : 1.38 }}>
            <div
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "13.5pt",
                fontWeight: 500,
                letterSpacing: "3.6pt",
                color: "#000000",
                lineHeight: 1.2,
                marginBottom: "14pt",
              }}
            >
              REFERENCES
            </div>

            {refs.map((r: any, idx: number) => (
              <div key={idx} style={{ marginTop: idx === 0 ? 0 : isA4 ? "26pt" : "20pt" }}>
                <div style={{ fontWeight: 700 }}>{r.name || "FULL NAME HERE"}</div>
                <div>{r.title || "Job Title"}</div>
                <div>{r.company || "Company or Institution"}</div>
                <div>{r.phone || "(555) 555-5555"}</div>
                <div>{r.email || "reference@mail.com"}</div>
              </div>
            ))}
          </div>
        }
      />
    );
  }

  if (seriesId === "11") {
    const refs = makeRefs("REFERENCE NAME HERE");
    return (
      <div style={{ width: pageW, height: pageH, padding: "36pt 36pt 36pt 36pt", boxSizing: "border-box", backgroundColor: "#FFFFFF", color: "#000000", overflow: "hidden" }}>
        <IvyPage1Header c={c} isLetter={isLetter} bottomGap={isLetter ? "13pt" : "15pt"} />
        <IvySectionHeading title="REFERENCES" letterSpacing="2.7pt" marginTop="0" marginBottom={isLetter ? "10pt" : "12pt"} />
        <div style={{ textAlign: "center" }}>
          {refs.map((ref, idx) => (
            <div key={ref.id} style={{ fontFamily: "'Merriweather', Georgia, serif", fontSize: isLetter ? "9.5pt" : "10pt", fontWeight: 300, lineHeight: 1.58, marginBottom: idx < refs.length - 1 ? (isLetter ? "22pt" : "25pt") : "0" }}>
              <div style={{ fontWeight: 700, letterSpacing: "1pt" }}>{ref.name.toUpperCase()}</div>
              <div>{ref.title}</div>
              <div>{ref.company}</div>
              <div>{ref.phone}</div>
              <div>{ref.email}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (seriesId === "12") {
    const isA4 = String(style?.pageSize || "A4").toLowerCase() !== "letter";
    const refs =
      Array.isArray(c.references) && c.references.length > 0
        ? c.references.slice(0, 4)
        : [0, 1, 2, 3].map(() => ({
            name: "REFERENCE   NAME   HERE",
            title: "Job Title",
            company: "Company or Institution",
            phone: "(555) 555-5555",
            email: "reference@mail.com",
          }));

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "36pt",
          boxSizing: "border-box",
          backgroundColor: "#FFFFFF",
          fontFamily: "'Work Sans', sans-serif",
          fontSize: "10pt",
          fontWeight: 400,
          color: "#000000",
          lineHeight: isA4 ? 1.42 : 1.38,
        }}
      >
        <SinglePage1Header c={c} />

        <div style={{ marginTop: "16pt" }}>
          <SingleSectionBanner title="REFERENCES" />
        </div>

        <div style={{ marginTop: "12pt", textAlign: "center" }}>
          {refs.map((r: any, idx: number) => (
            <div key={idx} style={{ marginTop: idx === 0 ? 0 : "26pt" }}>
              <div style={{ fontWeight: 700, letterSpacing: "0.5pt" }}>
                {r.name || "REFERENCE   NAME   HERE"}
              </div>
              <div>{r.title || "Job Title"}</div>
              <div>{r.company || "Company or Institution"}</div>
              <div>{r.phone || "(555) 555-5555"}</div>
              <div>{r.email || "reference@mail.com"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (seriesId === "14") {
    const refs = makeRefs("REFERENCE NAME HERE");
    return (
      <div style={{ width: pageW, height: pageH, padding: "36pt 36pt 36pt 36pt", boxSizing: "border-box", backgroundColor: "#FFFFFF", color: "#000000", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
        <MinimalPage1Header c={c} />
        <MinimalSectionHeading title="REFERENCES" />
        <div>
          {refs.map((ref, idx) => (
            <div key={ref.id} style={{ fontSize: "9.2pt", lineHeight: 1.58, marginBottom: idx < refs.length - 1 ? (isLetter ? "18pt" : "22pt") : "0" }}>
              <div style={{ fontWeight: 700, letterSpacing: "1pt" }}>{ref.name.toUpperCase()}</div>
              <div>{ref.title}</div>
              <div>{ref.company}</div>
              <div>{ref.phone}</div>
              <div>{ref.email}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Executive ("2") and default fallback
  const vLineX = isLetter ? "195.8pt" : "194.1pt";
  const rightX = isLetter ? "208pt" : "206.7pt";
  const rightW = isLetter ? "368pt" : "357.6pt";
  const fullName = (c?.fullName || c?.name || c?.personal?.fullName || "JENNIFER DAVIS").toUpperCase();
  const profession = (c?.profession || c?.title || c?.personal?.title || "YOUR PROFESSION").toUpperCase();
  const refs = makeRefs("REFERENCE NAME HERE");
  const contactRows = [
    { icon: <ExecutivePhoneIcon size={29} />, text: c?.phone || c?.personal?.phone || "(555) 555-5555" },
    { icon: <ExecutiveEmailIcon size={25} />, text: c?.email || c?.personal?.email || "youremail@mail.com" },
    { icon: <ExecutiveLinkedInIcon size={27} />, text: c?.linkedin || c?.personal?.linkedin || "Linkedin.com/name" },
    { icon: <ExecutiveHomeIcon size={27} />, text: c?.location || c?.personal?.location || "City, State/Province" },
  ];

  return (
    <div style={{ width: pageW, height: pageH, backgroundColor: "#FFFFFF", color: "#000000", position: "relative", overflow: "hidden", boxSizing: "border-box", fontFamily: "'Rubik', sans-serif" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "11.25pt", backgroundColor: "#002060" }} />
      <div style={{ position: "absolute", top: "29pt", left: "30pt", right: "30pt", textAlign: "center" }}>
        <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "26pt", fontWeight: 400, letterSpacing: "4.5pt", paddingLeft: "4.5pt", lineHeight: 1.15, marginBottom: "11pt" }}>
          {fullName}
        </div>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: "11pt", fontWeight: 400, letterSpacing: "3pt", paddingLeft: "3pt", color: "#44546A", lineHeight: 1.2 }}>
          {profession}
        </div>
      </div>
      <div style={{ position: "absolute", top: "112pt", left: "30pt", right: "30pt", height: 0, borderTop: "1pt solid #DDE0F7" }} />
      <div style={{ position: "absolute", top: "120pt", bottom: "24pt", left: vLineX, width: 0, borderLeft: "1pt solid #DDE0F7" }} />
      <div style={{ position: "absolute", top: "122pt", left: "30pt", width: "158pt", display: "flex", flexDirection: "column", gap: "6.5pt" }}>
        {contactRows.map((row, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10pt" }}>
            <div style={{ width: "21pt", height: "21pt", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
            <span style={{ fontSize: "10pt", lineHeight: 1.25 }}>{row.text}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: "122pt", left: rightX, width: rightW }}>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: "13pt", fontWeight: 700, letterSpacing: "2.95pt", color: "#1F3C88", marginBottom: "14pt" }}>
          REFERENCES
        </div>
        {refs.map((ref, idx) => (
          <div key={ref.id} style={{ fontSize: "10pt", lineHeight: 1.56, marginBottom: idx < refs.length - 1 ? (isLetter ? "20pt" : "24pt") : "0" }}>
            <div style={{ fontWeight: 700 }}>{ref.name.toUpperCase()}</div>
            <div>{ref.title}</div>
            <div>{ref.company}</div>
            <div>{ref.phone}</div>
            <div>{ref.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
