"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore, type DocType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocCard } from "@/components/doc-card";
import { CreateResumeModal } from "@/components/studio/create-resume-modal";
import { PageHeader, EmptyState } from "@/components/shared";
import { Plus, Files, LayoutGrid, List, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { id: DocType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "resume", label: "Resumes" },
  { id: "cover", label: "Cover Letters" },
  { id: "tailored", label: "Auto-tailored" },
  { id: "website", label: "Websites" },
];

function DocumentsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { docs, addDoc, user, setUser } = useStore();
  const [tab, setTab] = useState<string>(sp.get("tab") || "all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("updated");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = sp.get("tab");
    if (t) setTab(t);
  }, [sp]);

  const list = useMemo(
    () =>
      docs
        .filter((d) => (tab === "all" || d.type === tab) && d.title.toLowerCase().includes(q.toLowerCase()))
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            (sort === "updated" ? b.updatedAt.localeCompare(a.updatedAt) : a.title.localeCompare(b.title))
        ),
    [docs, tab, q, sort]
  );

  return (
    <div>
      <PageHeader
        title="My Documents"
        sub="All 8 uploaded resume templates, matching cover letters, and your personal portfolio website."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setUser({ plan: user.plan === "Pro" ? "Free" : "Pro" })}
              title="Toggle Free / Pro preview mode"
            >
              <Crown className="mr-1.5 h-3.5 w-3.5 text-accent-foreground" />
              {user.plan === "Pro" ? "Pro Plan Active (Click for Free)" : "Free Plan (Click to test Pro)"}
            </Button>
            <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create New
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 flex-1">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-full bg-muted p-1 scrollbar-thin">
            {TABS.map((t) => {
              const n = t.id === "all" ? docs.length : docs.filter((d) => d.type === t.id).length;
              return (
                <TabsTrigger key={t.id} value={t.id} className="rounded-full text-xs md:text-sm">
                  {t.label}
                  <span className="ml-1.5 text-muted-foreground">{n}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search documents…"
          className="w-full rounded-full sm:w-56"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last edited</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <div className="hidden rounded-full border border-border p-0.5 md:flex">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Files className="h-6 w-6" />}
          title="Your shining professional image"
          sub="Start from one of your 8 signature templates, tailor to a job description, or import from LinkedIn."
          action={
            <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create New Resume
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* Dashed Quick-Create Card (Teal / Kickresume / Resume.io pattern) */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-line bg-card/50 p-6 text-center transition-all hover:-translate-y-1 hover:border-primary hover:bg-sage-mist/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-mist text-primary transition-transform group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">Create New Resume</div>
            <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">
              Pick from 8 templates, match a job ad, or import LinkedIn
            </p>
          </button>

          {list.map((d) => (
            <DocCard key={d.id} doc={d} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((d, i) => (
            <button
              key={d.id}
              onClick={() => router.push(`/editor/${d.id}`)}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted",
                i > 0 && "border-t border-border"
              )}
            >
              <div className="h-10 w-8 rounded border border-border" style={{ borderTopColor: d.accent, borderTopWidth: 3 }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  Series {d.series || d.template} · edited {((d.updatedAt && !isNaN(new Date(d.updatedAt).getTime())) ? new Date(d.updatedAt).toLocaleDateString() : "Today")}
                </div>
              </div>
              {d.score > 0 && (
                <span className="rounded-full bg-sage-mist px-2 py-0.5 text-xs font-medium text-primary">{d.score}%</span>
              )}
            </button>
          ))}
        </div>
      )}

      <CreateResumeModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export default function Documents() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading documents…</div>}>
      <DocumentsInner />
    </Suspense>
  );
}