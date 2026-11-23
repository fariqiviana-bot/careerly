import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANTI_HALLUCINATION_RULE, callAiJson } from "@/lib/server/ai-client";
import { analyzeResume } from "@/lib/server/resume-analyzer";

export const runtime = "nodejs";

const TailorReqSchema = z.object({
  content: z.record(z.any()),
  seriesId: z.string().optional().default("11"),
  jobTitle: z.string().optional().default(""),
  company: z.string().optional().default(""),
  jobDescription: z.string().min(10, "Please provide a job description or role summary."),
  level: z.enum(["conservative", "balanced", "turbo"]).optional().default("balanced"),
});

export interface TailorProposal {
  id: string;
  target: "role" | "summary" | "skills" | "bullet";
  label: string;
  reason: string;
  expId?: string;
  bulletIndex?: number;
  before: string;
  after: string;
  addedSkills?: string[];
}

function buildLocalTailorProposals(params: {
  content: Record<string, any>;
  jobTitle: string;
  company: string;
  jobDescription: string;
  level: "conservative" | "balanced" | "turbo";
}): { proposals: TailorProposal[]; beforeMatch: number; estimatedAfterMatch: number } {
  const { content, jobTitle, company, jobDescription, level } = params;
  const analysis = analyzeResume({
    content,
    jobTitle,
    jobCompany: company,
    jobDescription,
  });

  const jm = analysis.jobMatch;
  const missingHard = jm?.missingHard || [];
  const missingSoft = jm?.missingSoft || [];
  const proposals: TailorProposal[] = [];

  // 1. Target Role alignment (Balanced & Turbo)
  const currentRole = String(content.role || "").trim();
  const targetRole = jobTitle.trim();
  if (
    level !== "conservative" &&
    targetRole &&
    currentRole.toLowerCase() !== targetRole.toLowerCase()
  ) {
    proposals.push({
      id: "prop-role",
      target: "role",
      label: "Headline / Target Job Title",
      reason: `Align your header title directly with the posting ("${targetRole}") for instant ATS title matching.`,
      before: currentRole || "(empty)",
      after: targetRole,
    });
  }

  // 2. Skills keyword additions
  const skillLimit = level === "conservative" ? 2 : level === "balanced" ? 4 : 7;
  const skillsToAdd = [...missingHard, ...missingSoft].slice(0, skillLimit);
  if (skillsToAdd.length > 0) {
    const curSkills: string[] = Array.isArray(content.skills) ? content.skills : [];
    proposals.push({
      id: "prop-skills",
      target: "skills",
      label: `Add ${skillsToAdd.length} High-Signal Keyword(s) to Skills`,
      reason: `These keywords appear in the ${company || "target"} job description and are currently missing from your Skills section.`,
      before: curSkills.slice(0, 8).join(", ") || "(empty)",
      after: [...curSkills, ...skillsToAdd].join(", "),
      addedSkills: skillsToAdd,
    });
  }

  // 3. Summary tailoring
  const curSummary = String(content.summary || "").trim();
  const isPlaceholderSum = /^Write 3[\u2013\-]5 sentences|^Showcase your top|^Use this section/i.test(curSummary);
  const keyFocus = (missingHard.length > 0 ? missingHard : jm?.matchedHard || []).slice(0, 3);
  if (keyFocus.length > 0) {
    const newSummary = isPlaceholderSum || !curSummary
      ? `Impact-driven ${targetRole || currentRole || "Professional"} with hands-on expertise in ${keyFocus.join(", ")}. Proven track record of collaborating cross-functionally to deliver scalable solutions and measurable results${company ? ` aligned with ${company}'s priorities` : ""}.`
      : level === "conservative"
      ? `${curSummary.replace(/\.?\s*$/, "")}, with focused strengths in ${keyFocus.slice(0, 2).join(" and ")}.`
      : `${targetRole || currentRole || "Professional"} focused on ${keyFocus.join(", ")}. ${curSummary}`;

    proposals.push({
      id: "prop-summary",
      target: "summary",
      label: "Professional Summary Alignment",
      reason: `Weaves top job keywords (${keyFocus.join(", ")}) into the first 6 seconds of recruiter review.`,
      before: curSummary || "(empty)",
      after: newSummary,
    });
  }

  // 4. Bullet improvements (Balanced: up to 2 bullets, Turbo: up to 3 bullets, Conservative: 1 bullet)
  const expList: any[] = Array.isArray(content.experience) ? content.experience : [];
  const maxBullets = level === "conservative" ? 1 : level === "balanced" ? 2 : 3;
  let addedBullets = 0;

  for (const exp of expList) {
    if (addedBullets >= maxBullets) break;
    const bullets: string[] = Array.isArray(exp.bullets) && exp.bullets.length > 0
      ? exp.bullets
      : String(exp.description || "")
          .split(/\r?\n/)
          .map((l) => l.replace(/^[\u2022\-*]\s*/, "").trim())
          .filter(Boolean);

    for (let bi = 0; bi < bullets.length && addedBullets < maxBullets; bi++) {
      const b = bullets[bi];
      const kw = missingHard[addedBullets] || missingSoft[0];
      if (!kw || b.toLowerCase().includes(kw.toLowerCase())) continue;

      const cleaned = b
        .replace(/^(?:responsible for|helped(?: to)?|worked on|assisted(?: with| in)?)\s+/i, "Led ")
        .replace(/\.?\s*$/, "");
      const improved = `${cleaned}, applying ${kw} to elevate team outcomes.`;

      proposals.push({
        id: `prop-bullet-${exp.id}-${bi}`,
        target: "bullet",
        label: `Experience Bullet (${exp.role || exp.title || "Role"})`,
        reason: `Strengthens phrasing and naturally incorporates "${kw}" from the job posting without fabricating metrics.`,
        expId: String(exp.id),
        bulletIndex: bi,
        before: b,
        after: improved,
      });
      addedBullets++;
    }
  }

  const beforeMatch = jm?.matchScore ?? 50;
  const estimatedAfterMatch = Math.min(98, beforeMatch + Math.min(38, skillsToAdd.length * 7 + addedBullets * 4));
  return { proposals, beforeMatch, estimatedAfterMatch };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = TailorReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tailor request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const local = buildLocalTailorProposals({
      content: d.content,
      jobTitle: d.jobTitle,
      company: d.company,
      jobDescription: d.jobDescription,
      level: d.level,
    });

    const ai = await callAiJson<{ proposals: TailorProposal[] }>({
      temperature: 0.35,
      maxTokens: 1600,
      messages: [
        {
          role: "system",
          content: `You tailor resumes for a target job description at intensity "${d.level}" (conservative = light keyword polish; balanced = headline + summary + 2 bullets + skills; turbo = strong rewrite across headline, summary, skills, and 3-4 bullets). ${ANTI_HALLUCINATION_RULE} Return strict JSON: { "proposals": [{ "id": string, "target": "role"|"summary"|"skills"|"bullet", "label": string, "reason": string, "expId"?: string, "bulletIndex"?: number, "before": string, "after": string, "addedSkills"?: string[] }] }. For bullet proposals, preserve exact expId and 0-based bulletIndex from the input.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            jobTitle: d.jobTitle,
            company: d.company,
            jobDescription: d.jobDescription.slice(0, 5000),
            resume: {
              role: d.content.role,
              summary: d.content.summary,
              skills: d.content.skills,
              experience: (d.content.experience || []).slice(0, 4).map((e: any) => ({
                id: e.id,
                role: e.role || e.title,
                company: e.company,
                bullets: Array.isArray(e.bullets) ? e.bullets : [],
              })),
            },
          }),
        },
      ],
    });

    if (ai.ok && Array.isArray(ai.data?.proposals) && ai.data.proposals.length > 0) {
      return NextResponse.json({
        proposals: ai.data.proposals,
        beforeMatch: local.beforeMatch,
        estimatedAfterMatch: local.estimatedAfterMatch,
        level: d.level,
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    return NextResponse.json({
      ...local,
      level: d.level,
      mode: "smart-local",
      provider: "local",
      model: "tailor-deterministic",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate tailoring diff", detail: err?.message },
      { status: 500 }
    );
  }
}