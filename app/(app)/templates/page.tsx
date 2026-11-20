"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_CATALOG, previewOf, fileOf, gdocOf, type Tpl } from "@/lib/template-catalog";
import { useStore, templateContentForSeries } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageHeader, ResponsiveModal } from "@/components/shared";
import { Crown, Download, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "All", label: "All (8)" },
  { id: "ATS-friendly", label: "Single-Column ATS (3)" },
  { id: "Two-column", label: "Two-Column (5)" },
  { id: "Photo", label: "With Photo / Emblem (2)" },
  { id: "Free", label: "Free (3)" },
  { id: "Pro", label: "Pro (5)" },
] as const;

export default function Templates() {
  const router = useRouter();
  const { addDoc } = useStore();
  const [filter, setFilter] = useState<string>("All");
  const [sel, setSel] = useState<Tpl | null>(null);
  const [docKind, setDocKind] = useState<"resume" | "cover" | "references">("resume");
  const [size, setSize] = useState<"a4" | "letter">("a4");
  const [pages, setPages] = useState(1);

  const list = useMemo(
    () =>
      TEMPLATE_CATALOG.filter(
        (t) =>
          filter === "All" ||
          (filter === "ATS-friendly" && t.columns === 1) ||
          (filter === "Two-column" && t.columns === 2) ||
          (filter === "Photo" && t.photo) ||
          (filter === "Free" && t.tier === "free") ||
          (filter === "Pro" && t.tier === "premium")
      ),
    [filter]
  );

  const openModal = (t: Tpl) => {
    setSel(t);
    setDocKind("resume");
    setSize("a4");
    setPages(1);
  };

  const handleUseInStudio = (t: Tpl) => {
    const sample = templateContentForSeries(t.id);
    const d = addDoc("resume", `${t.name} Resume`, {
      template: t.id,
      series: t.id,
      content: sample,
    });
    setSel(null);
    router.push(`/editor/${d.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Templates"
        sub="8 curated resume architectures — each with matching cover letter and references in A4 & US Letter."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{list.length} templates</span>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t) => (
          <div key={t.id} className="group flex flex-col text-left">
            <div
              role="button"
              tabIndex={0}
              onClick={() => openModal(t)}
              onKeyDown={(e) => e.key === "Enter" && openModal(t)}
              className="relative aspect-[210/297] w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(32,33,36,0.06)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(32,33,36,0.12)]"
            >
              <img
                src={previewOf(t.id, "resume", 1, "a4")}
                alt={t.name}
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="block rounded-full bg-primary py-2 text-center text-xs font-medium text-primary-foreground shadow-md">
                  Edit in Studio
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
              <span className="truncate text-sm font-semibold text-foreground">{t.name}</span>
              {t.tier === "premium" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/80 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <Crown className="h-2.5 w-2.5" /> Pro
                </span>
              ) : (
                <span className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-primary">
                  Free
                </span>
              )}
            </div>
            <div className="mt-0.5 px-0.5 text-xs text-muted-foreground">
              {t.columns === 2 ? "Two-column" : "Single-column ATS"} · {t.fonts.heading}
            </div>
          </div>
        ))}
      </div>

      {sel && (
        <ResponsiveModal
          open={Boolean(sel)}
          onOpenChange={(v) => !v && setSel(null)}
          title={sel.name}
          description={`${sel.columns === 2 ? "Two-column layout" : "Single-column ATS layout"} · ${sel.fonts.heading} & ${sel.fonts.body}`}
        >
          <div className="grid gap-5 md:grid-cols-12">
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm md:col-span-7">
              <img
                src={previewOf(sel.id, docKind, pages, size)}
                alt={sel.name}
                className="block w-full"
              />
            </div>

            <div className="flex flex-col justify-between space-y-4 md:col-span-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Document Type</label>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                    {(["resume", "cover", "references"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDocKind(k)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-medium capitalize transition-colors",
                          docKind === k ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                        )}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Paper Size</label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                    {(["a4", "letter"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSize(sz)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-medium uppercase transition-colors",
                          size === sz ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                        )}
                      >
                        {sz === "a4" ? "A4" : "US Letter"}
                      </button>
                    ))}
                  </div>
                </div>

                {docKind === "resume" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Pages</label>
                    <div className="flex gap-1.5">
                      {sel.pages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPages(p)}
                          className={cn(
                            "flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                            pages === p ? "border-primary bg-sage-mist/50 text-primary" : "border-border bg-card"
                          )}
                        >
                          {p} {p === 1 ? "Page" : "Pages"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full rounded-full" onClick={() => handleUseInStudio(sel)}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Edit {sel.name} Live in Studio
                </Button>

                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="text-[11px] font-semibold text-muted-foreground">Original Static Files</div>
                  <div className="grid grid-cols-2 gap-2">
                    {fileOf(sel.id, docKind, size, "docx", pages) && (
                      <a
                        href={fileOf(sel.id, docKind, size, "docx", pages)!.url}
                        download
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" /> Word (.docx)
                      </a>
                    )}
                    {fileOf(sel.id, docKind, size, "pdf", pages) && (
                      <a
                        href={fileOf(sel.id, docKind, size, "pdf", pages)!.url}
                        download
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF (.pdf)
                      </a>
                    )}
                  </div>
                  {gdocOf(sel.id, docKind, size, pages) && (
                    <a
                      href={gdocOf(sel.id, docKind, size, pages)!.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sage-line bg-sage-mist/30 py-2 text-xs font-medium text-primary hover:bg-sage-mist"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in Google Docs
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </div>
  );
}