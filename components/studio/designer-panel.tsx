"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { useStore, type Doc, type DocLayoutSettings } from "@/lib/store";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { getSeriesDesign } from "@/lib/editor/design-tokens";

function accentForSeries(id: string, fallback = "#202124"): string {
  const r = getSeriesDesign(id);
  return r.ok && r.design.accent ? r.design.accent : fallback;
}
import { apiSmartAutoFit, type SmartFitResult } from "@/lib/api/editor-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutTemplate,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Sparkles,
  Loader2,
  PenTool,
  Camera,
  Upload,
  Trash2,
  Maximize2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubTab = "templates" | "layout" | "rearrange" | "signature";
type FilterKey = "all" | "ats" | "twocol" | "photo";

export interface HeaderFooterConfig {
  headerText: string;
  footerText: string;
  pageNumbering: "none" | "1-2-3" | "1/3" | "page-1";
}

type ExtendedLayoutSettings = DocLayoutSettings & {
  skillsLayout?: "inline" | "columns" | "categories";
  locationAlign?: "left" | "right";
  listLineHeight?: number;
};

const DEFAULT_SECTION_META: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Professional Experience",
  education: "Education",
  skills: "Skills & Expertise",
  certifications: "Certifications & Licenses",
  courses: "Courses & Training",
  awards: "Awards & Achievements",
  volunteering: "Community & Volunteering",
  references: "References",
};

const ACCENT_SWATCHES = [
  { label: "Template Default", value: "" },
  { label: "Executive Navy", value: "#1B365D" },
  { label: "Slate Charcoal", value: "#202124" },
  { label: "Muted Sage", value: "#4A6151" },
  { label: "Deep Teal", value: "#1E555C" },
  { label: "Burgundy Ink", value: "#6B2D38" },
  { label: "Warm Taupe", value: "#5E544C" },
];

const SIGNATURE_FONTS = [
  { id: "Pacifico", label: "Pacifico", css: "'Pacifico', cursive" },
  { id: "Great Vibes", label: "Great Vibes", css: "'Great Vibes', cursive" },
  { id: "Georgia Italic", label: "Classic Serif", css: "Georgia, serif" },
];

export function DesignerPanel({
  doc,
  headerFooter,
  customLabels,
  onHeaderFooterChange,
  onCustomLabelsChange,
}: {
  doc: Doc;
  onRequestUpgrade?: (reason: string) => void;
  headerFooter?: HeaderFooterConfig;
  customLabels?: Record<string, string>;
  onHeaderFooterChange?: (next: HeaderFooterConfig) => void;
  onCustomLabelsChange?: (next: Record<string, string>) => void;
}) {
  const { updateDoc, resetDocToTemplateSample } = useStore();
  const [subTab, setSubTab] = useState<SubTab>("templates");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loadSampleOnSwitch, setLoadSampleOnSwitch] = useState(false);

  // Smart Auto-Fit state
  const [fitBusy, setFitBusy] = useState(false);
  const [lastFit, setLastFit] = useState<SmartFitResult | null>(null);

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Local fallbacks if parent doesn't pass controlled props
  const [localHF, setLocalHF] = useState<HeaderFooterConfig>({
    headerText: "",
    footerText: "",
    pageNumbering: "none",
  });
  const [localLabels, setLocalLabels] = useState<Record<string, string>>({});
  const [sigFont, setSigFont] = useState("Pacifico");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const hf = headerFooter ?? localHF;
  const setHf = (next: HeaderFooterConfig) => {
    setLocalHF(next);
    onHeaderFooterChange?.(next);
  };

  const labels = customLabels ?? localLabels;
  const setLabels = (next: Record<string, string>) => {
    setLocalLabels(next);
    onCustomLabelsChange?.(next);
  };

  const sId = String(doc.series || doc.template || "11");
  const currentTpl = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[3];
  const settings: ExtendedLayoutSettings = (doc.settings || {
    pageSize: "A4",
    pageCount: 1,
    layoutMode: currentTpl.columns === 2 ? "two-col" : "ats",
    fontSize: 10,
    lineHeight: 1.35,
    sectionSpacing: 14,
    pageMargin: 0.48,
    dateFormat: "Jan YYYY",
    dateAlign: "right",
    sectionCase: "AA",
    headerAlign: "center",
    hideSkillLevels: true,
    showTitle: true,
    showPhone: true,
    showEmail: true,
    showLocation: true,
    showLink: true,
    uppercaseName: true,
  }) as ExtendedLayoutSettings;

  const vis = (doc.visibility || {}) as Record<string, boolean>;

  const patchSettings = (next: Partial<ExtendedLayoutSettings>) => {
    updateDoc(doc.id, { settings: { ...settings, ...next } as DocLayoutSettings });
  };

  const setVis = (k: string, val: boolean) => {
    updateDoc(doc.id, { visibility: { ...vis, [k]: val } });
  };

  const filteredTemplates = TEMPLATE_CATALOG.filter((t) => {
    if (filter === "ats") return t.columns === 1;
    if (filter === "twocol") return t.columns === 2;
    if (filter === "photo") return t.photo;
    return true;
  });

  const defaultOrder = [
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "courses",
    "awards",
    "volunteering",
  ];
  const sectionOrder =
    doc.content.sectionOrder && doc.content.sectionOrder.length > 0
      ? doc.content.sectionOrder
      : defaultOrder;

  const commitOrder = (nextOrder: string[]) => {
    updateDoc(doc.id, {
      content: { ...doc.content, sectionOrder: nextOrder },
    });
  };

  const moveSectionOrder = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const copy = [...sectionOrder];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    commitOrder(copy);
  };

  const handleDropSection = (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const copy = [...sectionOrder];
    const [moved] = copy.splice(dragIdx, 1);
    copy.splice(dropIdx, 0, moved);
    commitOrder(copy);
    setDragIdx(null);
    setDragOverIdx(null);
    toast.success("Section order updated");
  };

  const handleSmartAutoFit = async (overrideTarget?: 1 | 2 | 3) => {
    setFitBusy(true);
    try {
      const targetPages = (overrideTarget || settings.pageCount || 1) as 1 | 2 | 3;
      const res = await apiSmartAutoFit({
        content: doc.content,
        seriesId: sId,
        pageSize: settings.pageSize || "A4",
        targetPages,
      });
      setLastFit(res);
      patchSettings({
        pageSize: res.settings.pageSize,
        pageCount: res.settings.pageCount,
        fontSize: res.settings.fontSize,
        lineHeight: res.settings.lineHeight,
        sectionSpacing: res.settings.sectionSpacing,
        pageMargin: res.settings.pageMargin,
      });
      toast.success(res.summary);
    } catch (err: any) {
      toast.error(err?.message || "Could not run Auto-Fit");
    } finally {
      setFitBusy(false);
    }
  };

  const handleResetToOriginal = () => {
    patchSettings({
      fontSize: 10,
      lineHeight: 1.35,
      sectionSpacing: 14,
      pageMargin: 0.48,
      dateFormat: "Jan YYYY",
      sectionCase: "AA",
      skillsLayout: "inline",
    });
    updateDoc(doc.id, { accent: accentForSeries(sId) });
    setLastFit(null);
    toast.success(`Restored ${currentTpl.name} original typography & spacing`);
  };

  const handleImageFile = (
    file: File,
    onDataUrl: (url: string) => void
  ) => {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Please select an image under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const cl: any = (doc.content as any).coverLetter || {};
  const sigText = cl.signatureText || doc.content.name || "Your Signature";
  const sigImage = cl.signatureImage || "";
  const photoUrl = (doc.content as any).photoUrl || doc.content.photo || "";

  return (
    <div className="space-y-3.5">
      {/* 4 Designer Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-muted/60 p-1 text-[11px]">
        {[
          { id: "templates" as const, label: "Templates", icon: LayoutTemplate },
          { id: "layout" as const, label: "Layout & Fit", icon: SlidersHorizontal },
          { id: "rearrange" as const, label: "Rearrange", icon: ArrowUpDown },
          { id: "signature" as const, label: "Sign & Photo", icon: PenTool },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-xl py-2 font-medium transition-all",
              subTab === t.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* =====================================================================
       * SUB-TAB 1: TEMPLATES GALLERY (All 8 Unlocked)
       * =================================================================== */}
      {subTab === "templates" && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {[
                { id: "all" as const, label: "All (8)" },
                { id: "ats" as const, label: "1-Col ATS" },
                { id: "twocol" as const, label: "2-Column" },
                { id: "photo" as const, label: "With Photo" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-2 text-[11px]"
              onClick={handleResetToOriginal}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Template Original
            </Button>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Load sample text when switching template</span>
            <Switch checked={loadSampleOnSwitch} onCheckedChange={setLoadSampleOnSwitch} />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {filteredTemplates.map((t) => {
              const active = t.id === sId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    updateDoc(doc.id, {
                      series: t.id,
                      template: t.id,
                      accent: accentForSeries(t.id, doc.accent),
                    });
                    if (loadSampleOnSwitch) {
                      resetDocToTemplateSample(doc.id, t.id);
                    }
                    toast.success(`Switched to ${t.name}`);
                  }}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all",
                    active
                      ? "border-2 border-primary ring-2 ring-primary/15"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
                    <img
                      src={t.previews["resume-1p-a4"]}
                      alt={t.name}
                      className="h-full w-full object-cover object-top"
                    />
                    {t.columns === 1 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-[#e6f0e8] px-2 py-0.5 text-[9px] font-semibold text-[#33613d]">
                        ATS 1-Col
                      </span>
                    )}
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="bg-card p-2">
                    <div className="truncate text-xs font-semibold">{t.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {t.columns === 2 ? "2-Column" : "Single-Column"} · {t.fonts.heading}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 2: LAYOUT, SMART AUTO-FIT, SPACING & HEADER/FOOTER
       * =================================================================== */}
      {subTab === "layout" && (
        <div className="space-y-3.5 text-xs">
          {/* Smart Auto-Fit Card (Rezi Pattern Enhanced) */}
          <div className="space-y-2.5 rounded-2xl border border-sage-line bg-sage-mist/25 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Maximize2 className="h-4 w-4 text-primary" />
                  <span>Smart Page Auto-Fit</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Automatically balances typography and margins so trailing lines fit cleanly without breaking template fidelity.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 rounded-full text-xs"
                disabled={fitBusy}
                onClick={() => handleSmartAutoFit()}
              >
                {fitBusy ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Auto-Fit {settings.pageCount || 1}P
              </Button>
            </div>

            {lastFit && (
              <div className="rounded-xl border border-border bg-card p-2.5 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-1.5 font-semibold">
                  <span>
                    Fill: {lastFit.estimatedFillPercent}% · {lastFit.metrics.wordCount} words
                  </span>
                  <Badge variant="secondary" className="text-[9px] uppercase">
                    {lastFit.status}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{lastFit.summary}</p>
                {lastFit.recommendedPages !== settings.pageCount && (
                  <Button
                    type="button"
                    size="sm"
                    variant="link"
                    className="mt-1 h-auto p-0 text-[11px]"
                    onClick={() => handleSmartAutoFit(lastFit.recommendedPages)}
                  >
                    Switch & Fit to Recommended {lastFit.recommendedPages}P \u2192
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Paper Size, Page Target & Accent Swatches */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Page & Typography</span>
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset Original
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">Paper Size</div>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {(["A4", "Letter"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => patchSettings({ pageSize: sz })}
                      className={cn(
                        "rounded-lg py-1 font-medium",
                        settings.pageSize === sz
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      {sz === "Letter" ? "US Letter" : "A4"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">Page Target</div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                  {([1, 2, 3] as const).map((pc) => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => patchSettings({ pageCount: pc })}
                      className={cn(
                        "rounded-lg py-1 font-medium",
                        (settings.pageCount || 1) === pc
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      {pc}P
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Numeric Sliders */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-muted-foreground">Font Scale</span>
                  <span className="font-semibold">{settings.fontSize.toFixed(1)} pt ({Math.round((settings.fontSize / 10) * 100)}%)</span>
                </div>
                <input
                  type="range"
                  min={8.5}
                  max={11.5}
                  step={0.1}
                  value={settings.fontSize}
                  onChange={(e) => patchSettings({ fontSize: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-muted-foreground">Line Height</span>
                  <span className="font-semibold">{Math.round(settings.lineHeight * 100)}% ({settings.lineHeight.toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min={1.15}
                  max={1.65}
                  step={0.05}
                  value={settings.lineHeight}
                  onChange={(e) => patchSettings({ lineHeight: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-muted-foreground">Section Spacing</span>
                  <span className="font-semibold">{settings.sectionSpacing} pt</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={settings.sectionSpacing}
                  onChange={(e) => patchSettings({ sectionSpacing: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-muted-foreground">Page Margins</span>
                  <span className="font-semibold">{settings.pageMargin.toFixed(2)} in</span>
                </div>
                <input
                  type="range"
                  min={0.32}
                  max={0.75}
                  step={0.02}
                  value={settings.pageMargin}
                  onChange={(e) => patchSettings({ pageMargin: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div className="border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground">Accent Color</span>
                <span className="font-mono text-[10px] text-muted-foreground">{doc.accent}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_SWATCHES.map((sw) => {
                  const val = sw.value || accentForSeries(sId);
                  const active = (doc.accent || "").toLowerCase() === val.toLowerCase();
                  return (
                    <button
                      key={sw.label}
                      type="button"
                      title={sw.label}
                      onClick={() => updateDoc(doc.id, { accent: val })}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border transition-transform hover:scale-110",
                        active ? "ring-2 ring-primary ring-offset-2" : "border-border"
                      )}
                      style={{ backgroundColor: val }}
                    >
                      {active && <Check className="h-3 w-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Formatting Rules (Date Format, Alignments, Skills Layout, Contact Toggles) */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="font-bold text-foreground">Formatting & Alignments</div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">Date Format</div>
                <Select
                  value={settings.dateFormat || "Jan YYYY"}
                  onValueChange={(v) => patchSettings({ dateFormat: v as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jan YYYY">Jan 2026</SelectItem>
                    <SelectItem value="January YYYY">January 2026</SelectItem>
                    <SelectItem value="MM/YYYY">01/2026</SelectItem>
                    <SelectItem value="YYYY">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">Skills Layout</div>
                <Select
                  value={settings.skillsLayout || "inline"}
                  onValueChange={(v) => patchSettings({ skillsLayout: v as any })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inline">Inline List</SelectItem>
                    <SelectItem value="columns">2 Columns</SelectItem>
                    <SelectItem value="categories">Categorized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { key: "showTitle" as const, label: "Show Job Title" },
                { key: "showPhone" as const, label: "Show Phone" },
                { key: "showEmail" as const, label: "Show Email" },
                { key: "showLocation" as const, label: "Show Location" },
                { key: "showLink" as const, label: "Show LinkedIn" },
                { key: "uppercaseName" as const, label: "Uppercase Name" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-border px-2.5 py-1.5"
                >
                  <span>{item.label}</span>
                  <Switch
                    checked={settings[item.key] !== false}
                    onCheckedChange={(v) => patchSettings({ [item.key]: v })}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Header & Footer + Page Numbering (Resume.io Pattern — Persisted to SQLite) */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Header, Footer & Page Numbers</span>
              </div>
              <Badge variant="outline" className="text-[9px]">Saved to DB</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[10px] font-medium text-muted-foreground">Running Header Text</div>
                <Input
                  value={hf.headerText}
                  onChange={(e) => setHf({ ...hf, headerText: e.target.value })}
                  placeholder="e.g. Sara Mohammadi — Product Designer"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-medium text-muted-foreground">Running Footer Text</div>
                <Input
                  value={hf.footerText}
                  onChange={(e) => setHf({ ...hf, footerText: e.target.value })}
                  placeholder="e.g. sara@example.com"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-medium text-muted-foreground">Page Numbering Style</div>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 text-[11px]">
                {[
                  { id: "none" as const, label: "None" },
                  { id: "1-2-3" as const, label: "1, 2, 3" },
                  { id: "1/3" as const, label: "1 / 3" },
                  { id: "page-1" as const, label: "Page 1" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHf({ ...hf, pageNumbering: opt.id })}
                    className={cn(
                      "rounded-lg py-1 font-medium",
                      hf.pageNumbering === opt.id
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 3: DRAG-AND-DROP REARRANGE & CUSTOM SECTION LABELS
       * =================================================================== */}
      {subTab === "rearrange" && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs text-xs">
          <div>
            <div className="font-bold text-foreground">Drag to Reorder & Rename Sections</div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Drag any section card to change order, toggle visibility, or customize its display title.
            </p>
          </div>

          {/* Locked Header Card */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-muted-foreground">
            <span className="font-medium">Header & Contact Info (Fixed at top)</span>
            <Badge variant="outline" className="text-[9px]">Locked</Badge>
          </div>

          <div className="space-y-2">
            {sectionOrder.map((secId, idx) => {
              const visible = vis[secId] !== false;
              const defaultLabel = DEFAULT_SECTION_META[secId] || secId;
              const currentLabel = labels[secId] ?? defaultLabel;

              return (
                <div
                  key={secId}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={() => handleDropSection(idx)}
                  onDragEnd={() => {
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2 transition-all",
                    dragOverIdx === idx
                      ? "border-primary bg-sage-mist/35"
                      : "border-border bg-card",
                    !visible && "opacity-60"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                  <Input
                    value={currentLabel}
                    onChange={(e) => setLabels({ ...labels, [secId]: e.target.value })}
                    className="h-7 flex-1 border-transparent bg-transparent px-1.5 text-xs font-medium hover:border-border focus:border-border focus:bg-background"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      disabled={idx === 0}
                      onClick={() => moveSectionOrder(idx, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      disabled={idx === sectionOrder.length - 1}
                      onClick={() => moveSectionOrder(idx, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Switch
                    checked={visible}
                    onCheckedChange={(v) => setVis(secId, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 4: DIGITAL SIGNATURE & PROFILE PHOTO MANAGER
       * =================================================================== */}
      {subTab === "signature" && (
        <div className="space-y-3.5 text-xs">
          {/* Signature Studio (Enhancv Pattern) */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <PenTool className="h-4 w-4 text-primary" />
              <span>Cover Letter Signature</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Type a script signature or upload a transparent PNG signature image for your Cover Letter.
            </p>

            <div>
              <div className="mb-1 text-[10px] font-medium text-muted-foreground">Typed Signature</div>
              <Input
                value={sigText}
                onChange={(e) =>
                  updateDoc(doc.id, {
                    content: {
                      ...doc.content,
                      coverLetter: { ...cl, signatureText: e.target.value, signatureFont: sigFont },
                    } as any,
                  })
                }
                placeholder="Your Full Name"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {SIGNATURE_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSigFont(f.id);
                    updateDoc(doc.id, {
                      content: {
                        ...doc.content,
                        coverLetter: { ...cl, signatureText: sigText, signatureFont: f.id },
                      } as any,
                    });
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-center transition-all",
                    sigFont === f.id
                      ? "border-primary bg-sage-mist/30"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="truncate text-base" style={{ fontFamily: f.css }}>
                    {sigText || "Signature"}
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted-foreground">{f.label}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
              <input
                ref={sigInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  handleImageFile(f, (dataUrl) => {
                    updateDoc(doc.id, {
                      content: {
                        ...doc.content,
                        coverLetter: { ...cl, signatureImage: dataUrl },
                      } as any,
                    });
                    toast.success("Signature image uploaded");
                  });
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs"
                onClick={() => sigInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Signature Image
              </Button>
              {sigImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full text-xs text-destructive"
                  onClick={() => {
                    updateDoc(doc.id, {
                      content: {
                        ...doc.content,
                        coverLetter: { ...cl, signatureImage: "" },
                      } as any,
                    });
                    toast.success("Signature image removed");
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>

          {/* Profile Photo Manager */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Camera className="h-4 w-4 text-primary" />
                <span>Profile Photo</span>
              </div>
              <Badge variant={currentTpl.photo ? "secondary" : "outline"} className="text-[10px]">
                {currentTpl.photo ? "Supported by Template" : "Photo-Free ATS Template"}
              </Badge>
            </div>

            {!currentTpl.photo && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                <span>{currentTpl.name} is designed without a headshot for US/UK ATS compliance.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 rounded-full text-[10px]"
                  onClick={() => {
                    updateDoc(doc.id, { series: "22", template: "22" });
                    toast.success("Switched to Professional Photo template (Series 22)");
                  }}
                >
                  Use Photo Template
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    handleImageFile(f, (dataUrl) => {
                      updateDoc(doc.id, {
                        content: { ...doc.content, photo: dataUrl, photoUrl: dataUrl } as any,
                      });
                      toast.success("Profile photo updated");
                    });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full text-xs"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Headshot
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full text-xs text-destructive"
                    onClick={() => {
                      updateDoc(doc.id, {
                        content: { ...doc.content, photo: "", photoUrl: "" } as any,
                      });
                      toast.success("Profile photo removed");
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}