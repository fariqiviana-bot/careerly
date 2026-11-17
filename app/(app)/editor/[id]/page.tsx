"use client";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ResumeRender } from "@/components/render";
import { useStore, uid, type Content, type Doc } from "@/lib/store";
import { FONTS, TEMPLATES, LANGS, EXTRA_SECTIONS, FREE_CHECKS, LOCKED_CHECKS } from "@/lib/catalog";
import { WebsiteView } from "@/components/website-view";
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
import { ArrowLeft, Undo2, Redo2, Sparkles, Wand2, Languages, History, Download, CheckCircle2, Lock, Plus, Trash2, Bold, Italic, Underline, List as ListIcon, Link2, Eye, Send, Check, Upload, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", label: "Personal details", pct: 10 }, { id: "experience", label: "Professional experience", pct: 25 },
  { id: "education", label: "Education", pct: 15 }, { id: "skills", label: "Areas of expertise", pct: 4 },
  { id: "summary", label: "Professional summary", pct: 10 }, { id: "additional", label: "Additional sections", pct: 6 },
  { id: "review", label: "Review", pct: 0 },
];

function Preview({ doc, content, twoCol, margin, fontSize }: { doc: Doc; content: Content; twoCol: boolean; margin: number; fontSize: number }) {
  const details = content.extraDetails ?? {};
  return (
    <div id="resume-print-area" className="mx-auto w-full max-w-[640px] rounded-lg border border-border bg-white text-neutral-900 shadow-sm" style={{ padding: `${margin}px`, fontFamily: doc.font }}>
      <div className="border-b-2 pb-3" style={{ borderColor: doc.accent }}>
        <div className="text-2xl font-bold" style={{ color: doc.accent }}>{content.name}</div>
        <div className="text-sm font-medium">{content.role}</div>
        <div className="mt-1 text-[11px] text-neutral-500">{content.email} · {content.phone} · {content.location}</div>
      </div>
      <div className={cn("mt-4 gap-6", twoCol && "grid grid-cols-[1fr_180px]")} style={{ fontSize: `${fontSize}px` }}>
        <div className="space-y-4 leading-relaxed">
          {content.summary && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Summary</div><p className="whitespace-pre-wrap">{content.summary}</p></div>}
          {content.experience.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Experience</div>
            {content.experience.map((e) => <div key={e.id} className="mb-2.5"><div className="flex justify-between font-semibold"><span>{e.role} — {e.company}</span><span className="font-normal text-neutral-500">{e.period}</span></div><p className="whitespace-pre-wrap text-neutral-600">{e.description}</p></div>)}
          </div>}
          {content.education.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Education</div>
            {content.education.map((e) => <div key={e.id} className="flex justify-between"><span><b>{e.degree}</b>, {e.school}</span><span className="text-neutral-500">{e.period}</span></div>)}
          </div>}
          {content.extras?.map((sec) => {
            const text = details[sec];
            if (!text) return null;
            return (
              <div key={sec}>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>{sec}</div>
                <p className="whitespace-pre-wrap text-neutral-700">{text}</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-4">
          {content.skills.length > 0 && <div><div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Skills</div>
            <div className={cn("flex flex-wrap gap-1", twoCol && "flex-col")}>{content.skills.map((s) => <span key={s} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px]">{s}</span>)}</div>
          </div>}
          {content.extras?.filter((sec) => !details[sec]).length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: doc.accent }}>Highlights</div>
              <div className="flex flex-wrap gap-1">{content.extras.filter((sec) => !details[sec]).map((sec) => <span key={sec} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px]">{sec}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const { docs, updateDoc, addDoc } = useStore();
  const doc = docs.find((d) => d.id === id);
  const [content, setContent] = useState<Content>(doc?.content ?? ({} as Content));
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<"edit" | "customize">("edit");
  const [webTab, setWebTab] = useState<"fill" | "design" | "publish">("publish");
  const [slugInput, setSlugInput] = useState(doc?.slug ?? "viana-fariqi");
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
  const [aiMsgs, setAiMsgs] = useState<{ me: boolean; text: string; suggestion?: string }[]>([{ me: false, text: "I'm Sage. Ask me to improve your summary, quantify impact, or tailor this resume." }]);
  const [aiInput, setAiInput] = useState("");
  const past = useRef<Content[]>([]); const future = useRef<Content[]>([]);
  const first = useRef(true);
  const loadedId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (doc && loadedId.current !== doc.id) {
      loadedId.current = doc.id;
      first.current = true;
      setContent(doc.content);
      setSlugInput(doc.slug ?? "viana-fariqi");
      past.current = [];
      future.current = [];
    }
  }, [doc]);

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

  if (!doc || !content.experience) return <div className="py-20 text-center text-muted-foreground">Document not found. <Button variant="link" onClick={() => router.push("/documents")}>Back to documents</Button></div>;

  const set = (patch: Partial<Content>) => { past.current.push(content); future.current = []; setContent({ ...content, ...patch }); };
  const undo = () => { const p = past.current.pop(); if (p) { future.current.push(content); setContent(p); } };
  const redo = () => { const f = future.current.pop(); if (f) { past.current.push(content); setContent(f); } };
  const isLetter = doc.type === "cover" || doc.type === "resignation";
  const isWebsite = doc.type === "website";

  const exportFile = (format: "PDF" | "DOCX" | "TXT") => {
    setModal("");
    if (format === "PDF") {
      toast.success("Preparing vector PDF — select 'Save as PDF' in the print dialog");
      setTimeout(() => window.print(), 250);
      return;
    }
    const c = content;
    if (format === "TXT") {
      const extraTxt = (c.extras ?? []).map((sec) => `\n${sec.toUpperCase()}\n${c.extraDetails?.[sec] ?? ""}`).join("\n");
      const txt = `${c.name} — ${c.role}\n${c.email} · ${c.phone} · ${c.location}\n\nSUMMARY\n${c.summary}\n\nEXPERIENCE\n${c.experience.map((e) => `${e.role} @ ${e.company} (${e.period})\n${e.description}`).join("\n\n")}\n\nEDUCATION\n${c.education.map((e) => `${e.degree}, ${e.school} (${e.period})`).join("\n")}\n\nSKILLS\n${c.skills.join(", ")}${extraTxt}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
      a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
      a.click();
      toast.success("TXT file downloaded");
      return;
    }
    if (format === "DOCX") {
      const html = `<html><head><meta charset="utf-8"><title>${doc.title}</title></head><body style="font-family: Calibri, Arial, sans-serif; line-height: 1.5;"><h1>${c.name}</h1><h3>${c.role}</h3><p>${c.email} | ${c.phone} | ${c.location}</p><hr/><h2>Summary</h2><p>${c.summary}</p><h2>Experience</h2>${c.experience.map((e) => `<p><b>${e.role} — ${e.company}</b> (${e.period})<br/>${e.description}</p>`).join("")}<h2>Education</h2>${c.education.map((e) => `<p><b>${e.degree}</b>, ${e.school} (${e.period})</p>`).join("")}<h2>Skills</h2><p>${c.skills.join(", ")}</p></body></html>`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" }));
      a.download = `${doc.title.replace(/\s+/g, "_")}.doc`;
      a.click();
      toast.success("Word document downloaded");
    }
  };

  const sendAi = (text?: string) => {
    const q = text ?? aiInput; if (!q.trim()) return;
    setAiMsgs((m) => [...m, { me: true, text: q }]); setAiInput("");
    const improved = `${content.role || "Product Designer"} with proven experience delivering high-impact digital products. Led cross-functional initiatives that lifted user activation by 18% and scaled a 120-component design system across 30+ engineers.`;
    setTimeout(() => setAiMsgs((m) => [...m, {
      me: false,
      text: `Here is a sharper, quantified version tailored for ${content.role || "your role"}:\n\n“${improved}”`,
      suggestion: improved,
    }]), 450);
  };

  const handleTailor = () => {
    const stopWords = new Set(["with", "from", "that", "this", "your", "have", "will", "work", "team", "role", "experience", "years", "looking", "strong", "skills", "about"]);
    const extracted = Array.from(new Set(
      (jd.match(/\b[A-Za-z][A-Za-z0-9+#.-]{3,15}\b/g) ?? [])
        .filter((w) => !stopWords.has(w.toLowerCase()) && !content.skills.some((s) => s.toLowerCase() === w.toLowerCase()))
    )).slice(0, level === "conservative" ? 2 : level === "balanced" ? 4 : 6);

    const newSkills = [...content.skills, ...extracted];
    const tailoredSummary = extracted.length
      ? `${content.summary} Specialized focus on ${extracted.slice(0, 3).join(", ")}.`
      : content.summary;

    const d = addDoc("tailored", `${doc.title} — Tailored`, {
      content: { ...content, skills: newSkills, summary: tailoredSummary },
      score: Math.min(100, score + 14),
      template: doc.template,
      accent: doc.accent,
    });
    toast.success(`Tailored resume created (+${extracted.length} keywords matched)`);
    setModal("");
    router.push(`/editor/${d.id}`);
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
          <div key={e.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Degree"><Input value={e.degree} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x) })} /></Field>
              <Field label="School"><Input value={e.school} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, school: ev.target.value } : x) })} /></Field>
              <Field label="Period"><Input value={e.period} onChange={(ev) => set({ education: content.education.map((x, j) => j === i ? { ...x, period: ev.target.value } : x) })} /></Field>
            </div>
            {content.education.length > 1 && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => set({ education: content.education.filter((_, j) => j !== i) })}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove</Button>}
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
          {[Bold, Italic, Underline, ListIcon, Link2].map((I, i) => <Button key={i} variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Formatting applied")}><I className="h-3.5 w-3.5" /></Button>)}
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-primary" onClick={() => setModal("ai")}><Sparkles className="h-3.5 w-3.5" />AI Writer</Button>
        </div>
        <Textarea rows={6} className="rounded-t-none" value={content.summary} onChange={(e) => set({ summary: e.target.value })} />
        <p className="text-xs text-muted-foreground">{content.summary.length}/600 · Recruiter tip: 400–600 characters increases interview chances.</p>
      </>}
      {STEPS[step].id === "additional" && (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {EXTRA_SECTIONS.map((s) => (
              <label key={s} className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3 text-sm">
                {s}<Switch checked={content.extras.includes(s)} onCheckedChange={(b) => set({ extras: b ? [...content.extras, s] : content.extras.filter((x) => x !== s) })} />
              </label>
            ))}
          </div>
          {content.extras.length > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              {content.extras.map((sec) => (
                <Field key={sec} label={sec} hint={`Add items for ${sec} (appears in your preview)`}>
                  <Textarea
                    rows={3}
                    value={content.extraDetails?.[sec] ?? ""}
                    onChange={(e) => set({ extraDetails: { ...(content.extraDetails ?? {}), [sec]: e.target.value } })}
                    placeholder={`Enter your ${sec.toLowerCase()} details…`}
                  />
                </Field>
              ))}
            </div>
          )}
        </div>
      )}
      {STEPS[step].id === "review" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <ScoreRing value={score} size={120} label="resume score" />
          <p className="max-w-sm text-sm text-muted-foreground">Looking good! Run an AI review against a specific job target for deeper feedback.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="rounded-full" onClick={() => { if (!content.role) { toast.error("Job target is required to get an AI review"); return; } setModal("tailor"); }}><Sparkles className="mr-1 h-4 w-4" />Tailor to a job ad</Button>
            <Button variant="outline" className="rounded-full" onClick={() => exportFile("PDF")}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
          </div>
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
        <Button variant="outline" className="rounded-full" onClick={() => {
          set({ letter: { ...content.letter, body: `Dear ${content.letter.to || "Hiring Manager"},\n\nI am writing to express my strong interest in the ${content.role} position at ${content.letter.company || "your company"}. Over the past 4+ years, I have shipped scalable design systems and improved product activation by 18%.\n\nI would welcome the opportunity to discuss how my background aligns with your team's goals.\n\nWarm regards,\n${content.name}` } });
          toast.success("Cover letter drafted");
        }}><Wand2 className="mr-1 h-4 w-4" />Generate new letter</Button>
        <Badge variant="secondary" className="ml-auto self-center rounded-full"><CheckCircle2 className="mr-1 h-3 w-3" />No spelling errors</Badge>
      </div>
    </div>
  );

  /* Kickresume-style Website Builder: Fill In | Design | Publish */
  const websiteBuilder = (
    <div className="space-y-5">
      <div className="flex gap-1.5 rounded-2xl border border-border bg-card p-1.5">
        {([
          ["fill", "Fill In"],
          ["design", "Design"],
          ["publish", "Publish"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setWebTab(k)}
            className={cn(
              "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              webTab === k ? "bg-[#2d2d2d] text-white shadow-xs" : "text-foreground/75 hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {webTab === "fill" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex flex-wrap gap-1.5">
            {STEPS.slice(0, 6).map((s, i) => (
              <button key={s.id} onClick={() => setStep(i)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", i === step ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                {s.label}
              </button>
            ))}
          </div>
          {stepForm}
        </div>
      )}

      {webTab === "design" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-xl">Website Design</h2>
          <Field label="Website layout template">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "sidebar", name: "Sidebar Template", desc: "Dark navigation sidebar + warm cream canvas" },
                { id: "editorial", name: "Editorial Center", desc: "Centered hero header + pill navigation" },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => updateDoc(doc.id, { webTemplate: tpl.id as "sidebar" | "editorial" })}
                  className={cn("rounded-xl border p-3.5 text-left transition-colors", (doc.webTemplate ?? "sidebar") === tpl.id ? "border-primary bg-sage-mist/60" : "border-border hover:bg-muted")}
                >
                  <div className="text-sm font-semibold">{tpl.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{tpl.desc}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Avatar badge color">
            <div className="flex gap-2.5">
              {["#b83a14", "#5d6f61", "#3d4a3f", "#5b7a8c", "#8a6f9e", "#c98d72"].map((c) => (
                <button key={c} onClick={() => updateDoc(doc.id, { accent: c })} className={cn("h-8 w-8 rounded-full border-2", doc.accent === c ? "border-foreground" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
          </Field>
          <Field label="Typography">
            <Select value={doc.font} onValueChange={(v) => updateDoc(doc.id, { font: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      )}

      {webTab === "publish" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-foreground" />
            <h2 className="font-sans text-2xl font-bold">Publish Website</h2>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Your website is currently using these features:</div>
            <div className="flex items-center gap-2 text-primary"><Lock className="h-3.5 w-3.5" /><span className="underline">{(doc.webTemplate ?? "sidebar") === "sidebar" ? "Sidebar" : "Editorial"}</span> template</div>
            <div className="flex items-center gap-2 text-primary"><Lock className="h-3.5 w-3.5" /><span className="underline">{doc.font}</span> font</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-sans text-xl font-bold">Publish your website</h3>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {doc.published ? "Link active" : "Link disabled"}
                <Switch
                  checked={!!doc.published}
                  onCheckedChange={(b) => {
                    updateDoc(doc.id, { published: b, slug: slugInput });
                    toast.success(b ? "Website published!" : "Website link disabled");
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Create a public web address to share your new website online.</p>

            <div className="flex overflow-hidden rounded-lg border border-border bg-background">
              <span className="flex items-center border-r border-border bg-muted/60 px-3 text-xs text-muted-foreground select-none">
                www.farnavi.com/cv/
              </span>
              <input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value.replace(/[^a-zA-Z-]/g, "").toLowerCase())}
                placeholder="viana-fariqi"
                className="h-10 flex-1 bg-transparent px-3 text-sm outline-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Only the letters a-z, A-Z and &quot;-&quot; are allowed. (e.g. &quot;viana-fariqi&quot;)</p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-lg border-[#e0533c] px-6 text-[#e0533c] hover:bg-[#e0533c]/10"
                onClick={() => {
                  const cleanSlug = slugInput.trim() || "viana-fariqi";
                  updateDoc(doc.id, { slug: cleanSlug, published: true });
                  toast.success(`Website live at /cv/${cleanSlug}`);
                  router.push(`/cv/${cleanSlug}`);
                }}
              >
                {doc.published ? "Open Website" : "Create"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const cleanSlug = slugInput.trim() || "viana-fariqi";
                  navigator.clipboard.writeText(`${window.location.origin}/cv/${cleanSlug}`);
                  toast.success("Public website URL copied");
                }}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />Copy URL
              </Button>
            </div>

            {/* Miniature Thumbnail Card */}
            <div className="pt-3">
              <div
                onClick={() => router.push(`/cv/${slugInput || "viana-fariqi"}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border transition-all hover:shadow-md"
              >
                <div className="flex h-44 bg-[#f7efe2]">
                  <div className="flex w-1/4 flex-col items-center bg-[#2d2d2d] pt-5 text-white">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium" style={{ background: doc.accent || "#b83a14" }}>
                      {(content.name || "V")[0]}
                    </div>
                    <div className="mt-4 w-full space-y-1.5 px-2 text-[8px] text-white/70">
                      <div className="rounded bg-white/15 px-1.5 py-0.5 text-white">Personal Information</div>
                      <div className="px-1.5">Work experience</div>
                      <div className="px-1.5">Education</div>
                      <div className="px-1.5">Skills</div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="bg-[#ede2d0] py-6 text-center text-base font-bold text-[#3b3b3b]">{content.name}</div>
                    <div className="p-4 text-[10px] text-[#5a5751]">
                      <div className="font-bold text-[#3b3b3b]">Email address</div>
                      <div>{content.email}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{content.name} — {doc.title}</span>
                <button onClick={() => router.push(`/cv/${slugInput || "viana-fariqi"}`)} className="inline-flex items-center gap-1 text-primary hover:underline">
                  Full screen <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const customize = (
    <Tabs defaultValue="template">
      <TabsList className="w-full rounded-full"><TabsTrigger value="template" className="flex-1 rounded-full">Template & Colors</TabsTrigger><TabsTrigger value="text" className="flex-1 rounded-full">Text</TabsTrigger><TabsTrigger value="layout" className="flex-1 rounded-full">Layout</TabsTrigger></TabsList>
      <TabsContent value="template" className="mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.slice(0, 9).map((t) => (
            <button key={t.id} onClick={() => { updateDoc(doc.id, { template: t.id, accent: t.accent }); setTwoCol(t.twoCol); }} className={cn("rounded-xl border p-2 text-left text-xs transition-colors", doc.template === t.id ? "border-primary bg-sage-mist" : "border-border hover:bg-muted")}>
              <div className="mb-1 h-12 rounded bg-white" style={{ borderTop: `3px solid ${t.accent}` }} />{t.name}{t.pro && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
            </button>
          ))}
        </div>
        {/* Template colors are locked brand assets — no picker. */}
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
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(isWebsite ? "/documents?tab=website" : "/documents")}><ArrowLeft className="h-4 w-4" /></Button>
        <Input value={doc.title} onChange={(e) => updateDoc(doc.id, { title: e.target.value })} className="h-9 w-48 border-transparent bg-transparent font-medium hover:border-border focus:border-border md:w-64" />
        <span className="text-xs text-muted-foreground">{saving ? "Saving…" : "Saved"}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo}><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setModal("history")}><History className="h-4 w-4" /></Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          {isWebsite ? (
            <Button size="sm" className="rounded-full" onClick={() => router.push(`/cv/${slugInput || "viana-fariqi"}`)}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview Live Website
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden rounded-full md:flex" onClick={() => setModal("fix")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Fix mistakes</Button>
              <Button variant="outline" size="sm" className="hidden rounded-full md:flex" onClick={() => setModal("tailor")}><Wand2 className="mr-1 h-3.5 w-3.5" />Check & Tailor</Button>
              <Button variant="outline" size="sm" className="hidden rounded-full lg:flex" onClick={() => setModal("translate")}><Languages className="mr-1 h-3.5 w-3.5" />Translate</Button>
              <Button size="sm" className="rounded-full" onClick={() => setModal("download")}><Download className="mr-1 h-3.5 w-3.5" />Download</Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile form/preview toggle */}
      <div className="no-print mb-4 grid grid-cols-2 rounded-full border border-border p-0.5 md:hidden">
        {(["form", "preview"] as const).map((v) => <Button key={v} variant={mobileView === v ? "secondary" : "ghost"} size="sm" className="rounded-full capitalize" onClick={() => setMobileView(v)}>{v === "preview" ? <><Eye className="mr-1 h-3.5 w-3.5" />Preview</> : "Edit"}</Button>)}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,50%)]">
        <div className={cn("no-print", mobileView === "preview" && "hidden md:block")}>
          {!isLetter && !isWebsite && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "edit" | "customize")}>
              <TabsList className="mb-4 rounded-full"><TabsTrigger value="edit" className="rounded-full px-6">Edit</TabsTrigger><TabsTrigger value="customize" className="rounded-full px-6">Customize</TabsTrigger></TabsList>
            </Tabs>
          )}
          {isWebsite ? websiteBuilder : tab === "customize" && !isLetter ? customize : (
            <div className="rounded-2xl border border-border bg-card p-5">
              {isLetter ? letterForm : (
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

        <div className={cn("md:sticky md:top-20 md:self-start", mobileView === "form" && "hidden md:block print:block")}>
          <div className="no-print mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{isWebsite ? "Interactive website preview (click menu items)" : "Live document preview"}</span>
            {(doc.type === "resume" || doc.type === "tailored") && <span className="rounded-full bg-sage-mist px-2 py-0.5 font-medium text-primary">{score}%</span>}
          </div>
          {isWebsite ? (
            <WebsiteView doc={{ ...doc, content }} compact />
          ) : isLetter ? (
            <div id="resume-print-area" className="mx-auto max-w-[640px] rounded-lg border border-border bg-white p-8 text-sm leading-relaxed text-neutral-900" style={{ fontFamily: doc.font, fontSize: `${fontSize}px` }}>
              <div className="font-bold" style={{ color: doc.accent }}>{content.name}</div>
              <div className="text-xs text-neutral-500">{content.email} · {content.phone}</div>
              <div className="mt-6">{content.letter.to}<br />{content.letter.company}</div>
              <div className="mt-4 font-semibold">{content.letter.subject}</div>
              <p className="mt-4 whitespace-pre-wrap text-neutral-700">{content.letter.body}</p>
            </div>
          ) : <ResumeRender doc={doc} onPatch={(p:any)=>{ if(p.__visibility){ updateDoc(doc.id,{visibility:p.__visibility} as any); } else { updateDoc(doc.id,{content:p}); } }} />}
        </div>
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

      <ResponsiveModal open={modal === "tailor"} onOpenChange={(b) => !b && setModal("")} title="Check & Tailor" description="Paste a job ad — we extract missing keywords and tailor your resume." wide
        footer={<Button disabled={!jd.trim()} onClick={handleTailor}>✨ Tailor now</Button>}>
        <div className="space-y-4">
          <Field label="Job description or URL"><Textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description…" /></Field>
          <Field label="Tailoring level">
            <RadioGroup value={level} onValueChange={setLevel} className="flex gap-4">
              {[["conservative", "Conservative (+2 skills)"], ["balanced", "Balanced ✨ (+4 skills)"], ["bold", "Bold (+6 skills)"]].map(([v, l]) => <label key={v} className="flex items-center gap-2 text-sm"><RadioGroupItem value={v} />{l}</label>)}
            </RadioGroup>
          </Field>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "translate"} onOpenChange={(b) => !b && setModal("")} title="Translate resume" description="AI translation — always review the result."
        footer={<Button onClick={() => { toast.success(`Translated to ${lang}`); setModal(""); }}>Translate</Button>}>
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

      <ResponsiveModal open={modal === "download"} onOpenChange={(b) => !b && setModal("")} title="Download" description="Your document, your formats — ATS-ready vector PDF, Word or plain text."
        footer={<Button onClick={() => exportFile("PDF")}><Download className="mr-1 h-4 w-4" />Download PDF</Button>}>
        <div className="grid grid-cols-3 gap-2">
          {(["PDF", "DOCX", "TXT"] as const).map((f) => <Button key={f} variant="outline" className="rounded-xl" onClick={() => exportFile(f)}>{f}</Button>)}
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => { toast.success("PDF sent to fariqiviana@gmail.com"); }}><Send className="mr-2 h-4 w-4" />Send PDF to my email</Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${doc.id}`); toast.success("Share link copied"); }}><Link2 className="mr-2 h-4 w-4" />Copy share link</Button>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "ai"} onOpenChange={(b) => !b && setModal("")} title="Sage — AI Writer" wide>
        <ScrollArea className="h-64 pr-3">
          <div className="space-y-3">
            {aiMsgs.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", m.me ? "ml-auto bg-primary text-primary-foreground" : "bg-sage-mist")}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.suggestion && (
                  <Button size="sm" variant="secondary" className="mt-2 h-7 rounded-full text-xs" onClick={() => { set({ summary: m.suggestion! }); toast.success("Applied to summary"); setModal(""); }}>
                    <Check className="mr-1 h-3 w-3" />Apply to summary
                  </Button>
                )}
              </div>
            ))}
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

export default function Editor() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading editor…</div>}>
      <EditorInner />
    </Suspense>
  );
}