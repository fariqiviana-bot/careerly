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
import { previewOf } from "@/lib/template-catalog";
import { MoreHorizontal, Pin, Pencil, Copy, Sparkles, Download, Trash2, Tag, History, Share2, Layers, FileText, Globe } from "lucide-react";

const TYPE_LABEL: Record<string, string> = { resume: "Resume", cover: "Cover letter", resignation: "Resignation", website: "Website", tailored: "Auto-tailored" };

export function DocCard({ doc }: { doc: Doc }) {
  const router = useRouter();
  const { updateDoc, removeDoc, duplicateDoc, docs } = useStore();
  const [modal, setModal] = useState<"" | "rename" | "label" | "versions" | "combine" | "delete">("");
  const [title, setTitle] = useState(doc.title);
  const [label, setLabel] = useState(doc.label ?? "");
  const [combineId, setCombineId] = useState("");
  const covers = docs.filter((d) => d.type === "cover");

  const publicUrl = doc.type === "website" ? `/cv/${doc.slug || "viana-fariqi"}` : `/s/${doc.id}`;

  const download = (fmt: "PDF" | "DOCX" | "TXT") => {
    const c = doc.content;
    if (fmt === "PDF") {
      router.push(`/s/${doc.id}?print=1`);
      return;
    }
    if (fmt === "TXT") {
      const txt = `${c.name} — ${c.role}\n${c.email} · ${c.phone} · ${c.location}\n\nSUMMARY\n${c.summary}\n\nEXPERIENCE\n${c.experience.map((e) => `${e.role} @ ${e.company} (${e.period})\n${e.description}`).join("\n\n")}\n\nSKILLS\n${c.skills.join(", ")}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
      a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
      a.click();
      toast.success("TXT downloaded");
      return;
    }
    if (fmt === "DOCX") {
      const html = `<html><head><meta charset="utf-8"><title>${doc.title}</title></head><body style="font-family: Calibri, Arial, sans-serif; line-height: 1.5;"><h1>${c.name}</h1><h3>${c.role}</h3><p>${c.email} | ${c.phone} | ${c.location}</p><hr/><h2>Summary</h2><p>${c.summary}</p><h2>Experience</h2>${c.experience.map((e) => `<p><b>${e.role} — ${e.company}</b> (${e.period})<br/>${e.description}</p>`).join("")}<h2>Education</h2>${c.education.map((e) => `<p><b>${e.degree}</b>, ${e.school} (${e.period})</p>`).join("")}<h2>Skills</h2><p>${c.skills.join(", ")}</p></body></html>`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" }));
      a.download = `${doc.title.replace(/\s+/g, "_")}.doc`;
      a.click();
      toast.success("Word document downloaded");
    }
  };

  return (
    <>
      <div className="group relative rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(43,47,42,0.08)]">
        <button onClick={() => router.push(`/editor/${doc.id}`)} className="block w-full">
          {doc.type === "website" ? (
            /* Kickresume Website Miniature Preview on Card */
            <div className="relative flex aspect-[210/260] overflow-hidden rounded-xl border border-border bg-[#f7efe2] text-left">
              <div className="flex w-[34%] flex-col items-center bg-[#2d2d2d] pt-4 text-white">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: doc.accent || "#b83a14" }}>
                  {(doc.content.name || "V")[0]}
                </div>
                <div className="mt-3 w-full space-y-1 px-1.5 text-[7px] text-white/70">
                  <div className="truncate rounded bg-white/15 px-1 py-0.5 text-white">Personal Info</div>
                  <div className="truncate px-1">Experience</div>
                  <div className="truncate px-1">Education</div>
                  <div className="truncate px-1">Skills</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="bg-[#ede2d0] py-4 text-center text-[11px] font-bold text-[#3b3b3b]">{doc.content.name}</div>
                <div className="p-2.5 text-[8px] text-[#5a5751]">
                  <div className="font-bold text-[#3b3b3b]">Email address</div>
                  <div className="truncate">{doc.content.email}</div>
                </div>
              </div>
              {doc.published && <span className="absolute right-2 top-2 rounded-full bg-[#e6f0e8] px-1.5 py-0.5 text-[9px] font-semibold text-[#33613d]">Live</span>}
            </div>
          ) : (
            <div className="relative aspect-[210/297] overflow-hidden rounded-xl border border-border bg-white">
            {previewOf(doc.template) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewOf(doc.template)} alt={doc.title} className="size-full object-cover object-top" />
            ) : (
              <div className="p-3">
                <div className="h-2 w-1/2 rounded bg-muted" />
                <div className="mt-2 h-1.5 w-3/4 rounded bg-muted" />
                <div className="mt-3 space-y-1.5">{[...Array(8)].map((_, i) => <div key={i} className="h-1 rounded bg-muted" style={{ width: `${90 - (i % 3) * 18}%` }} />)}</div>
              </div>
            )}
            {doc.pinned && <span className="absolute right-2 top-2 rounded-full bg-accent p-1"><Pin className="h-3 w-3 text-accent-foreground" /></span>}
          </div>
          )}
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
              <DropdownMenuItem onClick={() => router.push(publicUrl)}><Globe className="mr-2 h-4 w-4" />{doc.type === "website" ? "Open live website" : "View shared page"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTitle(doc.title); setModal("rename"); }}><FileText className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateDoc(doc.id)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateDoc(doc.id, { pinned: !doc.pinned })}><Pin className="mr-2 h-4 w-4" />{doc.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModal("label")}><Tag className="mr-2 h-4 w-4" />Add label</DropdownMenuItem>
              {(doc.type === "resume" || doc.type === "tailored") && <DropdownMenuItem onClick={() => router.push(`/editor/${doc.id}?tailor=1`)}><Sparkles className="mr-2 h-4 w-4" />Tailor for job</DropdownMenuItem>}
              {doc.type !== "website" && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><Download className="mr-2 h-4 w-4" />Download</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => download("PDF")}>PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => download("DOCX")}>DOCX</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => download("TXT")}>TXT</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {doc.type === "resume" && <DropdownMenuItem onClick={() => setModal("combine")}><Layers className="mr-2 h-4 w-4" />Combine with cover letter</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => setModal("versions")}><History className="mr-2 h-4 w-4" />Version history</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`); toast.success("Link copied"); }}><Share2 className="mr-2 h-4 w-4" />Copy link</DropdownMenuItem>
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
        <Field label="Label" hint="e.g. Fintech, FAANG, Europe market"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a label" /></Field>
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
        footer={<Button disabled={!combineId} onClick={() => { setModal(""); router.push(`/s/${doc.id}?print=1`); }}>Download Combined PDF</Button>}>
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