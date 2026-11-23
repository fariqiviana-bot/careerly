"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useStore, type TrackItem } from "@/lib/store";
import { STATUS, STATUS_ORDER, type TrackStatus } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, ResponsiveModal, StatusBadge, StatCard, Field, DangerConfirm } from "@/components/shared";
import { Plus, MoreHorizontal, SquareKanban, Table as TableIcon, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTrackDate(raw?: string): string {
  if (!raw) return "Recently";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

export default function Tracker() {
  const { tracker, addTrack, moveTrack, updateTrack, removeTrack, docs, addInterview } = useStore();
  const [view, setView] = useState<"board" | "table">("board");
  const [add, setAdd] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", url: "", notes: "" });
  const [sel, setSel] = useState<TrackItem | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ id: string; to: TrackStatus } | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const current = sel ? tracker.find((t) => t.id === sel.id) ?? null : null;

  const exportCsv = () => {
    const rows = [["Title", "Company", "Status", "Location", "Salary", "Date"], ...tracker.map((t) => [t.title, t.company, STATUS[t.status].label, t.location, t.salary, formatTrackDate(t.date)])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = "job-tracker.csv"; a.click(); toast.success("CSV exported");
  };

  const Card = ({ t }: { t: TrackItem }) => (
    <div className="rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button className="min-w-0 text-left" onClick={() => setSel(t)}>
          <div className="truncate text-sm font-medium">{t.title}</div>
          <div className="text-xs text-muted-foreground">{t.company} · {t.location}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{formatTrackDate(t.date)} · {t.salary}</div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSel(t)}>Open</DropdownMenuItem>
            {STATUS_ORDER.filter((s) => s !== t.status).map((s) => <DropdownMenuItem key={s} onClick={() => setConfirmMove({ id: t.id, to: s })}>Move to {STATUS[s].label}</DropdownMenuItem>)}
            <DropdownMenuItem className="text-destructive" onClick={() => setDel(t.id)}>Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Job tracker" sub="One name per status, everywhere — board, cards and reports." actions={<>
        <div className="flex rounded-full border border-border p-0.5">
          <Button variant={view === "board" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView("board")}><SquareKanban className="h-4 w-4" /></Button>
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView("table")}><TableIcon className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" className="rounded-full" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />CSV</Button>
        <Button className="rounded-full" onClick={() => setAdd(true)}><Plus className="mr-1 h-4 w-4" />Add job</Button>
      </>} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Applications sent" value={tracker.filter((t) => ["applied", "interviewing", "offer"].includes(t.status)).length} hint="last 30 days" />
        <StatCard label="In interviewing" value={tracker.filter((t) => t.status === "interviewing").length} hint="active now" />
        <StatCard label="Shortlisted" value={tracker.filter((t) => t.status === "shortlist").length} hint="ready to apply" />
        <StatCard label="Offers" value={tracker.filter((t) => t.status === "offer").length} hint="all time" />
      </div>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {STATUS_ORDER.map((s) => {
            const items = tracker.filter((t) => t.status === s);
            return (
              <div key={s} className="w-[270px] shrink-0 rounded-2xl bg-muted/60 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", STATUS[s].dot)} />
                  <span className="text-sm font-medium">{STATUS[s].label}</span>
                  <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => <Card key={t.id} t={t} />)}
                  {items.length === 0 && <div className="rounded-xl border border-dashed border-sage-line p-4 text-center text-xs text-muted-foreground">Nothing here yet</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card scrollbar-thin">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
              {["Position", "Company", "Status", "Location", "Salary", "Date added"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {tracker.map((t) => (
                <tr key={t.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted" onClick={() => setSel(t)}>
                  <td className="px-4 py-3 font-medium">{t.title}</td><td className="px-4 py-3">{t.company}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">{t.location}</td><td className="px-4 py-3">{t.salary}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTrackDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add job */}
      <ResponsiveModal open={add} onOpenChange={setAdd} title="Add job details"
        footer={<Button disabled={!form.title || !form.company} onClick={() => { addTrack({ ...form, status: "shortlist", location: "", salary: "" }); setAdd(false); setForm({ title: "", company: "", url: "", notes: "" }); toast.success("Job added to Shortlist"); }}>Add job</Button>}>
        <div className="space-y-4">
          <Field label="Job title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Company" required><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label="URL"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </ResponsiveModal>

      {/* Job detail — 5 tabs (Enhancv pattern) */}
      <ResponsiveModal open={!!current} onOpenChange={(b) => !b && setSel(null)} title={current?.title ?? ""} description={current ? `${current.company} · ${current.location}` : ""} wide>
        {current && (
          <Tabs defaultValue="overview">
            <TabsList className="w-full overflow-x-auto rounded-full scrollbar-thin">
              {["overview", "documents", "networking", "notes", "interview"].map((t) => <TabsTrigger key={t} value={t} className="flex-1 rounded-full capitalize">{t === "interview" ? "Interview help" : t}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm">Status</span><StatusBadge status={current.status} /></div>
              <Field label="Move to status">
                <Select value={current.status} onValueChange={(v) => setConfirmMove({ id: current.id, to: v as TrackStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS[s].label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Job URL"><Input value={current.url} onChange={(e) => updateTrack(current.id, { url: e.target.value })} /></Field>
            </TabsContent>
            <TabsContent value="documents" className="mt-4 space-y-3">
              {["Resume", "Cover letter"].map((k) => (
                <Field key={k} label={k}>
                  <Select><SelectTrigger><SelectValue placeholder={`Attach a ${k.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{docs.filter((d) => k === "Resume" ? d.type === "resume" || d.type === "tailored" : d.type === "cover").map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent></Select>
                </Field>
              ))}
            </TabsContent>
            <TabsContent value="networking" className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Recruiter name"><Input placeholder="Jane Doe" /></Field><Field label="Email / LinkedIn"><Input placeholder="jane@company.com" /></Field></div>
              <Button variant="outline" className="rounded-full" onClick={() => toast.success("Outreach message generated (demo)")}><Sparkles className="mr-1 h-4 w-4" />Generate outreach message</Button>
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <Textarea rows={6} value={current.notes} onChange={(e) => updateTrack(current.id, { notes: e.target.value })} placeholder="Add your notes here…" />
            </TabsContent>
            <TabsContent value="interview" className="mt-4">
              <Button className="rounded-full" onClick={() => { addInterview({ title: current.title, company: current.company, seniority: "Mid", mode: "Personalized" }); toast.success("Interview prep created"); setSel(null); }}>Prepare for this interview</Button>
            </TabsContent>
          </Tabs>
        )}
      </ResponsiveModal>

      <DangerConfirm open={!!confirmMove} onOpenChange={(b) => !b && setConfirmMove(null)} title="Change status?"
        desc={confirmMove ? `Move this job to “${STATUS[confirmMove.to].label}”? You can undo by moving it back.` : ""}
        onConfirm={() => { if (confirmMove) { moveTrack(confirmMove.id, confirmMove.to); toast.success(`Moved to ${STATUS[confirmMove.to].label}`); } }} />
      <DangerConfirm open={!!del} onOpenChange={(b) => !b && setDel(null)} title="Remove job?" desc="This removes the job from your tracker." onConfirm={() => { if (del) { removeTrack(del); toast.success("Removed"); } }} />
    </div>
  );
}