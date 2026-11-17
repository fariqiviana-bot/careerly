"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_CATALOG, previewOf, fileOf, gdocOf, type Tpl } from "@/lib/template-catalog";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, ResponsiveModal } from "@/components/shared";
import { Crown, Download, ExternalLink, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "ATS-friendly", "Free", "Pro", "Two-column"] as const;

export default function Templates() {
  const router = useRouter();
  const { addDoc } = useStore();
  const [filter, setFilter] = useState<string>("All");
  const [sel, setSel] = useState<Tpl | null>(null);
  const [size, setSize] = useState<"a4" | "letter">("a4");
  const [pages, setPages] = useState(1);

  const list = useMemo(() => TEMPLATE_CATALOG.filter((t) =>
    filter === "All" ||
    (filter === "ATS-friendly" && t.ats) ||
    (filter === "Free" && t.tier === "free") ||
    (filter === "Pro" && t.tier === "premium") ||
    (filter === "Two-column" && t.columns === 2)), [filter]);

  const open = (t: Tpl) => { setSel(t); setSize("a4"); setPages(t.pages[0] ?? 1); };
  const use = (t: Tpl) => {
    const d = addDoc("resume", `${t.name} Resume`, { template: t.id });
    setSel(null); router.push(`/editor/${d.id}`);
  };

  return (
    <div>
      <PageHeader title="Templates"
        sub={`${TEMPLATE_CATALOG.length} designed series · resume, cover letter and references in matching design.`} />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
            className="rounded-full" onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">{list.length} shown</span>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((t) => (
          <button key={t.id} onClick={() => open(t)}
            className="group text-left">
            <div className="relative aspect-[210/297] overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_3px_rgba(43,47,42,0.07)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-sage-line group-hover:shadow-[0_14px_30px_rgba(43,47,42,0.13)]">
              {previewOf(t.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewOf(t.id)} alt={t.name} className="size-full object-cover object-top" />
              ) : <div className="flex size-full items-center justify-center text-xs text-muted-foreground">no preview</div>}
              <div className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <span className="block rounded-full bg-primary py-1.5 text-center text-xs font-medium text-primary-foreground">
                  Preview &amp; use
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{t.name}</span>
              <div className="flex shrink-0 gap-1">
                {t.ats && <Badge variant="secondary" className="rounded-full bg-sage-mist text-[10px] text-primary">ATS</Badge>}
                {t.tier === "premium"
                  ? <Badge className="rounded-full bg-accent text-[10px] text-accent-foreground hover:bg-accent"><Crown className="mr-0.5 h-2.5 w-2.5" />Pro</Badge>
                  : <Badge variant="secondary" className="rounded-full text-[10px]">Free</Badge>}
              </div>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {t.pages.join("/")}-page · {t.columns === 2 ? "Two-column" : "Single-column"}
              {t.hasReferences && " · References"}
            </div>
          </button>
        ))}
      </div>

      <ResponsiveModal open={!!sel} onOpenChange={(b) => !b && setSel(null)} wide
        title={sel?.name ?? ""}
        description={sel ? `${sel.fonts.heading ?? ""}${sel.fonts.body && sel.fonts.body !== sel.fonts.heading ? " + " + sel.fonts.body : ""} · fonts and colors are fixed by design` : ""}
        footer={sel && <>
          <Button variant="outline" onClick={() => setSel(null)}>Close</Button>
          <Button onClick={() => use(sel)}><Check className="mr-1 h-4 w-4" />Use this template</Button>
        </>}>
        {sel && (
          <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewOf(sel.id, size, pages)} alt={sel.name} className="w-full object-cover object-top" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {sel.ats && <Badge variant="secondary" className="rounded-full bg-sage-mist text-primary">ATS-friendly · {sel.atsScore}/100</Badge>}
                {sel.photo && <Badge variant="secondary" className="rounded-full">Photo</Badge>}
                {sel.hasCover && <Badge variant="secondary" className="rounded-full">Cover letter</Badge>}
                {sel.hasReferences && <Badge variant="secondary" className="rounded-full">References</Badge>}
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium">Page size</div>
                <div className="flex gap-1.5">
                  {(["a4","letter"] as const).map((s) => (
                    <Button key={s} size="sm" variant={size === s ? "default" : "outline"}
                      className="rounded-full" disabled={!sel.sizes.includes(s)}
                      onClick={() => setSize(s)}>{s === "a4" ? "A4" : "US Letter"}</Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium">Length</div>
                <div className="flex gap-1.5">
                  {sel.pages.map((p) => (
                    <Button key={p} size="sm" variant={pages === p ? "default" : "outline"}
                      className="rounded-full" onClick={() => setPages(p)}>{p}-page</Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium">Download blank files</div>
                <div className="space-y-1.5">
                  {(["resume","cover","references"] as const).map((d) => {
                    const pdf = fileOf(sel.id, d, size, "pdf", pages);
                    const docx = fileOf(sel.id, d, size, "docx", pages);
                    const gd = gdocOf(sel.id, d, size, pages);
                    if (!pdf && !docx && !gd) return null;
                    return (
                      <div key={d} className="flex items-center gap-1.5 rounded-lg border border-border p-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-xs capitalize">{d}</span>
                        {pdf && <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2 text-[11px]"><a href={pdf.url} target="_blank" rel="noreferrer">PDF</a></Button>}
                        {docx && <Button asChild size="sm" variant="outline" className="h-7 rounded-full px-2 text-[11px]"><a href={docx.url} download>DOCX</a></Button>}
                        {gd && <Button asChild size="sm" variant="ghost" className="h-7 rounded-full px-2 text-[11px]"><a href={gd.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3 w-3" />Docs</a></Button>}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Blank files open in Word or Google Docs. To fill them inside Farnavi, use
                  <span className="font-medium"> Use this template</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}
