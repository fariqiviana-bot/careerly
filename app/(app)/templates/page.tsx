"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TEMPLATES, ACCENTS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, GradientPanel } from "@/components/shared";
import { BorderBeam } from "@/components/magicui";
import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "ATS", "Two column", "With photo", "Free", "Pro"] as const;

export default function Templates() {
  const router = useRouter();
  const { addDoc } = useStore();
  const [filter, setFilter] = useState<string>("All");
  const [accent, setAccent] = useState<string | null>(null);

  const list = TEMPLATES.filter((t) =>
    (filter === "All" || (filter === "ATS" && t.ats) || (filter === "Two column" && t.twoCol) || (filter === "With photo" && t.photo) || (filter === "Free" && !t.pro) || (filter === "Pro" && t.pro)) &&
    (!accent || t.accent === accent));

  return (
    <div>
      <PageHeader title="Templates" sub="Every template is recruiter-tested. ATS-friendly ones are marked on the card." />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter(f)}>{f}</Button>)}
        <div className="ml-auto flex items-center gap-1.5">
          {ACCENTS.map((c) => <button key={c} onClick={() => setAccent(accent === c ? null : c)} className={cn("h-6 w-6 rounded-full border-2", accent === c ? "border-foreground" : "border-transparent")} style={{ background: c }} aria-label={c} />)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t) => (
          <div key={t.id} className="group relative rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(43,47,42,0.10)]">
            {t.pro && <BorderBeam />}
            <div className="relative aspect-[210/260] overflow-hidden rounded-xl border border-border bg-white p-3">
              <div className="h-2 w-1/2 rounded" style={{ background: t.accent }} />
              <div className="mt-2 h-1.5 w-3/4 rounded bg-foreground/15" />
              <div className={cn("mt-3 gap-2", t.twoCol ? "grid grid-cols-[1fr_38%]" : "")}>
                <div className="space-y-1.5">{[...Array(8)].map((_, i) => <div key={i} className="h-1 rounded bg-foreground/8" style={{ width: `${92 - (i % 3) * 20}%` }} />)}</div>
                {t.twoCol && <div className="space-y-1.5">{[...Array(5)].map((_, i) => <div key={i} className="h-1 rounded bg-foreground/8" />)}</div>}
              </div>
              {t.photo && <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-sage-soft" />}
              <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <Button size="sm" className="w-full rounded-full" onClick={() => { if (t.pro) { toast.info("Pro template — see plans"); router.push("/pricing"); return; } const d = addDoc("resume", `${t.name} Resume`, { template: t.id, accent: t.accent }); router.push(`/editor/${d.id}`); }}>
                  {t.pro ? <><Crown className="mr-1 h-3.5 w-3.5" />Pro</> : <><Check className="mr-1 h-3.5 w-3.5" />Use template</>}
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-sm font-medium">{t.name}</span>
              <div className="flex gap-1">{t.ats && <Badge variant="secondary" className="rounded-full bg-sage-mist text-[10px] text-primary">ATS</Badge>}{t.pro && <Badge className="rounded-full bg-accent text-[10px] text-accent-foreground hover:bg-accent">Pro</Badge>}</div>
            </div>
          </div>
        ))}
      </div>

      <GradientPanel className="mt-8 p-6 md:p-8">
        <div className="glass flex flex-col items-start gap-4 rounded-xl p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="font-serif text-2xl">500+ premium templates with Pro</div>
            <p className="mt-1 text-sm text-foreground/70">Plus unlimited documents, AI tailoring and full ATS reports.</p>
          </div>
          <Button className="rounded-full" onClick={() => router.push("/pricing")}>See plans</Button>
        </div>
      </GradientPanel>
    </div>
  );
}