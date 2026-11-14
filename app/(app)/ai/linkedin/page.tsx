"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { LINKEDIN_STEPS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Field } from "@/components/shared";
import { Linkedin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LinkedInCoach() {
  const [url, setUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState<boolean[]>(LINKEDIN_STEPS.map((_, i) => i === 0));
  const pct = Math.round((done.filter(Boolean).length / LINKEDIN_STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="LinkedIn Coach" sub="A 15-step profile optimization, guided by Sage." />
      {!connected ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mist"><Linkedin className="h-5 w-5 text-primary" /></div><div><div className="font-medium">What is your LinkedIn profile?</div><div className="text-xs text-muted-foreground">We'll audit it against the 15-step checklist.</div></div></div>
          <div className="mt-4 flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="linkedin.com/in/your-name" />
            <Button className="rounded-full" disabled={!url.includes("linkedin.com")} onClick={() => { setConnected(true); toast.success("Profile connected — audit started"); }}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-1 flex justify-between text-sm"><span className="font-medium">Profile optimization</span><span>{done.filter(Boolean).length}/15 · {pct}%</span></div>
          <Progress value={pct} className="mb-5 h-2" />
          <div className="space-y-1.5">
            {LINKEDIN_STEPS.map((s, i) => (
              <label key={s} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors", done[i] ? "border-primary/30 bg-sage-mist/50" : "border-border hover:bg-muted")}>
                <Checkbox checked={done[i]} onCheckedChange={(b) => setDone(done.map((x, j) => j === i ? !!b : x))} />
                <span className={cn(done[i] && "text-muted-foreground line-through")}>{i + 1}. {s}</span>
                {done[i] && <Check className="ml-auto h-4 w-4 text-primary" />}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}