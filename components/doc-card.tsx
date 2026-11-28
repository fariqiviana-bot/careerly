"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiDownloadTxt } from "@/lib/api/export-client";
import { useStore, type Doc } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ResponsiveModal, DangerConfirm, Field } from "@/components/shared";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { LiveDocThumb } from "@/components/render/live-thumb";
import {
  MoreHorizontal,
  Pin,
  Pencil,
  Copy,
  Sparkles,
  Download,
  Trash2,
  FileText,
  Globe,
} from "lucide-react";

function formatEditedDate(raw?: string): string {
  if (!raw) return "Just now";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString();
}

export function DocCard({ doc }: { doc: Doc }) {
  const router = useRouter();
  const { removeDoc, duplicateDoc, renameDoc, togglePinDoc } = useStore();
  const [modal, setModal] = useState<"" | "rename" | "delete">("");
  const [title, setTitle] = useState(doc.title);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  useEffect(() => { setTitle(doc.title); }, [doc.title]);

  const sId = doc.series || doc.template || "11";
  const tplMeta = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[3];
  const publicUrl = doc.type === "website" ? `/cv/${doc.slug || "viana-fariqi"}` : `/s/${doc.id}`;
  const cleanTitle = doc.title.replace(/^Series\s+\d+\s*[—\-·]\s*/i, "");

  const download = async (fmt: "PDF" | "DOCX" | "TXT") => {
    if (fmt === "PDF") {
      router.push(`/editor/${doc.id}?download=pdf`);
      return;
    }
    if (fmt === "DOCX") {
      router.push(`/editor/${doc.id}?download=docx`);
      return;
    }
    try {
      await apiDownloadTxt({
        fileName: doc.content?.name || cleanTitle,
        content: doc.content || {},
        visibility: (doc as any).visibility || {},
        sectionOrder: (doc as any).sectionOrder || [],
        customLabels: (doc as any).customLabels || {},
      });
      toast.success("ATS Plain-Text (.txt) downloaded");
    } catch {
      toast.error("Plain-text export failed");
    }
  };

  return (
    <>
      <div className="group flex flex-col">
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/editor/${doc.id}`)}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/editor/${doc.id}`)}
          className="relative aspect-[210/297] w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(32,33,36,0.06)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(32,33,36,0.12)]"
        >
          {doc.type === "website" ? (
            <div className="relative flex h-full w-full overflow-hidden bg-[#f7efe2] text-left">
              <div className="flex w-[34%] flex-col items-center bg-[#2d2d2d] pt-5 text-white">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: doc.accent || "#b83a14" }}
                >
                  {(doc.content.name || "V")[0]}
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="bg-[#ede2d0] py-5 text-center text-xs font-bold text-[#3b3b3b]">
                  {doc.content.name}
                </div>
                <div className="p-3 text-[9px] text-[#5a5751]">{doc.content.email}</div>
              </div>
            </div>
          ) : (
            <LiveDocThumb doc={doc} />
          )}

          {doc.pinned && (
            <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-foreground shadow-xs backdrop-blur-xs">
              <Pin className="h-3 w-3" />
            </span>
          )}

          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground shadow-md">
              <Pencil className="h-3.5 w-3.5" /> Edit in Studio
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{cleanTitle}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {tplMeta?.name} · Edited {formatEditedDate(doc.updatedAt)}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => router.push(`/editor/${doc.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit in Studio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(publicUrl)}>
                <Globe className="mr-2 h-4 w-4" />
                View shared link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTitle(cleanTitle);
                  setModal("rename");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busyAction === "duplicate"}
                onClick={async () => {
                  if (busyAction) return;
                  setBusyAction("duplicate");
                  try {
                    const copyId = await duplicateDoc(doc.id);
                    if (copyId) toast.success("Document duplicated");
                    else toast.error("Failed to duplicate document");
                  } finally {
                    setBusyAction(null);
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busyAction === "pin"}
                onClick={async () => {
                  if (busyAction) return;
                  setBusyAction("pin");
                  try {
                    const nextPinned = !doc.pinned;
                    const ok = await togglePinDoc(doc.id, nextPinned);
                    if (ok) toast.success(nextPinned ? "Document pinned" : "Document unpinned");
                    else toast.error("Failed to update pin status");
                  } finally {
                    setBusyAction(null);
                  }
                }}
              >
                <Pin className="mr-2 h-4 w-4" />
                {doc.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/editor/${doc.id}?tab=tailor`)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Tailor to job
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => download("PDF")}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => download("DOCX")}>DOCX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => download("TXT")}>TXT</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setModal("delete")}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResponsiveModal
        open={modal === "rename"}
        onOpenChange={(b) => !b && setModal("")}
        title="Rename document"
        footer={
          <Button
            className="rounded-full"
            disabled={busyAction === "rename" || !title.trim()}
            onClick={async () => {
              const trimmed = title.trim();
              if (!trimmed || busyAction) return;
              setBusyAction("rename");
              try {
                const ok = await renameDoc(doc.id, trimmed);
                if (ok) {
                  setModal("");
                  toast.success("Document renamed");
                } else {
                  toast.error("Failed to rename document");
                }
              } finally {
                setBusyAction(null);
              }
            }}
          >
            Save
          </Button>
        }
      >
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </ResponsiveModal>

      <DangerConfirm
        open={modal === "delete"}
        onOpenChange={(b) => !b && setModal("")}
        title="Delete document?"
        desc={`"${cleanTitle}" will be permanently removed.`}
        onConfirm={async () => {
          const ok = await removeDoc(doc.id);
          if (ok) toast.success("Document deleted");
          else toast.error("Failed to delete document ? restored");
        }}
      />
    </>
  );
}