"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore, templateContentForSeries } from "@/lib/store";
import { apiParseResumeFile, apiParseResumeText } from "@/lib/api/import-client";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { ResponsiveModal, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Briefcase,
  LayoutTemplate,
  Upload,
  Linkedin,
  Sparkles,
  Check,
  Crown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepMode = "hub" | "template" | "jd" | "upload" | "linkedin";

export function CreateResumeModal({
  open,
  onOpenChange,
  defaultSeries = "11",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultSeries?: string;
}) {
  const router = useRouter();
  const { addDoc } = useStore();
  const [mode, setMode] = useState<StepMode>("hub");
  const [selectedSeries, setSelectedSeries] = useState<string>(defaultSeries);
  const [docTitle, setDocTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [liUrl, setLiUrl] = useState("");
  const [liText, setLiText] = useState("");
  const [uploading, setUploading] = useState(false);

  const resetAndClose = () => {
    setMode("hub");
    onOpenChange(false);
  };

  const launchWithSeries = (seriesId: string, customTitle?: string, extraOpts?: any) => {
    const tpl = TEMPLATE_CATALOG.find((t) => t.id === seriesId) || TEMPLATE_CATALOG[0];
    const base = templateContentForSeries(seriesId);
    const content = extraOpts?.content ? { ...base, ...extraOpts.content } : base;
    const d = addDoc("resume", customTitle || docTitle.trim() || `Series ${seriesId} — ${tpl.name}`, {
      template: seriesId,
      series: seriesId,
      content,
      ...(extraOpts || {}),
    });
    resetAndClose();
    router.push(`/editor/${d.id}`);
  };

  const handleTailorFromJd = () => {
    if (!jobTitle.trim() && !jdText.trim()) return;
    const base = templateContentForSeries(selectedSeries);
    const extractedSkills = ["Cross-Functional Leadership", "Strategic Execution", "Process Optimization"];
    if (/python|genom|bioinformatic/i.test(jdText + jobTitle)) {
      extractedSkills.push("Python", "Genomic Pipelines", "NGS Data Analysis");
    } else if (/nurse|clinical|patient|rn/i.test(jdText + jobTitle)) {
      extractedSkills.push("Acute Patient Care", "Rapid Triage", "Epic EHR", "HIPAA Compliance");
    } else if (/design|figma|ux|product/i.test(jdText + jobTitle)) {
      extractedSkills.push("Figma", "Design Systems", "User Research", "Prototyping");
    }
    const targetRole = jobTitle.trim() || base.role;
    const d = addDoc(
      "tailored",
      `${targetRole}${company.trim() ? " — " + company.trim() : ""} (Tailored)`,
      {
        template: selectedSeries,
        series: selectedSeries,
        tailoredJobTitle: targetRole,
        tailoredCompany: company.trim(),
        tailoredJd: jdText.trim(),
        label: company.trim() ? `Tailored · ${company.trim()}` : "JD Tailored",
        content: {
          ...base,
          role: targetRole.toUpperCase(),
          skills: Array.from(new Set([...extractedSkills, ...base.skills])).slice(0, 10),
        },
      }
    );
    toast.success("Resume tailored to job description");
    resetAndClose();
    router.push(`/editor/${d.id}?tab=tailor`);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) setMode("hub");
        onOpenChange(v);
      }}
      title={
        mode === "hub"
          ? "How would you like to start your resume?"
          : mode === "template"
          ? "Choose one of your 8 signature templates"
          : mode === "jd"
          ? "Start from a Job Description"
          : mode === "upload"
          ? "Upload existing resume (PDF / DOCX)"
          : "Import from LinkedIn Profile"
      }
      description={
        mode === "hub"
          ? "Every option opens inside the live 1:1 Farnavi Studio with instant preview and ATS verification."
          : undefined
      }
    >
      {mode === "hub" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Path 1: From 8 Real Templates */}
            <button
              type="button"
              onClick={() => setMode("template")}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex w-full items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mist text-primary">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <Badge className="rounded-full bg-sage-mist text-primary hover:bg-sage-mist">Recommended</Badge>
              </div>
              <div className="text-sm font-semibold text-foreground">Start from Template (8 Series)</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Pick from your 3 Free ATS or 5 Pro Studio templates with exact original typography and layout.
              </p>
            </button>

            {/* Path 2: Start from Job Description (Teal / Kickresume pattern) */}
            <button
              type="button"
              onClick={() => setMode("jd")}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex w-full items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Briefcase className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">ATS Match</Badge>
              </div>
              <div className="text-sm font-semibold text-foreground">Start from Job Description</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Paste a target job ad to pre-align your headline, keywords, and ATS match score from day one.
              </p>
            </button>

            {/* Path 3: Upload PDF/DOCX */}
            <button
              type="button"
              onClick={() => setMode("upload")}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-foreground">Upload Existing Resume</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Import your old PDF or Word resume and reformat it into any of the 8 studio templates.
              </p>
            </button>

            {/* Path 4: Import LinkedIn */}
            <button
              type="button"
              onClick={() => setMode("linkedin")}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7eef2] text-[#3d5563]">
                <Linkedin className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-foreground">Import from LinkedIn</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Convert your public LinkedIn URL into a structured, ATS-ready resume in seconds.
              </p>
            </button>
          </div>

          {/* Quick Blank / Default ATS Launch */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>We never share your data with 3rd parties or use it for external model training.</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs font-medium text-primary"
              onClick={() => launchWithSeries("11", "Template — Ivy League ATS Resume")}
            >
              Quick start with Template (ATS) <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {mode === "template" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-2.5 text-xs" onClick={() => setMode("hub")}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Button>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Optional document title (e.g. Senior Product Designer CV)"
              className="h-8 max-w-xs text-xs"
            />
          </div>

          <div className="grid max-h-[380px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {TEMPLATE_CATALOG.map((t) => {
              const active = selectedSeries === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedSeries(t.id)}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all",
                    active ? "border-2 border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
                    <img
                      src={t.previews["resume-1p-a4"]}
                      alt={t.name}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute left-1.5 top-1.5 flex gap-1">
                      {t.tier === "free" ? (
                        <span className="rounded-full bg-[#e6f0e8] px-1.5 py-0.5 text-[9px] font-semibold text-[#33613d]">
                          Free · ATS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
                          <Crown className="h-2.5 w-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="bg-card p-2">
                    <div className="truncate text-xs font-semibold">Series {t.id} · {t.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {t.columns === 2 ? "2-Column" : "1-Column ATS"} · {t.fonts.heading}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-full" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={() => launchWithSeries(selectedSeries)}>
              Open Series {selectedSeries} in Studio <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {mode === "jd" && (
        <div className="space-y-3.5">
          <Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={() => setMode("hub")}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to options
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Target Job Title *">
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Clinical Bioinformatician, Product Designer"
              />
            </Field>
            <Field label="Company Name">
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Regeneron, Telgorithm"
              />
            </Field>
          </div>
          <Field label="Job Description (Paste full posting or requirements) *">
            <Textarea
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here. Farnavi will extract core hard/soft skills and align your template..."
            />
          </Field>
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs text-muted-foreground">
              {!jobTitle.trim() && !jdText.trim() ? "Enter a job title or description to continue" : "Ready to analyze & tailor"}
            </span>
            <Button
              className="rounded-full"
              disabled={!jobTitle.trim() && !jdText.trim()}
              onClick={handleTailorFromJd}
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Create Tailored Resume
            </Button>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={() => setMode("hub")}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to options
            </Button>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
            >
              {TEMPLATE_CATALOG.map((t) => (
                <option key={t.id} value={t.id}>
                  Target Template: {t.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-line bg-sage-mist/40 px-6 py-10 text-center transition-colors hover:bg-sage-mist">
            {uploading ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Extracting sections & formatting into template...</span>
              </>
            ) : (
              <>
                <Upload className="h-7 w-7 text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Drag & drop your resume file, or click to browse</span>
                <span className="mt-1 text-xs text-muted-foreground">Supports PDF, DOCX, or TXT · up to 10MB</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setUploading(true);
                try {
                  const res = await apiParseResumeFile(f);
                  const p = res.parsed;
                  const cleanName = p.name
                    ? `${p.name} (Imported)`
                    : f.name.replace(/\.[^.]+$/, "");
                  toast.success(
                    `Imported ${res.stats.experienceCount} role(s) & ${res.stats.skillCount} skill(s) (${res.stats.confidence}% confidence)`
                  );
                  launchWithSeries(selectedSeries, cleanName, {
                    content: {
                      ...(p.name ? { name: p.name } : {}),
                      ...(p.role ? { role: p.role } : {}),
                      ...(p.email ? { email: p.email } : {}),
                      ...(p.phone ? { phone: p.phone } : {}),
                      location: p.location || "",
                      ...(p.linkedin ? { linkedin: p.linkedin } : {}),
                      ...(p.website ? { website: p.website } : {}),
                      summary: p.summary || "",
                      ...(p.experience.length > 0 ? { experience: p.experience } : {}),
                      ...(p.education.length > 0 ? { education: p.education } : {}),
                      ...(p.skills.length > 0 ? { skills: p.skills, areasOfExpertise: p.skills } : {}),
                      technicalSkills: p.technicalSkills,
                      ...(p.certifications.length > 0 ? { certifications: p.certifications } : {}),
                      ...(p.courses.length > 0 ? { courses: p.courses } : {}),
                      ...(p.awards.length > 0 ? { awards: p.awards } : {}),
                      ...(p.volunteering.length > 0 ? { volunteering: p.volunteering } : {}),
                      ...(p.references.length > 0 ? { references: p.references } : {}),
                    },
                  });
                } catch (err: any) {
                  toast.error(err?.message || "Could not parse uploaded resume");
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>
      )}

      {mode === "linkedin" && (
        <div className="space-y-3.5">
          <Button variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={() => setMode("hub")}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to options
          </Button>
          <Field label="LinkedIn Profile URL (optional)">
            <Input
              value={liUrl}
              onChange={(e) => setLiUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-name"
            />
          </Field>
          <Field label="Paste LinkedIn Profile Text *" hint="Or click Upload Existing Resume and attach LinkedIn's 'Save to PDF' export.">
            <Textarea
              rows={5}
              value={liText}
              onChange={(e) => setLiText(e.target.value)}
              placeholder="Paste your LinkedIn About, Experience, Education, and Skills sections here..."
              className="text-xs"
            />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              className="rounded-full"
              disabled={uploading || liText.trim().length < 20}
              onClick={async () => {
                setUploading(true);
                try {
                  const res = await apiParseResumeText(liText, "linkedin", liUrl);
                  const p = res.parsed;
                  toast.success(`LinkedIn profile parsed (${res.stats.confidence}% confidence)`);
                  launchWithSeries(
                    selectedSeries,
                    p.name ? `${p.name} (LinkedIn)` : "LinkedIn Imported Resume",
                    {
                      content: {
                        ...(p.name ? { name: p.name } : {}),
                        ...(p.role ? { role: p.role } : {}),
                        ...(p.email ? { email: p.email } : {}),
                        ...(p.phone ? { phone: p.phone } : {}),
                        ...(p.location ? { location: p.location } : {}),
                        ...(p.linkedin ? { linkedin: p.linkedin } : {}),
                        ...(p.summary ? { summary: p.summary } : {}),
                        ...(p.experience.length > 0 ? { experience: p.experience } : {}),
                        ...(p.education.length > 0 ? { education: p.education } : {}),
                        ...(p.skills.length > 0 ? { skills: p.skills, areasOfExpertise: p.skills } : {}),
                      },
                    }
                  );
                } catch (err: any) {
                  toast.error(err?.message || "Failed to parse LinkedIn text");
                } finally {
                  setUploading(false);
                }
              }}
            >
              {uploading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Convert to Resume
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}