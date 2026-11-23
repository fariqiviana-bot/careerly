import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANTI_HALLUCINATION_RULE, callAiJson } from "@/lib/server/ai-client";

export const runtime = "nodejs";

const SummaryReqSchema = z.object({
  content: z.record(z.any()),
  targetRole: z.string().optional().default(""),
  highlightSkills: z.array(z.string()).optional().default([]),
});

export interface SummaryVariant {
  id: string;
  label: string;
  text: string;
}

function buildLocalSummaries(
  content: Record<string, any>,
  targetRole: string,
  highlightSkills: string[]
): SummaryVariant[] {
  const role = targetRole.trim() || String(content.role || content.profession || "Professional").trim();
  const exp: any[] = Array.isArray(content.experience) ? content.experience : [];
  const skills: string[] =
    highlightSkills.length > 0
      ? highlightSkills
      : Array.isArray(content.skills)
      ? content.skills.slice(0, 5)
      : [];
  const skillText = skills.length > 0 ? skills.slice(0, 4).join(", ") : "cross-functional execution, problem solving, and strategic delivery";
  const latestCompany = exp[0]?.company ? ` most recently at ${exp[0].company}` : "";

  return [
    {
      id: "impact",
      label: "Impact-Driven (Recommended)",
      text: `Results-focused ${role} with [N]+ years of experience driving measurable outcomes${latestCompany}. Skilled in ${skillText}, with a track record of improving workflow efficiency by [X%] and aligning execution with business goals.`,
    },
    {
      id: "concise",
      label: "Concise & ATS-Crisp",
      text: `${role} specializing in ${skillText}. Proven ability to translate complex requirements into scalable deliverables, partner with cross-functional teams, and elevate quality across high-priority initiatives.`,
    },
    {
      id: "executive",
      label: "Leadership & Strategy",
      text: `Strategic ${role} combining deep expertise in ${skillText} with hands-on leadership${latestCompany}. Recognized for mentoring peers, standardizing best practices, and delivering consistent results across fast-paced environments.`,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = SummaryReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid summary request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, targetRole, highlightSkills } = parsed.data;
    const ai = await callAiJson<{ variants: SummaryVariant[] }>({
      temperature: 0.45,
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content: `Write 3 distinct ATS-optimized Professional Summary options (each 280-460 characters, no first-person pronouns I/My). ${ANTI_HALLUCINATION_RULE} Return strict JSON: { "variants": [{ "id": "impact"|"concise"|"executive", "label": string, "text": string }] }.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            targetRole: targetRole || content.role,
            highlightSkills,
            experience: (content.experience || []).slice(0, 3),
            skills: (content.skills || []).slice(0, 12),
            currentSummary: content.summary || "",
          }),
        },
      ],
    });

    if (ai.ok && Array.isArray(ai.data?.variants) && ai.data.variants.length > 0) {
      return NextResponse.json({
        variants: ai.data.variants,
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    return NextResponse.json({
      variants: buildLocalSummaries(content, targetRole, highlightSkills),
      mode: "smart-local",
      provider: "local",
      model: "summary-deterministic",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate summaries", detail: err?.message },
      { status: 500 }
    );
  }
}