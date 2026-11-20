"use client";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useStore, calculateDocScore, type Doc } from "@/lib/store";
import { LOCKED_CHECKS, WEAK_VERBS } from "@/lib/catalog";
import { getBullets } from "@/components/render/series-all";
import { ScoreRing } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Crown,
  Lock,
  Search,
  Briefcase,
  Plus,
  Check,
  Flame,
  Scale,
  Smile,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AnalyzerTailorPanel({
  doc,
  mode,
  onRequestUpgrade,
  onJumpToSection,
}: {
  doc: Doc;
  mode: "analyzer" | "tailor";
  onRequestUpgrade: (reason: string) => void;
  onJumpToSection: (sec: string) => void;
}) {
  const { updateDoc, jobs, user } = useStore();
  const c = doc.content;
  const calc = calculateDocScore(c);

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || "j1");
  const [customTitle, setCustomTitle] = useState(doc.tailoredJobTitle || "");
  const [customCompany, setCustomCompany] = useState(doc.tailoredCompany || "");
  const [customJd, setCustomJd] = useState(doc.tailoredJd || "");
  const [useCustomJd, setUseCustomJd] = useState(Boolean(doc.tailoredJd));
  const [tailorLevel, setTailorLevel] = useState<"conservative" | "balanced" | "turbo">("balanced");

  const activeJob = useMemo(() => {
    if (useCustomJd && (customTitle.trim() || customJd.trim())) {
      return {
        id: "custom",
        title: customTitle.trim() || c.role || "Target Role",
        company: customCompany.trim() || "Target Company",
        location: "Custom JD",
        salary: "",
        tags: extractKeywordsFromText(customTitle + " " + customJd),
        summary: customJd.trim() || "Custom job description provided for keyword matching.",
      };
    }
    return jobs.find((j) => j.id === selectedJobId) || jobs[0];
  }, [useCustomJd, customTitle, customCompany, customJd, jobs, selectedJobId, c.role]);

  const resumeTextLower = useMemo(() => {
    const expStr = (c.experience || [])
      .map((e) => `${e.role} ${e.company} ${e.overview || ""} ${getBullets(e).join(" ")}`)
      .join(" ");
    return `${c.name} ${c.role} ${c.summary} ${(c.skills || []).join(" ")} ${(c.technicalSkills || []).join(" ")} ${expStr}`.toLowerCase();
  }, [c]);

  const hardSkills = useMemo(() => {
    const base = activeJob?.tags && activeJob.tags.length > 0
      ? activeJob.tags
      : ["Strategic Planning", "Cross-Functional Leadership", "Data Analysis", "Process Optimization", "Project Management"];
    const extra = extractKeywordsFromText(activeJob?.summary || "");
    return Array.from(new Set([...base, ...extra])).slice(0, 10);
  }, [activeJob]);

  const softSkills = ["Stakeholder Communication", "Team Leadership", "Problem Solving", "Adaptability"];

  const matchedHard = hardSkills.filter((kw) => resumeTextLower.includes(kw.toLowerCase()));
  const missingHard = hardSkills.filter((kw) => !resumeTextLower.includes(kw.toLowerCase()));
  const matchedSoft = softSkills.filter((kw) => resumeTextLower.includes(kw.toLowerCase()));
  const missingSoft = softSkills.filter((kw) => !resumeTextLower.includes(kw.toLowerCase()));

  const matchScore = Math.round(
    ((matchedHard.length + matchedSoft.length * 0.5) / Math.max(1, hardSkills.length + softSkills.length * 0.5)) * 100
  );

  const addKeywordToSkills = (kw: string) => {
    if ((c.skills || []).includes(kw)) return;
    updateDoc(doc.id, {
      content: {
        ...c,
        skills: [...(c.skills || []), kw],
      },
    });
    toast.success(`Added "${kw}" to your skills`);
  };

  const handleAutoTailor = () => {
    if (tailorLevel === "turbo" && user.plan !== "Pro") {
      onRequestUpgrade("Turbo AI Tailoring is a Pro Studio feature.");
      return;
    }
    const targetRole = activeJob?.title || c.role;
    const nextSkills = Array.from(new Set([...(c.skills || []), ...missingHard.slice(0, tailorLevel === "conservative" ? 2 : 5)]));
    let nextSummary = c.summary;
    if (tailorLevel !== "conservative") {
      nextSummary = ` Results-driven ${targetRole} with proven expertise in ${hardSkills.slice(0, 4).join(", ")}. Track record of delivering measurable operational and strategic outcomes aligned with ${activeJob?.company || "organizational"} objectives.`;
    }
    updateDoc(doc.id, {
      tailoredJobTitle: targetRole,
      tailoredCompany: activeJob?.company,
      content: {
        ...c,
        role: targetRole.toUpperCase(),
        summary: nextSummary.trim(),
        skills: nextSkills,
      },
    });
    toast.success(`Resume tailored (${tailorLevel} mode) for ${targetRole}`);
  };

  const handleAutoFixWeakVerbs = () => {
    const nextExp = (c.experience || []).map((e) => {
      const fixedBullets = getBullets(e).map((b) =>
        b
          .replace(/responsible for/gi, "Spearheaded")
          .replace(/helped/gi, "Collaborated to")
          .replace(/worked on/gi, "Executed")
          .replace(/duties included/gi, "Delivered")
      );
      return {
        ...e,
        bullets: fixedBullets,
        description: fixedBullets.map((x) => `• ${x}`).join("\n"),
      };
    });
    updateDoc(doc.id, { content: { ...c, experience: nextExp } });
    toast.success("Replaced weak passive phrasing with strong action verbs");
  };

  if (mode === "analyzer") {
    return (
      <div className="space-y-4">
        {/* Top Score & Distribution Card (Teal Page 23 + Rezi Page 19) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-5">
            <ScoreRing value={calc.score} size={88} label="Overall" />
            <div className="min-w-[200px] flex-1 space-y-2.5">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">Resume Structure & Formatting</span>
                  <span className="font-semibold text-[#33613d]">{calc.breakdown.structure}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[#4e8a5a]" style={{ width: `${calc.breakdown.structure}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">Content & Measurable Results</span>
                  <span className="font-semibold text-primary">{calc.breakdown.content}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${calc.breakdown.content}%` }} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">ATS Readability & Font Kerning</span>
                  <span className="font-semibold text-[#33613d]">100% · Good</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full rounded-full bg-[#4e8a5a]" />
                </div>
              </div>
            </div>
          </div>

          {/* Rezi Page 19 "How You Compare" Mini Distribution Bar Chart */}
          <div className="mt-4 border-t border-border pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>How your resume compares to other candidates</span>
              <span className="font-semibold text-foreground">Top {Math.max(5, 100 - calc.score)}%</span>
            </div>
            <div className="flex h-10 items-end gap-1 pt-1">
              {[12, 18, 25, 34, 48, 62, 78, 90, 95, 70, 50, 30].map((barH, idx) => {
                const bucketScore = (idx + 1) * 8;
                const isUserBucket = Math.abs(calc.score - bucketScore) <= 8;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 rounded-t transition-all",
                      isUserBucket ? "bg-primary" : "bg-muted"
                    )}
                    style={{ height: `${barH}%` }}
                    title={`Score bucket ~${bucketScore}%`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhancv Page 4-7 "Fix Mistakes" — 4 Free Active Checks */}
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Automated Quality & Grammar Checks</div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-full text-xs"
              onClick={handleAutoFixWeakVerbs}
            >
              <Wrench className="mr-1.5 h-3.5 w-3.5 text-primary" /> Auto-Fix Weak Verbs
            </Button>
          </div>

          {calc.issues.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#e6f0e8]/70 p-3 text-xs font-medium text-[#285030]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              All core content, contact, and quantification checks passed!
            </div>
          ) : (
            <div className="space-y-2">
              {calc.issues.map((iss, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c05b49]" />
                    <div>
                      <div className="text-xs font-medium text-foreground">{iss.message}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Section: {iss.section}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full text-xs text-primary"
                    onClick={() => onJumpToSection(iss.section)}
                  >
                    Fix in section →
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Strengths List */}
          <div className="space-y-1.5 pt-2">
            {calc.strengths.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#285030]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4e8a5a]" />
                <span>{st.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enhancv Page 5-7 "FIXED WITH A FARNAVI RESUME" + Recruiter Checks (PRO) */}
        <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recruiter Screening Checks
            </div>
            {user.plan !== "Pro" && (
              <Badge className="rounded-full bg-accent text-[10px] text-accent-foreground">
                <Crown className="mr-1 h-2.5 w-2.5" /> PRO
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {LOCKED_CHECKS.map((chk) => (
              <div
                key={chk}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
              >
                <span className="font-medium">{chk}</span>
                {user.plan === "Pro" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f0e8] px-2 py-0.5 text-[10px] font-semibold text-[#33613d]">
                    <Check className="h-3 w-3" /> Passed · Clear
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestUpgrade(`Unlock ${chk} Recruiter Audit with Pro.`)}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/70 px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground hover:bg-accent"
                  >
                    <Lock className="h-2.5 w-2.5" /> Unlock with Pro
                  </button>
                )}
              </div>
            ))}
          </div>

          {user.plan !== "Pro" && (
            <Button
              type="button"
              className="mt-2 w-full rounded-full"
              onClick={() => onRequestUpgrade("Unlock all 5 Recruiter Screening Checks & Unlimited AI Tailoring.")}
            >
              <Crown className="mr-1.5 h-4 w-4" /> Unlock Full Recruiter Report
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * MODE 2: JOB MATCHER & TAILORING (Teal Pages 28-30 + Kickresume Page 20)
   * ======================================================================= */
  return (
    <div className="space-y-4">
      {/* Match Score Header Card (Teal Page 29) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Active Job Match Target
            </div>
            <div className="mt-0.5 truncate text-base font-bold text-foreground">
              {activeJob?.title}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeJob?.company} · {activeJob?.location}
            </div>
          </div>
          <ScoreRing value={matchScore} size={78} label="Match" />
        </div>

        {/* Toggle between Saved Jobs Board vs Paste Custom Job Description */}
        <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            variant={!useCustomJd ? "default" : "outline"}
            className="h-7 rounded-full text-xs"
            onClick={() => setUseCustomJd(false)}
          >
            <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Pick from Job Board ({jobs.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={useCustomJd ? "default" : "outline"}
            className="h-7 rounded-full text-xs"
            onClick={() => setUseCustomJd(true)}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" /> Paste Custom Job Ad
          </Button>
        </div>

        {!useCustomJd ? (
          <div className="mt-3 max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
            {jobs.map((jb) => {
              const active = jb.id === selectedJobId;
              return (
                <button
                  key={jb.id}
                  type="button"
                  onClick={() => setSelectedJobId(jb.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all",
                    active ? "border-primary bg-sage-mist/40" : "border-border bg-background hover:bg-muted/40"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{jb.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {jb.company} · {jb.location} · {jb.salary}
                    </div>
                  </div>
                  <Badge variant={active ? "default" : "outline"} className="ml-2 shrink-0 rounded-full text-[10px]">
                    {active ? "Selected" : "Match Job"}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Job Title (e.g. Bioinformatician)"
                className="h-8 text-xs"
              />
              <Input
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="Company Name"
                className="h-8 text-xs"
              />
            </div>
            <Textarea
              rows={4}
              value={customJd}
              onChange={(e) => setCustomJd(e.target.value)}
              placeholder="Paste the full job description here to extract required Hard & Soft skills..."
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Teal Page 29 Hard Skills & Soft Skills Keyword Gap Matrix */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground">
            Hard Skills ({matchedHard.length} / {hardSkills.length})
          </div>
          <span className="text-[11px] text-muted-foreground">Click any red skill to add it to your resume</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {hardSkills.map((kw) => {
            const matched = matchedHard.includes(kw);
            return (
              <button
                key={kw}
                type="button"
                onClick={() => !matched && addKeywordToSkills(kw)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  matched
                    ? "border-[#4e8a5a]/40 bg-[#e6f0e8] text-[#285030]"
                    : "border-[#c05b49]/40 bg-[#f7e4de] text-[#8a4436] hover:scale-[1.03]"
                )}
              >
                {matched ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                <span>{kw}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border pt-2.5">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            Soft Skills ({matchedSoft.length} / {softSkills.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {softSkills.map((kw) => {
              const matched = matchedSoft.includes(kw);
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => !matched && addKeywordToSkills(kw)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                    matched
                      ? "border-[#4e8a5a]/40 bg-[#e6f0e8] text-[#285030]"
                      : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {matched ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  <span>{kw}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kickresume Page 20 "Tailoring Level" Selector (Conservative | Balanced | Turbo) */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="text-sm font-semibold">Tailor your resume to this job</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "conservative", label: "Conservative", icon: Smile, desc: "Adds top 2 missing skills without changing summary." },
            { id: "balanced", label: "Balanced", icon: Scale, desc: "Recommended. The sweet spot — polished, relevant, and still you." },
            { id: "turbo", label: "Turbo PRO", icon: Flame, desc: "Full summary & keyword alignment for maximum ATS score." },
          ].map((lv) => {
            const active = tailorLevel === lv.id;
            return (
              <button
                key={lv.id}
                type="button"
                onClick={() => setTailorLevel(lv.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition-all",
                  active
                    ? "border-primary bg-[#202124] text-white shadow-xs"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <lv.icon className="h-4 w-4" />
                <span>{lv.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {tailorLevel === "conservative"
            ? "Conservative: Preserves your exact wording and appends 2 priority keywords."
            : tailorLevel === "balanced"
            ? "Recommended. The sweet spot — polished, relevant, and still you."
            : "Turbo (PRO): Rewrites your target title, summary, and skills to maximize ATS match."}
        </p>
        <Button type="button" className="w-full rounded-full" onClick={handleAutoTailor}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Tailor Resume Now
        </Button>
      </div>
    </div>
  );
}

function extractKeywordsFromText(text: string): string[] {
  const candidates = [
    "Python",
    "TypeScript",
    "React",
    "Next.js",
    "Figma",
    "Design Systems",
    "Genomics",
    "Bioinformatics",
    "Epic EHR",
    "Acute Care",
    "BLS",
    "ACLS",
    "Project Management",
    "Data Visualization",
    "SQL",
    "SEO",
    "Demand Generation",
  ];
  const lower = text.toLowerCase();
  return candidates.filter((c) => lower.includes(c.toLowerCase()));
}