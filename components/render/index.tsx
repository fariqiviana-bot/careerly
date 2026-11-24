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
import { Series11Exact, Series11CoverLetter, Series11References } from "./series-11";
import { Series12Exact, Series12CoverLetter, Series12References } from "./series-12";
import { Series14Exact, Series14CoverLetter, Series14References } from "./series-14";
import { Series22Exact, Series22CoverLetter, Series22References } from "./series-22";
import { Series24Exact, Series24CoverLetter, Series24References } from "./series-24";
import { Series2Exact, Series2CoverLetter, Series2References } from "./series-2";
import { Series3Exact, Series3CoverLetter, Series3References } from "./series-3";
import { Series4Exact, Series4CoverLetter, Series4References } from "./series-4";

export const RENDERED = ["2", "3", "4", "11", "12", "14", "22", "24"];

export interface MasterSeriesCanvasProps {
  seriesId: string;
  content: ResumeContent;
  activeTab?: "resume" | "cover" | "references";
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  showOriginalReference?: boolean;
  editable?: boolean;
  onContentChange?: (next: ResumeContent) => void;
}

const UNIVERSAL_EDIT_CSS = `
.uni-edit-host [data-uni-hover="1"] {
  background-color: rgba(93, 111, 97, 0.08) !important;
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35) !important;
  border-radius: 2px;
  cursor: text !important;
}
.uni-edit-host [data-uni-active="1"] {
  outline: none !important;
  background-color: rgba(93, 111, 97, 0.07) !important;
  box-shadow: 0 0 0 1.5px #5d6f61 !important;
  border-radius: 2px;
  cursor: text !important;
}
@media print {
  .uni-edit-host [data-uni-hover="1"],
  .uni-edit-host [data-uni-active="1"] {
    background-color: transparent !important;
    box-shadow: none !important;
  }
}
`;

function normText(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

interface TextBinding {
  key: string;
  multiline: boolean;
  apply: (nextVal: string) => ResumeContent;
}

function buildContentBindings(content: ResumeContent): TextBinding[] {
  const c: any = content || {};
  const list: TextBinding[] = [];
  const add = (val: any, multiline: boolean, apply: (nextVal: string) => ResumeContent) => {
    if (typeof val !== "string") return;
    const key = normText(val);
    if (!key) return;
    list.push({ key, multiline, apply });
  };

  add(c.fullName, false, (v) => ({ ...c, fullName: v }));
  add(c.profession, false, (v) => ({ ...c, profession: v }));
  add(c.phone, false, (v) => ({ ...c, phone: v }));
  add(c.email, false, (v) => ({ ...c, email: v }));
  add(c.linkedin, false, (v) => ({ ...c, linkedin: v }));
  add(c.location, false, (v) => ({ ...c, location: v }));
  add(c.summary, true, (v) => ({ ...c, summary: v }));

  if (Array.isArray(c.professionalSkills)) {
    c.professionalSkills.forEach((sk: string, idx: number) => {
      add(sk, false, (v) => {
        const next = [...c.professionalSkills];
        next[idx] = v;
        return { ...c, professionalSkills: next };
      });
    });
    if (c.professionalSkills.length > 0) {
      add(c.professionalSkills.join(" - "), true, (v) => ({
        ...c,
        professionalSkills: v
          .split(/\s*[\-\u2013\u2014|•,]\s*/)
          .map((s) => s.trim())
          .filter(Boolean),
      }));
    }
  }

  if (Array.isArray(c.technicalSkills)) {
    c.technicalSkills.forEach((sk: string, idx: number) => {
      add(sk, false, (v) => {
        const next = [...c.technicalSkills];
        next[idx] = v;
        return { ...c, technicalSkills: next };
      });
    });
  }

  if (Array.isArray(c.experience)) {
    c.experience.forEach((exp: any, idx: number) => {
      const patchExp = (p: any) => ({
        ...c,
        experience: c.experience.map((e: any, i: number) => (i === idx ? { ...e, ...p } : e)),
      });
      add(exp.title, false, (v) => patchExp({ title: v, role: v }));
      add(exp.company, false, (v) => patchExp({ company: v }));
      add(exp.location, false, (v) => patchExp({ location: v }));
      if (exp.company && exp.location) {
        add(`${exp.company} / ${exp.location}`, false, (v) => patchExp({ company: v, location: "" }));
        add(`${exp.company}, ${exp.location}`, false, (v) => patchExp({ company: v, location: "" }));
        add(`${exp.company} | ${exp.location}`, false, (v) => patchExp({ company: v, location: "" }));
      }
      add(exp.period, false, (v) => patchExp({ period: v, date: v }));
      add(exp.summaryParagraph, true, (v) =>
        patchExp({ summaryParagraph: v, overview: v, description: v, showOverview: Boolean(v.trim()) })
      );
      const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
      bullets.forEach((b: string, bIdx: number) => {
        add(b, true, (v) => {
          const nextB = [...bullets];
          if (v.trim()) nextB[bIdx] = v;
          else nextB.splice(bIdx, 1);
          return patchExp({ bullets: nextB });
        });
      });
    });
  }

  if (Array.isArray(c.education)) {
    c.education.forEach((ed: any, idx: number) => {
      const patchEdu = (p: any) => ({
        ...c,
        education: c.education.map((e: any, i: number) => (i === idx ? { ...e, ...p } : e)),
      });
      add(ed.degree, false, (v) => patchEdu({ degree: v }));
      add(ed.school, false, (v) => patchEdu({ school: v }));
      add(ed.location, false, (v) => patchEdu({ location: v }));
      add(ed.date, false, (v) => patchEdu({ date: v, period: v }));
    });
  }

  if (Array.isArray(c.courses)) {
    c.courses.forEach((crs: any, idx: number) => {
      const patchCrs = (p: any) => ({
        ...c,
        courses: c.courses.map((e: any, i: number) => (i === idx ? { ...e, ...p } : e)),
      });
      add(crs.title || crs.name, false, (v) => patchCrs({ title: v, name: v }));
      add(crs.institution || crs.provider, false, (v) => patchCrs({ institution: v }));
      add(crs.date, false, (v) => patchCrs({ date: v }));
    });
  }

  if (Array.isArray(c.interests)) {
    c.interests.forEach((item: string, idx: number) => {
      add(item, false, (v) => {
        const next = [...c.interests];
        next[idx] = v;
        return { ...c, interests: next };
      });
    });
  }

  if (c.coverLetter) {
    const cl = c.coverLetter;
    const patchCL = (p: any) => ({ ...c, coverLetter: { ...cl, ...p } });
    add(cl.date, false, (v) => patchCL({ date: v }));
    add(cl.recipientName, false, (v) => patchCL({ recipientName: v }));
    add(cl.companyName, false, (v) => patchCL({ companyName: v }));
    add(cl.companyAddress, false, (v) => patchCL({ companyAddress: v }));
    add(cl.greeting || cl.salutation, false, (v) => patchCL({ greeting: v, salutation: v }));
    add(cl.openingParagraph, true, (v) => patchCL({ openingParagraph: v }));
    add(cl.bodyParagraph, true, (v) => patchCL({ bodyParagraph: v }));
    add(cl.closingParagraph, true, (v) => patchCL({ closingParagraph: v }));
    if (Array.isArray(cl.paragraphs)) {
      cl.paragraphs.forEach((p: string, idx: number) => {
        add(p, true, (v) => {
          const nextP = cl.paragraphs.map((it: string, i: number) => (i === idx ? v : it));
          return patchCL({
            paragraphs: nextP,
            openingParagraph: nextP[0] || cl.openingParagraph,
            bodyParagraph: nextP[1] || cl.bodyParagraph,
            closingParagraph: nextP[2] || cl.closingParagraph,
          });
        });
      });
    }
    add(cl.quote, true, (v) => patchCL({ quote: v }));
    add(cl.closingNote, false, (v) => patchCL({ closingNote: v }));
    add(cl.signOff, false, (v) => patchCL({ signOff: v }));
    add(cl.signatureText, false, (v) => patchCL({ signatureText: v }));
  }

  if (Array.isArray(c.references)) {
    c.references.forEach((ref: any, idx: number) => {
      const patchRef = (p: any) => ({
        ...c,
        references: c.references.map((r: any, i: number) => (i === idx ? { ...r, ...p } : r)),
      });
      add(ref.name, false, (v) => patchRef({ name: v }));
      add(ref.title || ref.role, false, (v) => patchRef({ title: v, role: v }));
      add(ref.company || ref.organization, false, (v) => patchRef({ company: v, organization: v }));
      add(ref.phone, false, (v) => patchRef({ phone: v }));
      add(ref.email, false, (v) => patchRef({ email: v }));
    });
  }

  return list;
}

function UniversalInlineEditLayer({
  enabled,
  content,
  onContentChange,
  children,
}: {
  enabled: boolean;
  content: ResumeContent;
  onContentChange?: (next: ResumeContent) => void;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const activeElRef = useRef<HTMLElement | null>(null);

  const findEditableTarget = (start: EventTarget | null) => {
    const host = hostRef.current;
    if (!host || !(start instanceof HTMLElement)) return null;
    const bindings = buildContentBindings(content);
    let el: HTMLElement | null = start;
    while (el && el !== host) {
      if (el.tagName === "SVG" || el.tagName === "PATH" || el.tagName === "IMG") {
        el = el.parentElement;
        continue;
      }
      const childBlocks = el.querySelectorAll("div, section, ul, ol, table").length;
      if (childBlocks === 0) {
        const key = normText(el.innerText || el.textContent || "");
        if (key) {
          const match = bindings.find((b) => b.key === key);
          if (match) return { el, binding: match };
        }
      }
      el = el.parentElement;
    }
    return null;
  };

  const clearHover = () => {
    if (hoveredElRef.current) {
      hoveredElRef.current.removeAttribute("data-uni-hover");
      hoveredElRef.current = null;
    }
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !onContentChange || activeElRef.current) return;
    const found = findEditableTarget(e.target);
    if (hoveredElRef.current && hoveredElRef.current !== found?.el) {
      hoveredElRef.current.removeAttribute("data-uni-hover");
      hoveredElRef.current = null;
    }
    if (found && found.el !== hoveredElRef.current) {
      found.el.setAttribute("data-uni-hover", "1");
      hoveredElRef.current = found.el;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !onContentChange) return;
    if (activeElRef.current && activeElRef.current.contains(e.target as Node)) return;
    const found = findEditableTarget(e.target);
    if (!found) return;

    const { el, binding } = found;
    clearHover();
    activeElRef.current = el;
    const originalText = el.innerText;

    el.contentEditable = "true";
    el.setAttribute("data-uni-active", "1");
    el.spellcheck = false;
    el.focus();

    const finish = (cancel: boolean) => {
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("paste", onPaste);
      el.contentEditable = "false";
      el.removeAttribute("data-uni-active");
      activeElRef.current = null;

      if (cancel) {
        el.innerText = originalText;
        return;
      }
      const raw = (el.innerText || "").replace(/\r/g, "").replace(/\n+$/, "");
      const nextVal = binding.multiline ? raw : raw.replace(/\n+/g, " ");
      if (nextVal !== originalText) {
        onContentChange(binding.apply(nextVal));
      }
    };

    const onBlur = () => finish(false);
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        finish(true);
      } else if (!binding.multiline && ev.key === "Enter") {
        ev.preventDefault();
        el.blur();
      }
    };
    const onPaste = (ev: ClipboardEvent) => {
      ev.preventDefault();
      const txt = ev.clipboardData?.getData("text/plain") || "";
      document.execCommand(
        "insertText",
        false,
        binding.multiline ? txt : txt.replace(/[\r\n]+/g, " ")
      );
    };

    el.addEventListener("blur", onBlur);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("paste", onPaste);
  };

  return (
    <div
      ref={hostRef}
      className={enabled ? "uni-edit-host w-full h-full" : "w-full h-full"}
      onMouseOver={handleMouseOver}
      onMouseLeave={clearHover}
      onClick={handleClick}
    >
      {enabled && <style dangerouslySetInnerHTML={{ __html: UNIVERSAL_EDIT_CSS }} />}
      {children}
    </div>
  );
}

function SinglePageRenderer({
  seriesId,
  content,
  style,
  sectionOrder,
  pageIndex,
  totalPages,
  editable,
  onContentChange,
}: {
  seriesId: string;
  content: ResumeContent;
  style?: DocumentStyleSettings;
  sectionOrder?: SectionLayoutItem[];
  pageIndex: number;
  totalPages?: number;
  editable?: boolean;
  onContentChange?: (next: ResumeContent) => void;
}) {
  const props = { content, style, sectionOrder, pageIndex, totalPages };
  switch (seriesId) {
    case "2":
      return (
        <Series2Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "3":
      return (
        <Series3Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "4":
      return (
        <Series4Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "11":
      return (
        <Series11Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "12":
      return (
        <Series12Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "14":
      return (
        <Series14Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "22":
      return (
        <Series22Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    case "24":
      return (
        <Series24Exact
          {...props}
          editable={editable}
          onContentChange={onContentChange}
        />
      );
    default:
      return <Series11 {...props} />;
  }
}

function getOriginalPreviewPath(
  seriesId: string,
  activeTab: "resume" | "cover" | "references",
  pageIndex: number,
  pageSize: "A4" | "Letter" = "A4",
  totalPages: number = 1
) {
  const sz = pageSize === "Letter" ? "letter" : "a4";
  if (activeTab === "cover") return `/templates/${seriesId}/preview-cover-${sz}.png`;
  if (activeTab === "references") return `/templates/${seriesId}/preview-references-${sz}.png`;
  if ((seriesId === "2" || seriesId === "3" || seriesId === "4" || seriesId === "22" || seriesId === "24") && totalPages >= 2) {
    return `/templates/${seriesId}/preview-resume-${totalPages}p-p${pageIndex + 1}-${sz}.png`;
  }
  if ((seriesId === "11" || seriesId === "12" || seriesId === "14") && totalPages >= 2) {
    return `/templates/${seriesId}/preview-resume-2p-p${pageIndex + 1}-${sz}.png`;
  }
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
  editable = false,
  onContentChange,
}: MasterSeriesCanvasProps) {
  const isLetter = style?.pageSize === "Letter";
  const pageWidth = isLetter ? 816 : 794;
  const pageHeight = isLetter ? 1056 : 1123;
  const MAX_2P_SERIES = ["11", "12", "14"];
  const rawPageCount = activeTab === "resume" ? style?.pageCount || 1 : 1;
  const pageCount = MAX_2P_SERIES.includes(String(seriesId))
    ? Math.min(rawPageCount, 2)
    : rawPageCount;
  const pages = Array.from({ length: pageCount }, (_, i) => i);
  const useUniversalEdit =
    editable && !["2", "3", "4", "11", "12", "14", "22", "24"].includes(seriesId) && Boolean(onContentChange);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Local self-hosted fonts active */}
      {pages.map((pageIndex) => {
        const renderedSheet =
          activeTab === "cover" ? (
            seriesId === "4" ? (
              <Series4CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "3" ? (
              <Series3CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "2" ? (
              <Series2CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "24" ? (
              <Series24CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "22" ? (
              <Series22CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "14" ? (
              <Series14CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "12" ? (
              <Series12CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "11" ? (
              <Series11CoverLetter
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : (
              <CoverLetterSheet
                content={content}
                seriesId={seriesId}
                style={style}
                paperSize={style?.pageSize}
              />
            )
          ) : activeTab === "references" ? (
            seriesId === "4" ? (
              <Series4References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "3" ? (
              <Series3References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "2" ? (
              <Series2References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "24" ? (
              <Series24References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "22" ? (
              <Series22References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "14" ? (
              <Series14References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "12" ? (
              <Series12References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : seriesId === "11" ? (
              <Series11References
                content={content}
                style={style}
                editable={editable}
                onContentChange={onContentChange}
              />
            ) : (
              <ReferencesSheet
                content={content}
                seriesId={seriesId}
                style={style}
                paperSize={style?.pageSize}
              />
            )
          ) : (
            <SinglePageRenderer
              seriesId={seriesId}
              content={content}
              style={style}
              sectionOrder={sectionOrder}
              pageIndex={pageIndex}
              totalPages={pageCount}
              editable={editable}
              onContentChange={onContentChange}
            />
          );

        return (
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
                {useUniversalEdit ? (
                  <UniversalInlineEditLayer
                    enabled={true}
                    content={content}
                    onContentChange={onContentChange}
                  >
                    {renderedSheet}
                  </UniversalInlineEditLayer>
                ) : (
                  renderedSheet
                )}
              </div>
            </div>

            {showOriginalReference && (
              <div className="relative">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#595959] uppercase tracking-wider px-1">
                  <span>
                    Original Word/PDF Reference (
                    {activeTab === "resume" ? `Page ${pageIndex + 1}` : activeTab} {"\u00b7"}{" "}
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
                      style?.pageSize || "A4",
                      pageCount
                    )}
                    alt="Original Template Reference"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function mapDocToResumeContent(doc: any): ResumeContent {
  const rawId = String(doc?.series || doc?.template || "11");
  const seriesId = RENDERED.includes(rawId) ? rawId : rawId.replace(/[^0-9]/g, "") || "11";
  const base = SAMPLE_CONTENT_BY_SERIES[seriesId] || SAMPLE_CONTENT_BY_SERIES["11"];
  const c = doc?.content || {};

  const isLegacyPlaceholder =
    Array.isArray(c.experience) &&
    c.experience.length === 1 &&
    c.experience[0]?.company === "Rangin Agency";

  const mappedExp =
    !isLegacyPlaceholder && Array.isArray(c.experience) && c.experience.length > 0
      ? c.experience
          .filter((e: any) => !e.hidden)
          .map((e: any, idx: number) => {
            const bullets = getBullets(e);
            const firstBullet = bullets[0] || "";
            const isDuplicatedBullets = (txt: string) =>
              Boolean(txt && firstBullet && txt.includes(firstBullet.slice(0, 40)));

            let summaryParagraph = e.showOverview ? e.overview : e.summaryParagraph;
            if (seriesId === "11" || seriesId === "12") {
              const candidate =
                e.summaryParagraph ||
                (e.showOverview !== false ? e.overview : "") ||
                e.description ||
                "";
              const clean = candidate && !isDuplicatedBullets(candidate) ? candidate : "";
              summaryParagraph =
                clean ||
                (idx === 0 && (e.role || e.title) === "ENTER YOUR JOB TITLE HERE"
                  ? seriesId === "12"
                    ? "Include this optional paragraph to provide an overview of the role, spotlight key successes, describe your path to the position (e.g., through a promotion), or briefly introduce the company if it\u2019s not widely recognized. You may exclude this paragraph to move directly to the bullet points."
                    : "Use this optional paragraph to summarize the role, highlight major accomplishments, note your progression to the position (e.g., via promotion), or briefly introduce the company if it\u2019s lesser-known. You may skip this paragraph to proceed directly to the bullet points."
                  : "");
            }

            return {
              id: e.id || `exp-${idx}`,
              title: e.role || e.title || "ENTER YOUR JOB TITLE HERE",
              company: e.company || "Company Name",
              location: e.location || "",
              period: e.period || "Date \u2013 Date",
              summaryParagraph,
              bullets,
            };
          })
      : base.experience;

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
    phone: !isLegacyPlaceholder && c.phone !== undefined ? c.phone : base.phone,
    email: !isLegacyPlaceholder && c.email !== undefined ? c.email : base.email,
    linkedin: !isLegacyPlaceholder && c.linkedin !== undefined ? c.linkedin : base.linkedin,
    location: !isLegacyPlaceholder && c.location !== undefined ? c.location : base.location,
    photoUrl: c.photoUrl || base.photoUrl,
    summary: !isLegacyPlaceholder && c.summary !== undefined ? c.summary : base.summary,
    areasOfExpertise:
      !isLegacyPlaceholder && Array.isArray(c.areasOfExpertise) && c.areasOfExpertise.length > 0
        ? c.areasOfExpertise
        : base.areasOfExpertise,
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
    coverLetter: c.coverLetter ? { ...base.coverLetter, ...c.coverLetter } : base.coverLetter,
  };
}

function resumeContentToDocContent(next: ResumeContent, prevDocContent: any) {
  const n: any = next || {};
  const prev = prevDocContent && typeof prevDocContent === "object" ? prevDocContent : {};

  return {
    ...prev,
    name: n.fullName ?? prev.name ?? "",
    fullName: n.fullName ?? prev.fullName ?? "",
    role: n.profession ?? prev.role ?? "",
    profession: n.profession ?? prev.profession ?? "",
    phone: n.phone ?? prev.phone ?? "",
    email: n.email ?? prev.email ?? "",
    linkedin: n.linkedin ?? prev.linkedin ?? "",
    location: n.location ?? prev.location ?? "",
    summary: n.summary ?? prev.summary ?? "",
    skills: Array.isArray(n.professionalSkills) ? n.professionalSkills : prev.skills || [],
    professionalSkills: Array.isArray(n.professionalSkills)
      ? n.professionalSkills
      : prev.professionalSkills || [],
    areasOfExpertise:
      Array.isArray(n.areasOfExpertise) && n.areasOfExpertise.length > 0
        ? n.areasOfExpertise
        : Array.isArray(n.professionalSkills)
        ? n.professionalSkills
        : prev.areasOfExpertise || [],
    technicalSkills: Array.isArray(n.technicalSkills)
      ? n.technicalSkills
      : prev.technicalSkills || [],
    experience: Array.isArray(n.experience)
      ? n.experience.map((e: any, idx: number) => ({
          id: e.id || `exp-${idx}`,
          role: e.title || e.role || "",
          title: e.title || e.role || "",
          company: e.company || "",
          location: e.location || "",
          period: e.period || e.date || "",
          date: e.period || e.date || "",
          overview: e.summaryParagraph ?? e.overview ?? "",
          summaryParagraph: e.summaryParagraph ?? e.overview ?? "",
          description: e.summaryParagraph ?? e.overview ?? "",
          showOverview: Boolean((e.summaryParagraph ?? e.overview ?? "").trim()),
          bullets: Array.isArray(e.bullets) ? e.bullets : getBullets(e),
        }))
      : prev.experience || [],
    education: Array.isArray(n.education)
      ? n.education.map((ed: any, idx: number) => ({
          id: ed.id || `edu-${idx}`,
          degree: ed.degree || "",
          school: ed.school || "",
          location: ed.location || "",
          period: ed.date || ed.period || "",
          date: ed.date || ed.period || "",
        }))
      : prev.education || [],
    certifications: Array.isArray(n.certifications) ? n.certifications : prev.certifications || [],
    courses: Array.isArray(n.courses) ? n.courses : prev.courses || [],
    awards: Array.isArray(n.awards) ? n.awards : prev.awards || [],
    volunteering: Array.isArray(n.volunteering) ? n.volunteering : prev.volunteering || [],
    memberships: Array.isArray(n.memberships) ? n.memberships : prev.memberships || [],
    interests: Array.isArray(n.interests) ? n.interests : prev.interests || [],
    references: Array.isArray(n.references) ? n.references : prev.references || [],
    coverLetter: n.coverLetter ?? prev.coverLetter,
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
  const [directEdit, setDirectEdit] = useState<boolean>(Boolean(onPatch));

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
    pageMarginMm: s.pageMargin ? +(s.pageMargin * 25.4).toFixed(2) : 12.7,
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

  const mappedContent = mapDocToResumeContent(doc);

  const handleDirectContentChange = (nextContent: ResumeContent) => {
    if (!onPatch) return;
    const nextDocContent = resumeContentToDocContent(nextContent, doc?.content);
    onPatch(nextDocContent);
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

        {/* Direct On-Page Edit Toggle */}
        {onPatch && (
          <>
            <button
              type="button"
              onClick={() => setDirectEdit((v) => !v)}
              title="Click any text directly on the page to edit"
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                directEdit
                  ? "bg-[#eaf0ea] text-[#2c3a2f] ring-1 ring-[#5d6f61]/30"
                  : "text-[#202124]/75 hover:bg-[#f1efe9]"
              }`}
            >
              {directEdit ? "Edit on Page: On" : "Edit on Page: Off"}
            </button>
            <div className="h-4 w-[1px] bg-[#202124]/15" />
          </>
        )}

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
          content={mappedContent}
          activeTab={localTab}
          style={style}
          sectionOrder={sectionOrder}
          showOriginalReference={compareOrig}
          editable={directEdit && Boolean(onPatch)}
          onContentChange={handleDirectContentChange}
        />
      </div>
    </div>
  );
}