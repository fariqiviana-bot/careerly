"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, GradientPanel, ResponsiveModal, Field } from "@/components/shared";
import { MagicCard, BorderBeam } from "@/components/magicui";
import { Check, Crown, GraduationCap, ShieldCheck, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = ["Unlimited resumes & cover letters", "All 500+ professional templates", "AI writing & job tailoring", "Full ATS reports & recruiter checks", "Auto Apply — up to 20 / day", "Personal website + share links", "Version history & DOCX export", "24/7 support"];
const COMPARE: [string, boolean, boolean][] = [
  ["Documents", true, true], ["Templates", false, true], ["AI tailoring", false, true],
  ["ATS deep report", false, true], ["Auto Apply", false, true], ["Website builder", false, true],
  ["Version history", false, true], ["Human proofreading", false, true],
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const [student, setStudent] = useState(false);
  const price = yearly ? 8 : 24;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="You're about to get hired faster" sub="Transparent pricing — what you see is what you get. Cancel anytime." />
      <div className="mb-6 flex items-center justify-center gap-3 text-sm">
        <span className={cn(!yearly && "font-medium")}>Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={cn(yearly && "font-medium")}>Yearly</span>
        <Badge className="rounded-full bg-accent text-accent-foreground hover:bg-accent">Save 66%</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-2xl">Free</h2>
          <div className="mt-2 text-4xl font-semibold">€0</div>
          <p className="mt-1 text-sm text-muted-foreground">Save your data, search jobs, build 1 resume.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {["1 resume + 1 cover letter", "5 free templates", "Job search & tracker", "Basic ATS score"].map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}
          </ul>
          <Button variant="outline" className="mt-6 w-full rounded-full" disabled>Current plan</Button>
        </div>

        <GradientPanel className="p-1.5">
          <MagicCard className="relative border-white/60 bg-white/80 p-6 backdrop-blur">
            <BorderBeam />
            <div className="flex items-center justify-between"><h2 className="text-2xl">Pro</h2><Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary"><Crown className="mr-1 h-3 w-3" />Most popular</Badge></div>
            <div className="mt-2 flex items-baseline gap-1"><span className="text-4xl font-semibold">€{price}</span><span className="text-sm text-muted-foreground">/ month{yearly && ", billed yearly"}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need, nothing hidden.</p>
            <ul className="mt-5 space-y-2 text-sm">
              {FEATURES.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}
            </ul>
            <Button className="mt-6 w-full rounded-full" onClick={() => toast.success("Checkout (demo) — no charge made")}>Upgrade to Pro</Button>
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />14-day money-back guarantee</p>
          </MagicCard>
        </GradientPanel>
      </div>

      {/* Comparison */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left"><th className="px-4 py-3 font-medium">All subscription benefits</th><th className="px-4 py-3 text-center font-medium">Free</th><th className="px-4 py-3 text-center font-medium">Pro</th></tr></thead>
          <tbody>{COMPARE.map(([f, a, b]) => (
            <tr key={f} className="border-b border-border last:border-0"><td className="px-4 py-2.5">{f}</td>
              <td className="px-4 py-2.5 text-center">{a ? <Check className="mx-auto h-4 w-4 text-primary" /> : "—"}</td>
              <td className="px-4 py-2.5 text-center">{b ? <Check className="mx-auto h-4 w-4 text-primary" /> : "—"}</td></tr>))}
          </tbody>
        </table>
      </div>

      {/* Services */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <PenLine className="h-5 w-5 text-primary" /><div className="mt-2 font-medium">Human proofreading</div>
          <p className="mt-1 text-xs text-muted-foreground">Grammar + readability by native editors. Ready in 2 work days.</p>
          <div className="mt-2 text-xl font-semibold">€26<span className="text-sm font-normal text-muted-foreground"> / resume</span></div>
          <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => toast.success("Proofreading order (demo)")}>Get proofreading</Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <GraduationCap className="h-5 w-5 text-primary" /><div className="mt-2 font-medium">Students & teachers</div>
          <p className="mt-1 text-xs text-muted-foreground">Verify with ISIC/ITIC or UniDays — 6 months of Pro free.</p>
          <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => setStudent(true)}>Verify student status</Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Crown className="h-5 w-5 text-accent-foreground" /><div className="mt-2 font-medium">Career services</div>
          <p className="mt-1 text-xs text-muted-foreground">Resume writing & coaching from $179 — see Career Tools → Coaching.</p>
          <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => toast.info("Open Career Tools → Coaching")}>Explore</Button>
        </div>
      </div>

      <ResponsiveModal open={student} onOpenChange={setStudent} title="Verify your student status" description="Get six months of Pro for free."
        footer={<Button onClick={() => { toast.success("Verification submitted — check your email"); setStudent(false); }}>Continue</Button>}>
        <div className="space-y-4">
          <Field label="Full name"><Input placeholder="Viana Fariqi" /></Field>
          <Field label="Institution"><Input placeholder="University of Tehran" /></Field>
          <Field label="ISIC / ITIC card number"><Input placeholder="Card number" /></Field>
          <Field label="Country"><Select><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent><SelectItem value="ir">Iran</SelectItem><SelectItem value="de">Germany</SelectItem><SelectItem value="us">United States</SelectItem></SelectContent></Select></Field>
        </div>
      </ResponsiveModal>
    </div>
  );
}