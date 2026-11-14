"use client";
import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageHeader, ResponsiveModal, StatCard, Field } from "@/components/shared";
import { NumberTicker } from "@/components/magicui";
import { Zap, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Select your resume", "Screening questions", "Recommendations", "Notifications"];

export default function AutoApply() {
  const { docs, tracker, credits, setCredits, autoConfigured, setAutoConfigured, moveTrack, removeTrack, user } = useStore();
  const [step, setStep] = useState(0);
  const [resumeId, setResumeId] = useState(docs.find((d) => d.type === "resume")?.id ?? "");
  const [form, setForm] = useState({ title: "", phone: "", location: "", summary: "" });
  const [roles, setRoles] = useState<string[]>(["Product Designer"]);
  const [remote, setRemote] = useState(true);
  const [notify, setNotify] = useState({ email: true, weekly: true });
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const queue = tracker.filter((t) => t.status === "auto");
  const applied = tracker.filter((t) => ["applied", "interviewing", "offer"].includes(t.status)).length;
  const job = queue[0];

  const next = () => {
    if (step === 1) {
      const e = ["title", "phone", "location", "summary"].filter((k) => !(form as any)[k].trim());
      setErrors(e);
      if (e.length) { toast.error("Fill the required fields"); return; }
    }
    if (step === 3) { setAutoConfigured(true); toast.success("Auto Apply is ready ✓"); return; }
    setStep(step + 1);
  };

  if (!autoConfigured) return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Auto Apply" sub="Set up once. Apply every day — up to 20 tailored applications daily with Pro." />
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Documents · {step + 1} of 4</span><span>{STEPS[step]}</span></div>
        <Progress value={((step + 1) / 4) * 100} className="h-2" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-2xl">{STEPS[step]}</h2>
        {step === 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {docs.filter((d) => d.type === "resume" || d.type === "tailored").map((d) => (
              <button key={d.id} onClick={() => setResumeId(d.id)} className={cn("rounded-xl border p-4 text-left", resumeId === d.id ? "border-primary bg-sage-mist/50" : "border-border hover:bg-muted")}>
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{d.title}</span>{resumeId === d.id && <Check className="h-4 w-4 text-primary" />}</div>
                <div className="mt-1 text-xs text-muted-foreground">Score {d.score}% {d.score < 70 && "· Needs work"}</div>
              </button>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">A few details we'll reuse on every application. Known: <b>{user.name}</b> · {user.email}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current job title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={cn(errors.includes("title") && "border-destructive")} /></Field>
              <Field label="Phone" required><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cn(errors.includes("phone") && "border-destructive")} /></Field>
              <Field label="Current location" required><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={cn(errors.includes("location") && "border-destructive")} /></Field>
              <Field label="LinkedIn URL"><Input placeholder="linkedin.com/in/…" /></Field>
            </div>
            <Field label="Experience summary" required hint={`${form.summary.length}/500`}>
              <Textarea rows={4} maxLength={500} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={cn(errors.includes("summary") && "border-destructive")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Authorized to work in"><Input placeholder="Countries (up to 6)" /></Field>
              <Field label="Require sponsorship?"><Input placeholder="No / Yes" /></Field>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            <Field label="Target roles">
              <div className="flex flex-wrap gap-2">
                {["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "Product Designer", "Marketing Manager"].map((r) => (
                  <Button key={r} variant={roles.includes(r) ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r])}>{r}</Button>
                ))}
              </div>
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">Remote only<Switch checked={remote} onCheckedChange={setRemote} /></label>
          </div>
        )}
        {step === 3 && (
          <div className="mt-4 space-y-2">
            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">Email — {user.email}<Switch checked={notify.email} onCheckedChange={(b) => setNotify({ ...notify, email: b })} /></label>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">Weekly digest<Switch checked={notify.weekly} onCheckedChange={(b) => setNotify({ ...notify, weekly: b })} /></label>
            <p className="text-xs text-muted-foreground">You can turn these off anytime in Settings → Preferences.</p>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="outline" className="rounded-full" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
          <Button className="rounded-full" onClick={next}>{step === 3 ? "Complete" : "Next"}<ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Auto Apply" sub="Auto Apply is on — we prepare tailored applications, you approve them." actions={
        <Badge variant="secondary" className="rounded-full px-3 py-1"><Zap className="mr-1 h-3.5 w-3.5 text-accent-foreground" />{credits} credit{credits === 1 ? "" : "s"}</Badge>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="In queue" value={<NumberTicker value={queue.length} />} hint="awaiting your review" />
        <StatCard label="Auto applied" value={<NumberTicker value={applied} />} hint="since Nov 11, 2026" />
        <StatCard label="Credits left" value={<NumberTicker value={credits} />} hint="Pro: 20 / day" />
        <StatCard label="Matched roles" value={<NumberTicker value={102} />} hint="for your preferences" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl">Your next applications are ready</h2><p className="mt-1 text-sm text-muted-foreground">{queue.length ? `${queue[0].title} at ${queue[0].company} is ready to submit.` : "Queue is empty — explore jobs to add more."}</p></div>
          <div className="flex gap-2">
            <Button className="rounded-full" disabled={!queue.length} onClick={() => setReview(true)}>Review application</Button>
            <Button asChild variant="outline" className="rounded-full"><Link href="/jobs">Explore jobs</Link></Button>
          </div>
        </div>
      </div>

      <ResponsiveModal open={review && !!job} onOpenChange={setReview} title={job ? `${job.title} at ${job.company}` : ""} description="This is exactly what we'll submit on your behalf." wide
        footer={job && <>
          <Button variant="outline" className="text-destructive" onClick={() => { removeTrack(job.id); setReview(false); toast.success("Application discarded"); }}>Discard & remove</Button>
          <Button onClick={() => { if (credits <= 0) { toast.error("Out of credits"); return; } moveTrack(job.id, "applied"); setCredits(credits - 1); setReview(false); toast.success(`Your ${job.company} application was sent ✓`); }}>Submit application</Button>
        </>}>
        {job && (
          <Tabs defaultValue="questions">
            <TabsList className="w-full rounded-full">
              {["questions", "resume", "cover letter", "notes"].map((t) => <TabsTrigger key={t} value={t} className="flex-1 rounded-full capitalize">{t}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="questions" className="mt-4 space-y-3">
              {[["Full name", user.name], ["Email", user.email], ["Phone", "+98 912 000 0000"], ["Location", "Tehran, Iran"], ["Sponsorship", "No"]].map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </TabsContent>
            <TabsContent value="resume" className="mt-4"><div className="rounded-xl bg-sage-mist p-4 text-sm"><Badge className="mb-2 rounded-full bg-accent text-accent-foreground hover:bg-accent">✦ Tailored</Badge><div className="font-medium">Viana_Fariqi_Resume_{job.company}.pdf</div><div className="text-xs text-muted-foreground">Auto-tailored to this job ad · ATS 82</div></div></TabsContent>
            <TabsContent value="cover letter" className="mt-4"><div className="rounded-xl bg-sage-mist p-4 text-sm"><Badge className="mb-2 rounded-full bg-accent text-accent-foreground hover:bg-accent">✦ Tailored</Badge><div className="font-medium">Cover_Letter_{job.company}.pdf</div><div className="text-xs text-muted-foreground">Generated from your resume + the job ad</div></div></TabsContent>
            <TabsContent value="notes" className="mt-4"><Textarea rows={4} placeholder="Anything we should know before submitting…" /></TabsContent>
          </Tabs>
        )}
      </ResponsiveModal>
    </div>
  );
}