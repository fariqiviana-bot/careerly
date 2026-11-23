"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Content } from "@/lib/store";
import {
  apiParseResumeFile,
  apiParseResumeText,
  type ImportParseResult,
} from "@/lib/api/import-client";
import {
  Upload,
  FileText,
  Linkedin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  FilePlus2,
  Replace,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SourceTab = "file" | "paste" | "linkedin";

export interface SelectedImportSections {
  contact: boolean;
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  extras: boolean;
  references: boolean;
}

export function ImportResumeModal({
  open,
  onOpenChange,
  currentContent,
  onApplyToCurrent,
  onCreateNewFromImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentContent: Content;
  onApplyToCurrent: (merged: Content, sourceLabel: string) => Promise<void> | void;
  onCreateNewFromImport: (merged: Content, title: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<SourceTab>("file");
  const [pasteText, setPasteText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportParseResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [selected, setSelected] = useState<SelectedImportSections>({
    contact: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    extras: true,
    references: true,
  });

  const resetModal = () => {
    setResult(null);
    setShowRaw(false);
    setBusy(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetModal();
    onOpenChange(nextOpen);
  };

  const initializeSelection = (res: ImportParseResult) => {
    const p = res.parsed;
    setSelected({
      contact: Boolean(p.name || p.email || p.phone || p.role),
      summary: Boolean(p.summary),
      experience: p.experience.length > 0,
      education: p.education.length > 0,
      skills: p.skills.length + p.technicalSkills.length > 0,
      extras:
        p.certifications.length +
          p.courses.length +
          p.awards.length +
          p.volunteering.length >
        0,
      references: p.references.length > 0,
    });
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const parsed = await apiParseResumeFile(file);
      setResult(parsed);
      initializeSelection(parsed);
      toast.success(`Parsed ${file.name} (${parsed.stats.confidence}% confidence)`);
    } catch (err: any) {
      toast.error(err?.message || "Could not parse uploaded file");
    } finally {
      setBusy(false);
    }
  };

  const handleTextParse = async (kind: "paste" | "linkedin") => {
    const txt = kind === "linkedin" ? linkedinText : pasteText;
    if (txt.trim().length < 20) {
      toast.error("Please paste at least a few lines of text first.");
      return;
    }
    setBusy(true);
    try {
      const parsed = await apiParseResumeText(
        txt,
        kind,
        kind === "linkedin" ? linkedinUrl : undefined
      );
      setResult(parsed);
      initializeSelection(parsed);
      toast.success(`Extracted resume data (${parsed.stats.confidence}% confidence)`);
    } catch (err: any) {
      toast.error(err?.message || "Could not parse text");
    } finally {
      setBusy(false);
    }
  };

  const buildMergedContent = (): Content => {
    if (!result) return currentContent;
    const p = result.parsed;
    const next: Content = { ...currentContent };

    if (selected.contact) {
      if (p.name) {
        next.name = p.name;
        const parts = p.name.trim().split(/\s+/);
        next.firstName = parts[0] || "";
        next.lastName = parts.slice(1).join(" ");
      }
      if (p.role) next.role = p.role;
      if (p.email) next.email = p.email;
      if (p.phone) next.phone = p.phone;
      if (p.location) next.location = p.location;
      else if (next.location === "City, State/Province") next.location = "";
      if (p.linkedin) next.linkedin = p.linkedin;
      if (p.website) next.website = p.website;
    }
    if (selected.summary && p.summary) {
      next.summary = p.summary;
    } else if (/^Write 3[\u2013\-]5 sentences|^Showcase your top accomplishments|^Use this section to/i.test(next.summary || "")) {
      next.summary = p.summary || "";
    }
    if (selected.experience && p.experience.length > 0) {
      next.experience = p.experience;
    }
    if (selected.education && p.education.length > 0) {
      next.education = p.education;
    }
    if (selected.skills) {
      if (p.skills.length > 0) {
        next.skills = p.skills;
        (next as any).areasOfExpertise = p.skills;
      }
      next.technicalSkills = p.technicalSkills;
    }
    if (selected.extras) {
      if (p.certifications.length > 0) next.certifications = p.certifications;
      if (p.courses.length > 0) next.courses = p.courses;
      if (p.awards.length > 0) next.awards = p.awards;
      if (p.volunteering.length > 0) next.volunteering = p.volunteering;
    }
    if (selected.references && p.references.length > 0) {
      next.references = p.references;
    }
    return next;
  };

  const toggleKey = (key: keyof SelectedImportSections) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const diffRows = result
    ? [
        {
          key: "contact" as const,
          label: "Contact & Header",
          currentText: [currentContent.name, currentContent.role, currentContent.email]
            .filter(Boolean)
            .join(" · "),
          importedText: [
            result.parsed.name,
            result.parsed.role,
            result.parsed.email,
            result.parsed.phone,
            result.parsed.location,
          ]
            .filter(Boolean)
            .join(" · "),
          hasData: Boolean(
            result.parsed.name ||
              result.parsed.email ||
              result.parsed.phone ||
              result.parsed.role
          ),
        },
        {
          key: "summary" as const,
          label: "Professional Summary",
          currentText: currentContent.summary
            ? `${currentContent.summary.slice(0, 95)}...`
            : "(empty)",
          importedText: result.parsed.summary
            ? `${result.parsed.summary.slice(0, 120)}${result.parsed.summary.length > 120 ? "..." : ""}`
            : "(not found)",
          hasData: Boolean(result.parsed.summary),
        },
        {
          key: "experience" as const,
          label: `Work Experience (${result.stats.experienceCount} roles · ${result.stats.bulletCount} bullets)`,
          currentText: `${(currentContent.experience || []).length} role(s)`,
          importedText:
            result.parsed.experience.length > 0
              ? result.parsed.experience
                  .slice(0, 3)
                  .map((e) => `${e.role}${e.company ? ` @ ${e.company}` : ""}`)
                  .join(" · ")
              : "(not found)",
          hasData: result.parsed.experience.length > 0,
        },
        {
          key: "education" as const,
          label: `Education (${result.stats.educationCount})`,
          currentText: `${(currentContent.education || []).length} item(s)`,
          importedText:
            result.parsed.education.length > 0
              ? result.parsed.education
                  .slice(0, 2)
                  .map((ed) => [ed.degree, ed.school].filter(Boolean).join(" — "))
                  .join(" · ")
              : "(not found)",
          hasData: result.parsed.education.length > 0,
        },
        {
          key: "skills" as const,
          label: `Skills (${result.stats.skillCount})`,
          currentText: `${(currentContent.skills || []).length} skill(s)`,
          importedText:
            result.stats.skillCount > 0
              ? [...result.parsed.skills, ...result.parsed.technicalSkills]
                  .slice(0, 8)
                  .join(", ")
              : "(not found)",
          hasData: result.stats.skillCount > 0,
        },
        {
          key: "extras" as const,
          label: `Certifications, Courses & Awards (${result.parsed.certifications.length + result.parsed.courses.length + result.parsed.awards.length + result.parsed.volunteering.length})`,
          currentText: `${(currentContent.certifications || []).length + (currentContent.courses || []).length} item(s)`,
          importedText:
            result.parsed.certifications.length +
              result.parsed.courses.length +
              result.parsed.awards.length +
              result.parsed.volunteering.length >
            0
              ? [
                  ...result.parsed.certifications.map((x) => x.name),
                  ...result.parsed.courses.map((x) => x.title),
                  ...result.parsed.awards.map((x) => x.title),
                  ...result.parsed.volunteering.map((x) => x.role),
                ]
                  .slice(0, 4)
                  .join(" · ")
              : "(not found)",
          hasData:
            result.parsed.certifications.length +
              result.parsed.courses.length +
              result.parsed.awards.length +
              result.parsed.volunteering.length >
            0,
        },
        {
          key: "references" as const,
          label: `References (${result.parsed.references.length})`,
          currentText: `${(currentContent.references || []).length} reference(s)`,
          importedText:
            result.parsed.references.length > 0
              ? result.parsed.references.map((r) => r.name).join(" · ")
              : "(not found)",
          hasData: result.parsed.references.length > 0,
        },
      ]
    : [];

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleClose}
      title={result ? "Review Imported Resume (Diff Preview)" : "Smart Resume Import"}
      description={
        result
          ? "Select which parsed sections to apply. Applying automatically saves a backup snapshot in Version History."
          : "Upload an existing PDF/DOCX resume, LinkedIn Save-to-PDF export, or paste raw text."
      }
    >
      {!result ? (
        <div className="space-y-4">
          {/* Source Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1 text-xs">
            {[
              { id: "file" as const, label: "Upload PDF / DOCX", icon: Upload },
              { id: "paste" as const, label: "Paste Text", icon: FileText },
              { id: "linkedin" as const, label: "LinkedIn", icon: Linkedin },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                  tab === item.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {tab === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                dragOver
                  ? "border-primary bg-sage-mist/40"
                  : "border-border bg-muted/20 hover:border-primary/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {busy ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <div className="text-xs font-medium">Extracting layout & sections...</div>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-mist text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold">
                    Drop your PDF, DOCX, or TXT resume here
                  </div>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Supports single-column, two-column Word/PDF templates, and LinkedIn &ldquo;Save to PDF&rdquo; files up to 10 MB.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-1 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse File
                  </Button>
                </>
              )}
            </div>
          )}

          {tab === "paste" && (
            <div className="space-y-3">
              <Textarea
                rows={9}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your full resume text here (name, contact, summary, experience, education, skills)..."
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={busy || pasteText.trim().length < 20}
                  onClick={() => handleTextParse("paste")}
                >
                  {busy ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Parse & Preview Diff
                </Button>
              </div>
            </div>
          )}

          {tab === "linkedin" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-sage-line bg-sage-mist/30 p-3 text-muted-foreground">
                <strong className="text-foreground">Best way to import LinkedIn (100% accurate):</strong>{" "}
                On your LinkedIn profile, click <em>Resources / More → Save to PDF</em>, then upload that PDF below — or copy & paste your profile sections into the box.
              </div>
              <div className="flex gap-2">
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/your-profile (optional)"
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-lg text-xs"
                  onClick={() => {
                    setTab("file");
                    setTimeout(() => fileInputRef.current?.click(), 50);
                  }}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload LinkedIn PDF
                </Button>
              </div>
              <Textarea
                rows={6}
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="Or paste your LinkedIn About, Experience, Education, and Skills text here..."
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={busy || linkedinText.trim().length < 20}
                  onClick={() => handleTextParse("linkedin")}
                >
                  {busy ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Linkedin className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Parse LinkedIn Text
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Confidence & Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#33613d]" />
              <span className="font-semibold">
                {result.stats.fileName || result.stats.sourceType.toUpperCase()} parsed
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {result.stats.confidence}% confidence
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase">
                {result.mode}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[11px] text-primary underline"
                onClick={() => setShowRaw((v) => !v)}
              >
                {showRaw ? "Hide raw text" : "Inspect raw text"}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-xs"
                onClick={resetModal}
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Re-upload
              </Button>
            </div>
          </div>

          {result.stats.warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>{result.stats.warnings.join(" ")}</div>
            </div>
          )}

          {showRaw && (
            <pre className="max-h-36 overflow-auto rounded-xl border border-border bg-muted/40 p-2.5 text-[10px] whitespace-pre-wrap text-muted-foreground">
              {result.rawTextPreview}
            </pre>
          )}

          {/* Quick-Verify Header Fields (editable before apply) */}
          <div className="grid gap-2 rounded-xl border border-sage-line bg-sage-mist/20 p-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Detected Full Name
              </div>
              <Input
                value={result.parsed.name}
                onChange={(e) =>
                  setResult((prev) =>
                    prev ? { ...prev, parsed: { ...prev.parsed, name: e.target.value } } : prev
                  )
                }
                placeholder="Full Name"
                className="h-7 bg-card text-xs"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Detected Job Title
              </div>
              <Input
                value={result.parsed.role}
                onChange={(e) =>
                  setResult((prev) =>
                    prev ? { ...prev, parsed: { ...prev.parsed, role: e.target.value } } : prev
                  )
                }
                placeholder="Target Job Title"
                className="h-7 bg-card text-xs"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Detected Email
              </div>
              <Input
                value={result.parsed.email}
                onChange={(e) =>
                  setResult((prev) =>
                    prev ? { ...prev, parsed: { ...prev.parsed, email: e.target.value } } : prev
                  )
                }
                placeholder="email@example.com"
                className="h-7 bg-card text-xs"
              />
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Detected Location
              </div>
              <Input
                value={result.parsed.location}
                onChange={(e) =>
                  setResult((prev) =>
                    prev ? { ...prev, parsed: { ...prev.parsed, location: e.target.value } } : prev
                  )
                }
                placeholder="City, Country"
                className="h-7 bg-card text-xs"
              />
            </div>
          </div>

          {/* Section-by-Section Diff Selector */}
          <div className="max-h-[270px] space-y-2 overflow-y-auto pr-1">
            {diffRows.map((row) => (
              <label
                key={row.key}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors",
                  selected[row.key] && row.hasData
                    ? "border-primary/60 bg-sage-mist/25"
                    : "border-border bg-card opacity-75"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected[row.key] && row.hasData}
                  disabled={!row.hasData}
                  onChange={() => toggleKey(row.key)}
                  className="mt-0.5 h-3.5 w-3.5 accent-primary"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{row.label}</span>
                    {!row.hasData && (
                      <span className="text-[10px] text-muted-foreground">Nothing detected</span>
                    )}
                  </div>
                  <div className="grid gap-1 text-[11px] sm:grid-cols-2">
                    <div className="truncate text-muted-foreground">
                      <span className="font-medium">Current:</span> {row.currentText || "—"}
                    </div>
                    <div className="truncate text-foreground">
                      <span className="font-medium text-[#33613d]">Imported:</span>{" "}
                      {row.importedText}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Apply / Create New Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => {
                const merged = buildMergedContent();
                const title = result.parsed.name
                  ? `${result.parsed.name} (Imported)`
                  : `Imported Resume (${new Date().toLocaleDateString()})`;
                onCreateNewFromImport(merged, title);
                handleClose(false);
              }}
            >
              <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Create as New Resume
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full text-xs"
              onClick={async () => {
                const merged = buildMergedContent();
                const label = result.stats.fileName || result.stats.sourceType;
                await onApplyToCurrent(merged, label);
                handleClose(false);
              }}
            >
              <Replace className="mr-1.5 h-3.5 w-3.5" /> Apply to Current Resume
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}