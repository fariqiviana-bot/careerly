"use client";
import React from "react";
import type { Doc } from "@/lib/store";
import { TEMPLATES } from "@/lib/catalog";

export function ResumeMiniPreview({
  doc,
  templateId,
  accentOverride,
  type = "resume",
  className = "",
}: {
  doc?: Doc;
  templateId?: string;
  accentOverride?: string;
  type?: "resume" | "cover";
  className?: string;
}) {
  const tplId = templateId || doc?.template || "editorial-11";
  const tpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
  const accent = accentOverride || doc?.accent || tpl.accent || "#202124";
  const c = doc?.content || {
    name: "Viana Fariqi",
    role: "Product Designer",
    email: "fariqiviana@gmail.com",
    phone: "+98 912 000 0000",
    location: "Tehran, Iran",
    summary: "Product designer with 4+ years shaping B2B SaaS workflows and token-driven design systems.",
    experience: [
      { id: "1", role: "Product Designer", company: "Rangin Agency", period: "2023 — Present", description: "Led redesign of onboarding; +18% activation." },
      { id: "2", role: "UI/UX Designer", company: "Studio Kit", period: "2021 — 2023", description: "Delivered 14 client design systems." },
    ],
    education: [{ id: "1", degree: "BSc, Molecular Biology", school: "University of Tehran", period: "2024 — 2028" }],
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Next.js"],
    extras: ["Projects", "Languages"],
    letter: {
      to: "Hiring Manager",
      company: "Telgorithm",
      subject: "Application for Marketing Manager",
      body: "Dear Hiring Manager,\n\nI am writing to express my strong interest in this role...",
    },
  };

  const isCover = type === "cover" || doc?.type === "cover";
  const isTwoCol = doc?.settings ? doc.settings.layoutMode === "two-col" : tpl.twoCol;
  const hasScript = tpl.series === "14" || tpl.series === "22";

  return (
    <div
      className={`relative overflow-hidden bg-[#FCFBF8] text-[#202124] select-none border border-[#e5dfd5] shadow-xs ${className}`}
      style={{ aspectRatio: "1 / 1.414", fontFamily: tpl.bodyFont || "Lato, sans-serif" }}
    >
      {/* تزریق فونت‌های اصلی پکیج‌های شما */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lato:wght@400;700&family=Manrope:wght@500;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
      `}</style>

      {/* آرایه‌های ظریف پس‌زمینه برای هماهنگی با کارت داشبورد */}
      <div
        className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-15"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full opacity-10"
        style={{ background: "#c98d72" }}
      />

      <div className="relative z-10 flex h-full flex-col p-3.5 text-[7px] leading-[1.35]">
        {/* هدر قالب بر اساس سری 11، 12، 14 یا 22 */}
        <div
          className={`pb-2 mb-2 border-b ${
            tpl.series === "22" ? "text-center bg-[#F7F4EE]/80 py-2 px-2 rounded-xs" : "text-center"
          }`}
          style={{ borderColor: `${accent}33` }}
        >
          {hasScript && (
            <div
              className="text-[11px] leading-none mb-0.5 opacity-85"
              style={{ fontFamily: "'Great Vibes', cursive", color: accent }}
            >
              {c.name}
            </div>
          )}
          <div
            className="font-bold tracking-[0.12em] uppercase text-[9.5px] leading-tight"
            style={{ fontFamily: tpl.headingFont, color: accent }}
          >
            {c.name}
          </div>
          <div className="text-[6.5px] uppercase tracking-[0.16em] text-[#706A62] mt-0.5 font-medium">
            {c.role}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-[5.5px] text-[#706A62]">
            <span>{c.email}</span>
            <span>•</span>
            <span>{c.location}</span>
          </div>
        </div>

        {/* بدنه کاورلتر */}
        {isCover ? (
          <div className="flex-1 space-y-2 pt-1 text-[6.5px] text-[#3c4043]">
            <div className="flex justify-between text-[6px] text-[#706A62]">
              <div>
                <div className="font-bold text-[#202124]">To: {c.letter?.to || "Hiring Manager"}</div>
                <div>{c.letter?.company || "Company"}</div>
              </div>
              <div>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
            <div className="font-semibold text-[6.5px]" style={{ color: accent }}>
              RE: {c.letter?.subject || `Application for ${c.role}`}
            </div>
            <p className="leading-relaxed whitespace-pre-line line-clamp-10 text-[6px] text-[#4a4f55]">
              {c.letter?.body || "Dear Hiring Manager,\n\nI am excited to submit my application..."}
            </p>
            <div className="pt-2">
              <div className="text-[6px] text-[#706A62]">Sincerely,</div>
              <div
                className="text-[10px] mt-0.5"
                style={{ fontFamily: hasScript ? "'Great Vibes', cursive" : tpl.headingFont, color: accent }}
              >
                {c.name}
              </div>
            </div>
          </div>
        ) : isTwoCol ? (
          /* بدنه رزومه دوستونه (Track B) */
          <div className="grid flex-1 grid-cols-12 gap-2.5 overflow-hidden">
            <div className="col-span-5 pr-2 border-r space-y-2" style={{ borderColor: `${accent}22` }}>
              <div>
                <div
                  className="font-bold uppercase tracking-wider text-[6px] mb-1 pb-0.5 border-b"
                  style={{ color: accent, borderColor: `${accent}33`, fontFamily: tpl.headingFont }}
                >
                  Education
                </div>
                {c.education.slice(0, 1).map((ed) => (
                  <div key={ed.id} className="space-y-0.5">
                    <div className="font-semibold text-[6px]">{ed.degree}</div>
                    <div className="text-[5.5px] text-[#706A62]">{ed.school}</div>
                    <div className="text-[5px] text-[#9aa0a6]">{ed.period}</div>
                  </div>
                ))}
              </div>
              <div>
                <div
                  className="font-bold uppercase tracking-wider text-[6px] mb-1 pb-0.5 border-b"
                  style={{ color: accent, borderColor: `${accent}33`, fontFamily: tpl.headingFont }}
                >
                  Skills
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.skills.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="rounded-xs bg-[#F7F4EE] px-1 py-0.2 text-[5.2px] text-[#3c4043] border border-[#e5dfd5]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-7 space-y-2">
              <div>
                <div
                  className="font-bold uppercase tracking-wider text-[6px] mb-0.5 pb-0.5 border-b"
                  style={{ color: accent, borderColor: `${accent}33`, fontFamily: tpl.headingFont }}
                >
                  Profile
                </div>
                <p className="text-[5.6px] text-[#4a4f55] line-clamp-3">{c.summary}</p>
              </div>
              <div>
                <div
                  className="font-bold uppercase tracking-wider text-[6px] mb-1 pb-0.5 border-b"
                  style={{ color: accent, borderColor: `${accent}33`, fontFamily: tpl.headingFont }}
                >
                  Experience
                </div>
                <div className="space-y-1.5">
                  {c.experience.slice(0, 2).map((ex) => (
                    <div key={ex.id}>
                      <div className="flex justify-between font-semibold text-[5.8px]">
                        <span>{ex.role}</span>
                        <span className="text-[5px] text-[#706A62]">{ex.period}</span>
                      </div>
                      <div className="text-[5.3px] font-medium text-[#706A62]">{ex.company}</div>
                      <p className="text-[5.2px] text-[#4a4f55] line-clamp-2 mt-0.5">• {ex.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* بدنه رزومه تک‌ستونه ATS (Track A) */
          <div className="flex-1 space-y-1.5 overflow-hidden">
            <div>
              <div
                className="font-bold uppercase tracking-wider text-[6px] mb-0.5 pb-0.5 border-b"
                style={{ color: accent, borderColor: `${accent}40`, fontFamily: tpl.headingFont }}
              >
                Professional Summary
              </div>
              <p className="text-[5.6px] text-[#4a4f55] line-clamp-2">{c.summary}</p>
            </div>
            <div>
              <div
                className="font-bold uppercase tracking-wider text-[6px] mb-0.5 pb-0.5 border-b"
                style={{ color: accent, borderColor: `${accent}40`, fontFamily: tpl.headingFont }}
              >
                Professional Experience
              </div>
              {c.experience.slice(0, 2).map((ex) => (
                <div key={ex.id} className="mb-1">
                  <div className="flex justify-between font-semibold text-[5.8px]">
                    <span>{ex.role} — {ex.company}</span>
                    <span className="text-[5px] text-[#706A62]">{ex.period}</span>
                  </div>
                  <p className="text-[5.2px] text-[#4a4f55] line-clamp-1">• {ex.description}</p>
                </div>
              ))}
            </div>
            <div>
              <div
                className="font-bold uppercase tracking-wider text-[6px] mb-0.5 pb-0.5 border-b"
                style={{ color: accent, borderColor: `${accent}40`, fontFamily: tpl.headingFont }}
              >
                Education & Core Skills
              </div>
              <div className="text-[5.4px] text-[#3c4043]">
                {c.education[0]?.degree} · {c.education[0]?.school}
              </div>
              <div className="text-[5.2px] text-[#706A62] truncate mt-0.5">
                {c.skills.join(" • ")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}