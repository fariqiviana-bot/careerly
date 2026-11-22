"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, calculateDocScore, type Content } from "@/lib/store";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { LANGS } from "@/lib/catalog";
import { ResumeRender } from "@/components/render";
import { WebsiteView } from "@/components/website-view";
import { ContentEditorPanel } from "@/components/studio/content-editor-panel";
import { DesignerPanel } from "@/components/studio/designer-panel";
import { AnalyzerTailorPanel } from "@/components/studio/analyzer-tailor-panel";
import { ResponsiveModal, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Palette,
  ScanSearch,
  Sparkles,
  Download,
  History,
  Languages,
  Undo2,
  Redo2,
  Crown,
  Check,
  ExternalLink,
  FileDown,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudioTab = "content" | "designer" | "analyzer" | "tailor";

export default function EditorStudioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const {
    docs,
    updateDoc,
    translateDoc,
    saveDocVersion,
    restoreDocVersion,
    resetDocToTemplateSample,
    user,
    setUser,
  } = useStore();

  const doc = docs.find((d) => d.id === params.id) || docs[0];
  const [studioTab, setStudioTab] = useState<StudioTab>("content");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [undoStack, setUndoStack] = useState<Content[]>([]);
  const [redoStack, setRedoStack] = useState<Content[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [targetLang, setTargetLang] = useState("English (US)");
  const [upgradeReason, setUpgradeReason] = useState("");
  const [proBannerExpanded, setProBannerExpanded] = useState(false);

  useEffect(() => {
    const t = sp.get("tab");
    if (t === "tailor" || t === "analyzer" || t === "designer" || t === "content") {
      setStudioTab(t);
    }
    const dl = sp.get("download");
    if (dl) {
      setExportOpen(true);
    }
  }, [sp]);

  if (!doc) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Document not found.{" "}
        <button onClick={() => router.push("/documents")} className="text-primary underline">
          Return to Documents
        </button>
      </div>
    );
  }

  const sId = String(doc.series || doc.template || "11");
  const tplMeta = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[0];
  const calc = calculateDocScore(doc.content);
  const isProTemplate = tplMeta.tier === "premium";

  const handlePatchContent = (nextContentOrPatch: any) => {
    if (nextContentOrPatch && nextContentOrPatch.__settings) {
      updateDoc(doc.id, { settings: nextContentOrPatch.__settings });
      return;
    }
    if (nextContentOrPatch && nextContentOrPatch.__visibility) {
      updateDoc(doc.id, { visibility: nextContentOrPatch.__visibility });
      return;
    }
    setUndoStack((prev) => [JSON.parse(JSON.stringify(doc.content)), ...prev.slice(0, 19)]);
    setRedoStack([]);
    updateDoc(doc.id, { content: nextContentOrPatch });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [prev, ...rest] = undoStack;
    setRedoStack((r) => [JSON.parse(JSON.stringify(doc.content)), ...r]);
    setUndoStack(rest);
    updateDoc(doc.id, { content: prev });
    toast.success("Undid last change");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    setUndoStack((u) => [JSON.parse(JSON.stringify(doc.content)), ...u]);
    setRedoStack(rest);
    updateDoc(doc.id, { content: next });
    toast.success("Redid change");
  };

  const handlePrintVectorPdf = () => {
    if (isProTemplate && user.plan !== "Pro") {
      setExportOpen(false);
      setUpgradeReason(`(${tplMeta.name}) is a Pro Studio template. Upgrade or toggle Pro preview mode to export.`);
      return;
    }
    setExportOpen(false);
    setTimeout(() => {
      window.print();
    }, 180);
  };

  const handleExportLiveDocx = () => {
    if (user.plan !== "Pro") {
      setExportOpen(false);
      setUpgradeReason("Live DOCX export is included in the Pro plan (or download the static master DOCX on the right).");
      return;
    }
    const c = doc.content;
    const html = `<html><head><meta charset="utf-8"><title>${doc.title}</title></head><body style="font-family: '${tplMeta.fonts.body}', Calibri, sans-serif; line-height: 1.45; max-width: 720px; margin: 0 auto;"><h1 style="font-family: '${tplMeta.fonts.heading}', Georgia, serif; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 4px;">${c.name}</h1><div style="color: #44546A; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">${c.role}</div><div style="border-top: 1px solid #CFCDCD; border-bottom: 1px solid #CFCDCD; padding: 6px 0; font-size: 10pt; margin-bottom: 16px;">${c.phone} | ${c.email} | ${c.linkedin || ""} | ${c.location}</div><h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #D0CECE; padding-bottom: 4px;">Professional Summary</h2><p style="font-size: 10pt;">${c.summary}</p><h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #D0CECE; padding-bottom: 4px;">Professional Experience</h2>${(c.experience || []).map((e) => `<div style="margin-bottom: 12px;"><div><strong>${e.role}</strong> — <span style="float:right;"><strong>${e.period}</strong></span></div><div>${e.company}</div>${e.showOverview && e.overview ? `<p>${e.overview}</p>` : ""}<p style="white-space: pre-wrap;">${e.description}</p></div>`).join("")}<h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #D0CECE; padding-bottom: 4px;">Education & Certifications</h2>${(c.education || []).map((ed) => `<div><strong>${ed.degree}</strong> — ${ed.school} (${ed.period})</div>`).join("")}${(c.certifications || []).map((ct) => `<div><strong>${ct.name}</strong> — ${ct.issuer} (${ct.date})</div>`).join("")}<h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #D0CECE; padding-bottom: 4px;">Skills</h2><p>${(c.skills || []).join(" · ")}</p></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" }));
    a.download = `${doc.title.replace(/\s+/g, "_")}.doc`;
    a.click();
    toast.success("Live edited Word document downloaded");
  };

  const handleExportTxt = () => {
    const c = doc.content;
    const txt = `${c.name}\n${c.role}\n${c.phone} | ${c.email} | ${c.linkedin || ""} | ${c.location}\n\nPROFESSIONAL SUMMARY\n${c.summary}\n\nPROFESSIONAL EXPERIENCE\n${(c.experience || []).map((e) => `${e.role} | ${e.company} (${e.period})\n${e.description}`).join("\n\n")}\n\nEDUCATION\n${(c.education || []).map((ed) => `${ed.degree} — ${ed.school} (${ed.period})`).join("\n")}\n\nSKILLS\n${(c.skills || []).join(", ")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
    a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    toast.success("ATS Plain-Text (.txt) downloaded");
  };

  if (doc.type === "website") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push("/documents")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={(doc.title || "").replace(/^Series\s+\d+\s*[\u2014\u2013\-\u00b7]+\s*/i, "")}
              onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
              className="h-8 w-64 border-transparent bg-transparent font-medium hover:border-border focus:bg-background"
            />
          </div>
          <Button className="rounded-full" onClick={() => router.push(`/cv/${doc.slug || "viana-fariqi"}`)}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Open Live Portfolio Website
          </Button>
        </div>
        <WebsiteView doc={doc} compact />
      </div>
    );
  }

  return (
    <div className="no-print-shell space-y-4">
      {/* =====================================================================
       * UNIFIED STUDIO TOPBAR (Teal + Enhancv + Resume.io Hybrid Header)
       * =================================================================== */}
      <div className="sticky top-14 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 px-3.5 py-2.5 shadow-xs backdrop-blur">
        {/* Left: Back + Document Title + Autosave Status */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => router.push("/documents")}
            title="Back to My Documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={doc.title}
            onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
            className="h-8 w-44 border-transparent bg-transparent px-2 text-sm font-semibold hover:border-border focus:border-border focus:bg-background sm:w-56"
          />
          <span className="hidden items-center gap-1 rounded-full bg-[#e6f0e8] px-2 py-0.5 text-[10px] font-medium text-[#33613d] sm:inline-flex">
            <Check className="h-3 w-3" /> Saved
          </span>
        </div>

        {/* Center: 4 Primary Studio Mode Tabs (Content Editor | Designer | Analyzer | Job Matcher) */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-muted p-1">
          {[
            { id: "content", label: "Content Editor", icon: FileText },
            { id: "designer", label: "Designer & Layout", icon: Palette },
            {
              id: "analyzer",
              label: "Analyzer & Fix",
              icon: ScanSearch,
              badge: calc.issues.length > 0 ? String(calc.issues.length) : undefined,
            },
            { id: "tailor", label: "Job Matcher", icon: Sparkles },
          ].map((tab) => {
            const active = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStudioTab(tab.id as StudioTab)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
                  active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="rounded-full bg-[#c05b49] px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Undo/Redo + History + Translate + Download CTA */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs lg:inline-flex"
            onClick={() => {
              saveDocVersion(doc.id);
              setHistoryOpen(true);
            }}
          >
            <History className="mr-1 h-3.5 w-3.5" /> History
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs xl:inline-flex"
            onClick={() => setTranslateOpen(true)}
          >
            <Languages className="mr-1 h-3.5 w-3.5" /> Translate
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full px-3.5 text-xs font-semibold"
            onClick={() => setExportOpen(true)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download / Export
          </Button>
        </div>
      </div>

      {/* =====================================================================
       * MAIN SPLIT-SCREEN STUDIO WORKSPACE (Left Form / Right Live 1:1 Paper)
       * =================================================================== */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* LEFT PANE: Active Mode Panel */}
        <div className="space-y-3.5 lg:col-span-6 xl:col-span-5">
          {/* Kickresume Pages 1-2 Transparent Premium Features Banner (Only shown when Free user picks a Pro template) */}
          {isProTemplate && user.plan !== "Pro" && (
            <div className="rounded-2xl border border-accent bg-accent/25 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Crown className="h-4 w-4 text-accent-foreground" />
                  <span>This resume uses 1 Pro Studio feature (Series {sId} · {tplMeta.name}).</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProBannerExpanded((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {proBannerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              {proBannerExpanded && (
                <div className="mt-2.5 space-y-2 border-t border-border/60 pt-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Series {sId} Two-Column / Emblem Master Template
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Free ATS templates: Template, Template, Template
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full text-xs"
                        onClick={() => updateDoc(doc.id, { template: "11", series: "11" })}
                      >
                        Switch to Free Template
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 rounded-full text-xs"
                        onClick={() => {
                          setUser({ plan: "Pro" });
                          toast.success("Pro Plan enabled for testing!");
                        }}
                      >
                        Enable Pro Plan ($9/mo)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {studioTab === "content" && (
            <ContentEditorPanel
              doc={doc}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              onRequestUpgrade={(reason) => setUpgradeReason(reason)}
            />
          )}

          {studioTab === "designer" && (
            <DesignerPanel
              doc={doc}
              onRequestUpgrade={(reason) => setUpgradeReason(reason)}
            />
          )}

          {(studioTab === "analyzer" || studioTab === "tailor") && (
            <AnalyzerTailorPanel
              doc={doc}
              mode={studioTab}
              onRequestUpgrade={(reason) => setUpgradeReason(reason)}
              onJumpToSection={(sec) => {
                setStudioTab("content");
                setActiveSection(sec);
              }}
            />
          )}
        </div>

        {/* RIGHT PANE: Sticky 1:1 Live Editable Paper Canvas */}
        <div className="lg:sticky lg:top-28 lg:col-span-6 xl:col-span-7">
          <ResumeRender
            doc={doc}
            onPatch={handlePatchContent}
            onSelectSection={(sec) => {
              if (studioTab !== "content") setStudioTab("content");
              setActiveSection(sec);
            }}
          />
        </div>
      </div>

      {/* =====================================================================
       * TWO-COLUMN EXPORT & ORIGINAL TEMPLATE PACKAGE MODAL
       * =================================================================== */}
      <ResponsiveModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={`Export & Download — (${tplMeta.name})`}
        description="Download your live edited document or access the original static Word, PDF, and Google Docs master files."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Column: Live Edited Document Exports */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                1. Live Edited Document
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {doc.settings?.pageSize || "A4"} · {doc.settings?.pageCount || 1}P
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated directly from the changes you made in the Studio editor.
            </p>

            <div className="space-y-2 pt-2">
              <Button className="w-full justify-between rounded-xl" onClick={handlePrintVectorPdf}>
                <span className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" /> Download Live Vector PDF
                </span>
                {isProTemplate && user.plan !== "Pro" ? (
                  <Badge className="bg-accent text-accent-foreground">PRO</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">100% Vector</Badge>
                )}
              </Button>

              <Button variant="outline" className="w-full justify-between rounded-xl" onClick={handleExportLiveDocx}>
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Export Edited Word (.doc)
                </span>
                {user.plan !== "Pro" ? (
                  <Badge className="bg-accent text-accent-foreground">PRO</Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Editable</span>
                )}
              </Button>

              <Button variant="outline" className="w-full justify-between rounded-xl" onClick={handleExportTxt}>
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Download Plain Text (.txt)
                </span>
                <span className="text-[10px] text-[#33613d]">Free · ATS Raw</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Original Uploaded Package Files (Word, PDF & Google Docs) */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                2. Original Series {sId} Master Package
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">
                Original Files
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct downloads of your uploaded `.docx`, `.pdf`, and Google Docs template files.
            </p>

            <div className="max-h-[210px] space-y-1.5 overflow-y-auto pr-1 pt-1">
              {tplMeta.files
                .filter((f) => f.size === (doc.settings?.pageSize === "Letter" ? "letter" : "a4"))
                .map((f, i) => (
                  <a
                    key={i}
                    href={f.path}
                    download
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-primary hover:bg-sage-mist/30"
                  >
                    <span className="capitalize">
                      {f.doc} {f.pages ? `(${f.pages}P)` : ""} — {f.size.toUpperCase()}
                    </span>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      .{f.format}
                    </Badge>
                  </a>
                ))}

              {tplMeta.gdocs.slice(0, 4).map((g) => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-sage-line bg-sage-mist/30 px-3 py-2 text-xs font-medium text-primary hover:bg-sage-mist"
                >
                  <span className="truncate">{g.label || `Google Docs — ${g.doc}`}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveModal>

      {/* VERSION HISTORY MODAL (Enhancv Page 22) */}
      <ResponsiveModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Version History"
        description="Restore any saved snapshot of your resume or reset to the original template sample."
      >
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-xs"
              onClick={() => {
                saveDocVersion(doc.id, `Manual Snapshot (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`);
                toast.success("Snapshot saved");
              }}
            >
              + Save Current Snapshot
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs text-primary"
              onClick={() => {
                resetDocToTemplateSample(doc.id);
                setHistoryOpen(false);
                toast.success("Reset to original template sample text");
              }}
            >
              Reset to Original Series {sId} Sample
            </Button>
          </div>

          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {(doc.versions || []).map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div>
                  <div className="text-xs font-semibold">{v.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Series {v.template} · {new Date(v.savedAt).toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  onClick={() => {
                    restoreDocVersion(doc.id, v.id);
                    setHistoryOpen(false);
                    toast.success("Version restored");
                  }}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveModal>

      {/* TRANSLATE MODAL (Enhancv / Kickresume Pattern) */}
      <ResponsiveModal
        open={translateOpen}
        onOpenChange={setTranslateOpen}
        title="Translate Resume"
        description="In which language would you like to translate your resume section headings and content?"
        footer={
          <Button
            className="rounded-full"
            onClick={() => {
              translateDoc(doc.id, targetLang);
              toast.success(`Translated resume & headings to ${targetLang}`);
              setTranslateOpen(false);
            }}
          >
            Translate to {targetLang}
          </Button>
        }
      >
        <Field label="Target Language">
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </ResponsiveModal>

      {/* TRANSPARENT PRO UPGRADE MODAL */}
      <ResponsiveModal
        open={Boolean(upgradeReason)}
        onOpenChange={(v) => !v && setUpgradeReason("")}
        title="Upgrade to Farnavi Pro Studio"
        description={upgradeReason || "Unlock all 8 signature templates, DOCX exports, and unlimited AI tailoring."}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" className="rounded-full" onClick={() => setUpgradeReason("")}>
              Continue on Free Plan
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                setUser({ plan: "Pro" });
                setUpgradeReason("");
                toast.success("Farnavi Pro activated!");
              }}
            >
              <Crown className="mr-1.5 h-4 w-4" /> Activate Pro Now ($9/mo)
            </Button>
          </div>
        }
      >
        <div className="space-y-2 rounded-xl border border-sage-line bg-sage-mist/30 p-3.5 text-xs">
          <div className="font-semibold text-foreground">Included in Farnavi Pro:</div>
          <ul className="space-y-1.5 pl-4 text-muted-foreground list-disc">
            <li>All 8 Master Templates (Template, 3, 4, 11, 12, 14, 22, 24) in A4 & US Letter</li>
            <li>Live Vector PDF & Editable Word (.DOCX) Exports + Google Docs Access</li>
            <li>All 5 Recruiter Screening Checks (Credibility, Interview Risks, Age Bias, Gaps)</li>
            <li>Turbo AI Job Description Tailoring & Pre-Written Phrase Library</li>
          </ul>
        </div>
      </ResponsiveModal>
    </div>
  );
}