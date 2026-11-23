"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { FREE_CHECKS, LOCKED_CHECKS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, ScoreRing, GradientPanel, Field, DangerConfirm } from "@/components/shared";
import { Upload, Lock, CheckCircle2, Sparkles, FileSearch, AlertCircle, Plus, FileText, Trash2, X } from "lucide-react";

const STOP_WORDS = new Set(["with","from","that","this","your","have","will","work","team","role","experience","years","looking","strong","skills","about","their","what","when","where","which","while","within","would","could","should","into","more","most","other","some","such","than","then","them","these","they","through","under","until","very","were","been","being","both","each","even","make","made","many","must","need","only","over","same","take","well","also","back","good","high","just","know","like","long","next","open","part","plus","join","help","able"]);

export default function Checker() {
  const router = useRouter();
  const { docs, updateDoc, addDoc, removeDoc } = useStore();
  const resumes = useMemo(() => docs.filter((d) => d.type === "resume" || d.type === "tailored"), [docs]);
  const [selectedId, setSelectedId] = useState(resumes[0]?.id ?? "");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; docId: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(true);
  const [jd, setJd] = useState("We are looking for a Senior Product Designer with strong Figma, Design Systems, Prototyping, User Research, SaaS, B2B, and Accessibility experience to partner with engineering.");
  const [checks, setChecks] = useState(FREE_CHECKS.map(() => true));
  const [reports, setReports] = useState<{ id: string; docId?: string; title: string; date: string; score: number }[]>([
    { id: "r1", docId: "d1", title: "Product Designer Resume", date: "Nov 10, 2026", score: 84 },
    { id: "r2", docId: "d2", title: "Telgorithm — Marketing Manager", date: "Nov 11, 2026", score: 82 },
  ]);

  const activeDoc = resumes.find((d) => d.id === selectedId) ?? resumes[0];
  const isUploadedDoc = !!activeDoc && (activeDoc.label === "Uploaded" || activeDoc.title.includes("(Uploaded)") || uploadedFile?.docId === activeDoc.id);

  const analysis = useMemo(() => {
    if (!activeDoc) return { total: 75, design: 85, structure: 88, contentScore: 60, matched: [] as string[], missing: [] as string[], hasMetrics: false };
    const c = activeDoc.content;
    const resumeText = `${c.role} ${c.summary} ${c.skills.join(" ")} ${c.experience.map((e) => `${e.role} ${e.description}`).join(" ")}`.toLowerCase();

    const rawTokens = jd.match(/\b[A-Za-z][A-Za-z0-9+#/-]{2,16}\b/g) ?? [];
    const uniqueKeywords = Array.from(new Set(rawTokens.map((w) => w.trim()).filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase())))).slice(0, 14);

    const matched = uniqueKeywords.filter((k) => resumeText.includes(k.toLowerCase()));
    const missing = uniqueKeywords.filter((k) => !resumeText.includes(k.toLowerCase())).slice(0, 8);

    const hasMetrics = /\d+%|\$\d+|\+\d+|\d+\+/.test(resumeText);
    const design = activeDoc.template.includes("ats") || activeDoc.template === "classic" ? 92 : 84;
    const structure = Math.min(100, 40 + (c.experience.length ? 25 : 0) + (c.education.length ? 15 : 0) + (c.skills.length >= 4 ? 20 : 10));
    const kwRatio = uniqueKeywords.length ? matched.length / uniqueKeywords.length : 0.7;
    const contentScore = Math.min(98, Math.round(35 + kwRatio * 45 + (hasMetrics ? 18 : 0)));
    const total = Math.round(design * 0.25 + structure * 0.3 + contentScore * 0.45);

    return { total, design, structure, contentScore, matched, missing, hasMetrics };
  }, [activeDoc, jd]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.max(1, Math.round(file.size / 1024));
    const cleanTitle = file.name.replace(/\.[^.]+$/, "");

    let extraSkills: string[] = [];
    if (file.name.endsWith(".txt")) {
      try {
        const text = await file.text();
        const found = text.match(/\b(Figma|React|TypeScript|Python|SQL|SaaS|B2B|Research|Prototyping|Marketing|Leadership)\b/gi) ?? [];
        extraSkills = Array.from(new Set(found));
      } catch (err) { console.warn("[page]", err); }
    }

    const newDoc = addDoc("resume", `${cleanTitle} (Uploaded)`, {
      score: 86,
      label: "Uploaded",
    });
    if (extraSkills.length > 0) {
      updateDoc(newDoc.id, {
        content: { ...newDoc.content, skills: Array.from(new Set([...newDoc.content.skills, ...extraSkills])) },
      });
    }

    setUploadedFile({ name: file.name, size: `${sizeKB} KB`, docId: newDoc.id });
    setSelectedId(newDoc.id);
    setAnalyzed(true);
    setReports((prev) => [{ id: String(Date.now()), docId: newDoc.id, title: file.name, date: "Uploaded just now", score: 86 }, ...prev]);
    toast.success(`"${file.name}" uploaded and analyzed!`);
    e.target.value = "";
  };

  const handleDeleteResume = (docId: string) => {
    const target = resumes.find((r) => r.id === docId);
    const remaining = resumes.filter((r) => r.id !== docId);
    removeDoc(docId);
    if (uploadedFile?.docId === docId) setUploadedFile(null);
    setReports((prev) => prev.filter((r) => r.docId !== docId && r.title !== target?.title));
    setSelectedId(remaining[0]?.id ?? "");
    setConfirmDeleteId(null);
    toast.success(`"${target?.title ?? "Resume"}" permanently deleted`);
  };

  const runAnalysis = () => {
    setAnalyzed(true);
    setReports([{ id: String(Date.now()), docId: activeDoc?.id, title: `${activeDoc?.title ?? "Resume"} (${analysis.matched.length} keywords)`, date: "Just now", score: analysis.total }, ...reports]);
    toast.success(`ATS analysis complete — Score: ${analysis.total}/100`);
  };

  const addMissingToResume = () => {
    if (!activeDoc || !analysis.missing.length) return;
    const updatedSkills = Array.from(new Set([...activeDoc.content.skills, ...analysis.missing.slice(0, 5)]));
    updateDoc(activeDoc.id, {
      content: { ...activeDoc.content, skills: updatedSkills },
      score: Math.min(100, analysis.total + 10),
    });
    toast.success(`Added ${Math.min(5, analysis.missing.length)} missing keywords to ${activeDoc.title}`);
  };

  const subs = [
    ["Design & ATS readability", analysis.design],
    ["Section structure", analysis.structure],
    ["Keyword & impact match", analysis.contentScore],
  ] as const;

  return (
    <div>
      <PageHeader title="ATS Checker" sub="Compare your resume against any job description in real time." actions={
        <Button className="rounded-full" onClick={() => { setAnalyzed(false); setJd(""); }}><Upload className="mr-1 h-4 w-4" />New check</Button>} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-xl">Check against a job</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select a resume or upload a file, then paste the job ad.</p>
            </div>

            <Field label="Select resume">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Select value={activeDoc?.id ?? ""} onValueChange={(id) => {
                    setSelectedId(id);
                    if (uploadedFile && uploadedFile.docId !== id) setUploadedFile(null);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choose a resume" /></SelectTrigger>
                    <SelectContent>
                      {resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {activeDoc && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDeleteId(activeDoc.id)}
                    title="Delete selected resume"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Field>

            {/* Uploaded Resume Card with Direct Delete & Replace Actions */}
            {isUploadedDoc && activeDoc ? (
              <div className="rounded-xl border border-primary/40 bg-sage-mist/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-foreground">{uploadedFile?.name ?? activeDoc.title}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-primary">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>Uploaded resume{uploadedFile?.size ? ` · ${uploadedFile.size}` : ""}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 rounded-full px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDeleteId(activeDoc.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Delete file
                  </Button>
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-sage-line bg-card/70 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                  <Upload className="h-3.5 w-3.5 text-primary" />Upload a different file
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-sage-line bg-sage-mist/25 p-4 text-center text-sm text-muted-foreground transition-colors hover:bg-sage-mist/60">
                <Upload className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Upload a resume file (PDF / DOCX / TXT)</span>
                <span className="text-xs">Click to browse from your computer</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
              </label>
            )}

            <Field label="Job description">
              <Textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description or requirements…" />
            </Field>

            <Button className="w-full rounded-full" disabled={!jd.trim() || !activeDoc} onClick={runAnalysis}>
              <FileSearch className="mr-1 h-4 w-4" />Analyze match
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl">My reports</h2>
            <div className="mt-3 divide-y divide-border">
              {reports.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No saved reports yet.</p>
              ) : reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.date}</div></div>
                  <span className="rounded-full bg-sage-mist px-2.5 py-0.5 text-xs font-semibold text-primary">{r.score}</span>
                  <button
                    type="button"
                    onClick={() => { setReports((prev) => prev.filter((x) => x.id !== r.id)); toast.success("Report removed"); }}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    title="Delete report"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-3">
          {analyzed && activeDoc ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="shrink-0 text-muted-foreground">Active resume:</span>
                    <span className="truncate font-semibold text-foreground">{activeDoc.title}</span>
                  </div>
                  {isUploadedDoc && (
                    <div className="flex items-center gap-1.5">
                      <Badge className="rounded-full bg-[#e6f0e8] text-[#33613d] hover:bg-[#e6f0e8]">✓ Uploaded File</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId(activeDoc.id)}
                        title="Delete uploaded file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <ScoreRing value={analysis.total} size={116} label="ATS score" />
                  <div className="min-w-[200px] flex-1 space-y-3">
                    {subs.map(([label, v]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-medium">{v}/100</span></div>
                        <Progress value={v} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-sage-mist p-3 text-sm">
                  {analysis.missing.length > 0
                    ? <>Adding <b>{analysis.missing.slice(0, 3).join(", ")}</b> to your skills or summary can boost your ATS match by ~10 points.</>
                    : <>Great keyword alignment! Your resume mirrors the core terminology in this job description.</>}
                </p>
              </div>

              {/* Keyword Gap Analysis */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl">Keyword gap analysis</h2>
                  {analysis.missing.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={addMissingToResume}>
                      <Plus className="mr-1 h-3.5 w-3.5" />Add missing keywords to resume
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-3.5">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#33613d]">
                      <CheckCircle2 className="h-4 w-4" />Matched ({analysis.matched.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matched.length ? analysis.matched.map((k) => (
                        <Badge key={k} variant="secondary" className="rounded-full bg-[#e6f0e8] text-[#33613d]">{k}</Badge>
                      )) : <span className="text-xs text-muted-foreground">No matches found yet</span>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-3.5">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                      <AlertCircle className="h-4 w-4" />Missing ({analysis.missing.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing.length ? analysis.missing.map((k) => (
                        <Badge key={k} variant="outline" className="rounded-full border-peach bg-accent/40 text-accent-foreground">{k}</Badge>
                      )) : <span className="text-xs text-muted-foreground">All key terms covered!</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-xl">Recruiter checks</h2>
                <div className="mt-3 space-y-2">
                  {FREE_CHECKS.map((c, i) => (
                    <div key={c} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#4e8a5a]" />{c}</span>
                      <Switch checked={checks[i]} onCheckedChange={(b) => setChecks(checks.map((x, j) => j === i ? b : x))} />
                    </div>
                  ))}
                  {LOCKED_CHECKS.map((c) => (
                    <div key={c} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2"><Lock className="h-4 w-4" />{c}</span><Badge variant="secondary">Pro</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <GradientPanel className="p-5">
                <div className="glass flex flex-col items-start gap-3 rounded-xl p-4 md:flex-row md:items-center">
                  <Sparkles className="h-5 w-5 shrink-0 text-accent-foreground" />
                  <div className="flex-1 text-sm"><b>Deep analysis:</b> repetitive verbs, credibility signals, interview risks & employment gaps.</div>
                  <Button size="sm" className="rounded-full" onClick={() => router.push("/pricing")}>Unlock full report</Button>
                </div>
              </GradientPanel>
            </>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-sage-line bg-card p-10 text-center">
              <FileSearch className="h-8 w-8 text-primary" />
              <h3 className="mt-3 text-xl">Ready when you are</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Paste a job description or upload your resume to get your ATS score.</p>
            </div>
          )}
        </div>
      </div>

      <DangerConfirm
        open={!!confirmDeleteId}
        onOpenChange={(b) => !b && setConfirmDeleteId(null)}
        title="Delete this resume?"
        desc={`"${resumes.find((r) => r.id === confirmDeleteId)?.title ?? "This file"}" will be permanently removed from your ATS Checker and Documents.`}
        onConfirm={() => { if (confirmDeleteId) handleDeleteResume(confirmDeleteId); }}
      />
    </div>
  );
}