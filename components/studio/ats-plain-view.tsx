"use client";

import React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AtsPlainViewData } from "@/lib/server/resume-analyzer";
import { CheckCircle2, AlertCircle, Copy, Cpu, FileText } from "lucide-react";

export function AtsPlainView({ data }: { data: AtsPlainViewData | null }) {
  if (!data) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-border bg-card p-8 text-xs text-muted-foreground">
        Generating ATS plain-text preview...
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
      {/* Top Parse Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-mist text-primary">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <span>What ATS Systems See</span>
              <Badge
                variant="secondary"
                className="bg-[#e6f0e8] text-[10px] font-semibold text-[#33613d]"
              >
                {data.parseRate}% Parse Rate
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {data.wordCount} words · {data.layoutKind === "1-column-ats" ? "1-Column Linear ATS" : "2-Column Reading Order"} · ~{data.estimatedPages} page(s)
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-full text-xs"
          onClick={() => {
            navigator.clipboard?.writeText(data.plainText);
            toast.success("Copied ATS plain text");
          }}
        >
          <Copy className="mr-1.5 h-3 w-3" /> Copy ATS Text
        </Button>
      </div>

      {/* Parsed Entity Extraction Matrix */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.detectedFields.map((f) => (
          <div
            key={f.label}
            className="flex items-start gap-2 rounded-xl border border-border bg-muted/25 px-2.5 py-2 text-[11px]"
          >
            {f.ok ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#33613d]" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c05b49]" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}
              </div>
              <div className="truncate font-medium text-foreground">{f.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw ATS Text Paper Sheet */}
      <div className="rounded-xl border border-border bg-[#fcfbf8] p-5 shadow-inner">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3 w-3" /> Extracted Plain-Text Stream (Workday / Greenhouse / Lever Simulation)
        </div>
        <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-[#202124]">
          {data.plainText || "(No text extracted yet)"}
        </pre>
      </div>
    </div>
  );
}