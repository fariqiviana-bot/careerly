"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ResumeContent,
  DocumentStyleSettings,
  SectionLayoutItem,
  SAMPLE_CONTENT_BY_SERIES,
  SERIES_CATALOG,
} from "@/lib/store";
import {
  Series2,
  Series3,
  Series4,
  Series11,
  Series12,
  Series14,
  Series22,
  Series24,
  CoverLetterSheet,
  ReferencesSheet,
  getBullets,
} from "./series-all";

export const RENDERED = ["2", "3", "4", "11", "12", "14", "22", "24"];

export interface MasterSeriesCanvasProps {
  seriesId: string;
  content: ResumeContent;
  activeTab?: "resume" | "cover" | "references";
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  showOriginalReference?: boolean;
}

function SinglePageRenderer({
  seriesId,
  content,
  style,
  sectionOrder,
  pageIndex,
  totalPages,
}: {
  seriesId: string;
  content: ResumeContent;
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  pageIndex: number;
  totalPages?: number;
}) {
  const props = { content, style, sectionOrder, pageIndex, totalPages };
  switch (seriesId) {
    case "2":
      return <Series2 {...props} />;
    case "3":
      return <Series3 {...props} />;
    case "4":
      return <Series4 {...props} />;
    case "11":
      return <Series11 {...props} />;
    case "12":
      return <Series12 {...props} />;
    case "14":
      return <Series14 {...props} />;
    case "22":
      return <Series22 {...props} />;
    case "24":
      return <Series24 {...props} />;
    default:
      return <Series11 {...props} />;
  }
}

function getOriginalPreviewPath(
  seriesId: string,
  activeTab: "resume" | "cover" | "references",
  pageIndex: number,
  pageSize: "A4" | "Letter" = "A4"
) {
  const sz = pageSize === "Letter" ? "letter" : "a4";
  if (activeTab === "cover") return `/templates/${seriesId}/preview-cover-${sz}.png`;
  if (activeTab === "references") return `/templates/${seriesId}/preview-references-${sz}.png`;
  const pageNum = pageIndex + 1;
  return `/templates/${seriesId}/preview-resume-${pageNum}p-${sz}.png`;
}

export function MasterSeriesCanvas({
  seriesId,
  content,
  activeTab = "resume",
  style,
  sectionOrder,
  showOriginalReference = false,
}: MasterSeriesCanvasProps) {
  const isLetter = style?.pageSize === "Letter";
  const pageWidth = isLetter ? 816 : 794;
  const pageHeight = isLetter ? 1056 : 1123;
  const MAX_2P_SERIES = ["11", "12", "14"]; const rawPageCount = activeTab === "resume" ? style?.pageCount || 1 : 1; const pageCount = MAX_2P_SERIES.includes(String(seriesId)) ? Math.min(rawPageCount, 2) : rawPageCount;
  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-8">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Courgette&family=Great+Vibes&family=Kaushan+Script&family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lumanosimo&family=Manrope:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Pacifico&family=Parisienne&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&family=Rubik:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
      />
      {pages.map((pageIndex) => (
        <div key={pageIndex} className="flex flex-col xl:flex-row items-start gap-6">
          <div className="relative group">
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#5d6f61] uppercase tracking-wider px-1">
              <span>
                {activeTab === "cover"
                  ? `Cover Letter (${style?.pageSize || "A4"})`
                  : activeTab === "references"
                  ? `References Sheet (${style?.pageSize || "A4"})`
                  : `Page ${pageIndex + 1} of ${pageCount} (${style?.pageSize || "A4"})`}
              </span>
              <span>
                {isLetter ? "US Letter (8.5 \u00d7 11 in)" : "A4 (210 \u00d7 297 mm)"}
              </span>
            </div>
            <div
              className="bg-white shadow-[0_20px_60px_rgba(32,33,36,0.14)] ring-1 ring-[#202124]/10 transition-all overflow-hidden"
              style={{
                width: `${pageWidth}px`,
                height: `${pageHeight}px`,
              }}
            >
              {activeTab === "cover" ? (
                <CoverLetterSheet content={content} seriesId={seriesId} style={style} paperSize={style?.pageSize} />
              ) : activeTab === "references" ? (
                <ReferencesSheet content={content} seriesId={seriesId} style={style} paperSize={style?.pageSize} />
              ) : (
                <SinglePageRenderer
                  seriesId={seriesId}
                  content={content}
                  style={style}
                  sectionOrder={sectionOrder}
                  pageIndex={pageIndex} totalPages={pageCount}
                />
              )}
            </div>
          </div>

          {showOriginalReference && (
            <div className="relative">
              <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#595959] uppercase tracking-wider px-1">
                <span>
                  Original Word/PDF Reference (
                  {activeTab === "resume" ? `Page ${pageIndex + 1}` : activeTab} \u00b7{" "}
                  {style?.pageSize || "A4"})
                </span>
              </div>
              <div
                className="bg-white shadow-lg ring-1 ring-[#202124]/10 overflow-hidden"
                style={{
                  width: `${pageWidth}px`,
                  height: `${pageHeight}px`,
                }}
              >
                <img
                  src={getOriginalPreviewPath(
                    seriesId,
                    activeTab,
                    pageIndex,
                    style?.pageSize || "A4"
                  )}
                  alt="Original Template Reference"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function mapDocToResumeContent(doc: any): ResumeContent {
  const rawId = String(doc?.series || doc?.template || "11");
  const seriesId = RENDERED.includes(rawId) ? rawId : rawId.replace(/[^0-9]/g, "") || "11";
  const base = SAMPLE_CONTENT_BY_SERIES[seriesId] || SAMPLE_CONTENT_BY_SERIES["11"];
  const c = doc?.content || {};

  // Use template sample experience if doc only has legacy 1-item Rangin Agency placeholder
  const isLegacyPlaceholder =
    Array.isArray(c.experience) &&
    c.experience.length === 1 &&
    c.experience[0]?.company === "Rangin Agency";

  const mappedExp =
    !isLegacyPlaceholder && Array.isArray(c.experience) && c.experience.length > 0
      ? c.experience
          .filter((e: any) => !e.hidden)
          .map((e: any, idx: number) => ({
            id: e.id || `exp-${idx}`,
            title: e.role || e.title || "ENTER YOUR JOB TITLE HERE",
            company: e.company || "Company Name",
            location: e.location || "",
            period: e.period || "Date \u2013 Date",
            summaryParagraph: e.showOverview ? e.overview : e.summaryParagraph,
            bullets: getBullets(e),
          }))
      : base.experience;

  // Ensure multi-page views (2P / 3P) always have the template's continued jobs if user only has 2-3 items
  const fullExp =
    mappedExp.length < base.experience.length
      ? [...mappedExp, ...base.experience.slice(mappedExp.length)]
      : mappedExp;

  const mappedEdu =
    !isLegacyPlaceholder && Array.isArray(c.education) && c.education.length > 0
      ? c.education.map((ed: any, idx: number) => ({
          id: ed.id || `edu-${idx}`,
          degree: ed.degree || "DEGREE TITLE",
          school: ed.school || "University Name",
          location: ed.location || "",
          date: ed.period || ed.date || "Date",
        }))
      : base.education;

  const mappedCerts =
    Array.isArray(c.certifications) && c.certifications.length > 0
      ? c.certifications
      : base.certifications;

  return {
    ...base,
    fullName: !isLegacyPlaceholder && c.name ? c.name : base.fullName,
    profession: !isLegacyPlaceholder && c.role ? c.role : base.profession,
    phone: !isLegacyPlaceholder && c.phone ? c.phone : base.phone,
    email: !isLegacyPlaceholder && c.email ? c.email : base.email,
    linkedin: !isLegacyPlaceholder && c.linkedin ? c.linkedin : base.linkedin,
    location: !isLegacyPlaceholder && c.location ? c.location : base.location,
    summary: !isLegacyPlaceholder && c.summary ? c.summary : base.summary,
    professionalSkills:
      !isLegacyPlaceholder && Array.isArray(c.skills) && c.skills.length > 0
        ? c.skills
        : base.professionalSkills,
    technicalSkills:
      Array.isArray(c.technicalSkills) && c.technicalSkills.length > 0
        ? c.technicalSkills
        : base.technicalSkills,
    experience: fullExp,
    education: mappedEdu,
    certifications: mappedCerts,
    courses: Array.isArray(c.courses) && c.courses.length > 0 ? c.courses : base.courses,
    awards: Array.isArray(c.awards) && c.awards.length > 0 ? c.awards : base.awards,
    volunteering:
      Array.isArray(c.volunteering) && c.volunteering.length > 0
        ? c.volunteering
        : base.volunteering,
    memberships:
      Array.isArray(c.memberships) && c.memberships.length > 0 ? c.memberships : base.memberships,
    interests: Array.isArray(c.interests) && c.interests.length > 0 ? c.interests : base.interests,
    references:
      Array.isArray(c.references) && c.references.length > 0 ? c.references : base.references,
    coverLetter: base.coverLetter,
  };
}

export function ResumeRender({
  doc,
  onPatch,
  activeTab: externalTab,
  showOriginalReference: externalShowOrig = false,
}: {
  doc: any;
  onPatch?: (c: any) => void;
  onSelectSection?: (sec: string) => void;
  activeTab?: "resume" | "cover" | "references";
  showOriginalReference?: boolean;
}) {
  const rawId = String(doc?.series || doc?.template || "11");
  const seriesId = RENDERED.includes(rawId) ? rawId : rawId.replace(/[^0-9]/g, "") || "11";
  const resolvedSeries = RENDERED.includes(seriesId) ? seriesId : "11";
  const tplMeta = SERIES_CATALOG.find((s) => s.id === resolvedSeries) || SERIES_CATALOG[0];
  const maxPages = tplMeta.maxPages || 3;

  const s = doc?.settings || {};
  const [localTab, setLocalTab] = useState<"resume" | "cover" | "references">(
    externalTab || doc?.activeTab || (doc?.type === "cover" ? "cover" : "resume")
  );
  const [localPageCount, setLocalPageCount] = useState<1 | 2 | 3>(
    (s.pageCount || 1) as 1 | 2 | 3
  );
  const [localPageSize, setLocalPageSize] = useState<"A4" | "Letter">(
    s.pageSize === "Letter" ? "Letter" : "A4"
  );
  const [compareOrig, setCompareOrig] = useState<boolean>(externalShowOrig);

  useEffect(() => {
    if (s.pageCount) setLocalPageCount(Math.min(s.pageCount, maxPages) as 1 | 2 | 3);
  }, [s.pageCount, maxPages]);

  useEffect(() => {
    if (s.pageSize) setLocalPageSize(s.pageSize === "Letter" ? "Letter" : "A4");
  }, [s.pageSize]);

  useEffect(() => {
    if (externalTab) setLocalTab(externalTab);
  }, [externalTab]);

  const effectivePageCount = Math.min(localPageCount, maxPages) as 1 | 2 | 3;

  const style: DocumentStyleSettings = {
    pageSize: localPageSize,
    pageCount: effectivePageCount,
    accentColor: tplMeta.accentColor || doc?.accent || "#202124",
    fontScale: s.fontSize ? Math.round((s.fontSize / 10) * 100) : 100,
    lineSpacing: s.lineHeight || 1.35,
    pageMarginMm: s.pageMargin ? Math.round(s.pageMargin * 25.4) : 12.7,
    sectionGapPx: s.sectionSpacing || 14,
    showPhoto: true,
    showEmblem: true,
    showSignature: true,
  };

  const vis = (doc?.visibility || {}) as Record<string, boolean>;
  const sectionOrder: SectionLayoutItem[] | undefined = Array.isArray(doc?.sectionOrder)
    ? doc.sectionOrder
    : Object.keys(vis).length > 0
    ? Object.entries(vis).map(([id, visible]) => ({
        id,
        label: id,
        visible: Boolean(visible),
        column: "right",
      }))
    : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const pageW = style.pageSize === "Letter" ? 816 : 794;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth - 24;
      if (available > 0 && available < pageW) {
        setScale(available / pageW);
      } else {
        setScale(1);
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [pageW]);

  const handlePageCountChange = (cnt: 1 | 2 | 3) => {
    setLocalPageCount(cnt);
    setLocalTab("resume");
    onPatch?.({ __settings: { ...s, pageCount: cnt } });
  };

  const handlePageSizeChange = (sz: "A4" | "Letter") => {
    setLocalPageSize(sz);
    onPatch?.({ __settings: { ...s, pageSize: sz } });
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center overflow-x-hidden py-2">
      {/* Direct Canvas Format & Sheet Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-full border border-[#202124]/10 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
        {/* Document Sheet Tabs */}
        <div className="flex items-center gap-1">
          {(["resume", "cover", "references"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLocalTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                localTab === t
                  ? "bg-[#5d6f61] text-white"
                  : "text-[#202124]/75 hover:bg-[#f1efe9]"
              }`}
            >
              {t === "resume" ? "Resume" : t === "cover" ? "Cover Letter" : "References"}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-[#202124]/15" />

        {/* Page Count Selector (1P / 2P / 3P) */}
        <div className="flex items-center gap-1">
          {([1, 2, 3] as const)
            .filter((n) => n <= maxPages)
            .map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handlePageCountChange(n)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  localTab === "resume" && effectivePageCount === n
                    ? "bg-[#202124] text-white"
                    : "text-[#202124]/75 hover:bg-[#f1efe9]"
                }`}
              >
                {n}P
              </button>
            ))}
        </div>

        <div className="h-4 w-[1px] bg-[#202124]/15" />

        {/* Page Size Selector (A4 / US Letter) */}
        <div className="flex items-center gap-1">
          {(["A4", "Letter"] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => handlePageSizeChange(sz)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                localPageSize === sz
                  ? "bg-[#202124] text-white"
                  : "text-[#202124]/75 hover:bg-[#f1efe9]"
              }`}
            >
              {sz === "Letter" ? "US Letter" : "A4"}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-[#202124]/15" />

        {/* Side-by-Side Original PNG Toggle */}
        <button
          type="button"
          onClick={() => setCompareOrig((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            compareOrig
              ? "bg-[#e6b5a1] text-[#202124]"
              : "text-[#202124]/75 hover:bg-[#f1efe9]"
          }`}
        >
          {compareOrig ? "Hide Original" : "Compare Original"}
        </button>
      </div>

      <div
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top center",
        }}
      >
        <MasterSeriesCanvas
          seriesId={resolvedSeries}
          content={mapDocToResumeContent(doc)}
          activeTab={localTab}
          style={style}
          sectionOrder={sectionOrder}
          showOriginalReference={compareOrig}
        />
      </div>
    </div>
  );
}
