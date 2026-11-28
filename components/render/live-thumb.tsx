"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Doc, ResumeContent, DocumentStyleSettings } from "@/lib/store";
import { Series2Exact } from "./series-2";
import { Series3Exact } from "./series-3";
import { Series4Exact } from "./series-4";
import { Series11Exact } from "./series-11";
import { Series12Exact } from "./series-12";
import { Series14Exact } from "./series-14";
import { Series22Exact } from "./series-22";
import { Series24Exact } from "./series-24";

function docToResumeContent(doc: Doc): ResumeContent {
  const c: any = doc.content || {};
  return {
    fullName: c.name || "",
    firstName: c.firstName,
    lastName: c.lastName,
    profession: c.role || "",
    phone: c.phone || "",
    email: c.email || "",
    linkedin: c.linkedin || "",
    location: c.location || "",
    summary: c.summary || "",
    areasOfExpertise: Array.isArray(c.areasOfExpertise)
      ? c.areasOfExpertise
      : Array.isArray(c.skills)
      ? c.skills
      : [],
    professionalSkills: Array.isArray(c.skills) ? c.skills : [],
    technicalSkills: Array.isArray(c.technicalSkills) ? c.technicalSkills : [],
    experience: (c.experience || []).map((e: any) => ({
      id: e.id,
      title: e.role || e.title || "",
      company: e.company || "",
      location: e.location || "",
      period: e.period || "",
      summaryParagraph: e.showOverview ? e.overview : undefined,
      bullets:
        Array.isArray(e.bullets) && e.bullets.length > 0
          ? e.bullets
          : (e.description || "")
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[•\-*]\s*/, "").trim())
              .filter(Boolean),
    })),
    education: (c.education || []).map((ed: any) => ({
      id: ed.id,
      degree: ed.degree || "",
      school: ed.school || "",
      location: ed.location || "",
      date: ed.period || ed.date || "",
    })),
    certifications: Array.isArray(c.certifications) ? c.certifications : [],
    courses: Array.isArray(c.courses) ? c.courses : [],
    awards: Array.isArray(c.awards) ? c.awards : [],
    volunteering: Array.isArray(c.volunteering) ? c.volunteering : [],
    memberships: Array.isArray(c.memberships) ? c.memberships : [],
    interests: Array.isArray(c.interests) ? c.interests : [],
    customSections: [],
    photoUrl: c.photoUrl || c.photo,
    coverLetter: c.coverLetter || {
      date: "",
      recipientName: "",
      recipientTitle: "",
      companyName: "",
      companyAddress: "",
      greeting: "",
      openingParagraph: "",
      bodyParagraph: "",
      highlightsIntro: "",
      bulletHighlights: [],
      closingParagraph: "",
      signOff: "",
      signatureText: "",
    },
    references: Array.isArray(c.references) ? c.references : [],
  };
}

export function LiveDocThumb({ doc }: { doc: Doc }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  const isLetter = doc.settings?.pageSize === "Letter";
  // Physical page in CSS px at 96dpi (1pt = 96/72 px)
  const pageW = isLetter ? 816 : 793.76;
  const pageH = isLetter ? 1056 : 1122.56;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / pageW);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageW]);

  const sId = String(doc.series || doc.template || "11");
  const content = docToResumeContent(doc);
  const style: DocumentStyleSettings = {
    pageSize: isLetter ? "Letter" : "A4",
    pageCount: (doc.settings?.pageCount || 1) as 1 | 2 | 3,
    accentColor: doc.accent || "#202124",
    fontScale: doc.settings?.fontSize
      ? Math.round((doc.settings.fontSize / 10) * 100)
      : 100,
    lineSpacing: doc.settings?.lineHeight || 1.35,
    sectionGapPx: doc.settings?.sectionSpacing || 14,
    pageMarginMm: doc.settings?.pageMargin
      ? +(doc.settings.pageMargin * 25.4).toFixed(1)
      : 12.7,
    showPhoto: true,
    showIcons: true,
    showEmblem: true,
    showSignature: true,
  };

  const renderSeries = () => {
    const common = {
      content,
      style,
      sectionOrder: doc.sectionOrder,
      pageIndex: 0,
      totalPages: style.pageCount,
      editable: false,
    };
    switch (sId) {
      case "2":
        return <Series2Exact {...common} />;
      case "3":
        return <Series3Exact {...common} />;
      case "4":
        return <Series4Exact {...common} />;
      case "11":
        return <Series11Exact {...common} />;
      case "12":
        return <Series12Exact {...common} />;
      case "14":
        return <Series14Exact {...common} />;
      case "22":
        return <Series22Exact {...common} />;
      case "24":
        return <Series24Exact {...common} />;
      default:
        return <Series11Exact {...common} />;
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden bg-white select-none pointer-events-none"
    >
      <div
        style={{
          width: `${pageW}px`,
          height: `${pageH}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          background: "#FFFFFF",
        }}
      >
        {renderSeries()}
      </div>
    </div>
  );
}