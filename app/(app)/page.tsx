"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DocCard } from "@/components/doc-card";
import { GradientPanel, StatusBadge } from "@/components/shared";
import { AnimatedGradientText, NumberTicker } from "@/components/magicui";
import { FileText, Search, MessagesSquare, GraduationCap, Check, Plus, ArrowRight, Sparkles, Briefcase, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const GOALS = [
  { id: "resume", label: "Resume Building", icon: FileText },
  { id: "jobs", label: "Job Search", icon: Search },
  { id: "interview", label: "Interview Prep", icon: MessagesSquare },
  { id: "learning", label: "Learning", icon: GraduationCap },
];

export default function Dashboard() {
  const { user, docs, tracker, interviews, jobs } = useStore();
  const [goal, setGoal] = useState("resume");
  const resumes = docs.filter((d) => d.type === "resume");
  const topScore = Math.max(0, ...resumes.map((d) => (Number.isFinite(Number(d.score)) ? Number(d.score) : 0)));
  const applied = tracker.filter((t) => ["applied", "interviewing", "offer"].includes(t.status)).length;

  const rows: Record<string, [string, string, number][]> = {
    resume: [["Resume score", `${topScore}%`, topScore], ["Tailored resumes", String(docs.filter((d) => d.type === "tailored").length), 40], ["Cover letters", String(docs.filter((d) => d.type === "cover").length), 30]],
    jobs: [["Saved jobs", String(tracker.filter((t) => t.status === "shortlist").length), 20], ["Applications sent", String(applied), 45], ["Job alerts", "1 active", 60]],
    interview: [["Interviews scheduled", String(interviews.length), 30], ["Practice sessions", "0", 0], ["STAR stories ready", "2 / 5", 40]],
    learning: [["Job Search Method", "0%", 0], ["90-Day Plan", "0%", 0], ["Career assessment", "Not taken", 0]],
  };
  const checklist = [
    { label: "Upload your resume", done: resumes.length > 0 },
    { label: "Add a job and get a match score", done: tracker.length > 0 },
    { label: "Save 3 jobs you want to apply to", done: tracker.filter((t) => t.status === "shortlist").length >= 3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl">Hi {user.name.split(" ")[0]}, <AnimatedGradientText>what's your goal today?</AnimatedGradientText></h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)} className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors", goal === g.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}>
              <g.icon className="h-4 w-4" />{g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* PROGRESS */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl">Progress</h2><Badge variant="secondary">{GOALS.find((g) => g.id === goal)?.label}</Badge></div>
            <div className="space-y-4">
              {rows[goal].map(([label, val, pct]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-medium">{val}</span></div>
                  <Progress value={pct} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions 2x2 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { t: "Get a new resume in 20 mins", d: "Start from a template or import.", href: "/documents", icon: FileText },
              { t: "Tailor your resume for every job", d: "AI matches your resume to the job ad.", href: "/checker", icon: Sparkles },
              { t: "Craft a cover letter", d: "Generate a tailored letter in seconds.", href: "/documents", icon: FileText },
              { t: "Match with recruiters hiring now", d: `${jobs.length} fresh roles for ${user.target}.`, href: "/jobs", icon: Briefcase },
            ].map((c) => (
              <Link key={c.t} href={c.href} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(43,47,42,0.08)]">
                <c.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-medium">{c.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.d}</div>
                <div className="mt-3 flex items-center text-sm text-primary">Start<ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></div>
              </Link>
            ))}
          </div>

          {/* Job matches */}
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Your job matches</h2><Button asChild variant="ghost" size="sm"><Link href="/jobs">View all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {jobs.slice(0, 3).map((j) => (
                <Link key={j.id} href="/jobs" className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-sage-mist/50">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-mist text-xs font-semibold text-primary">{j.company[0]}</div>
                    <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium", j.risk === "Low" ? "bg-[#e6f0e8] text-[#33613d]" : "bg-[#f6ecdd] text-[#7c5a2e]")}>{j.risk} risk</span>
                  </div>
                  <div className="mt-2 truncate text-sm font-medium">{j.title}</div>
                  <div className="text-xs text-muted-foreground">{j.company} · {j.mode}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{j.salary} · {j.posted}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent documents */}
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Recent documents</h2><Button asChild variant="outline" size="sm" className="rounded-full"><Link href="/documents"><Plus className="mr-1 h-3.5 w-3.5" />New</Link></Button></div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {docs.slice(0, 3).map((d) => <DocCard key={d.id} doc={d} />)}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg">Get started</h3>
            <div className="mt-3 space-y-3">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-3 text-sm">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", c.done ? "border-primary bg-primary text-primary-foreground" : "border-sage-line")}>{c.done && <Check className="h-3 w-3" />}</span>
                  <span className={cn(c.done && "text-muted-foreground line-through")}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg">This week</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><div className="text-2xl font-semibold"><NumberTicker value={applied} /></div><div className="text-xs text-muted-foreground">Applications sent</div></div>
              <div><div className="text-2xl font-semibold"><NumberTicker value={interviews.length} /></div><div className="text-xs text-muted-foreground">Interviews</div></div>
            </div>
            {interviews[0] && (
              <div className="mt-4 rounded-xl bg-sage-mist p-3">
                <div className="text-xs text-muted-foreground">Upcoming interview</div>
                <div className="mt-0.5 text-sm font-medium">{interviews[0].title}</div>
                <div className="text-xs text-muted-foreground">{interviews[0].company}</div>
                <Button asChild size="sm" variant="outline" className="mt-2 w-full rounded-full"><Link href="/interviews">Prepare now</Link></Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg">Pipeline</h3>
            <div className="mt-3 space-y-2">
              {tracker.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{t.company}</span><StatusBadge status={t.status} />
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-2 w-full"><Link href="/tracker">Open tracker</Link></Button>
          </div>

          <GradientPanel className="p-5">
            <div className="glass rounded-xl p-4">
              <Crown className="h-5 w-5 text-accent-foreground" />
              <div className="mt-2 font-medium">Unlock your full career OS</div>
              <p className="mt-1 text-xs text-foreground/70">500+ templates · Auto Apply · Full ATS reports · AI tailoring</p>
              <Button asChild size="sm" className="mt-3 w-full rounded-full"><Link href="/pricing">See plans</Link></Button>
            </div>
          </GradientPanel>
        </div>
      </div>
    </div>
  );
}