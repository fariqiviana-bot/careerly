"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore, type Job } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader, ResponsiveModal, Field } from "@/components/shared";
import { Search, Heart, Sparkles, Star, Zap, MapPin, SlidersHorizontal, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function RiskBadge({ risk }: { risk: Job["risk"] }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", risk === "Low" ? "bg-[#e6f0e8] text-[#33613d]" : "bg-[#f6ecdd] text-[#7c5a2e]")}>{risk} ghost-job risk</span>;
}

export default function Jobs() {
  const router = useRouter();
  const { jobs, savedJobs, toggleSaveJob, addTrack, credits, setCredits, autoConfigured } = useStore();
  const [q, setQ] = useState(""); const [loc, setLoc] = useState("");
  const [mode, setMode] = useState("any"); const [salary, setSalary] = useState([0]);
  const [alerts, setAlerts] = useState(true);
  const [sel, setSel] = useState<Job | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const list = useMemo(() => jobs.filter((j) =>
    (j.title + j.company + j.tags.join()).toLowerCase().includes(q.toLowerCase()) &&
    j.location.toLowerCase().includes(loc.toLowerCase()) &&
    (mode === "any" || j.mode === mode)), [jobs, q, loc, mode]);

  const save = (j: Job) => { toggleSaveJob(j.id); toast.success(savedJobs.includes(j.id) ? "Removed from saved" : "Saved to tracker"); if (!savedJobs.includes(j.id)) addTrack({ title: j.title, company: j.company, url: `https://example.com/${j.id}`, status: "shortlist", location: j.location, salary: j.salary, notes: "" }); };
  const autoApply = (j: Job) => {
    if (!autoConfigured) { toast.info("Set up Auto Apply first"); router.push("/auto-apply"); return; }
    if (credits <= 0) { toast.error("Out of credits — upgrade for 20 applies/day"); return; }
    addTrack({ title: j.title, company: j.company, url: `https://example.com/${j.id}`, status: "auto", location: j.location, salary: j.salary, notes: "" });
    toast.success("Added to Auto Apply queue");
  };

  const Detail = ({ j }: { j: Job }) => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-mist text-lg font-semibold text-primary">{j.company[0]}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl leading-tight">{j.title}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>{j.company}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span><span>· {j.mode} · {j.posted}</span></div>
        </div>
        <RiskBadge risk={j.risk} />
      </div>
      <div className="flex flex-wrap gap-1.5">{j.tags.map((t) => <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>)}<Badge className="rounded-full bg-accent text-accent-foreground hover:bg-accent">{j.salary}</Badge></div>
      <div className="rounded-xl bg-sage-mist p-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />AI Job Summary</div>
        <p className="mt-1 text-sm">{j.summary}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Star className="h-4 w-4 fill-peach text-peach" />{j.rating} · {j.reviews} company reviews</div>
        <p className="mt-1 text-xs text-muted-foreground">{j.applicants.toLocaleString()} applicants · salary is our estimate · posted {j.posted}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-full" onClick={() => toast.success("Opening application (demo)")}><ExternalLink className="mr-1 h-4 w-4" />Apply now</Button>
        <Button variant="outline" className="rounded-full" onClick={() => autoApply(j)}><Zap className="mr-1 h-4 w-4" />Auto Apply</Button>
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => save(j)}><Heart className={cn("h-4 w-4", savedJobs.includes(j.id) && "fill-peach text-peach")} /></Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Find jobs" sub="Fresh, real, open roles — with ghost-job risk on every card." actions={
        <label className="flex items-center gap-2 text-sm text-muted-foreground">Email alerts<Switch checked={alerts} onCheckedChange={(b) => { setAlerts(b); toast.success(b ? "Job alert created" : "Alert paused"); }} /></label>} />

      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Remote product designer with Figma" /></div>
          <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City, state, or country" />
          <Button className="rounded-full"><Search className="mr-1 h-4 w-4" />Find jobs</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["Product Designer near New York", "Remote with Figma", "Roles paying ~$80k"].map((s) => <Button key={s} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setQ(s)}>{s}</Button>)}
          <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="mr-1 h-3.5 w-3.5" />All filters</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <div className="text-sm text-muted-foreground">{list.length} jobs found</div>
          {list.map((j) => (
            <button key={j.id} onClick={() => setSel(j)} className={cn("w-full rounded-2xl border bg-card p-4 text-left transition-colors", sel?.id === j.id ? "border-primary bg-sage-mist/40" : "border-border hover:bg-muted")}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-mist text-sm font-semibold text-primary">{j.company[0]}</div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{j.title}</div><div className="text-xs text-muted-foreground">{j.company} · {j.location}</div></div>
                <Heart className={cn("h-4 w-4 shrink-0", savedJobs.includes(j.id) ? "fill-peach text-peach" : "text-muted-foreground")} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full text-[10px]">{j.mode}</Badge><span>{j.salary}</span><span>· {j.posted}</span><span className="ml-auto"><RiskBadge risk={j.risk} /></span>
              </div>
            </button>
          ))}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-sm font-medium">How are the results?</div>
            <div className="mt-2 flex gap-2">
              <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Help us improve your search…" className="h-9" />
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setFeedback(""); toast.success("Feedback sent — thank you!"); }}>Submit</Button>
            </div>
          </div>
        </div>
        <div className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-6">
            {sel ? <Detail j={sel} /> : <div className="py-16 text-center text-sm text-muted-foreground">Select a job to see details, AI summary and reviews.</div>}
          </div>
        </div>
      </div>

      {/* Mobile detail */}
      <div className="lg:hidden">
        <ResponsiveModal open={!!sel} onOpenChange={(b) => !b && setSel(null)} title={sel?.title ?? ""} wide>{sel && <Detail j={sel} />}</ResponsiveModal>
      </div>

      <ResponsiveModal open={filtersOpen} onOpenChange={setFiltersOpen} title="All filters"
        footer={<Button onClick={() => setFiltersOpen(false)}>Show results</Button>}>
        <div className="space-y-4">
          <Field label="Workplace type">
            <Select value={mode} onValueChange={setMode}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="Remote">Remote</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem><SelectItem value="On-site">On-site</SelectItem></SelectContent></Select>
          </Field>
          <Field label={`Minimum salary — $${salary[0]}k`}><Slider value={salary} max={250} step={10} onValueChange={setSalary} /></Field>
          <Field label="Date posted">
            <Select defaultValue="any"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">Any time</SelectItem><SelectItem value="30">Past 30 days</SelectItem><SelectItem value="7">Past week</SelectItem></SelectContent></Select>
          </Field>
          <Separator />
          <div className="text-xs text-muted-foreground">Auto Apply credits: <b>{credits}</b> · Pro gets 20/day.</div>
        </div>
      </ResponsiveModal>
    </div>
  );
}