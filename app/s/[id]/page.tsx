"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LiveDocThumb } from "@/components/render/live-thumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/lib/store";
import { Eye, Download, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export default function SharedResumePage() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [meta, setMeta] = useState<{ viewCount: number; showContact: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(params.id)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data?.error || "Shared resume unavailable.");
        } else if (!cancelled) {
          setDoc(data.document);
          setMeta(data.share);
        }
      } catch {
        if (!cancelled) setError("Could not reach server to load shared resume.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-sm text-[#706a62]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading shared resume...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f4ee] p-6 text-center">
        <AlertCircle className="h-8 w-8 text-[#c05b49]" />
        <div className="text-base font-semibold text-[#202124]">{error || "Resume not found"}</div>
        <p className="max-w-sm text-xs text-[#706a62]">
          The owner may have disabled this share link or removed the document.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] px-4 py-8">
      <div className="mx-auto max-w-[840px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8cfc2] bg-white px-4 py-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#202124]">{doc.title}</span>
              <Badge variant="secondary" className="text-[10px]">
                <Eye className="mr-1 h-3 w-3" /> {meta?.viewCount || 1} views
              </Badge>
              {meta && !meta.showContact && (
                <Badge variant="outline" className="text-[10px]">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Contact Redacted
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-[#706a62]">
              Shared via Farnavi Resume Studio · Read-only live link
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-full text-xs"
            onClick={() => window.open(`/print/${doc.id}?mode=resume&autoprint=1`, "_blank")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Save as Vector PDF
          </Button>
        </div>

        <div className="mx-auto aspect-[210/297] w-full max-w-[794px] overflow-hidden rounded-xl border border-[#d8cfc2] bg-white shadow-xl">
          <LiveDocThumb doc={doc} />
        </div>
      </div>
    </div>
  );
}