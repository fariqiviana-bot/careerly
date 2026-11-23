import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANTI_HALLUCINATION_RULE, callAiJson } from "@/lib/server/ai-client";
import { analyzeResume } from "@/lib/server/resume-analyzer";

export const runtime = "nodejs";

const ChatReqSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  content: z.record(z.any()),
  seriesId: z.string().optional().default("11"),
});

export interface AiChatPatch {
  id: string;
  label: string;
  target: "summary" | "role" | "add-skills" | "replace-bullet";
  expId?: string;
  bulletIndex?: number;
  value: string | string[];
}

function buildLocalCopilotReply(message: string, content: Record<string, any>, seriesId: string): {
  reply: string;
  patches: AiChatPatch[];
} {
  const lower = message.toLowerCase();
  const report = analyzeResume({ content, seriesId });
  const patches: AiChatPatch[] = [];

  if (/summary|bio|intro|about/.test(lower)) {
    const role = String(content.role || "Professional");
    const skills = Array.isArray(content.skills) ? content.skills.slice(0, 4).join(", ") : "cross-functional delivery";
    const suggested = `Results-oriented ${role} with expertise in ${skills}. Proven record of streamlining workflows by [X%], partnering across teams, and delivering measurable impact on high-priority business goals.`;
    patches.push({
      id: `patch-sum-${Date.now()}`,
      label: "Update Professional Summary",
      target: "summary",
      value: suggested,
    });
    return {
      reply: `I drafted a tighter, ATS-ready Professional Summary tailored to "${role}". Notice the [X%] placeholder so you can enter your real metric before exporting.`,
      patches,
    };
  }

  if (/bullet|weak|rewrite|experience|impact|metric/.test(lower)) {
    const fixCheck = report.checks.find((ch) => ch.quickFix?.kind === "replace-bullet");
    if (fixCheck?.quickFix) {
      patches.push({
        id: `patch-bl-${Date.now()}`,
        label: fixCheck.quickFix.buttonLabel,
        target: "replace-bullet",
        expId: fixCheck.quickFix.expId,
        bulletIndex: fixCheck.quickFix.bulletIndex,
        value: fixCheck.quickFix.replacement,
      });
      return {
        reply: `I found an easy win in your experience bullets (${fixCheck.title}): "${fixCheck.quickFix.original}". Click Apply below to upgrade it immediately.`,
        patches,
      };
    }

    const firstExp = Array.isArray(content.experience) ? content.experience[0] : null;
    const firstBullet = Array.isArray(firstExp?.bullets) ? firstExp.bullets[0] : "";
    if (firstExp && firstBullet) {
      const upgraded = `${firstBullet.replace(/\.?\s*$/, "")}, driving a [X%] improvement across [N] key deliverables.`;
      patches.push({
        id: `patch-bl-xyz-${Date.now()}`,
        label: `Strengthen top bullet (${firstExp.role || "Role"})`,
        target: "replace-bullet",
        expId: firstExp.id,
        bulletIndex: 0,
        value: upgraded,
      });
      return {
        reply: `Your bullets already use strong action verbs! To push your Quantified Impact score higher, add a measurable outcome using the XYZ formula (fill in [X%] and [N] with your real numbers).`,
        patches,
      };
    }
  }

  if (/skill|keyword/.test(lower)) {
    const role = String(content.role || "").toLowerCase();
    const suggested = /design|ux|ui/.test(role)
      ? ["Design Systems", "Usability Testing", "Prototyping", "A/B Testing"]
      : /bio|genom|lab/.test(role)
      ? ["Python", "R", "NGS Analysis", "Biostatistics"]
      : ["Strategic Planning", "Data Analysis", "Cross-Functional Leadership", "Process Optimization"];
    const cur = new Set((content.skills || []).map((s: string) => s.toLowerCase()));
    const fresh = suggested.filter((s) => !cur.has(s.toLowerCase()));
    if (fresh.length > 0) {
      patches.push({
        id: `patch-sk-${Date.now()}`,
        label: `Add ${fresh.length} Role Skills`,
        target: "add-skills",
        value: fresh,
      });
    }
    return {
      reply:
        fresh.length > 0
          ? `Based on your target role ("${content.role || "General"}"), adding ${fresh.join(", ")} will boost ATS keyword coverage.`
          : `Your Skills section already covers the core keywords for "${content.role}". Try pasting a specific job description in the Job Matcher tab for role-specific gaps.`,
      patches,
    };
  }

  const topIssues = report.checks
    .filter((ch) => ch.severity === "error" || ch.severity === "warning")
    .slice(0, 3);

  const summaryMsg =
    topIssues.length > 0
      ? `Your current Resume Health score is ${report.overallScore}/100 (${report.grade}). Top ${topIssues.length} priorities to boost interviews:\n` +
        topIssues.map((it, i) => `${i + 1}. ${it.title}: ${it.message}`).join("\n")
      : `Your resume is scoring ${report.overallScore}/100 (${report.grade})! Ask me to rewrite a summary, sharpen a bullet with the XYZ formula, or tailor for a specific job description.`;

  return { reply: summaryMsg, patches };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = ChatReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, history, content, seriesId } = parsed.data;

    const ai = await callAiJson<{ reply: string; patches?: AiChatPatch[] }>({
      temperature: 0.45,
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content: `You are Farnavi AI Copilot, an expert career coach embedded inside a resume editor. Be concise, specific, and practical. ${ANTI_HALLUCINATION_RULE} When the user asks to edit, improve, or rewrite part of their resume, include actionable patches in JSON. Return strict JSON: { "reply": string, "patches": [{ "id": string, "label": string, "target": "summary"|"role"|"add-skills"|"replace-bullet", "expId"?: string, "bulletIndex"?: number, "value": string | string[] }] }.`,
        },
        {
          role: "user",
          content: `CURRENT RESUME SNAPSHOT:\n${JSON.stringify({
            name: content.name,
            role: content.role,
            summary: content.summary,
            skills: content.skills,
            experience: (content.experience || []).slice(0, 4).map((e: any) => ({
              id: e.id,
              role: e.role,
              company: e.company,
              bullets: Array.isArray(e.bullets) ? e.bullets : [],
            })),
          })}`,
        },
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ],
    });

    if (ai.ok && ai.data?.reply) {
      return NextResponse.json({
        reply: ai.data.reply,
        patches: Array.isArray(ai.data.patches) ? ai.data.patches : [],
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    const local = buildLocalCopilotReply(message, content, seriesId);
    return NextResponse.json({
      ...local,
      mode: "smart-local",
      provider: "local",
      model: "copilot-deterministic",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "AI Copilot failed", detail: err?.message },
      { status: 500 }
    );
  }
}