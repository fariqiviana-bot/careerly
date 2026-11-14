"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FREE_CHECKS, LOCKED_CHECKS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, ScoreRing, GradientPanel, Field } from "@/components/shared";
import { Upload, Lock, CheckCircle2, Sparkles, FileSearch } from "lucide-react";

export default function Checker() {
  const router = useRouter();
  const [analyzed, setAnalyzed] = useState(true);
  const [jd, setJd] = useState("");
  const [checks, setChecks] = useState(FREE_CHECKS.map(() => true));
  const [reports, setReports] = useState([
    { title: "Product Designer Resume", date: "Nov 10, 2026", score: 84 },
    { title: "Telgorithm — Marketing Manager", date: "Nov 11, 2026", score: 82 },
  ]);
  const subs = [["Design", 85], ["Structure", 90], ["Content", 51]] as const;

  return (
    <div>
      <PageHeader title="ATS Checker" sub="See your resume the way applicant tracking systems do." actions={
        <Button className="rounded-full" onClick={() => { setAnalyzed(false); setJd(""); }}><Upload className="mr-1 h-4 w-4" />New check</Button>} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl">Check against a job</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paste the job ad — we score the match and suggest fixes.</p>
            <Field label="Job description">
              <Textarea rows={6} className="mt-2" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description or URL…" />
            </Field>
            <Button className="mt-3 w-full rounded-full" disabled={!jd.trim()} onClick={() => { setAnalyzed(true); setReports([{ title: "New check", date: "Today", score: 78 }, ...reports]); toast.success("Analysis complete"); }}>
              <FileSearch className="mr-1 h-4 w-4" />Analyze
            </Button>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sage-line p-3 text-sm text-muted-foreground hover:bg-sage-mist/50">
              <Upload className="h-4 w-4" />or upload a PDF/DOCX
              <input type="file" className="hidden" onChange={() => { setAnalyzed(true); toast.success("Resume uploaded & analyzed (demo)"); }} />
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl">My reports</h2>
            <div className="mt-3 divide-y divide-border">
              {reports.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.date}</div></div>
                  <span className="rounded-full bg-sage-mist px-2 py-0.5 text-xs font-semibold text-primary">{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {analyzed ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-6">
                  <ScoreRing value={84} size={116} label="ATS score" />
                  <div className="min-w-[200px] flex-1 space-y-3">
                    {subs.map(([label, v]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-medium">{v}/100</span></div>
                        <Progress value={v} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-sage-mist p-3 text-sm">Your weakest link is <b>Content</b> — add quantified results to 3 bullets to gain ~12 points.</p>
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
    </div>
  );
}