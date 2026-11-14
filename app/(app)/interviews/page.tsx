"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { QUESTIONS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState, ResponsiveModal, Field, ScoreRing } from "@/components/shared";
import { Plus, MessagesSquare, Sparkles, Mic, ArrowRight } from "lucide-react";

export default function Interviews() {
  const { interviews, addInterview, docs } = useStore();
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", seniority: "Mid", mode: "Basic", resume: "" });
  const [practice, setPractice] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);

  const active = interviews.find((i) => i.id === practice);

  if (active) return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={active.title} sub={`${active.company} · ${active.mode} · ${active.seniority}`} actions={<Button variant="outline" className="rounded-full" onClick={() => { setPractice(null); setIdx(0); setDone(false); }}>Exit practice</Button>} />
      {done ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <ScoreRing value={76} size={120} label="prep score" />
          <h2 className="text-2xl">Interview report ready</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Strong STAR structure on 5/8 answers. Add quantified results to stories #2 and #6.</p>
          <Button className="rounded-full" onClick={() => { setPractice(null); setDone(false); setIdx(0); }}>Back to interviews</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Question {idx + 1} of {QUESTIONS.length}</span><span>{Math.round(((idx + 1) / QUESTIONS.length) * 100)}%</span></div><Progress value={((idx + 1) / QUESTIONS.length) * 100} className="h-2" /></div>
          <h2 className="text-2xl">{QUESTIONS[idx].q}</h2>
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="tip"><AccordionTrigger className="text-sm text-primary"><span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />STAR hint</span></AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{QUESTIONS[idx].tip}</AccordionContent></AccordionItem>
          </Accordion>
          <Textarea rows={5} className="mt-3" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Draft your answer…" />
          <div className="mt-4 flex justify-between">
            <Button variant="outline" className="rounded-full" onClick={() => toast.success("Recording… (demo)")}><Mic className="mr-1 h-4 w-4" />Practice aloud</Button>
            <Button className="rounded-full" onClick={() => { setAnswer(""); if (idx === QUESTIONS.length - 1) setDone(true); else setIdx(idx + 1); }}>{idx === QUESTIONS.length - 1 ? "Finish" : "Next"}<ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Interviews" sub="AI-generated questions tailored to the role — practice with STAR hints." actions={<Button className="rounded-full" onClick={() => setCreate(true)}><Plus className="mr-1 h-4 w-4" />New interview</Button>} />
      {interviews.length === 0 ? (
        <EmptyState icon={<MessagesSquare className="h-6 w-6" />} title="No interviews yet" sub="Create one from a job title — or from your tracker — and start practicing." action={<Button className="rounded-full" onClick={() => setCreate(true)}>Create interview</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((i) => (
            <div key={i.id} className="rounded-2xl border border-border bg-card p-5">
              <Badge variant="secondary" className="rounded-full">{i.mode}</Badge>
              <div className="mt-2 font-medium">{i.title}</div>
              <div className="text-sm text-muted-foreground">{i.company} · {i.seniority}</div>
              <Button className="mt-4 w-full rounded-full" onClick={() => setPractice(i.id)}><Sparkles className="mr-1 h-4 w-4" />Start practicing</Button>
            </div>
          ))}
        </div>
      )}

      <ResponsiveModal open={create} onOpenChange={setCreate} title="New interview" description="Basic mode is instant; Personalized uses the job ad + your resume."
        footer={<Button disabled={!form.title} onClick={() => { addInterview(form); setCreate(false); toast.success("Questions generated with AI ✓"); setForm({ title: "", company: "", seniority: "Mid", mode: "Basic", resume: "" }); }}>Generate with AI</Button>}>
        <div className="space-y-4">
          <Tabs value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
            <TabsList className="w-full rounded-full"><TabsTrigger value="Basic" className="flex-1 rounded-full">Basic</TabsTrigger><TabsTrigger value="Personalized" className="flex-1 rounded-full">Personalized ✨</TabsTrigger></TabsList>
          </Tabs>
          <Field label="Job title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job title from the job ad" /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label="Seniority"><RadioGroup value={form.seniority} onValueChange={(v) => setForm({ ...form, seniority: v })} className="flex gap-4">{["Junior", "Mid", "Senior"].map((s) => <label key={s} className="flex items-center gap-2 text-sm"><RadioGroupItem value={s} />{s}</label>)}</RadioGroup></Field>
          {form.mode === "Personalized" && <Field label="Resume"><Select value={form.resume} onValueChange={(v) => setForm({ ...form, resume: v })}><SelectTrigger><SelectValue placeholder="Pick a resume" /></SelectTrigger><SelectContent>{docs.filter((d) => d.type === "resume" || d.type === "tailored").map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent></Select></Field>}
        </div>
      </ResponsiveModal>
    </div>
  );
}