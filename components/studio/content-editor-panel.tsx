"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  useStore,
  uid,
  calculateDocScore,
  type Doc,
  type Content,
  type Exp,
  type Edu,
  type CertItem,
} from "@/lib/store";
import {
  PREWRITTEN_PHRASES,
  EXTRA_SECTION_CATALOG,
  WEAK_VERBS,
  PERSONAL_PRONOUNS,
  BUZZWORDS,
} from "@/lib/catalog";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { getBullets } from "@/components/render/series-all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ResponsiveModal } from "@/components/shared";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  Wrench,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  Crown,
  Camera,
  HeartPulse,
  Lock,
  Layers,
  Mail,
  Users,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = ["2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

function inspectBulletQuality(bullets: string[]) {
  const joined = " " + bullets.join(" ").toLowerCase() + " ";
  const hasNumbers = /\d+%|\$\d+|\d+\+/.test(joined);
  const hasWeak = WEAK_VERBS.some((w) => joined.includes(w));
  const hasPronoun = PERSONAL_PRONOUNS.some((p) => joined.includes(p));
  const hasBuzz = BUZZWORDS.some((b) => joined.includes(b));
  return {
    hasNumbers,
    hasWeak,
    hasPronoun,
    hasBuzz,
    passedCount: [hasNumbers, !hasWeak, !hasPronoun, !hasBuzz].filter(Boolean).length,
  };
}

export function ContentEditorPanel({
  doc,
  activeSection,
  onSelectSection,
  onRequestUpgrade,
}: {
  doc: Doc;
  activeSection: string;
  onSelectSection: (s: string) => void;
  onRequestUpgrade: (reason: string) => void;
}) {
  const { updateDoc, user } = useStore();
  const c: Content = doc.content;
  const sId = String(doc.series || doc.template || "11");
  const tplMeta = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[0];
  const vis = (doc.visibility || {}) as Record<string, boolean>;

  const [collapsedAll, setCollapsedAll] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showExtraPersonal, setShowExtraPersonal] = useState(false);
  const [phraseModal, setPhraseModal] = useState<"" | "summary" | "experience">("");
  const [phraseFilter, setPhraseFilter] = useState("All");
  const [activeExpIdxForPhrase, setActiveExpIdxForPhrase] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [previewExtraId, setPreviewExtraId] = useState<string>("Certifications");
  const [newSkill, setNewSkill] = useState("");
  const [newTechSkill, setNewTechSkill] = useState("");

  const calc = calculateDocScore(c);

  const patchContent = (next: Partial<Content>) => {
    updateDoc(doc.id, { content: { ...c, ...next } });
  };

  const setVis = (key: string, val: boolean) => {
    updateDoc(doc.id, { visibility: { ...vis, [key]: val } });
  };

  const toggleSection = (sec: string) => {
    setCollapsedAll(false);
    onSelectSection(activeSection === sec ? "" : sec);
  };

  const isOpen = (sec: string) => !collapsedAll && activeSection === sec;

  const sectionIssues = (sec: string) => calc.issues.filter((i) => i.section === sec);
  const sectionStrengths = (sec: string) => calc.strengths.filter((s) => s.section === sec);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patchContent({ photo: String(reader.result), emblemType: "photo" });
      toast.success("Profile photo updated on template");
    };
    reader.readAsDataURL(file);
  };

  const phraseCategories = ["All", ...Array.from(new Set((PREWRITTEN_PHRASES[phraseModal || "summary"] || []).map((p) => p.role)))];

  return (
    <div className="space-y-3.5">
      {/* 1. RESUME COMPLETENESS & QUICK-BOOST CHIPS (Resume.io Pages 1-2 Pattern) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-bold text-white",
                calc.score >= 80 ? "bg-[#4e8a5a]" : calc.score >= 50 ? "bg-[#b98a4e]" : "bg-[#c05b49]"
              )}
            >
              {calc.score}%
            </span>
            <span className="text-xs font-semibold text-foreground">Resume completeness</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAnalysis((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Toggle inline section analysis"
            >
              {showAnalysis ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {showAnalysis ? "Hide tips" : "Show tips"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCollapsedAll((v) => !v);
                if (!collapsedAll) onSelectSection("");
                else onSelectSection("personal");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
            >
              <ChevronsUpDown className="h-3 w-3" />
              {collapsedAll ? "Expand sections" : "Collapse all sections"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${calc.score}%`,
              backgroundColor: calc.score >= 80 ? "#4e8a5a" : calc.score >= 50 ? "#b98a4e" : "#c05b49",
            }}
          />
        </div>

        {/* Quick-Jump Boost Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { id: "personal", label: "Personal details", boost: "+10%" },
            { id: "summary", label: "Profile summary", boost: "+15%" },
            { id: "experience", label: "Employment history", boost: "+25%" },
            { id: "education", label: "Education", boost: "+15%" },
            { id: "skills", label: "Core skills", boost: "+10%" },
            { id: "certifications", label: "Certifications", boost: "+10%" },
          ].map((chip) => {
            const active = isOpen(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setCollapsedAll(false);
                  onSelectSection(chip.id);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-sage-mist/40"
                )}
              >
                <span
                  className={cn(
                    "rounded px-1 py-0.2 text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-[#e6f0e8] text-[#33613d]"
                  )}
                >
                  {chip.boost}
                </span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PERSONAL DETAILS SECTION */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("personal")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                Personal Details
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+10%</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {c.name} · {c.role}
              </div>
            </div>
          </div>
          {isOpen("personal") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("personal") && (
          <div className="space-y-4 border-t border-border p-4">
            {/* Kickresume Section Analysis Mini-Card */}
            {showAnalysis && (sectionStrengths("personal").length > 0 || sectionIssues("personal").length > 0) && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Section Analysis</div>
                {sectionStrengths("personal").map((st, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#e6f0e8]/70 px-2.5 py-1.5 text-xs text-[#285030]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{st.message}</span>
                  </div>
                ))}
                {sectionIssues("personal").map((is, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#f7e4de]/80 px-2.5 py-1.5 text-xs text-[#8a4436]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{is.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Template-Aware Photo / Emblem Bar (Resume.io Page 2 + Template & 24) */}
            {sId === "22" ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-sage-line bg-sage-mist/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Template Circular Portrait (38mm)</div>
                    <div className="text-[11px] text-muted-foreground">Overlaps the double header rule on the right</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  {c.photo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-full text-xs text-destructive"
                      onClick={() => patchContent({ photo: undefined })}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ) : sId === "24" ? (
              <div className="space-y-2 rounded-xl border border-sage-line bg-sage-mist/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    Template Header Emblem / Photo
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px]">Top-Left Header Mark</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: "heart-ecg", label: "Heart-ECG Emblem (Default)" },
                    { id: "monogram", label: "Initials Monogram" },
                    { id: "photo", label: "Upload Photo" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => patchContent({ emblemType: opt.id as any })}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                        (c.emblemType || "heart-ecg") === opt.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {c.emblemType === "photo" && (
                  <div className="pt-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted">
                      <Camera className="h-3.5 w-3.5" /> Choose image file
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              /* Resume.io Page 2 Disabled Photo Notice for Non-Photo Templates */
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">This template doesn&apos;t use a photo upload</div>
                    <div className="text-[11px] text-muted-foreground">Series {sId} is engineered for photo-free ATS compliance.</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full text-[11px]"
                  onClick={() => {
                    updateDoc(doc.id, { template: "22", series: "22" });
                    toast.success("Switched to Template (Photo Column)");
                  }}
                >
                  Use Photo Template 
                </Button>
              </div>
            )}

            {/* Split First Name / Last Name (Powers Template & Template Two-Tone Names Automatically!) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  First Name {(sId === "4" || sId === "14") && <span className="text-[10px] text-muted-foreground">(Tone 1)</span>}
                </label>
                <Input
                  value={c.firstName ?? c.name.split(" ")[0] ?? ""}
                  onChange={(e) => {
                    const fn = e.target.value;
                    const ln = c.lastName ?? c.name.split(" ").slice(1).join(" ");
                    patchContent({ firstName: fn, lastName: ln, name: `${fn} ${ln}`.trim() });
                  }}
                  placeholder="e.g. Viana"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Last Name {(sId === "4" || sId === "14") && <span className="text-[10px] text-muted-foreground">(Tone 2 Accent)</span>}
                </label>
                <Input
                  value={c.lastName ?? c.name.split(" ").slice(1).join(" ") ?? ""}
                  onChange={(e) => {
                    const ln = e.target.value;
                    const fn = c.firstName ?? c.name.split(" ")[0] ?? "";
                    patchContent({ firstName: fn, lastName: ln, name: `${fn} ${ln}`.trim() });
                  }}
                  placeholder="e.g. Fariqi"
                />
              </div>
            </div>

            {/* Target Job Title */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Target Job Title *</label>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={vis.title !== false}
                    onChange={(e) => setVis("title", e.target.checked)}
                    className="accent-primary"
                  />
                  Show on resume
                </label>
              </div>
              <Input
                value={c.role}
                onChange={(e) => patchContent({ role: e.target.value })}
                placeholder="e.g. Senior Product Designer, Registered Nurse"
              />
            </div>

            {/* Contact Grid with Teal/Rezi Show/Hide Toggles */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium">Email Address</label>
                  <input
                    type="checkbox"
                    checked={vis.email !== false}
                    onChange={(e) => setVis("email", e.target.checked)}
                    className="accent-primary"
                    title="Show email on resume"
                  />
                </div>
                <Input value={c.email} onChange={(e) => patchContent({ email: e.target.value })} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium">Phone Number</label>
                  <input
                    type="checkbox"
                    checked={vis.phone !== false}
                    onChange={(e) => setVis("phone", e.target.checked)}
                    className="accent-primary"
                    title="Show phone on resume"
                  />
                </div>
                <Input value={c.phone} onChange={(e) => patchContent({ phone: e.target.value })} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium">LinkedIn / Portfolio</label>
                  <input
                    type="checkbox"
                    checked={vis.link !== false}
                    onChange={(e) => setVis("link", e.target.checked)}
                    className="accent-primary"
                    title="Show link on resume"
                  />
                </div>
                <Input
                  value={c.linkedin || ""}
                  onChange={(e) => patchContent({ linkedin: e.target.value })}
                  placeholder="Linkedin.com/in/yourname"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium">City, State / Country</label>
                  <input
                    type="checkbox"
                    checked={vis.location !== false}
                    onChange={(e) => setVis("location", e.target.checked)}
                    className="accent-primary"
                    title="Show location on resume"
                  />
                </div>
                <Input value={c.location} onChange={(e) => patchContent({ location: e.target.value })} />
              </div>
            </div>

            {/* Expandable Additional Personal Details (Resume.io Page 4 / Kickresume Page 4) */}
            <div>
              <button
                type="button"
                onClick={() => setShowExtraPersonal((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {showExtraPersonal ? "Hide additional details" : "Add more details (Website, Nationality, Birth Date)"}
                {showExtraPersonal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showExtraPersonal && (
                <div className="mt-3 grid gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Personal Website</label>
                    <Input
                      value={c.website || ""}
                      onChange={(e) => patchContent({ website: e.target.value })}
                      placeholder="yourportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Nationality</label>
                    <Input
                      value={c.nationality || ""}
                      onChange={(e) => patchContent({ nationality: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Driving License / Mobility</label>
                    <Input
                      value={c.drivingLicense || ""}
                      onChange={(e) => patchContent({ drivingLicense: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. PROFESSIONAL SUMMARY SECTION (Resume.io Page 5 + Rezi Page 10 + Zety Phrases) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("summary")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {sId === "14" ? "Professional Profile" : "Professional Summary"}
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+15%</span>
              </div>
              <div className="line-clamp-1 text-[11px] text-muted-foreground">
                {c.summary || "Write 2–4 energetic sentences highlighting your impact"}
              </div>
            </div>
          </div>
          {isOpen("summary") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("summary") && (
          <div className="space-y-3 border-t border-border p-4">
            {showAnalysis && (sectionStrengths("summary").length > 0 || sectionIssues("summary").length > 0) && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                {sectionStrengths("summary").map((st, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#e6f0e8]/70 px-2.5 py-1.5 text-xs text-[#285030]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{st.message}</span>
                  </div>
                ))}
                {sectionIssues("summary").map((is, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#f7e4de]/80 px-2.5 py-1.5 text-xs text-[#8a4436]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{is.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Toolbar above Textarea */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full text-xs"
                  onClick={() => setPhraseModal("summary")}
                >
                  <BookOpen className="mr-1.5 h-3.5 w-3.5 text-primary" /> Pre-written phrases
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-full bg-primary text-xs text-primary-foreground"
                  onClick={() => {
                    const roleMatch = PREWRITTEN_PHRASES.summary.find((p) =>
                      p.role.toLowerCase().includes((c.role || "").toLowerCase().split(" ")[0])
                    ) || PREWRITTEN_PHRASES.summary[0];
                    patchContent({ summary: roleMatch.text });
                    toast.success("AI Summary generated for your target role");
                  }}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Write with AI
                </Button>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={vis.summary !== false}
                  onChange={(e) => setVis("summary", e.target.checked)}
                  className="accent-primary"
                />
                Visible
              </label>
            </div>

            <Textarea
              rows={5}
              value={c.summary}
              onChange={(e) => patchContent({ summary: e.target.value })}
              placeholder="Showcase your top accomplishments upfront, quantifying impacts with metrics..."
            />

            {/* Resume.io Page 5 Recruiter Tip & Character Counter */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Recruiter tip: write 300–550 characters to increase interview chances</span>
              <span className={cn("font-medium", (c.summary?.length || 0) >= 250 ? "text-[#33613d]" : "text-muted-foreground")}>
                {c.summary?.length || 0} / 400+
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. WORK EXPERIENCE SECTION (Rezi Bullet Checks + Enhancv Month/Year Picker + Role Overview) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("experience")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                Professional Experience
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+25%</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {(c.experience || []).length} positions · Reverse chronological
              </div>
            </div>
          </div>
          {isOpen("experience") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("experience") && (
          <div className="space-y-4 border-t border-border p-4">
            {showAnalysis && (sectionStrengths("experience").length > 0 || sectionIssues("experience").length > 0) && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                {sectionStrengths("experience").map((st, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#e6f0e8]/70 px-2.5 py-1.5 text-xs text-[#285030]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{st.message}</span>
                  </div>
                ))}
                {sectionIssues("experience").map((is, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#f7e4de]/80 px-2.5 py-1.5 text-xs text-[#8a4436]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{is.message}</span>
                  </div>
                ))}
              </div>
            )}

            {(c.experience || []).map((exp, idx) => {
              const bullets = getBullets(exp);
              const qCheck = inspectBulletQuality(bullets);

              const updateExp = (patchExp: Partial<Exp>) => {
                const next = [...c.experience];
                next[idx] = { ...exp, ...patchExp };
                patchContent({ experience: next });
              };

              return (
                <div
                  key={exp.id || idx}
                  className={cn(
                    "space-y-3 rounded-xl border p-3.5 transition-all",
                    exp.hidden ? "border-dashed border-border bg-muted/20 opacity-60" : "border-border bg-background"
                  )}
                >
                  {/* Card Header: Position # + Move Up/Down + Hide from Resume (Rezi Page 5) + Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div className="text-xs font-semibold text-foreground">
                      {exp.role || `Position #${idx + 1}`}
                      <span className="ml-1.5 font-normal text-muted-foreground">· {exp.company}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="mr-2 flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={!exp.hidden}
                          onChange={(e) => updateExp({ hidden: !e.target.checked })}
                          className="accent-primary"
                        />
                        Show
                      </label>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...c.experience];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          patchContent({ experience: next });
                        }}
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={idx === c.experience.length - 1}
                        onClick={() => {
                          const next = [...c.experience];
                          [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                          patchContent({ experience: next });
                        }}
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          patchContent({ experience: c.experience.filter((_, i) => i !== idx) });
                        }}
                        title="Delete role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Role / Company / Period with Interactive Month-Year Picker */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Job Title *</label>
                      <Input
                        value={exp.role}
                        onChange={(e) => updateExp({ role: e.target.value })}
                        placeholder="e.g. Senior Product Designer"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Company & Location *</label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExp({ company: e.target.value })}
                        placeholder="e.g. Company Name / New York, NY"
                      />
                    </div>
                  </div>

                  {/* Date Period + Interactive Picker (Enhancv Page 21 / Kickresume Page 22) */}
                  <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[11px] font-medium">Date Period</label>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(exp.showOverview)}
                            onChange={(e) =>
                              updateExp({
                                showOverview: e.target.checked,
                                overview:
                                  exp.overview ||
                                  "Brief role overview highlighting scope, team size, and primary mandate.",
                              })
                            }
                            className="accent-primary"
                          />
                          Include Role Overview paragraph
                        </label>
                        <button
                          type="button"
                          onClick={() => setDatePickerOpen(datePickerOpen === exp.id ? null : exp.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-primary hover:bg-sage-mist/50"
                        >
                          <Calendar className="h-3 w-3" /> Quick Date Picker
                        </button>
                      </div>
                    </div>
                    <Input
                      value={exp.period}
                      onChange={(e) => updateExp({ period: e.target.value })}
                      placeholder="e.g. Jan 2023 – Present"
                      className="mt-1"
                    />

                    {datePickerOpen === exp.id && (
                      <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                          <span>Select Start Year & Month</span>
                          <button
                            type="button"
                            onClick={() => setDatePickerOpen(null)}
                            className="text-[11px] text-primary hover:underline"
                          >
                            Done
                          </button>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {YEARS.map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => updateExp({ period: `Jan ${yr} – Present` })}
                              className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-sage-mist"
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {MONTHS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                updateExp({ period: `${m} 2024 – Present` });
                                setDatePickerOpen(null);
                              }}
                              className="rounded bg-muted/60 py-1 text-[11px] hover:bg-primary hover:text-primary-foreground"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Role Overview Paragraph (Template, 3, 4, 11, 12, 24) */}
                  {exp.showOverview && (
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                        Role Overview Paragraph (Appears above bullet points)
                      </label>
                      <Textarea
                        rows={2}
                        value={exp.overview || ""}
                        onChange={(e) => updateExp({ overview: e.target.value })}
                        placeholder="Summarize the role, team scale, or promotion context..."
                      />
                    </div>
                  )}

                  {/* Bullet Points + Rezi "+ COMPLETE BULLET" & Zety Phrase Picker */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[11px] font-medium">Achievement Bullet Points</label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 rounded-full px-2.5 text-[11px]"
                          onClick={() => {
                            setActiveExpIdxForPhrase(idx);
                            setPhraseModal("experience");
                          }}
                        >
                          <BookOpen className="mr-1 h-3 w-3 text-primary" /> Add pre-written bullet
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 rounded-full bg-primary px-2.5 text-[11px] text-primary-foreground"
                          onClick={() => {
                            const pool = PREWRITTEN_PHRASES.experience;
                            const pick = pool[(bullets.length + idx) % pool.length].text;
                            const nextBullets = [...bullets, pick];
                            updateExp({
                              bullets: nextBullets,
                              description: nextBullets.map((b) => `• ${b}`).join("\n"),
                            });
                            toast.success("Quantified AI bullet added");
                          }}
                        >
                          <Sparkles className="mr-1 h-3 w-3" /> + Complete Bullet
                        </Button>
                      </div>
                    </div>

                    {bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <span className="mt-2 text-xs font-bold text-primary">•</span>
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const nextB = [...bullets];
                            nextB[bIdx] = e.target.value;
                            updateExp({
                              bullets: nextB,
                              description: nextB.map((x) => `• ${x}`).join("\n"),
                            });
                          }}
                          className="min-h-[52px] text-xs"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="mt-1 h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const nextB = bullets.filter((_, i) => i !== bIdx);
                            updateExp({
                              bullets: nextB,
                              description: nextB.map((x) => `• ${x}`).join("\n"),
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-full rounded-xl border-dashed text-xs"
                      onClick={() => {
                        const nextB = [...bullets, "Spearheaded cross-functional initiative resulting in measurable efficiency gains."];
                        updateExp({
                          bullets: nextB,
                          description: nextB.map((x) => `• ${x}`).join("\n"),
                        });
                      }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add bullet point
                    </Button>
                  </div>

                  {/* Rezi Page 4 Best-Practice Micro-Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", qCheck.hasNumbers ? "bg-[#e6f0e8] text-[#33613d]" : "bg-muted text-muted-foreground")}>
                      {qCheck.hasNumbers ? "âœ“ Quantified metrics" : "• Add % or numbers"}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", !qCheck.hasWeak ? "bg-[#e6f0e8] text-[#33613d]" : "bg-[#f7e4de] text-[#8a4436]")}>
                      {!qCheck.hasWeak ? "âœ“ Strong action verbs" : "! Weak verb detected"}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", !qCheck.hasPronoun ? "bg-[#e6f0e8] text-[#33613d]" : "bg-[#f7e4de] text-[#8a4436]")}>
                      {!qCheck.hasPronoun ? "âœ“ No personal pronouns" : "! Remove 'I / my'"}
                    </span>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={() => {
                const newRole: Exp = {
                  id: uid(),
                  role: "ENTER YOUR JOB TITLE HERE",
                  company: "Company Name / Location",
                  period: "Jan 2024 – Present",
                  showOverview: false,
                  bullets: [
                    "Delivered measurable impact by optimizing core processes and collaborating across teams.",
                  ],
                  description: "• Delivered measurable impact by optimizing core processes and collaborating across teams.",
                };
                patchContent({ experience: [...(c.experience || []), newRole] });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add another work experience
            </Button>
          </div>
        )}
      </div>

      {/* 5. EDUCATION SECTION */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("education")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {sId === "14" ? "Professional Development & Education" : "Education"}
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+15%</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {(c.education || []).length} entries
              </div>
            </div>
          </div>
          {isOpen("education") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("education") && (
          <div className="space-y-3 border-t border-border p-4">
            {(c.education || []).map((ed, idx) => (
              <div key={ed.id || idx} className="space-y-2.5 rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{ed.degree || `Education #${idx + 1}`}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => patchContent({ education: c.education.filter((_, i) => i !== idx) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-medium">Degree / Course *</label>
                    <Input
                      value={ed.degree}
                      onChange={(e) => {
                        const next = [...c.education];
                        next[idx] = { ...ed, degree: e.target.value };
                        patchContent({ education: next });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-medium">School / University *</label>
                    <Input
                      value={ed.school}
                      onChange={(e) => {
                        const next = [...c.education];
                        next[idx] = { ...ed, school: e.target.value };
                        patchContent({ education: next });
                      }}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-medium">Graduation Year / Date</label>
                    <Input
                      value={ed.period}
                      onChange={(e) => {
                        const next = [...c.education];
                        next[idx] = { ...ed, period: e.target.value };
                        patchContent({ education: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={() =>
                patchContent({
                  education: [
                    ...(c.education || []),
                    { id: uid(), degree: "DEGREE TITLE", school: "University Name - Location", period: "2026" },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add education
            </Button>
          </div>
        )}
      </div>

      {/* 6. CERTIFICATIONS & LICENSES SECTION (Template, 4, 11, 12, 24 Clinical Licenses) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("certifications")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                Certifications & Licenses
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+10%</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {(c.certifications || []).length} credentials (Directly rendered on Template, 4, 11, 12, 24)
              </div>
            </div>
          </div>
          {isOpen("certifications") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("certifications") && (
          <div className="space-y-3 border-t border-border p-4">
            {(c.certifications || []).map((ct, idx) => (
              <div key={ct.id || idx} className="space-y-2.5 rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{ct.name || `Certification #${idx + 1}`}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      patchContent({
                        certifications: (c.certifications || []).filter((_, i) => i !== idx),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Certification / License Name</label>
                    <Input
                      value={ct.name}
                      onChange={(e) => {
                        const next = [...(c.certifications || [])];
                        next[idx] = { ...ct, name: e.target.value };
                        patchContent({ certifications: next });
                      }}
                      placeholder="e.g. BLS — Basic Life Support, PMP"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Issuing Organization / State</label>
                    <Input
                      value={ct.issuer}
                      onChange={(e) => {
                        const next = [...(c.certifications || [])];
                        next[idx] = { ...ct, issuer: e.target.value };
                        patchContent({ certifications: next });
                      }}
                      placeholder="e.g. American Heart Association"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">Year Earned / Expiration Date</label>
                    <Input
                      value={ct.date}
                      onChange={(e) => {
                        const next = [...(c.certifications || [])];
                        next[idx] = { ...ct, date: e.target.value };
                        patchContent({ certifications: next });
                      }}
                      placeholder="e.g. Expires July 2030"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium">License # / Credential Code (Optional)</label>
                    <Input
                      value={ct.code || ""}
                      onChange={(e) => {
                        const next = [...(c.certifications || [])];
                        next[idx] = { ...ct, code: e.target.value };
                        patchContent({ certifications: next });
                      }}
                      placeholder="e.g. License #222222"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={() =>
                patchContent({
                  certifications: [
                    ...(c.certifications || []),
                    { id: uid(), name: "CERTIFICATION NAME", issuer: "Issuing Organization", date: "2026" },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add certification or license
            </Button>
          </div>
        )}
      </div>

      {/* 7. ADAPTIVE SKILLS & AREAS OF EXPERTISE SECTION */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("skills")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {sId === "11" || sId === "12" ? "Areas of Expertise & Skills" : "Professional & Technical Skills"}
                <span className="rounded bg-[#e6f0e8] px-1.5 py-0.5 text-[10px] font-semibold text-[#33613d]">+10%</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {(c.skills || []).length} professional · {(c.technicalSkills || []).length} technical
              </div>
            </div>
          </div>
          {isOpen("skills") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("skills") && (
          <div className="space-y-4 border-t border-border p-4">
            {/* Group 1: Professional Skills / Areas of Expertise */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                {sId === "11" || sId === "12" ? "Areas of Expertise (Dash-separated under Summary)" : "Professional Skills"}
              </label>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {(c.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => patchContent({ skills: c.skills.filter((_, i) => i !== idx) })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSkill.trim()) {
                      e.preventDefault();
                      patchContent({ skills: [...(c.skills || []), newSkill.trim()] });
                      setNewSkill("");
                    }
                  }}
                  placeholder="Type a skill and press Enter (e.g. Strategic Leadership)..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!newSkill.trim()) return;
                    patchContent({ skills: [...(c.skills || []), newSkill.trim()] });
                    setNewSkill("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Group 2: Technical Skills (Highlighted for Template & Template) */}
            <div className="border-t border-border pt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold">
                  Technical Skills & Tools {(sId === "2" || sId === "14") && <Badge variant="secondary" className="ml-1 text-[10px]">Rendered in • TECHNICAL</Badge>}
                </label>
              </div>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {(c.technicalSkills || []).map((tsk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sage-line bg-sage-mist/40 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {tsk}
                    <button
                      type="button"
                      onClick={() =>
                        patchContent({
                          technicalSkills: (c.technicalSkills || []).filter((_, i) => i !== idx),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTechSkill}
                  onChange={(e) => setNewTechSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTechSkill.trim()) {
                      e.preventDefault();
                      patchContent({
                        technicalSkills: [...(c.technicalSkills || []), newTechSkill.trim()],
                      });
                      setNewTechSkill("");
                    }
                  }}
                  placeholder="Add tool or software (e.g. Figma, Python, Epic EHR, SEO)..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!newTechSkill.trim()) return;
                    patchContent({
                      technicalSkills: [...(c.technicalSkills || []), newTechSkill.trim()],
                    });
                    setNewTechSkill("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADDED EXTRA SECTIONS (Projects, Languages, Awards, Volunteering, etc.) */}
      {(c.extras || []).map((secName) => (
        <div key={secName} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex w-full items-center justify-between px-4 py-3 text-left">
            <button
              type="button"
              onClick={() => toggleSection(`extra:${secName}`)}
              className="flex flex-1 items-center gap-2.5 text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{secName}</div>
                <div className="text-[11px] text-muted-foreground">Custom section · Rendered live on resume</div>
              </div>
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive"
              onClick={() => {
                patchContent({ extras: (c.extras || []).filter((x) => x !== secName) });
                toast.success(`Removed ${secName} section`);
              }}
              title="Remove section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {isOpen(`extra:${secName}`) && (
            <div className="space-y-2 border-t border-border p-4">
              <label className="block text-xs font-medium">
                {secName} Entries (One bullet point per line)
              </label>
              <Textarea
                rows={4}
                value={c.extraDetails?.[secName] || ""}
                onChange={(e) =>
                  patchContent({
                    extraDetails: { ...(c.extraDetails || {}), [secName]: e.target.value },
                  })
                }
                placeholder={`Enter ${secName} items (one per line)...`}
              />
            </div>
          )}
        </div>
      ))}

      {/* 8. MATCHING COVER LETTER & REFERENCES QUICK ACCORDION */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("suite")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Matching Cover Letter & References Sheet</div>
              <div className="text-[11px] text-muted-foreground">
                Included in Series {sId} package · Edit recipient, cover letter body & 3 references
              </div>
            </div>
          </div>
          {isOpen("suite") ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {isOpen("suite") && (
          <div className="space-y-3 border-t border-border p-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium">Recipient Name / Title</label>
                <Input
                  value={c.letter?.to || ""}
                  onChange={(e) => patchContent({ letter: { ...c.letter, to: e.target.value } })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium">Target Company</label>
                <Input
                  value={c.letter?.company || ""}
                  onChange={(e) => patchContent({ letter: { ...c.letter, company: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium">Subject Line</label>
              <Input
                value={c.letter?.subject || ""}
                onChange={(e) => patchContent({ letter: { ...c.letter, subject: e.target.value } })}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium">Cover Letter Body</label>
              <Textarea
                rows={5}
                value={c.letter?.body || ""}
                onChange={(e) => patchContent({ letter: { ...c.letter, body: e.target.value } })}
              />
            </div>
          </div>
        )}
      </div>

      {/* 9. KICKRESUME / RESUME.IO VISUAL "+ ADD NEW SECTION" TRIGGER */}
      <button
        type="button"
        onClick={() => setAddSectionOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-sage-line bg-card/60 px-4 py-3.5 text-left transition-colors hover:border-primary hover:bg-sage-mist/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-mist text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">+ Add New Section</div>
            <div className="text-[11px] text-muted-foreground">
              Projects, Languages, Awards, Publications, Volunteering, Custom...
            </div>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full text-[11px]">Preview All Sections</Badge>
      </button>

      {/* PRE-WRITTEN PHRASES MODAL (Zety + Resume.io Pattern) */}
      <ResponsiveModal
        open={Boolean(phraseModal)}
        onOpenChange={(v) => !v && setPhraseModal("")}
        title={phraseModal === "summary" ? "Pre-Written Summary Examples" : "Pre-Written Achievement Bullets"}
        description="Click any recruiter-approved phrase to insert it directly into your resume."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {phraseCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPhraseFilter(cat)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  phraseFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {(PREWRITTEN_PHRASES[phraseModal || "summary"] || [])
              .filter((p) => phraseFilter === "All" || p.role === phraseFilter)
              .map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (phraseModal === "summary") {
                      patchContent({ summary: item.text });
                      toast.success("Summary phrase inserted");
                    } else {
                      const targetExp = c.experience[activeExpIdxForPhrase] || c.experience[0];
                      if (targetExp) {
                        const nextB = [...getBullets(targetExp), item.text];
                        const nextExp = [...c.experience];
                        nextExp[activeExpIdxForPhrase] = {
                          ...targetExp,
                          bullets: nextB,
                          description: nextB.map((x) => `• ${x}`).join("\n"),
                        };
                        patchContent({ experience: nextExp });
                        toast.success("Bullet added to experience");
                      }
                    }
                    setPhraseModal("");
                  }}
                  className="group block w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary hover:bg-sage-mist/30"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full text-[10px]">{item.role}</Badge>
                    <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100">+ Insert</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{item.text}</p>
                </button>
              ))}
          </div>
        </div>
      </ResponsiveModal>

      {/* KICKRESUME VISUAL "+ ADD NEW SECTION" MODAL (Pages 14-19 Pattern) */}
      <ResponsiveModal
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        title="Select a section to add"
        description="Preview how each section structures your credentials. Pro sections carry a crown badge."
      >
        <div className="grid gap-4 md:grid-cols-12">
          <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1 md:col-span-5">
            {EXTRA_SECTION_CATALOG.map((sec) => {
              const active = previewExtraId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setPreviewExtraId(sec.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                    active ? "bg-sage-mist text-primary" : "hover:bg-muted"
                  )}
                >
                  <span>{sec.title}</span>
                  {sec.pro ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                      <Crown className="h-2.5 w-2.5" /> PRO
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">FREE</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/30 p-4 md:col-span-7">
            {(() => {
              const meta = EXTRA_SECTION_CATALOG.find((s) => s.id === previewExtraId) || EXTRA_SECTION_CATALOG[0];
              return (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold">{meta.title}</h4>
                      {meta.pro ? (
                        <Badge className="rounded-full bg-accent text-accent-foreground">PRO Section</Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full">Free · ATS Safe</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>

                    <div className="mt-4 rounded-xl border border-border bg-white p-3.5 shadow-xs">
                      <div className="border-b border-border pb-1 text-[11px] font-bold uppercase tracking-wider text-[#202124]">
                        {meta.title}
                      </div>
                      <ul className="mt-2 space-y-1.5 pl-4 text-xs text-[#333] list-disc">
                        {meta.previewLines.map((line, li) => (
                          <li key={li}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" className="rounded-full" onClick={() => setAddSectionOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="rounded-full"
                      onClick={() => {
                        if (meta.pro && user.plan !== "Pro") {
                          setAddSectionOpen(false);
                          onRequestUpgrade(`${meta.title} is a Pro Studio section.`);
                          return;
                        }
                        if (meta.id === "Certifications") {
                          setAddSectionOpen(false);
                          onSelectSection("certifications");
                          return;
                        }
                        const nextExtras = Array.from(new Set([...(c.extras || []), meta.id]));
                        const nextDetails = {
                          ...(c.extraDetails || {}),
                          [meta.id]: (c.extraDetails?.[meta.id] || meta.previewLines.join("\n")),
                        };
                        patchContent({ extras: nextExtras, extraDetails: nextDetails });
                        toast.success(`${meta.title} section added`);
                        setAddSectionOpen(false);
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add {meta.title}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}