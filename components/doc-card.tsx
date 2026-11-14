"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore, type Doc } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { ResponsiveModal, DangerConfirm, Field } from "@/components/shared";
import { MoreHorizontal, Pin, Pencil, Copy, Sparkles, Download, Trash2, Tag, History, Share2, Layers, FileText } from "lucide-react";

const TYPE_LABEL: Record<string, string> = { resume: "Resume", cover: "Cover letter", resignation: "Resignation", website: "Website", tailored: "Auto-tailored" };

export function DocCard({ doc }: { doc: Doc }) {
  const router = useRouter();
  const { updateDoc, removeDoc, duplicateDoc, docs } = useStore();
  const [modal, setModal] = useState<"" | "rename" | "label" | "versions" | "combine" | "delete" | "download">("");
  const [title, setTitle] = useState(doc.title);
  const [label, setLabel] = useState(doc.label ?? "");
  const [combineId, setCombineId] = useState("");
  const covers = docs.filter((d) => d.type === "cover");

  const download = (fmt: string) => {
    if (fmt === "TXT") {
      const c = doc.content;
      const txt = `${c.name} — ${c.role}\n${c.email} · ${c.phone} · ${c.location}\n\nSUMMARY\n${c.summary}\n\nEXPERIENCE\n${c.experience.map((e) => `${e.role} @ ${e.company} (${e.period})\n${e.description}`).join("\n\n")}\n\nSKILLS\n${c.skills.join(", ")}`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); a.download = `${doc.title}.txt`; a.click();
      toast.success("TXT downloaded");
    } else toast.success(`${fmt} export queued — you'll get an email (demo)`);
    setModal("");
  };

  return (
    <>
      <div className="group relative rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(43,47,42,0.08)]">
        <button onClick={() => router.push(`/editor/${doc.id}`)} className="block w-full">
          <div className="relative aspect-[210/260] overflow-hidden rounded-xl border border-border bg-white p-3 text-left">
            <div className="h-2 w-1/2 rounded" style={{ background: doc.accent }} />
            <div className="mt-2 h-1.5 w-3/4 rounded bg-foreground/15" />
            <div className="mt-1 h-1.5 w-1/2 rounded bg-foreground/10" />
            <div className="mt-3 space-y-1.5">{[...Array(7)].map((_, i) => <div key={i} className="h-1 rounded bg-foreground/10" style={{ width: `${90 - (i % 3) * 18}%` }} />)}</div>
            <div className="mt-3 h-1.5 w-1/3 rounded" style={{ background: doc.accent, opacity: .5 }} />
            <div className="mt-2 space-y-1.5">{[...Array(4)].map((_, i) => <div key={i} className="h-1 rounded bg-foreground/10" style={{ width: `${85 - (i % 2) * 25}%` }} />)}</div>
            {doc.pinned && <span className="absolute right-2 top-2 rounded-full bg-accent p-1"><Pin className="h-3 w-3 text-accent-foreground" /></span>}
          </div>
        </button>
        <div className="mt-3 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{doc.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">{TYPE_LABEL[doc.type]}</Badge>
              {doc.score > 0 && <span className="rounded-full bg-sage-mist px-1.5 py-0 font-medium text-primary">{doc.score}%</span>}
              {doc.label && <span className="rounded-full bg-accent px-1.5 py-0 text-accent-foreground">{doc.label}</span>}
              <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => router.push(`/editor/${doc.id}`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTitle(doc.title); setModal("rename"); }}><FileText className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateDoc(doc.id)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateDoc(doc.id, { pinned: !doc.pinned })}><Pin className="mr-2 h-4 w-4" />{doc.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModal("label")}><Tag className="mr-2 h-4 w-4" />Add label</DropdownMenuItem>
              {(doc.type === "resume" || doc.type === "tailored") && <DropdownMenuItem onClick={() => router.push(`/editor/${doc.id}?tailor=1`)}><Sparkles className="mr-2 h-4 w-4" />Tailor for job</DropdownMenuItem>}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Download className="mr-2 h-4 w-4" />Download</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => download("PDF")}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => download("DOCX")}>DOCX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => download("TXT")}>TXT</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {doc.type === "resume" && <DropdownMenuItem onClick={() => setModal("combine")}><Layers className="mr-2 h-4 w-4" />Combine with cover letter</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => setModal("versions")}><History className="mr-2 h-4 w-4" />Version history</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`https://careerly.app/s/${doc.id}`); toast.success("Share link copied"); }}><Share2 className="mr-2 h-4 w-4" />Share link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setModal("delete")}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResponsiveModal open={modal === "rename"} onOpenChange={(b) => !b && setModal("")} title="Rename document"
        footer={<Button onClick={() => { updateDoc(doc.id, { title }); setModal(""); toast.success("Renamed"); }}>Save</Button>}>
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "label"} onOpenChange={(b) => !b && setModal("")} title="Label"
        footer={<Button onClick={() => { updateDoc(doc.id, { label: label || undefined }); setModal(""); }}>Save</Button>}>
        <Field label="Label" hint="e.g. Fintech, FAANG, Iran market"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a label" /></Field>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "versions"} onOpenChange={(b) => !b && setModal("")} title="Version history" description="Autosaved versions of this document.">
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div className="text-sm">{new Date(Date.now() - i * 864e5).toLocaleString()}</div>
              <Button size="sm" variant="outline" onClick={() => { toast.success("Version restored"); setModal(""); }}>Restore</Button>
            </div>
          ))}
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={modal === "combine"} onOpenChange={(b) => !b && setModal("")} title="Combine into one PDF" description="Merge this resume with a cover letter."
        footer={<Button disabled={!combineId} onClick={() => { toast.success("Combined PDF ready (demo)"); setModal(""); }}>Download PDF</Button>}>
        <Field label="Cover letter">
          <Select value={combineId} onValueChange={setCombineId}>
            <SelectTrigger><SelectValue placeholder="Choose a cover letter" /></SelectTrigger>
            <SelectContent>{covers.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </ResponsiveModal>

      <DangerConfirm open={modal === "delete"} onOpenChange={(b) => !b && setModal("")} title="Delete document?" desc={`"${doc.title}" will be permanently removed.`} onConfirm={() => { removeDoc(doc.id); toast.success("Document deleted"); }} />
    </>
  );
}