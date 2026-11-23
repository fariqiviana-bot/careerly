"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientPanel } from "@/components/shared";
import { Sparkles, Send, Upload, Linkedin, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const REPLIES: [RegExp, string][] = [
  [/tailor|match/i, "Paste a job ad in Check & Tailor — I'll score the match and rewrite your bullets to mirror the role's language. Want me to open it?"],
  [/interview/i, "I can generate questions for any role. Tell me the job title and seniority, or open Interviews to practice with STAR hints."],
  [/linkedin/i, "Your LinkedIn Coach checklist is 1/15 done. Start with a custom URL and a headline that states your target role + proof."],
  [/summary|resume|cv/i, "Try: “Product designer with 4+ years in B2B SaaS; shipped a design system used by 30+ engineers; lifted activation 18%.” — specific, quantified, short."],
];

export default function AI() {
  const [msgs, setMsgs] = useState([{ me: false, text: "You are back. What has happened since? I can write, tailor, review, or plan your next move." }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = (t?: string) => {
    const q = t ?? input; if (!q.trim()) return;
    setMsgs((m) => [...m, { me: true, text: q }]); setInput("");
    const reply = REPLIES.find(([re]) => re.test(q))?.[1] ?? "Got it. I can help with resumes, cover letters, job search, interviews and your LinkedIn. What outcome do you want this week?";
    setTimeout(() => setMsgs((m) => [...m, { me: false, text: reply }]), 500);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-180px)] max-w-2xl flex-col">
      <GradientPanel className="mb-4 p-4" calm>
        <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
          <div><div className="font-medium">Sage</div><div className="text-xs text-muted-foreground">Your AI career assistant</div></div>
        </div>
      </GradientPanel>
      <div className="flex-1 space-y-3 overflow-y-auto pb-4 scrollbar-thin">
        {msgs.map((m, i) => <div key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.me ? "ml-auto bg-primary text-primary-foreground" : "bg-card border border-border")}>{m.text}</div>)}
        <div ref={endRef} />
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[{ l: "Import your old resume", i: Upload }, { l: "Import from LinkedIn", i: Linkedin }, { l: "Ask me questions", i: HelpCircle }].map((c) => (
          <Button key={c.l} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => send(c.l)}><c.i className="mr-1 h-3 w-3" />{c.l}</Button>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Make changes, edit, or ask anything about your career…" className="rounded-full" />
        <Button type="submit" size="icon" className="rounded-full"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}