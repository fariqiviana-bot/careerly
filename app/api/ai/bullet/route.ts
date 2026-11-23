import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANTI_HALLUCINATION_RULE, callAiJson } from "@/lib/server/ai-client";

export const runtime = "nodejs";

const BulletReqSchema = z.object({
  role: z.string().optional().default("Professional"),
  company: z.string().optional().default(""),
  existingBullet: z.string().optional().default(""),
  keyword: z.string().optional().default(""),
  tone: z.enum(["impact", "concise", "leadership"]).optional().default("impact"),
  count: z.number().int().min(1).max(4).optional().default(3),
});

function buildLocalBullets(d: z.infer<typeof BulletReqSchema>): string[] {
  const kw = d.keyword.trim();
  const role = d.role.trim() || "Professional";
  const comp = d.company.trim() ? ` at ${d.company.trim()}` : "";
  const existing = d.existingBullet.trim();

  if (existing) {
    const cleaned = existing
      .replace(/^[\u2022\-*]\s*/, "")
      .replace(/^(?:responsible for|helped(?: to)?|worked on|assisted(?: with| in)?|handled)\s+/i, "")
      .replace(/^\s*(?:I|We)\s+/i, "")
      .trim();
    const cap = cleaned ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : "core initiatives";
    const kwSuffix = kw ? ` leveraging ${kw}` : "";
    return [
      `Spearheaded ${cap}${kwSuffix}, improving key delivery metrics by [X%] across [N] stakeholders.`,
      `Streamlined ${cap}${kwSuffix}, cutting turnaround time by [X%] while maintaining quality standards.`,
      `Led cross-functional execution to ${cap}${kwSuffix}, driving measurable impact for [N users/clients].`,
    ].slice(0, d.count);
  }

  if (kw) {
    return [
      `Applied ${kw} as ${role}${comp} to optimize core workflows, reducing manual effort by [X%] across [N] deliverables.`,
      `Partnered with cross-functional teams using ${kw} to ship high-impact solutions, lifting performance by [X%].`,
      `Built repeatable ${kw} standards${comp}, improving accuracy and team velocity across [N] projects.`,
    ].slice(0, d.count);
  }

  return [
    `Led end-to-end ${role} initiatives${comp}, improving operational efficiency by [X%] within [N] months.`,
    `Collaborated with cross-functional stakeholders to deliver [N] priority projects on schedule and within budget.`,
    `Implemented data-informed process improvements${comp}, boosting customer or team outcomes by [X%].`,
  ].slice(0, d.count);
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = BulletReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bullet request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const ai = await callAiJson<{ bullets: string[] }>({
      temperature: 0.4,
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content: `You are an elite executive resume writer. Write ATS-friendly resume bullet points using the Google XYZ formula (Accomplished X, as measured by Y, by doing Z). Start every bullet with a strong past/present action verb. No first-person pronouns. Keep each bullet 12-26 words. ${ANTI_HALLUCINATION_RULE} Return strict JSON: { "bullets": string[] }.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            role: d.role,
            company: d.company,
            existingBullet: d.existingBullet || undefined,
            targetKeyword: d.keyword || undefined,
            tone: d.tone,
            requestedCount: d.count,
          }),
        },
      ],
    });

    if (ai.ok && Array.isArray(ai.data?.bullets) && ai.data.bullets.length > 0) {
      return NextResponse.json({
        bullets: ai.data.bullets.slice(0, d.count).map((b) => String(b).replace(/^[\u2022\-*]\s*/, "").trim()),
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    return NextResponse.json({
      bullets: buildLocalBullets(d),
      mode: "smart-local",
      provider: "local",
      model: "xyz-deterministic",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate bullets", detail: err?.message },
      { status: 500 }
    );
  }
}