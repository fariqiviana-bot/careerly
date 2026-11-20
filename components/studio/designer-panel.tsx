"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useStore, type Doc, type DocLayoutSettings } from "@/lib/store";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  Crown,
  Lock,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubTab = "templates" | "layout" | "rearrange";
type FilterKey = "all" | "ats" | "twocol" | "photo" | "free";

export function DesignerPanel({
  doc,
  onRequestUpgrade,
}: {
  doc: Doc;
  onRequestUpgrade: (reason: string) => void;
}) {
  const { updateDoc, resetDocToTemplateSample } = useStore();
  const [subTab, setSubTab] = useState<SubTab>("templates");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loadSampleOnSwitch, setLoadSampleOnSwitch] = useState(false);

  const sId = String(doc.series || doc.template || "11");
  const currentTpl = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[3];
  const settings: DocLayoutSettings = doc.settings || ({
    pageSize: "A4",
    pageCount: 1,
    layoutMode: currentTpl.columns === 2 ? "two-col" : "ats",
    fontSize: 10,
    lineHeight: 1.38,
    sectionSpacing: 14,
    pageMargin: 0.5,
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
  } as DocLayoutSettings);

  const vis = (doc.visibility || {}) as Record<string, boolean>;

  const patchSettings = (next: Partial<DocLayoutSettings>) => {
    updateDoc(doc.id, { settings: { ...settings, ...next } });
  };

  const setVis = (k: string, val: boolean) => {
    updateDoc(doc.id, { visibility: { ...vis, [k]: val } });
  };

  const filteredTemplates = TEMPLATE_CATALOG.filter((t) => {
    if (filter === "ats") return t.columns === 1;
    if (filter === "twocol") return t.columns === 2;
    if (filter === "photo") return t.photo;
    if (filter === "free") return t.tier === "free";
    return true;
  });

  const defaultOrder = ["summary", "experience", "education", "skills", "certifications"];
  const sectionOrder =
    doc.content.sectionOrder && doc.content.sectionOrder.length > 0
      ? doc.content.sectionOrder
      : defaultOrder;

  const moveSectionOrder = (idx: number, dir: -1 | 1) => {
    const next = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateDoc(doc.id, { content: { ...doc.content, sectionOrder: next } });
    toast.success("Section order updated on resume");
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-1 shadow-2xs">
        {[
          { id: "templates", label: "Templates (8)", icon: LayoutTemplate },
          { id: "layout", label: "Page & Format", icon: SlidersHorizontal },
          { id: "rearrange", label: "Sections & Order", icon: ArrowUpDown },
        ].map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as SubTab)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
       * SUB-TAB 1: CLEAN 8 TEMPLATES GALLERY (No "Series" prefix, No badge clutter)
       * =================================================================== */}
      {subTab === "templates" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-sage-line bg-sage-mist/30 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-foreground">
                  Active Template: {currentTpl.name}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {currentTpl.fonts.heading} + {currentTpl.fonts.body} ·{" "}
                  {currentTpl.columns === 2 ? "Two-column" : "Single-column ATS"}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full bg-card text-xs"
                onClick={() => {
                  resetDocToTemplateSample(doc.id);
                  toast.success(`Reset to ${currentTpl.name} default sample text`);
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Load Template Sample Text
              </Button>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-sage-line/50 pt-2 text-[11px] text-muted-foreground">
              <span>Load default sample text automatically when switching templates</span>
              <Switch checked={loadSampleOnSwitch} onCheckedChange={setLoadSampleOnSwitch} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All (8)" },
              { id: "ats", label: "Single-Column (3)" },
              { id: "twocol", label: "Two-Column (5)" },
              { id: "photo", label: "With Photo / Emblem (2)" },
              { id: "free", label: "Free (3)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as FilterKey)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {filteredTemplates.map((tpl) => {
              const active = tpl.id === sId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    updateDoc(doc.id, {
                      template: tpl.id,
                      series: tpl.id,
                      accent: tpl.accent || "#202124",
                      font: tpl.fonts.heading || "Merriweather",
                      secondaryFont: tpl.fonts.body || "Lato",
                    });
                    if (loadSampleOnSwitch) {
                      setTimeout(() => resetDocToTemplateSample(doc.id), 10);
                    }
                    toast.success(`Template changed to ${tpl.name}`);
                  }}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-0.5",
                    active
                      ? "border-2 border-primary ring-2 ring-primary/15 shadow-sm"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="relative aspect-[210/297] w-full overflow-hidden border-b border-border bg-white">
                    <img
                      src={tpl.previews["resume-1p-a4"]}
                      alt={tpl.name}
                      className="h-full w-full object-cover object-top"
                    />
                    {active && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-foreground">{tpl.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {tpl.columns === 2 ? "Two-column" : "Single-column"}
                      </div>
                    </div>
                    {tpl.tier === "premium" ? (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/80 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                        <Crown className="h-2.5 w-2.5" /> Pro
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-primary">
                        Free
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 2: REACTIVE PAGE & FORMAT CONTROLS (Applies Directly to Paper!)
       * =================================================================== */}
      {subTab === "layout" && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Paper Size</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/40 p-1">
                {(["A4", "Letter"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      patchSettings({ pageSize: sz });
                      toast.success(`Paper size set to ${sz === "A4" ? "A4 (210 × 297mm)" : "US Letter (8.5 × 11in)"}`);
                    }}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-medium transition-colors",
                      settings.pageSize === sz ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sz === "A4" ? "A4 (210 × 297mm)" : "US Letter (8.5 × 11\")"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">Pages Shown in Studio</label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-muted/40 p-1">
                {[1, 2, 3].map((p) => {
                  const supported = currentTpl.pages.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={!supported}
                      onClick={() => {
                        patchSettings({ pageCount: p as 1 | 2 | 3 });
                        toast.success(`Showing ${p}-${p === 1 ? "page" : "page"} resume layout`);
                      }}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-medium transition-colors",
                        settings.pageCount === p
                          ? "bg-card text-foreground shadow-2xs"
                          : supported
                          ? "text-muted-foreground hover:text-foreground"
                          : "cursor-not-allowed opacity-40"
                      )}
                    >
                      {p} {p === 1 ? "Page" : "Pages"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Font Scale, Line Height, Section Spacing & Margin Sliders */}
          <div className="space-y-3 border-t border-border pt-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">Text Size Scale</span>
                <span className="text-muted-foreground">{settings.fontSize || 10} pt</span>
              </div>
              <input
                type="range"
                min={8.5}
                max={11.5}
                step={0.5}
                value={settings.fontSize || 10}
                onChange={(e) => patchSettings({ fontSize: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">Line Spacing</span>
                <span className="text-muted-foreground">{Math.round((settings.lineHeight || 1.38) * 100)}%</span>
              </div>
              <input
                type="range"
                min={1.15}
                max={1.65}
                step={0.05}
                value={settings.lineHeight || 1.38}
                onChange={(e) => patchSettings({ lineHeight: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">Between Sections Spacing</span>
                <span className="text-muted-foreground">{settings.sectionSpacing ?? 14} pt</span>
              </div>
              <input
                type="range"
                min={8}
                max={22}
                step={1}
                value={settings.sectionSpacing ?? 14}
                onChange={(e) => patchSettings({ sectionSpacing: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">Page Margins</span>
                <span className="text-muted-foreground">{settings.pageMargin ?? 0.5} in</span>
              </div>
              <input
                type="range"
                min={0.35}
                max={0.75}
                step={0.05}
                value={settings.pageMargin ?? 0.5}
                onChange={(e) => patchSettings({ pageMargin: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Date Format & Date Alignment */}
          <div className="space-y-3 border-t border-border pt-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Date Format (Applies to Experience & Education)</label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => patchSettings({ dateFormat: v as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jan YYYY">Short Name (Jan 2026)</SelectItem>
                  <SelectItem value="January YYYY">Long Name (January 2026)</SelectItem>
                  <SelectItem value="MM/YYYY">Numeric (01/2026)</SelectItem>
                  <SelectItem value="YYYY">Year Only (2026)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold">Date Alignment</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "left", title: "Inline Left", sub: "Job Title · Jan 2024 – Present" },
                  { id: "right", title: "Right Aligned", sub: "Job Title          Jan 2024 – Present" },
                ].map((al) => (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => patchSettings({ dateAlign: al.id as "left" | "right" })}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-all",
                      (settings.dateAlign || "right") === al.id
                        ? "border-2 border-primary bg-sage-mist/30"
                        : "border-border bg-background hover:bg-muted/40"
                    )}
                  >
                    <div className="text-xs font-semibold">{al.title}</div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">{al.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-TAB 3: REACTIVE SECTION REARRANGER & VISIBILITY (Works on ALL 8 Templates!)
       * =================================================================== */}
      {subTab === "rearrange" && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div>
            <div className="text-sm font-semibold">Rearrange & Toggle Sections</div>
            <p className="text-xs text-muted-foreground">
              Use the arrows to reorder sections or toggle switches to show/hide sections live on your {currentTpl.name} resume.
            </p>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Header & Contact Information
              </span>
              <span className="text-[10px] text-muted-foreground">Locked at Top</span>
            </div>

            {sectionOrder.map((secKey, idx) => (
              <div
                key={secKey}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Switch
                    checked={vis[secKey] !== false}
                    onCheckedChange={(checked) => setVis(secKey, checked)}
                  />
                  <span className="capitalize">{secKey}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSectionOrder(idx, -1)}
                    className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"
                    title="Move section up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sectionOrder.length - 1}
                    onClick={() => moveSectionOrder(idx, 1)}
                    className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"
                    title="Move section down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-xs font-semibold">Contact & Detail Visibility</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["title", "Target Job Title"],
                ["phone", "Phone Number"],
                ["email", "Email Address"],
                ["link", "LinkedIn URL"],
                ["location", "Location"],
                ["technical", "Technical Skills"],
              ].map(([k, label]) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-xs"
                >
                  <span>{label}</span>
                  <Switch
                    checked={vis[k] !== false}
                    onCheckedChange={(checked) => setVis(k, checked)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}