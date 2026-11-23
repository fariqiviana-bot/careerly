"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Content } from "@/lib/store";
import { getBullets } from "@/components/render/series-all";
import {
  apiAiChat,
  apiGenerateSummaries,
  apiGetAiStatus,
  type AiChatPatch,
  type AiRuntimeStatus,
  type SummaryVariant,
} from "@/lib/api/ai-client";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Check,
  Wand2,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  patches?: AiChatPatch[];
  appliedIds?: string[];
}

export function AiAssistantDrawer({
  open,
  onClose,
  content,
  seriesId,
  onApplyContent,
}: {
  open: boolean;
  onClose: () => void;
  content: Content;
  seriesId: string;
  onApplyContent: (next: Content) => void;
}) {
  const [status, setStatus] = useState<AiRuntimeStatus | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I am Farnavi AI Copilot. Ask me to audit your resume, rewrite weak bullets using the XYZ formula (without inventing fake metrics), generate 3 summary options, or suggest role skills.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [summaryVariants, setSummaryVariants] = useState<SummaryVariant[]>([]);

  useEffect(() => {
    if (!open) return;
    apiGetAiStatus()
      .then(setStatus)
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const applyPatch = (msgId: string, patch: AiChatPatch) => {
    const next: any = { ...content };
    if (patch.target === "summary" && typeof patch.value === "string") {
      next.summary = patch.value;
    } else if (patch.target === "role" && typeof patch.value === "string") {
      next.role = patch.value;
    } else if (patch.target === "add-skills" && Array.isArray(patch.value)) {
      const merged = Array.from(new Set([...(content.skills || []), ...patch.value]));
      next.skills = merged;
      next.areasOfExpertise = merged;
    } else if (
      patch.target === "replace-bullet" &&
      patch.expId &&
      patch.bulletIndex !== undefined &&
      typeof patch.value === "string"
    ) {
      next.experience = (content.experience || []).map((e) => {
        if (e.id !== patch.expId) return e;
        const bl = getBullets(e);
        if (patch.bulletIndex! < 0 || patch.bulletIndex! >= bl.length) return e;
        const copy = [...bl];
        copy[patch.bulletIndex!] = patch.value as string;
        return { ...e, bullets: copy, description: copy.map((b) => `\u2022 ${b}`).join("\n") };
      });
    }

    onApplyContent(next);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, appliedIds: [...(m.appliedIds || []), patch.id] }
          : m
      )
    );
    toast.success(`Applied: ${patch.label}`);
  };

  const sendMessage = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setSummaryVariants([]);

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setBusy(true);

    try {
      const res = await apiAiChat({
        message: text,
        history: nextHistory
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.text })),
        content,
        seriesId,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: res.reply,
          patches: res.patches || [],
          appliedIds: [],
        },
      ]);
    } catch (err: any) {
      toast.error(err?.message || "AI Copilot could not respond");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate3Summaries = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await apiGenerateSummaries({
        content,
        targetRole: content.role,
        highlightSkills: (content.skills || []).slice(0, 5),
      });
      setSummaryVariants(res.variants);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate summaries");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <span>Farnavi AI Copilot</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px]",
                  status?.configured ? "bg-[#e6f0e8] text-[#33613d]" : ""
                )}
              >
                {status?.modeLabel || "Ready"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-[#33613d]" />
              <span>Anti-hallucination mode: uses [X%] placeholders for missing metrics</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close AI Copilot" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-border bg-muted/25 px-4 py-2.5 text-[11px]">
        <button
          type="button"
          onClick={() => sendMessage("Audit my resume and give me the top 3 improvements.")}
          className="rounded-full border border-border bg-card px-2.5 py-1 font-medium hover:border-primary"
        >
          Top 3 fixes
        </button>
        <button
          type="button"
          onClick={() => sendMessage("Rewrite my weakest experience bullet with the XYZ formula.")}
          className="rounded-full border border-border bg-card px-2.5 py-1 font-medium hover:border-primary"
        >
          Sharpen weak bullet
        </button>
        <button
          type="button"
          onClick={handleGenerate3Summaries}
          className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-sage-mist/40 px-2.5 py-1 font-medium text-primary hover:bg-sage-mist"
        >
          <FileText className="h-3 w-3" /> 3 Summary Options
        </button>
        <button
          type="button"
          onClick={() => sendMessage("Suggest high-value skills missing for my target role.")}
          className="rounded-full border border-border bg-card px-2.5 py-1 font-medium hover:border-primary"
        >
          Suggest skills
        </button>
      </div>

      {/* Conversation Body */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
        {summaryVariants.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-sage-line bg-sage-mist/25 p-3">
            <div className="flex items-center justify-between font-bold text-primary">
              <span>3 Tailored Summary Options</span>
              <button
                type="button"
                className="text-[10px] underline"
                onClick={() => setSummaryVariants([])}
              >
                Close
              </button>
            </div>
            {summaryVariants.map((v) => (
              <div key={v.id} className="space-y-1.5 rounded-xl border border-border bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{v.label}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 rounded-full px-2.5 text-[10px]"
                    onClick={() => {
                      onApplyContent({ ...content, summary: v.text });
                      toast.success(`Applied "${v.label}" summary`);
                    }}
                  >
                    Apply
                  </Button>
                </div>
                <p className="leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col gap-2",
              m.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/35 text-foreground"
              )}
            >
              {m.text}
            </div>

            {m.patches && m.patches.length > 0 && (
              <div className="w-[92%] space-y-2">
                {m.patches.map((p) => {
                  const applied = (m.appliedIds || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-sage-line bg-sage-mist/20 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{p.label}</span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={applied}
                          className="h-6 rounded-full px-2.5 text-[10px]"
                          onClick={() => applyPatch(m.id, p)}
                        >
                          {applied ? (
                            <>
                              <Check className="mr-1 h-3 w-3" /> Applied
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-1 h-3 w-3" /> Apply Change
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="rounded-lg bg-card p-2 text-[11px] text-foreground">
                        {Array.isArray(p.value) ? p.value.join(", ") : p.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything or request a rewrite..."
          className="h-9 flex-1 rounded-full text-xs"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}