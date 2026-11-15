"use client";
import React, { useState } from "react";
import type { Doc } from "@/lib/store";
import { Mail, Share2, Phone, MapPin, Briefcase, GraduationCap, Sparkles, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WebsiteView({ doc, compact = false, onClose }: { doc: Doc; compact?: boolean; onClose?: () => void }) {
  const c = doc.content;
  const details = c.extraDetails ?? {};
  const extraTabs = (c.extras ?? []).filter((sec) => details[sec]);

  const sections = [
    { id: "personal", label: "Personal Information", icon: User },
    ...(c.experience.length > 0 ? [{ id: "experience", label: "Work experience", icon: Briefcase }] : []),
    ...(c.education.length > 0 ? [{ id: "education", label: "Education", icon: GraduationCap }] : []),
    ...(c.skills.length > 0 ? [{ id: "skills", label: "Skills", icon: Sparkles }] : []),
    ...extraTabs.map((sec) => ({ id: `extra-${sec}`, label: sec, icon: Sparkles })),
  ];

  const [activeTab, setActiveTab] = useState("personal");
  const initial = (c.name || "V")[0].toUpperCase();
  const tpl = doc.webTemplate ?? "sidebar";

  const copyShare = () => {
    const url = `${window.location.origin}/cv/${doc.slug || doc.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Website link copied to clipboard");
  };

  if (tpl === "editorial") {
    return (
      <div className={cn("overflow-hidden bg-[#f7efe2] text-[#2d2d2a]", compact ? "min-h-[560px] rounded-2xl border border-border shadow-sm" : "min-h-screen")} style={{ fontFamily: doc.font }}>
        <header className="border-b border-[#e2d5c1] bg-[#ede2d0] px-8 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium text-white" style={{ background: doc.accent || "#b83a14" }}>{initial}</div>
          <h1 className="text-4xl font-bold tracking-tight text-[#333330]">{c.name}</h1>
          <p className="mt-2 text-base text-[#6e6a63]">{c.role} · {c.location}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActiveTab(s.id)} className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-colors", activeTab === s.id ? "bg-[#2d2d2a] text-white" : "bg-white/60 text-[#2d2d2a] hover:bg-white")}>
                {s.label}
              </button>
            ))}
          </div>
        </header>
        <div className="mx-auto max-w-2xl p-8">
          {activeTab === "personal" && (
            <div className="space-y-6">
              {c.summary && <div><div className="text-xs font-bold uppercase tracking-wider text-[#7c766d]">About Me</div><p className="mt-2 leading-relaxed text-[#3a3834]">{c.summary}</p></div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><div className="text-xs font-bold text-[#333330]">Email address</div><div className="mt-1 text-sm text-[#6e6a63]">{c.email}</div></div>
                {c.phone && <div><div className="text-xs font-bold text-[#333330]">Phone</div><div className="mt-1 text-sm text-[#6e6a63]">{c.phone}</div></div>}
                {c.location && <div><div className="text-xs font-bold text-[#333330]">Location</div><div className="mt-1 text-sm text-[#6e6a63]">{c.location}</div></div>}
              </div>
            </div>
          )}
          {activeTab === "experience" && (
            <div className="space-y-5">
              {c.experience.map((e) => (
                <div key={e.id} className="border-b border-[#e2d5c1] pb-4 last:border-0">
                  <div className="flex justify-between font-semibold text-[#2d2d2a]"><span>{e.role} — {e.company}</span><span className="text-xs text-[#7c766d]">{e.period}</span></div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-[#524f49]">{e.description}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "education" && (
            <div className="space-y-4">
              {c.education.map((e) => (
                <div key={e.id} className="border-b border-[#e2d5c1] pb-3 last:border-0">
                  <div className="font-semibold">{e.degree}</div>
                  <div className="text-sm text-[#6e6a63]">{e.school} · {e.period}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "skills" && (
            <div className="flex flex-wrap gap-2">
              {c.skills.map((s) => <span key={s} className="rounded-lg bg-[#ede2d0] px-3.5 py-1.5 text-sm font-medium text-[#333330]">{s}</span>)}
            </div>
          )}
          {activeTab.startsWith("extra-") && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3a3834]">{details[activeTab.replace("extra-", "")]}</p>
          )}
        </div>
      </div>
    );
  }

  /* Default: Kickresume Sidebar Website Template (Exact match to Screenshots 1 & 2) */
  return (
    <div className={cn("relative flex overflow-hidden bg-[#f7efe2] text-[#2d2d2a]", compact ? "min-h-[580px] rounded-2xl border border-border shadow-sm" : "min-h-screen")} style={{ fontFamily: doc.font }}>
      {onClose && (
        <button onClick={onClose} className="absolute left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-xs font-bold text-[#2d2d2a] shadow hover:bg-white" title="Close preview">
          ✕
        </button>
      )}

      {/* Left Dark Sidebar */}
      <aside className={cn("flex shrink-0 flex-col justify-between bg-[#2d2d2d] text-white", compact ? "w-[185px]" : "w-[240px] md:w-[270px]")}>
        <div>
          <div className={cn("flex items-center justify-center", compact ? "pt-10 pb-6" : "pt-14 pb-10")}>
            <div
              className={cn("flex items-center justify-center rounded-full font-sans font-normal text-white shadow-md", compact ? "h-20 w-20 text-3xl" : "h-28 w-28 text-5xl")}
              style={{ backgroundColor: doc.accent || "#b83a14" }}
            >
              {initial}
            </div>
          </div>

          <nav className="mt-2 flex flex-col">
            {sections.map((s) => {
              const active = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={cn(
                    "w-full border-l-[3px] px-6 py-3.5 text-left text-sm transition-colors",
                    active
                      ? "border-white bg-[#3d3d3d] font-medium text-white"
                      : "border-transparent text-[#9e9e9e] hover:bg-[#353535] hover:text-white/90"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Mail & Share Circle Icons */}
        <div className="flex items-center gap-3 px-6 pb-6 pt-8">
          <a
            href={`mailto:${c.email}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6e6e6e] text-[#9e9e9e] transition-colors hover:border-white hover:text-white"
            title={`Email ${c.email}`}
          >
            <Mail className="h-4 w-4" />
          </a>
          <button
            onClick={copyShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6e6e6e] text-[#9e9e9e] transition-colors hover:border-white hover:text-white"
            title="Share website link"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Right Warm Sand / Cream Content Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#f7efe2]">
        {/* Top Hero Banner */}
        <div className={cn("flex flex-col items-center justify-center bg-[#ede2d0] px-6 text-center", compact ? "py-14" : "py-20 md:py-24")}>
          <h1 className={cn("font-sans font-bold tracking-tight text-[#3b3b3b]", compact ? "text-3xl" : "text-4xl md:text-5xl")}>
            {c.name}
          </h1>
          {c.role && <p className="mt-2 text-sm font-medium text-[#6e6a63]">{c.role}</p>}
        </div>

        {/* Active Section Body */}
        <div className={cn("flex-1", compact ? "p-8" : "p-10 md:px-20 md:py-14")}>
          {activeTab === "personal" && (
            <div className="max-w-xl space-y-6">
              <div>
                <div className="text-xs font-bold text-[#3b3b3b]">Email address</div>
                <div className="mt-1 text-sm text-[#5a5751]">{c.email}</div>
              </div>
              {c.phone && (
                <div>
                  <div className="text-xs font-bold text-[#3b3b3b]">Phone number</div>
                  <div className="mt-1 text-sm text-[#5a5751]">{c.phone}</div>
                </div>
              )}
              {c.location && (
                <div>
                  <div className="text-xs font-bold text-[#3b3b3b]">Location</div>
                  <div className="mt-1 text-sm text-[#5a5751]">{c.location}</div>
                </div>
              )}
              {c.summary && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-[#3b3b3b]">Profile summary</div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#5a5751]">{c.summary}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "experience" && (
            <div className="max-w-2xl space-y-6">
              {c.experience.map((e) => (
                <div key={e.id} className="border-b border-[#e4d8c4] pb-5 last:border-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-[#3b3b3b]">{e.role}</h3>
                    <span className="text-xs font-medium text-[#7a746b]">{e.period}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#6e6a63]">{e.company}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5a5751]">{e.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "education" && (
            <div className="max-w-2xl space-y-5">
              {c.education.map((e) => (
                <div key={e.id} className="border-b border-[#e4d8c4] pb-4 last:border-0">
                  <div className="text-base font-bold text-[#3b3b3b]">{e.degree}</div>
                  <div className="mt-0.5 text-sm text-[#5a5751]">{e.school}</div>
                  <div className="mt-0.5 text-xs text-[#7a746b]">{e.period}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="max-w-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#3b3b3b]">Competencies & Tools</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span key={s} className="rounded-md bg-[#ede2d0] px-3.5 py-1.5 text-xs font-semibold text-[#3b3b3b]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab.startsWith("extra-") && (
            <div className="max-w-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#3b3b3b]">{activeTab.replace("extra-", "")}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5a5751]">
                {details[activeTab.replace("extra-", "")]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}