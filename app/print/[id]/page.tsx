"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useStore, type Doc, type ResumeContent, type DocumentStyleSettings } from "@/lib/store";
import { apiGetDocument } from "@/lib/api/documents-client";
import { Series2Exact, Series2CoverLetter, Series2References } from "@/components/render/series-2";
import { Series3Exact, Series3CoverLetter, Series3References } from "@/components/render/series-3";
import { Series4Exact, Series4CoverLetter, Series4References } from "@/components/render/series-4";
import { Series11Exact, Series11CoverLetter, Series11References } from "@/components/render/series-11";
import { Series12Exact, Series12CoverLetter, Series12References } from "@/components/render/series-12";
import { Series14Exact, Series14CoverLetter, Series14References } from "@/components/render/series-14";
import { Series22Exact, Series22CoverLetter, Series22References } from "@/components/render/series-22";
import { Series24Exact, Series24CoverLetter, Series24References } from "@/components/render/series-24";

function toResumeContent(c: any): ResumeContent {
  return {
    fullName: c?.name || c?.fullName || "",
    profession: c?.role || c?.profession || "",
    phone: c?.phone || "",
    email: c?.email || "",
    linkedin: c?.linkedin || "",
    location: c?.location || "",
    summary: c?.summary || "",
    areasOfExpertise: Array.isArray(c?.areasOfExpertise)
      ? c.areasOfExpertise
      : Array.isArray(c?.skills)
      ? c.skills
      : [],
    professionalSkills: Array.isArray(c?.skills) ? c.skills : [],
    technicalSkills: Array.isArray(c?.technicalSkills) ? c.technicalSkills : [],
    experience: (c?.experience || [])
      .filter((e: any) => !e?.hidden)
      .map((e: any) => ({
        id: e.id,
        title: e.role || e.title || "",
        company: e.company || "",
        location: e.location || "",
        period: e.period || "",
        summaryParagraph: e.showOverview ? e.overview : undefined,
        bullets:
          Array.isArray(e.bullets) && e.bullets.length > 0
            ? e.bullets
            : String(e.description || "")
                .split(/\r?\n/)
                .map((l) => l.replace(/^[\u2022\-*]\s*/, "").trim())
                .filter(Boolean),
      })),
    education: (c?.education || []).map((ed: any) => ({
      id: ed.id,
      degree: ed.degree || "",
      school: ed.school || "",
      location: ed.location || "",
      date: ed.period || ed.date || "",
    })),
    certifications: Array.isArray(c?.certifications) ? c.certifications : [],
    courses: Array.isArray(c?.courses) ? c.courses : [],
    awards: Array.isArray(c?.awards) ? c.awards : [],
    volunteering: Array.isArray(c?.volunteering) ? c.volunteering : [],
    memberships: Array.isArray(c?.memberships) ? c.memberships : [],
    interests: Array.isArray(c?.interests) ? c.interests : [],
    customSections: [],
    photoUrl: c?.photoUrl || c?.photo,
    coverLetter: c?.coverLetter || {
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
    references: Array.isArray(c?.references) ? c.references : [],
  };
}

function renderResumePage(
  sId: string,
  content: ResumeContent,
  style: DocumentStyleSettings,
  pageIndex: number,
  totalPages: number
) {
  const props = { content, style, pageIndex, totalPages, editable: false };
  switch (sId) {
    case "2": return <Series2Exact {...props} />;
    case "3": return <Series3Exact {...props} />;
    case "4": return <Series4Exact {...props} />;
    case "11": return <Series11Exact {...props} />;
    case "12": return <Series12Exact {...props} />;
    case "14": return <Series14Exact {...props} />;
    case "22": return <Series22Exact {...props} />;
    case "24": return <Series24Exact {...props} />;
    default: return <Series11Exact {...props} />;
  }
}

function renderCoverPage(sId: string, content: ResumeContent, style: DocumentStyleSettings) {
  const props = { content, style, editable: false };
  switch (sId) {
    case "2": return <Series2CoverLetter {...props} />;
    case "3": return <Series3CoverLetter {...props} />;
    case "4": return <Series4CoverLetter {...props} />;
    case "11": return <Series11CoverLetter {...props} />;
    case "12": return <Series12CoverLetter {...props} />;
    case "14": return <Series14CoverLetter {...props} />;
    case "22": return <Series22CoverLetter {...props} />;
    case "24": return <Series24CoverLetter {...props} />;
    default: return <Series11CoverLetter {...props} />;
  }
}

function renderReferencesPage(sId: string, content: ResumeContent, style: DocumentStyleSettings) {
  const props = { content, style, editable: false };
  switch (sId) {
    case "2": return <Series2References {...props} />;
    case "3": return <Series3References {...props} />;
    case "4": return <Series4References {...props} />;
    case "11": return <Series11References {...props} />;
    case "12": return <Series12References {...props} />;
    case "14": return <Series14References {...props} />;
    case "22": return <Series22References {...props} />;
    case "24": return <Series24References {...props} />;
    default: return <Series11References {...props} />;
  }
}

export default function VectorPrintPage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const { docs } = useStore();
  const mode = sp.get("mode") || "resume"; // resume | cover | references | combined
  const autoprint = sp.get("autoprint") === "1";

  const [doc, setDoc] = useState<Doc | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await apiGetDocument(params.id);
        if (!cancelled && remote) {
          setDoc(remote);
          setReady(true);
          return;
        }
      } catch (err) { console.warn("[print] fallback to local store:", err); }
      const local = docs.find((d) => d.id === params.id) || null;
      if (!cancelled) {
        setDoc(local);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!ready || !doc || !autoprint) return;
    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      setTimeout(() => window.print(), 350);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(trigger);
    } else {
      trigger();
    }
  }, [ready, doc, autoprint]);

  if (!ready || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm text-neutral-600">
        Preparing high-resolution vector document...
      </div>
    );
  }

  const sId = String(doc.series || (doc as any).seriesId || doc.template || "11");
  const isLetter = doc.settings?.pageSize === "Letter";
  const pageCount = (doc.settings?.pageCount || 1) as 1 | 2 | 3;
  const content = toResumeContent(doc.content);
  const style: DocumentStyleSettings = {
    pageSize: isLetter ? "Letter" : "A4",
    pageCount,
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

  const pageWidth = isLetter ? "8.5in" : "210mm";
  const pageHeight = isLetter ? "11in" : "297mm";

  const pages: React.ReactNode[] = [];
  if (mode === "cover") {
    pages.push(renderCoverPage(sId, content, style));
  } else if (mode === "references") {
    pages.push(renderReferencesPage(sId, content, style));
  } else if (mode === "combined") {
    for (let i = 0; i < pageCount; i++) {
      pages.push(renderResumePage(sId, content, style, i, pageCount));
    }
    pages.push(renderCoverPage(sId, content, style));
  } else {
    for (let i = 0; i < pageCount; i++) {
      pages.push(renderResumePage(sId, content, style, i, pageCount));
    }
  }

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${isLetter ? "letter" : "A4"} portrait;
              margin: 0;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #FFFFFF !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-toolbar { display: none !important; }
              .print-sheet {
                box-shadow: none !important;
                margin: 0 !important;
                page-break-after: always;
                break-after: page;
              }
              .print-sheet:last-child {
                page-break-after: auto;
                break-after: auto;
              }
            }
          `,
        }}
      />

      {/* Screen-only toolbar */}
      <div className="print-toolbar mx-auto mb-4 flex max-w-[820px] items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <div className="text-xs font-medium text-neutral-700">
          {doc.title} · {mode === "combined" ? "Combined Resume + Cover Letter" : mode.toUpperCase()} · {isLetter ? "US Letter" : "A4"} ({pages.length} page{pages.length > 1 ? "s" : ""})
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#202124] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black"
        >
          Save / Print Vector PDF
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 print:gap-0">
        {pages.map((node, idx) => (
          <div
            key={idx}
            className="print-sheet relative overflow-hidden bg-white shadow-xl"
            style={{ width: pageWidth, height: pageHeight }}
          >
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}