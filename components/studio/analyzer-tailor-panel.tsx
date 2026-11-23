"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, type Doc } from "@/lib/store";
import { getBullets } from "@/components/render/series-all";
import { ScoreRing } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  apiAnalyzeResume,
  type ResumeAnalysisReport,
} from "@/lib/api/analyze-client";
import {
  apiGenerateBullets,
  apiGenerateCoverLetter,
  apiTailorResume,
  type TailorProposal,
} from "@/lib/api/ai-client";
import { apiCreateVersion } from "@/lib/api/documents-client";
import type {
  AnalysisCheckItem,
  CheckCategory,
  QuickFixPatch,
} from "@/lib/server/resume-analyzer";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Plus,
  Check,
  X,
  Flame,
  Scale,
  Smile,
  Wrench,
  ShieldCheck,
  FileSearch,
  Loader2,
  ArrowUpRight,
  Briefcase,
  Mail,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<CheckCategory, { label: string; desc: string }> = {
  ats: { label: "ATS & Format", desc: "Parsability, dates, placeholders, length" },
  impact: { label: "Quantified Impact", desc: "Metrics, bullet balance, summary, skills" },
  language: { label: "Language Quality", desc: "Action verbs, pronouns, passive voice, typos" },
  recruiter: { label: "Recruiter Checks", desc: "Credibility, tenure, gaps, bias, ownership" },
};

export function AnalyzerTailorPanel({
  doc,
  mode,
  onJumpToSection,
}: {
  doc: Doc;
  mode: "analyzer" | "tailor";
  onRequestUpgrade?: (reason: string) => void;
  onJumpToSection: (sec: string) => void;
}) {
  const { updateDoc, jobs } = useStore();
  const c = doc.content;
  const sId = String(doc.series || doc.template || "11");

  const [report, setReport] = useState<ResumeAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<"issues" | "all" | "passed">("issues");
  const [activeCategory, setActiveCategory] = useState<CheckCategory | "all">("all");
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(false);

  // Job Matcher & AI Tailor Diff state
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || "j1");
  const [customTitle, setCustomTitle] = useState(doc.tailoredJobTitle || "");
  const [customCompany, setCustomCompany] = useState(doc.tailoredCompany || "");
  const [customJd, setCustomJd] = useState(doc.tailoredJd || "");
  const [useCustomJd, setUseCustomJd] = useState(Boolean(doc.tailoredJd));
  const [tailorLevel, setTailorLevel] = useState<"conservative" | "balanced" | "turbo">("balanced");

  const [tailorBusy, setTailorBusy] = useState(false);
  const [proposals, setProposals] = useState<TailorProposal[]>([]);
  const [proposalMeta, setProposalMeta] = useState<{ before: number; after: number; mode: string } | null>(null);
  const [decidedIds, setDecidedIds] = useState<Record<string, "accepted" | "rejected">>({});

  // Keyword -> AI Bullet Writer state
  const [bulletKeyword, setBulletKeyword] = useState<string | null>(null);
  const [bulletBusy, setBulletBusy] = useState(false);
  const [generatedBullets, setGeneratedBullets] = useState<string[]>([]);
  const [targetExpIdx, setTargetExpIdx] = useState(0);

  // AI Cover Letter state
  const [coverBusy, setCoverBusy] = useState(false);

  const activeJob = useMemo(() => {
    if (useCustomJd && (customTitle.trim() || customJd.trim())) {
      return {
        id: "custom",
        title: customTitle.trim() || c.role || "Target Role",
        company: customCompany.trim() || "Target Company",
        summary: customJd.trim() || customTitle.trim(),
      };
    }
    const found = jobs.find((j) => j.id === selectedJobId) || jobs[0];
    return found
      ? {
          id: found.id,
          title: found.title,
          company: found.company,
          summary: `${found.summary} ${(found.tags || []).join(" ")}`,
        }
      : { id: "default", title: c.role || "Target Role", company: "Company", summary: "" };
  }, [useCustomJd, customTitle, customCompany, customJd, jobs, selectedJobId, c.role]);

  const analysisSig = JSON.stringify({
    content: c,
    seriesId: sId,
    pageCount: doc.settings?.pageCount || 1,
    jd: mode === "tailor" ? activeJob.summary : "",
    jt: mode === "tailor" ? activeJob.title : "",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiAnalyzeResume({
          content: c,
          seriesId: sId,
          settings: doc.settings || {},
          jobTitle: mode === "tailor" ? activeJob.title : undefined,
          jobCompany: mode === "tailor" ? activeJob.company : undefined,
          jobDescription: mode === "tailor" ? activeJob.summary : undefined,
        });
        if (!cancelled) setReport(res);
      } catch (err) { console.warn("[analyzer-tailor-panel]", err); } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [analysisSig]);

  const applyQuickFix = (fix: QuickFixPatch) => {
    if (fix.kind === "replace-bullet" && fix.expId !== undefined && fix.bulletIndex !== undefined) {
      const nextExp = (c.experience || []).map((e) => {
        if (e.id !== fix.expId) return e;
        const bullets = getBullets(e);
        if (fix.bulletIndex! < 0 || fix.bulletIndex! >= bullets.length) return e;
        const nextBullets = [...bullets];
        nextBullets[fix.bulletIndex!] = fix.replacement;
        return {
          ...e,
          bullets: nextBullets,
          description: nextBullets.map((b) => `\u2022 ${b}`).join("\n"),
        };
      });
      updateDoc(doc.id, { content: { ...c, experience: nextExp } });
      toast.success("Bullet improved with 1-click fix");
      return;
    }
    if (fix.kind === "replace-summary") {
      updateDoc(doc.id, { content: { ...c, summary: fix.replacement } });
      toast.success("Summary updated");
    }
  };

  const addSkillKeyword = (kw: string) => {
    const existing = c.skills || [];
    if (existing.some((s) => s.toLowerCase() === kw.toLowerCase())) {
      toast.info(`"${kw}" is already in your skills`);
      return;
    }
    const nextSkills = [...existing, kw];
    updateDoc(doc.id, {
      content: {
        ...c,
        skills: nextSkills,
        areasOfExpertise: nextSkills,
      } as any,
    });
    toast.success(`Added "${kw}" to Skills`);
  };

  const handleWriteBulletForKeyword = async (kw: string) => {
    setBulletKeyword(kw);
    setBulletBusy(true);
    setGeneratedBullets([]);
    const exp = (c.experience || [])[targetExpIdx] || (c.experience || [])[0];
    try {
      const res = await apiGenerateBullets({
        role: exp?.role || c.role || activeJob.title,
        company: exp?.company || "",
        keyword: kw,
        tone: "impact",
        count: 3,
      });
      setGeneratedBullets(res.bullets);
    } catch (err: any) {
      toast.error(err?.message || "Failed to write bullet");
    } finally {
      setBulletBusy(false);
    }
  };

  const insertGeneratedBullet = (bulletText: string) => {
    const list = c.experience || [];
    if (list.length === 0) {
      toast.error("Add a work experience entry first.");
      return;
    }
    const idx = Math.min(targetExpIdx, list.length - 1);
    const nextExp = list.map((e, i) => {
      if (i !== idx) return e;
      const prevBullets = getBullets(e);
      const nextBullets = [...prevBullets, bulletText];
      return {
        ...e,
        bullets: nextBullets,
        description: nextBullets.map((b) => `\u2022 ${b}`).join("\n"),
      };
    });
    updateDoc(doc.id, { content: { ...c, experience: nextExp } });
    toast.success(`Inserted bullet into "${list[idx].role || "Experience"}"`);
  };

  const handleGenerateTailorDiff = async () => {
    if (!activeJob.summary || activeJob.summary.trim().length < 10) {
      toast.error("Please select a job or paste a job description first.");
      return;
    }
    setTailorBusy(true);
    setProposals([]);
    setDecidedIds({});
    try {
      const res = await apiTailorResume({
        content: c,
        seriesId: sId,
        jobTitle: activeJob.title,
        company: activeJob.company,
        jobDescription: activeJob.summary,
        level: tailorLevel,
      });
      setProposals(res.proposals);
      setProposalMeta({
        before: res.beforeMatch,
        after: res.estimatedAfterMatch,
        mode: res.mode === "ai" ? `${res.provider.toUpperCase()} AI` : "Smart Local",
      });
      if (res.proposals.length === 0) {
        toast.info("Your resume is already tightly aligned with this role.");
      } else {
        toast.success(`Generated ${res.proposals.length} tailored diff suggestion(s)`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate tailoring diff");
    } finally {
      setTailorBusy(false);
    }
  };

  const applySingleProposal = async (prop: TailorProposal, skipBackup = false) => {
    if (!skipBackup && Object.keys(decidedIds).length === 0) {
      apiCreateVersion(doc.id, `Auto-Backup before tailoring (${activeJob.title})`, "pre-tailor").catch(() => {});
    }

    const next: any = { ...c };
    if (prop.target === "role") {
      next.role = prop.after;
    } else if (prop.target === "summary") {
      next.summary = prop.after;
    } else if (prop.target === "skills") {
      const additions =
        prop.addedSkills && prop.addedSkills.length > 0
          ? prop.addedSkills
          : prop.after.split(",").map((s) => s.trim()).filter(Boolean);
      const merged = Array.from(new Set([...(c.skills || []), ...additions]));
      next.skills = merged;
      next.areasOfExpertise = merged;
    } else if (
      prop.target === "bullet" &&
      prop.expId &&
      prop.bulletIndex !== undefined
    ) {
      next.experience = (c.experience || []).map((e) => {
        if (e.id !== prop.expId) return e;
        const bl = getBullets(e);
        if (prop.bulletIndex! < 0 || prop.bulletIndex! >= bl.length) return e;
        const copy = [...bl];
        copy[prop.bulletIndex!] = prop.after;
        return { ...e, bullets: copy, description: copy.map((b) => `\u2022 ${b}`).join("\n") };
      });
    }

    updateDoc(doc.id, {
      tailoredJobTitle: activeJob.title,
      tailoredCompany: activeJob.company,
      tailoredJd: activeJob.summary,
      content: next,
    });
    setDecidedIds((prev) => ({ ...prev, [prop.id]: "accepted" }));
    if (!skipBackup) toast.success(`Accepted: ${prop.label}`);
  };

  const acceptAllPendingProposals = async () => {
    const pending = proposals.filter((p) => !decidedIds[p.id]);
    if (pending.length === 0) return;

    apiCreateVersion(doc.id, `Auto-Backup before tailoring (${activeJob.title})`, "pre-tailor").catch(() => {});

    const next: any = JSON.parse(JSON.stringify(c));
    for (const prop of pending) {
      if (prop.target === "role") next.role = prop.after;
      else if (prop.target === "summary") next.summary = prop.after;
      else if (prop.target === "skills") {
        const additions =
          prop.addedSkills && prop.addedSkills.length > 0
            ? prop.addedSkills
            : prop.after.split(",").map((s) => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...(next.skills || []), ...additions]));
        next.skills = merged;
        next.areasOfExpertise = merged;
      } else if (prop.target === "bullet" && prop.expId && prop.bulletIndex !== undefined) {
        next.experience = (next.experience || []).map((e: any) => {
          if (e.id !== prop.expId) return e;
          const bl = getBullets(e);
          if (prop.bulletIndex! < 0 || prop.bulletIndex! >= bl.length) return e;
          const copy = [...bl];
          copy[prop.bulletIndex!] = prop.after;
          return { ...e, bullets: copy, description: copy.map((b: string) => `\u2022 ${b}`).join("\n") };
        });
      }
    }

    updateDoc(doc.id, {
      tailoredJobTitle: activeJob.title,
      tailoredCompany: activeJob.company,
      tailoredJd: activeJob.summary,
      content: next,
    });

    const nextDecided: Record<string, "accepted" | "rejected"> = { ...decidedIds };
    pending.forEach((p) => {
      nextDecided[p.id] = "accepted";
    });
    setDecidedIds(nextDecided);
    toast.success(`Accepted all ${pending.length} changes (previous version auto-backed up)`);
  };

  const handleGenerateCoverLetter = async () => {
    setCoverBusy(true);
    try {
      const res = await apiGenerateCoverLetter({
        content: c,
        jobTitle: activeJob.title,
        company: activeJob.company,
        jobDescription: activeJob.summary,
        tone: "confident",
      });
      updateDoc(doc.id, {
        activeTab: "cover",
        content: {
          ...c,
          coverLetter: res.coverLetter,
        } as any,
      });
      toast.success(`Tailored Cover Letter generated for ${activeJob.title} — switched to Cover Letter view`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate cover letter");
    } finally {
      setCoverBusy(false);
    }
  };

  // =========================================================================
  // MODE 1: 28-POINT ANALYZER & RECRUITER CHECKS
  // =========================================================================
  if (mode === "analyzer") {
    const checks = report?.checks || [];
    const filteredChecks = checks.filter((ch) => {
      if (activeCategory !== "all" && ch.category !== activeCategory) return false;
      if (filterMode === "issues") return ch.severity !== "pass";
      if (filterMode === "passed") return ch.severity === "pass";
      return true;
    });

    const severityIcon = (sev: AnalysisCheckItem["severity"]) => {
      if (sev === "pass") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#33613d]" />;
      if (sev === "error") return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c05b49]" />;
      if (sev === "warning") return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />;
      return <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />;
    };

    return (
      <div className="space-y-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ScoreRing value={report?.overallScore ?? 0} size={68} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Resume Health: {report?.grade || "Analyzing..."}
                  </h3>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {report
                    ? `${report.stats.passedChecks}/${report.stats.totalChecks} checks passed · ${report.stats.errorCount} critical · ${report.stats.warningCount} warnings`
                    : "Running 28-point ATS & recruiter screening..."}
                </p>
                {report && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                    <Badge variant="secondary">{report.stats.wordCount} words</Badge>
                    <Badge variant="secondary">{report.stats.quantifiedRatio}% quantified bullets</Badge>
                    <Badge className="bg-[#e6f0e8] text-[#33613d] hover:bg-[#e6f0e8]">
                      <ShieldCheck className="mr-1 h-3 w-3" /> All 28 Checks Unlocked
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {report && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-border pt-3.5">
              {(["ats", "impact", "language", "recruiter"] as CheckCategory[]).map((cat) => {
                const val = report.subscores[cat];
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(isSelected ? "all" : cat)}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-sage-mist/35"
                        : "border-border bg-muted/20 hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{CATEGORY_META[cat].label}</span>
                      <span
                        className={cn(
                          val >= 85
                            ? "text-[#33613d]"
                            : val >= 65
                            ? "text-amber-700"
                            : "text-[#c05b49]"
                        )}
                      >
                        {val}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          val >= 85
                            ? "bg-[#33613d]"
                            : val >= 65
                            ? "bg-amber-500"
                            : "bg-[#c05b49]"
                        )}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs">
            {[
              { id: "issues" as const, label: `To Fix (${(report?.stats.errorCount || 0) + (report?.stats.warningCount || 0)})` },
              { id: "all" as const, label: `All (${report?.stats.totalChecks || 28})` },
              { id: "passed" as const, label: `Passed (${report?.stats.passedChecks || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-all",
                  filterMode === f.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={() => setShowSectionBreakdown((v) => !v)}
          >
            <FileSearch className="mr-1 h-3.5 w-3.5" />
            {showSectionBreakdown ? "Hide Section Analysis" : "Section Analysis"}
          </Button>
        </div>

        {showSectionBreakdown && report && (
          <div className="grid gap-2 rounded-2xl border border-border bg-card p-3.5 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Per-Section Breakdown
            </div>
            {report.sectionAnalysis.map((sec) => (
              <div
                key={sec.section}
                className="flex items-start justify-between gap-2 rounded-xl border border-border bg-muted/20 p-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{sec.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {sec.score}/100
                    </Badge>
                  </div>
                  {sec.strengths.map((st, idx) => (
                    <div key={idx} className="text-[11px] text-[#33613d]">
                      \u2713 {st}
                    </div>
                  ))}
                  {sec.issues.map((is, idx) => (
                    <div key={idx} className="text-[11px] text-[#c05b49]">
                      \u2022 {is}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0 rounded-full px-2 text-[11px]"
                  onClick={() => onJumpToSection(sec.section)}
                >
                  Edit <ArrowUpRight className="ml-0.5 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filteredChecks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-[#33613d]" />
              No issues in this view \u2014 your resume passes every check here.
            </div>
          ) : (
            filteredChecks.map((ch) => (
              <div
                key={ch.id}
                className="rounded-xl border border-border bg-card p-3 text-xs transition-colors hover:border-primary/40"
              >
                <div className="flex items-start gap-2.5">
                  {severityIcon(ch.severity)}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span>{ch.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {CATEGORY_META[ch.category].label}
                        </Badge>
                      </div>
                      {ch.severity !== "pass" && (
                        <button
                          type="button"
                          onClick={() => onJumpToSection(ch.section)}
                          className="inline-flex items-center text-[11px] font-medium text-primary hover:underline"
                        >
                          Open section <ArrowUpRight className="ml-0.5 h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                      {ch.message}
                    </p>
                    {ch.detail && (
                      <div className="rounded-lg bg-muted/40 px-2.5 py-1.5 font-mono text-[10.5px] text-foreground">
                        {ch.detail}
                      </div>
                    )}
                    {ch.quickFix && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full border-primary/50 text-[11px] text-primary hover:bg-sage-mist"
                          onClick={() => applyQuickFix(ch.quickFix!)}
                        >
                          <Wrench className="mr-1 h-3 w-3" /> {ch.quickFix.buttonLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODE 2: JOB MATCHER + 3-LEVEL AI TAILOR DIFF + KEYWORD BULLET WRITER + AI COVER LETTER
  // =========================================================================
  const jm = report?.jobMatch;

  return (
    <div className="space-y-3.5">
      {/* Job Source Selector */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Briefcase className="h-4 w-4 text-primary" />
            <span>Target Job Description</span>
          </div>
          <div className="flex gap-1 rounded-full bg-muted p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setUseCustomJd(false)}
              className={cn(
                "rounded-full px-2.5 py-0.5 font-medium",
                !useCustomJd ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              Sample Jobs
            </button>
            <button
              type="button"
              onClick={() => setUseCustomJd(true)}
              className={cn(
                "rounded-full px-2.5 py-0.5 font-medium",
                useCustomJd ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              Paste Own JD
            </button>
          </div>
        </div>

        {!useCustomJd ? (
          <div className="grid gap-1.5">
            {jobs.slice(0, 4).map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setSelectedJobId(j.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all",
                  selectedJobId === j.id
                    ? "border-primary bg-sage-mist/35"
                    : "border-border bg-muted/15 hover:border-primary/40"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{j.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {j.company} · {j.location || j.mode}
                  </div>
                </div>
                {selectedJobId === j.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Job Title (e.g. Senior Product Designer)"
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
              rows={5}
              value={customJd}
              onChange={(e) => setCustomJd(e.target.value)}
              placeholder="Paste the full job description here to extract Hard Skills, Soft Skills, and generate tailored diff suggestions..."
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Match Score, Hard/Soft Skills & Keyword Bullet Writer */}
      <div className="space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <ScoreRing value={jm?.matchScore ?? 0} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span>ATS Match Score</span>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {jm?.keywordDensityNote || "Comparing your resume against the target role..."}
            </p>
          </div>
        </div>

        {jm && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>
                Hard Skills ({jm.matchedHard.length}/{jm.matchedHard.length + jm.missingHard.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                + Add skill · \u2728 Write bullet
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {jm.matchedHard.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full bg-[#e6f0e8] px-2.5 py-1 text-[11px] font-medium text-[#33613d]"
                >
                  <Check className="h-3 w-3" /> {kw}
                </span>
              ))}
              {jm.missingHard.map((kw) => (
                <div
                  key={kw}
                  className="inline-flex items-center overflow-hidden rounded-full border border-dashed border-[#c05b49]/60 bg-[#fdf3f1] text-[11px] font-medium text-[#9e3d2d]"
                >
                  <button
                    type="button"
                    onClick={() => addSkillKeyword(kw)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-[#fae2dd]"
                    title={`Add "${kw}" to Skills`}
                  >
                    <Plus className="h-3 w-3" /> {kw}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWriteBulletForKeyword(kw)}
                    className="border-l border-[#c05b49]/30 px-2 py-1 text-primary hover:bg-sage-mist"
                    title={`Write XYZ experience bullet using "${kw}"`}
                  >
                    <Wand2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Keyword-to-Bullet Generator Drawer (Teal Pattern + Anti-Hallucination) */}
        {bulletKeyword && (
          <div className="space-y-2 rounded-xl border border-sage-line bg-sage-mist/25 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-primary">
                AI Bullet Suggestions for &ldquo;{bulletKeyword}&rdquo;
              </div>
              <div className="flex items-center gap-1.5">
                {(c.experience || []).length > 0 && (
                  <select
                    value={targetExpIdx}
                    onChange={(e) => setTargetExpIdx(Number(e.target.value))}
                    className="h-6 rounded-md border border-border bg-card px-1.5 text-[10px]"
                  >
                    {(c.experience || []).map((ex, i) => (
                      <option key={ex.id || i} value={i}>
                        Insert into: {(ex.role || "Role").slice(0, 24)}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setBulletKeyword(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {bulletBusy ? (
              <div className="flex items-center gap-2 py-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing XYZ bullets...
              </div>
            ) : (
              <div className="space-y-1.5">
                {generatedBullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-2"
                  >
                    <p className="text-[11px] leading-relaxed text-foreground">{b}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 shrink-0 rounded-full px-2 text-[10px]"
                      onClick={() => insertGeneratedBullet(b)}
                    >
                      + Insert
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {jm && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-xs font-semibold">
              Soft Skills ({jm.matchedSoft.length}/{jm.matchedSoft.length + jm.missingSoft.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {jm.matchedSoft.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full bg-[#e6f0e8] px-2.5 py-1 text-[11px] font-medium text-[#33613d]"
                >
                  <Check className="h-3 w-3" /> {kw}
                </span>
              ))}
              {jm.missingSoft.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => addSkillKeyword(kw)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-500/60 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
                >
                  <Plus className="h-3 w-3" /> {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3-Level Tailoring Controls + AI Cover Letter CTA */}
        <div className="space-y-2.5 border-t border-border pt-3">
          <div className="text-xs font-semibold">Tailoring Intensity (Interactive Diff Review)</div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { id: "conservative" as const, label: "Conservative", icon: Smile },
              { id: "balanced" as const, label: "Balanced", icon: Scale },
              { id: "turbo" as const, label: "Turbo", icon: Flame },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setTailorLevel(lvl.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border py-2 font-medium transition-all",
                  tailorLevel === lvl.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                <lvl.icon className="h-3.5 w-3.5" />
                <span>{lvl.label}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="w-full rounded-full text-xs font-semibold"
              onClick={handleGenerateTailorDiff}
              disabled={tailorBusy || !jm}
            >
              {tailorBusy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              Preview AI Tailor Diff
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full text-xs font-semibold"
              onClick={handleGenerateCoverLetter}
              disabled={coverBusy}
            >
              {coverBusy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="mr-1.5 h-3.5 w-3.5" />
              )}
              Generate Cover Letter
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Before / After Tailor Diff Panel (Accept / Reject each change!) */}
      {proposals.length > 0 && (
        <div className="space-y-2.5 rounded-2xl border border-sage-line bg-card p-4 shadow-xs text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div>
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span>Proposed Tailoring Diff ({proposals.length})</span>
                {proposalMeta && (
                  <Badge className="bg-[#e6f0e8] text-[10px] text-[#33613d] hover:bg-[#e6f0e8]">
                    {proposalMeta.before}% \u2192 ~{proposalMeta.after}% Match
                  </Badge>
                )}
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                Review each suggestion individually. Accepting automatically saves a Version History backup.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-full text-[11px]"
              onClick={acceptAllPendingProposals}
              disabled={proposals.every((p) => Boolean(decidedIds[p.id]))}
            >
              Accept All Pending
            </Button>
          </div>

          <div className="space-y-2">
            {proposals.map((prop) => {
              const decision = decidedIds[prop.id];
              return (
                <div
                  key={prop.id}
                  className={cn(
                    "space-y-1.5 rounded-xl border p-3 transition-opacity",
                    decision === "accepted" && "border-[#33613d]/40 bg-[#e6f0e8]/30",
                    decision === "rejected" && "border-border bg-muted/20 opacity-50",
                    !decision && "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{prop.label}</span>
                    {decision ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] uppercase",
                          decision === "accepted" ? "text-[#33613d]" : "text-muted-foreground"
                        )}
                      >
                        {decision}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 rounded-full px-2 text-[10px] text-muted-foreground"
                          onClick={() =>
                            setDecidedIds((prev) => ({ ...prev, [prop.id]: "rejected" }))
                          }
                        >
                          <X className="mr-0.5 h-3 w-3" /> Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 rounded-full px-2.5 text-[10px]"
                          onClick={() => applySingleProposal(prop)}
                        >
                          <Check className="mr-0.5 h-3 w-3" /> Accept
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{prop.reason}</p>
                  <div className="grid gap-1.5 pt-1 text-[11px]">
                    <div className="rounded-lg bg-[#fdf3f1] px-2.5 py-1.5 text-[#8c3627] line-through decoration-[#c05b49]/50">
                      {prop.before}
                    </div>
                    <div className="rounded-lg bg-[#eef6f0] px-2.5 py-1.5 font-medium text-[#214729]">
                      {prop.after}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}