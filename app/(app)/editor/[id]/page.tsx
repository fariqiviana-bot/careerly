"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, uid, type Content, type Doc } from "@/lib/store";
import { ACCENTS, FONTS, TEMPLATES, LANGS, EXTRA_SECTIONS, FREE_CHECKS, LOCKED_CHECKS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveModal, Field, ScoreRing } from "@/components/shared";
import { ArrowLeft, Undo2, Redo2, Sparkles, Wand2, Languages, History, Download, CheckCircle2, Lock, Plus, Trash2, Bold, Italic, Underline, List as ListIcon, Link2, Eye, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", label: "Personal details", pct: 10 }, { id: "experience", label: "Professional experience", pct: 25 },
  { id: "education", label: "Education", pct: 15 }, { id: "skills", label: "Areas of expertise", pct: 4 },
  { id: "summary", label: "Professional summary", pct: 10 }, { id: "additional", label: "Additional sections", pct: 6 },
  { id: "review", label: "Review", pct: 0 },
];

function Preview({ doc, content, twoCol, margin }: { doc: Doc; content: Content; twoCol: boolean; margin: number }) {
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-lg border border-border bg-white shadow-sm" style={{ padding: `${margin}px`, fontFamily: doc.font }}>
      <div className="border-b-2 pb-3" style={{ borderColor: doc.accent }}>
        <div className="text-2xl font-bold" style={{ color: doc.accent }}>{content.name}</div>
        <div className="text-sm font-medium">{content.role}</div>
        <div className="mt-1 text-[11px] text-neutral-500">{content.email} · {content.phone} · {content.location}</div>
      </div>
      <div className={cn("mt-4 gap-6", twoCol && "grid grid-cols-[1fr_180px]")}>
        <div className="space-y-4 text-[12px] leading-relaxed">
          {content.summary && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Summary</div><p>{content.summary}</p></div>}
          {content.experience.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Experience</div>
            {content.experience.map((e) => <div key={e.id} className="mb-2"><div className="flex justify-between font-semibold"><span>{e.role} — {e.company}</span><span className="font-normal text-neutral-500">{e.period}</span></div><p className="text-neutral-600">{e.description}</p></div>)}
          </div>}
          {content.education.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Education</div>
            {content.education.map((e) => <div key={e.id} className="flex justify-between"><span><b>{e.degree}</b>, {e.school}</span><span className="text-neutral-500">{e.period}</span></div>)}
          </div>}
        </div>
        {content.skills.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Skills</div>
          <div className={cn("flex flex-wrap gap-1", twoCol && "flex-col")}>{content.skills.map((s) => <span key={s} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px]">{s}</span>)}</div>
        </div>}
      </div>
    </div>
  );
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const { docs, updateDoc, addDoc } = useStore();
  const doc = docs.find((d) => d.id === id);
  const [content, setContent] = useState<Content>(doc?.content ?? ({} as Content));
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<"edit" | "customize">("edit");
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<string>(sp.get("tailor") ? "tailor" : "");
  const [twoCol, setTwoCol] = useState(false);
  const [margin, setMargin] = useState(32);
  const [fontSize, setFontSize] = useState(12);
  const [checks, setChecks] = useState(FREE_CHECKS.map(() => true));
  const [jd, setJd] = useState("");
  const [level, setLevel] = useState("balanced");
  const [lang, setLang] = useState("Español");
  const [aiMsgs, setAiMsgs] = useState<{ me: boolean; text: string }[]>([{ me: false, text: "I'm Sage. Ask me to improve your summary, quantify impact, or tailor this resume." }]);
  const [aiInput, setAiInput] = useState("");
  const past = useRef<Content[]>([]); const future = useRef<Content[]>([]);
  const first = useRef(true);

  const score = useMemo(() => {
    if (!doc) return 0;
    let s = 15;
    if (content.role) s += 10; if (content.experience?.length) s += 25; if (content.education?.length) s += 15;
    if ((content.skills?.length ?? 0) >= 3) s += 4; if (content.summary) s += 10; s += (content.extras?.length ?? 0) * 3;
    return Math.min(100, s);
  }, [content, doc]);

  useEffect(() => {
    if (!doc) return;
    if (first.current) { first.current = false; return; }
    setSaving(true);
    const t = setTimeout(() => { updateDoc(doc.id, { content, score: doc.type === "resume" || doc.type === "tailored" ? score : doc.score }); setSaving(false); }, 700);
    return () => clearTimeout(t);
  }, [content]); // eslint-disable-line

  if (!doc) return <div className="py-20 text-center text-muted-foreground">Document not found. <Button variant="link" onClick={() => router.push("/documents")}>Back to documents</Button></div>;

  const set = (patch: Partial<Content>) => { past.current.push(content); future.current = []; setContent({ ...content, ...patch }); };
  const undo = () => { const p = past.current.pop(); if (p) { future.current.push(content); setContent(p); } };
  const redo = () => { const f = future.current.pop(); if (f) { past.current.push(content); setContent(f); } };
  const isLetter = doc.type === "cover" || doc.type === "resignation";
  const isWebsite = doc.type === "website";

  const sendAi = (text?: string) => {
    const q = text ?? aiInput; if (!q.trim()) return;
    setAiMsgs((m) => [...m, { me: true, text: q }]); setAiInput("");
    setTimeout(() => setAiMsgs((m) => [...m, { me: false, text: `Here's a stronger version (demo): “${content.summary?.slice(0, 80) ?? "Led cross-functional design"}… resulting in a measurable 18% lift.” — Want me to apply it to your summary?` }]), 600);
  };

  const stepForm = (
    <div className="space-y-5">
      {STEPS[step].id === "personal" && <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={content.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Job target" required><Input value={content.role} onChange={(e) => set({ role: e.target.value })} /></Field>
          <Field label="Email"><Input value={content.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={content.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Location"><Input value={content.location} onChange={(e) => set({ location: e.target.value })} /></Field>
        </div>
      </>}
      {STEPS[step].id === "experience" && <>
        {content.experience.map((e, i) => (
          <div key={e.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role"><Input value={e.role} onChange={(ev) => set({ experience: content.experience.map((x, j) => j === i ? { ...x, role: ev.target.value } : x) })} /></Field>
              <Field label="Company"><Input value={e.company} onChange={(ev) => set({ experience: content.experience.map((x, j) => j === i ? { ...x, company: ev.target.value } : x) })} /></Field>
            </div>
            <Field label="Period"><Input value={e.period} onChange={(ev) => set({ experience: content.experience.map((x, j) => j === i ? { ...x, period: ev.target.value } : x) })} /></Field>
            <Field label="Description" hint="Tip: quantify results — “+18% activation” beats “improved onboarding”."><Textarea rows={3} value={e.description} onChange={(ev) => set({ experience: content.experience.map((x, j) => j === i ? { ...x, description: ev.target.value } : x) })} /></Field>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => set({ experience: content.experience.filter((_, j) => j !== i) })}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove</Button>
          </div>
        ))}
        <Button variant="outline" className="rounded-full" onClick={() => set({ experience: [...content.experience, { id: uid(), role: "", company: "", period: "", description: "" }] })}><Plus className="mr-1 h-4 w-4" />Add employment</Button>
      </>}
      {STEPS[step].id === "education" && <>
        {content.education.map((e, i) => (
          <div key={e.id} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3">
            <Field label="Degree"><Input value={e.degree} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x) })} /></Field>
            <Field label="School"><Input value={e.school} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, school: ev.target.value } : x) })} /></Field>
            <Field label="Period"><Input value={e.period} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, period: ev.target.value } : x) })} /></Field>
          </div>
        ))}
        <Button variant="outline" className="rounded-full" onClick={() => set({ education: [...content.education, { id: uid(), degree: "", school: "", period: "" }] })}><Plus className="mr-1 h-4 w-4" />Add education</Button>
      </>}
      {STEPS[step].id === "skills" && <>
        <Field label="Skills" hint="Comma-separated. 6–10 relevant skills works best.">
          <Textarea rows={3} value={content.skills.join(", ")} onChange={(e) => set({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </Field>
        <div className="flex flex-wrap gap-1.5">{content.skills.map((s) => <Badge key={s} variant="secondary" className="rounded-full">{s}</Badge>)}</div>
      </>}
      {STEPS[step].id === "summary" && <>
        <div className="flex gap-1 rounded-t-xl border border-b-0 border-border bg-muted px-2 py-1.5">
          {[Bold, Italic, Underline, ListIcon, Link2].map((I, i) => <Button key={i} variant="ghost" size="icon" className="h-7 w-7"><I className="h-3.5 w-3.5" /></Button>)}
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-primary" onClick={() => setModal("ai")}><Sparkles className="h-3.5 w-3.5" />AI Writer</Button>
        </div>
        <Textarea rows={6} className="rounded-t-none" value={content.summary} onChange={(e) => set({ summary: e.target.value })} />
        <p className="text-xs text-muted-foreground">{content.summary.length}/600 · Recruiter tip: 400–600 characters increases interview chances.</p>
      </>}
      {STEPS[step].id === "additional" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {EXTRA_SECTIONS.map((s) => (
            <label key={s} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              {s}<Switch checked={content.extras.includes(s)} onCheckedChange={(b) => set({ extras: b ? [...content.extras, s] : content.extras.filter((x) => x !== s) })} />
            </label>
          ))}
        </div>
      )}
      {STEPS[step].id === "review" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <ScoreRing value={score} size={120} label="resume score" />
          <p className="max-w-sm text-sm text-muted-foreground">Looking good! Run an AI review against a specific job target for deeper feedback.</p>
          <Button className="rounded-full" onClick={() => { if (!content.role) { toast.error("Job target is required to get an AI review"); return; } toast.success("AI review generated (demo)"); }}><Sparkles className="mr-1 h-4 w-4" />Get AI review</Button>
        </div>
      )}
    </div>
  );

  const letterForm = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="To"><Input value={content.letter.to} onChange={(e) => set({ letter: { ...content.letter, to: e.target.value } })} /></Field>
        <Field label="Company"><Input value={content.letter.company} onChange={(e) => set({ letter: { ...content.letter, company: e.target.value } })} /></Field>
      </div>
      <Field label="Subject"><Input value={content.letter.subject} onChange={(e) => set({ letter: { ...content.letter, subject: e.target.value } })} /></Field>
      <Field label="Body">
        <Textarea rows={12} value={content.letter.body} onChange={(e) => set({ letter: { ...content.letter, body: e.target.value } })} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => setModal("ai")}><Sparkles className="mr-1 h-4 w-4" />Ask AI writer</Button>
        <Button variant="outline" className="rounded-full" onClick={() => toast.success("Generate New Letter (demo)")}><Wand2 className="mr-1 h-4 w-4" />Generate new letter</Button>
        <Badge variant="secondary" className="ml-auto self-center rounded-full"><CheckCircle2 className="mr-1 h-3 w-3" />No spelling errors</Badge>
      </div>
    </div>
  );

  const websiteForm = (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div><div className="font-medium">Publish website</div><div className="text-xs text-muted-foreground">careerly.app/s/{doc.id}</div></div>
          <Switch checked={!!doc.published} onCheckedChange={(b) => { updateDoc(doc.id, { published: b }); toast.success(b ? "Website published" : "Website unpublished"); }} />
        </div>
        {doc.published && <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => { navigator.clipboard.writeText(`https://careerly.app/s/${doc.id}`); toast.success("Link copied"); }}><Link2 className="mr-1 h-3.5 w-3.5" />Copy link</Button>}
      </div>
      <p className="text-sm text-muted-foreground">Your website is generated from the same content as your resume — edit sections below.</p>
      {stepForm}
    </div>
  );

  const customize = (
    <Tabs defaultValue="template">
      <TabsList className="w-full rounded-full"><TabsTrigger value="template" className="flex-1 rounded-full">Template & Colors</TabsTrigger><TabsTrigger value="text" className="flex-1 rounded-full">Text</TabsTrigger><TabsTrigger value="layout" className="flex-1 rounded-full">Layout</TabsTrigger></TabsList>
      <TabsContent value="template" className="mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.slice(0, 9).map((t) => (
            <button key={t.id} onClick={() => updateDoc(doc.id, { template: t.id, accent: t.accent })} className={cn("rounded-xl border p-2 text-left text-xs transition-colors", doc.template === t.id ? "border-primary bg-sage-mist" : "border-border hover:bg-muted")}>
              <div className="mb-1 h-12 rounded bg-white" style={{ borderTop: `3px solid ${t.accent}` }} />{t.name}{t.pro && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
            </button>
          ))}
        </div>
        <Field label="Accent color">
          <div className="flex gap-2">{ACCENTS.map((c) => <button key={c} onClick={() => updateDoc(doc.id, { accent: c })} className={cn("h-7 w-7 rounded-full border-2", doc.accent === c ? "border-foreground" : "border-transparent")} style={{ background: c }} aria-label={c} />)}</div>
        </Field>
      </TabsContent>
      <TabsContent value="text" className="mt-4 space-y-4">
        <Field label="Font"><Select value={doc.font} onValueChange={(v) => updateDoc(doc.id, { font: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></Field>
        <Field label={`Body size — ${fontSize}pt`}><Slider value={[fontSize]} min={9} max={14} step={0.5} onValueChange={([v]) => setFontSize(v)} /></Field>
      </TabsContent>
      <TabsContent value="layout" className="mt-4 space-y-4">
        <Field label="Page format"><RadioGroup defaultValue="a4" className="flex gap-4"><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="a4" />A4</label><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="letter" />US Letter</label></RadioGroup></Field>
        <Field label={`Margins — ${margin}px`}><Slider value={[margin]} min={16} max={56} onValueChange={([v]) => setMargin(v)} /></Field>
        <Field label="Two-column layout"><Switch checked={twoCol} onCheckedChange={setTwoCol} /></Field>
        <Field label="Date format"><Select defaultValue="long"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="long">January 2026</SelectItem><SelectItem value="short">Jan 2026</SelectItem><SelectItem value="num">01/2026</SelectItem><SelectItem value="year">2026</SelectItem></SelectContent></Select></Field>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="-mt-2">
      {/* Editor topbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/documents")}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={doc.title} onChange={(e) => updateDoc(doc.id, { title: e.target.value })} className="h-9 w-48 border-transparent bg-transparent font-medium hover:border-border focus:border-border md:w-64" />
        <span className="text-xs text-muted-foreground">{saving ? "Saving…" : "Saved"}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo}><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setModal("history")}><History className="h-4 w-4" /></Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="outline" size="sm" className="hidden rounded-full md:flex" onClick={() => setModal("fix")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Fix mistakes</Button>
          <Button variant="outline" size="sm" className="hidden rounded-full md:flex" onClick={() => setModal("tailor")}><Wand2 className="mr-1 h-3.5 w-3.5" />Check & Tailor</Button>
          <Button variant="outline" size="sm" className="hidden rounded-full lg:flex" onClick={() => setModal("translate")}><Languages className="mr-1 h-3.5 w-3.5" />Translate</Button>
          <Button size="sm" className="rounded-full" onClick={() => setModal("download")}><Download className="mr-1 h-3.5 w-3.5" />Download</Button>
        </div>
      </div>

      {/* Mobile form/preview toggle */}
      <div className="mb-4 grid grid-cols-2 rounded-full border border-border p-0.5 md:hidden">
        {(["form", "preview"] as const).map((v) => <Button key={v} variant={mobileView === v ? "secondary" : "ghost"} size="sm" className="rounded-full capitalize" onClick={() => setMobileView(v)}>{v === "preview" ? <><Eye className="mr-1 h-3.5 w-3.5" />Preview</> : "Edit"}</Button>)}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,46%)]">
        <div className={cn(mobileView === "preview" && "hidden md:block")}>
          {!isLetter && !isWebsite && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="mb-4 rounded-full"><TabsTrigger value="edit" className="rounded-full px-6">Edit</TabsTrigger><TabsTrigger value="customize" className="rounded-full px-6">Customize</TabsTrigger></TabsList>
            </Tabs>
          )}
          {tab === "customize" && !isLetter ? customize : (
            <div className="rounded-2xl border border-border bg-card p-5">
              {isLetter ? letterForm : isWebsite ? websiteForm : (
                <>
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {STEPS.map((s, i) => (
                      <button key={s.id} onClick={() => setStep(i)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", i === step ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                        {s.label}{s.pct > 0 && <span className={cn("ml-1", i === step ? "opacity-80" : "text-primary")}>+{s.pct}%</span>}
                      </button>
                    ))}
                  </div>
                  {stepForm}
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" className="rounded-full" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
                    <Button className="rounded-full" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className={cn("md:sticky md:top-20 md:self-start", mobileView === "form" && "hidden md:block")}>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>Live preview</span>{(doc.type === "resume" || doc.type === "tailored") && <span className="rounded-full bg-sage-mist px-2 py-0.5 font-medium text-primary">{score}%</span>}</div>
          {isLetter ? (
            <div className="mx-auto max-w-[640px] rounded-lg border border-border bg-white p-8 text-sm leading-relaxed" style={{ fontFamily: doc.font }}>
              <div className="font-bold" style={{ color: doc.accent }}>{content.name}</div>
              <div className="text-xs text-neutral-500">{content.email}</div>
              <div className="mt-6">{content.letter.to}<br />{content.letter.company}</div>
              <div className="mt-4 font-semibold">{content.letter.subject}</div>
              <p className="mt-4 whitespace-pre-wrap text-neutral-700">{content.letter.body}</p>
            </div>
          ) : <Preview doc={doc} content={content} twoCol={twoCol} margin={margin} />}
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 flex gap-2 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setModal("fix")}><CheckCircle2 className="mr-1 h-4 w-4" />Fix</Button>
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setModal("tailor")}><Wand2 className="mr-1 h-4 w-4" />Tailor</Button>
        <Button className="flex-1 rounded-full" onClick={() => setModal("ai")}><Sparkles className="mr-1 h-4 w-4" />AI</Button>
      </div>

      {/* Modals */}
      <ResponsiveModal open={modal === "fix"} onOpenChange={(b) => !b && setModal("")} title="Fix mistakes" description="Recruiter checks run on your latest content." wide>
        <div className="space-y-2">
          {FREE_CHECKS.map((c, i) => (
            <div key={c} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#4e8a5a]" />{c}</span>
              <Switch checked={checks[i]} onCheckedChange={(b) => setChecks(checks.map((x, j) => j === i ? b : x))} />
            </div>
          ))}
          <Separator className="my-3" />
          {LOCKED_CHECKS.map((c) => (
            <div key={c} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Lock className="h-4 w-4" />{c}</span><Badge variant="secondary">Pro</Badge></div>
          ))}
          <Button className="mt-2 w-full rounded-full" onClick={() => router.push("/pricing")}>Unlock full report</Button>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "tailor"} onOpenChange={(b) => !b && setModal("")} title="Check & Tailor" description="Paste a job ad — we score the match and tailor your resume." wide
        footer={<Button disabled={!jd.trim()} onClick={() => { const d = addDoc("tailored", `${doc.title} — tailored`, { content, score: Math.min(100, score + 12), template: doc.template, accent: doc.accent }); toast.success("Tailored resume created"); setModal(""); router.push(`/editor/${d.id}`); }}>✨ Tailor now</Button>}>
        <div className="space-y-4">
          <Field label="Job description or URL"><Textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description…" /></Field>
          <Field label="Tailoring level">
            <RadioGroup value={level} onValueChange={setLevel} className="flex gap-4">
              {[["conservative", "Conservative"], ["balanced", "Balanced ✨"], ["bold", "Bold"]].map(([v, l]) => <label key={v} className="flex items-center gap-2 text-sm"><RadioGroupItem value={v} />{l}</label>)}
            </RadioGroup>
          </Field>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "translate"} onOpenChange={(b) => !b && setModal("")} title="Translate resume" description="AI translation — always review the result."
        footer={<Button onClick={() => { toast.success(`Translated to ${lang} (demo)`); setModal(""); }}>Translate</Button>}>
        <Field label="Language"><Select value={lang} onValueChange={setLang}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></Field>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "history"} onOpenChange={(b) => !b && setModal("")} title="Version history">
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
            {new Date(Date.now() - i * 36e5 * 8).toLocaleString()}
            <Button size="sm" variant="outline" onClick={() => { toast.success("Restored"); setModal(""); }}>Restore</Button>
          </div>))}
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "download"} onOpenChange={(b) => !b && setModal("")} title="Download" description="Your document, your formats — no surprises."
        footer={<Button onClick={() => { toast.success("Download started (demo)"); setModal(""); }}><Download className="mr-1 h-4 w-4" />Download PDF</Button>}>
        <div className="grid grid-cols-3 gap-2">
          {["PDF", "DOCX", "TXT"].map((f) => <Button key={f} variant="outline" className="rounded-xl" onClick={() => { toast.success(`${f} export (demo)`); }}>{f}</Button>)}
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => { toast.success("PDF sent to fariqiviana@gmail.com"); }}><Send className="mr-2 h-4 w-4" />Send PDF to my email</Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => { navigator.clipboard.writeText(`https://careerly.app/s/${doc.id}`); toast.success("Share link copied"); }}><Link2 className="mr-2 h-4 w-4" />Copy share link</Button>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "ai"} onOpenChange={(b) => !b && setModal("")} title="Sage — AI Writer" wide>
        <ScrollArea className="h-64 pr-3">
          <div className="space-y-3">
            {aiMsgs.map((m, i) => <div key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.me ? "ml-auto bg-primary text-primary-foreground" : "bg-sage-mist")}>{m.text}</div>)}
          </div>
        </ScrollArea>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Improve my summary", "Quantify my impact", "Write a bullet for my last role"].map((s) => <Button key={s} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => sendAi(s)}>{s}</Button>)}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); sendAi(); }}>
          <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask anything about this document…" />
          <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
        </form>
      </ResponsiveModal>
    </div>
  );
}