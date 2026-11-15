"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, type DocType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocCard } from "@/components/doc-card";
import { PageHeader, EmptyState, ResponsiveModal, Field } from "@/components/shared";
import { Plus, Files, LayoutGrid, List, Upload, Linkedin, Sparkles, FileText, Globe, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { id: DocType | "all"; label: string }[] = [
  { id: "all", label: "All" }, { id: "resume", label: "Resumes" }, { id: "cover", label: "Cover Letters" },
  { id: "resignation", label: "Resignation Letters" }, { id: "website", label: "Websites" }, { id: "tailored", label: "Auto-tailored" },
];

function DocumentsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { docs, addDoc } = useStore();
  const [tab, setTab] = useState<string>(sp.get("tab") || "all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("updated");
  const [importModal, setImportModal] = useState<"" | "upload" | "linkedin">("");
  const [liUrl, setLiUrl] = useState("");

  useEffect(() => {
    const t = sp.get("tab");
    if (t) setTab(t);
  }, [sp]);

  const list = useMemo(() => docs
    .filter((d) => (tab === "all" || d.type === tab) && d.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (sort === "updated" ? b.updatedAt.localeCompare(a.updatedAt) : a.title.localeCompare(b.title))),
  [docs, tab, q, sort]);

  const create = (type: DocType, title: string, via?: string) => {
    const d = addDoc(type, title);
    if (via) toast.success(`${via} — imported & reformatted`);
    router.push(`/editor/${d.id}`);
  };

  const createMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button className="rounded-full"><Plus className="mr-1 h-4 w-4" />Create New</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => create("resume", "New Resume")}><FileText className="mr-2 h-4 w-4" />Resume — start blank</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/templates")}><LayoutGrid className="mr-2 h-4 w-4" />Resume — from template</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setImportModal("upload")}><Upload className="mr-2 h-4 w-4" />Upload resume (PDF/DOCX)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setImportModal("linkedin")}><Linkedin className="mr-2 h-4 w-4" />Import from LinkedIn</DropdownMenuItem>
        <DropdownMenuItem onClick={() => create("cover", "New Cover Letter", "AI")}><Sparkles className="mr-2 h-4 w-4" />Cover letter — with AI</DropdownMenuItem>
        <DropdownMenuItem onClick={() => create("resignation", "Resignation Letter")}><PenLine className="mr-2 h-4 w-4" />Resignation letter</DropdownMenuItem>
        <DropdownMenuItem onClick={() => create("website", "Personal Website")}><Globe className="mr-2 h-4 w-4" />Personal website (Portfolio)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
      <PageHeader title="My Documents" sub="Resumes, cover letters, resignation letters and your personal websites." actions={
        tab === "website" ? (
          <Button className="rounded-full" onClick={() => create("website", "Personal Website")}><Plus className="mr-1 h-4 w-4" />Create New Website</Button>
        ) : createMenu
      } />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 flex-1">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-full bg-muted p-1 scrollbar-thin">
            {TABS.map((t) => {
              const n = t.id === "all" ? docs.length : docs.filter((d) => d.type === t.id).length;
              return <TabsTrigger key={t.id} value={t.id} className="rounded-full text-xs md:text-sm">{t.label}<span className="ml-1.5 text-muted-foreground">{n}</span></TabsTrigger>;
            })}
          </TabsList>
        </Tabs>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="w-full sm:w-52" />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="updated">Last edited</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent>
        </Select>
        <div className="hidden rounded-full border border-border p-0.5 md:flex">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-full" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Files className="h-6 w-6" />} title="Your shining professional image" sub="Create your first document or personal website — start blank, import, or let AI draft it." action={createMenu} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((d) => <DocCard key={d.id} doc={d} />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((d, i) => (
            <button key={d.id} onClick={() => router.push(`/editor/${d.id}`)} className={cn("flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted", i > 0 && "border-t border-border")}>
              <div className="h-10 w-8 rounded border border-border" style={{ borderTopColor: d.accent, borderTopWidth: 3 }} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{d.title}</div><div className="text-xs text-muted-foreground">{d.type} · edited {new Date(d.updatedAt).toLocaleDateString()}</div></div>
              {d.score > 0 && <span className="rounded-full bg-sage-mist px-2 py-0.5 text-xs font-medium text-primary">{d.score}%</span>}
            </button>
          ))}
        </div>
      )}

      <ResponsiveModal open={importModal === "upload"} onOpenChange={(b) => !b && setImportModal("")} title="Upload your resume" description="PDF or DOCX — we'll reformat it into a template instantly.">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-line bg-sage-mist/40 px-6 py-10 text-center hover:bg-sage-mist">
          <Upload className="h-6 w-6 text-primary" />
          <span className="mt-2 text-sm font-medium">Drag & drop, or browse</span>
          <span className="text-xs text-muted-foreground">PDF or DOCX · up to 10MB</span>
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => {
            const f = e.target.files?.[0];
            create("resume", f ? f.name.replace(/\.[^.]+$/, "") : "Imported Resume", "Resume uploaded");
          }} />
        </label>
      </ResponsiveModal>

      <ResponsiveModal open={importModal === "linkedin"} onOpenChange={(b) => !b && setImportModal("")} title="Import from LinkedIn" description="Your profile must be public."
        footer={<Button disabled={!liUrl.includes("linkedin.com")} onClick={() => create("resume", "LinkedIn Resume", "LinkedIn profile")}>Convert to resume</Button>}>
        <Field label="LinkedIn URL"><Input value={liUrl} onChange={(e) => setLiUrl(e.target.value)} placeholder="linkedin.com/in/your-name" /></Field>
      </ResponsiveModal>
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