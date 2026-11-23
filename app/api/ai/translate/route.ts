import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callAiJson } from "@/lib/server/ai-client";

export const runtime = "nodejs";

const TranslateReqSchema = z.object({
  content: z.record(z.any()),
  targetLanguage: z.string().min(2).max(60),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = TranslateReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid translate request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, targetLanguage } = parsed.data;

    const ai = await callAiJson<{
      role?: string;
      summary?: string;
      skills?: string[];
      technicalSkills?: string[];
      experience?: Array<{ id: string; role: string; overview?: string; bullets: string[] }>;
      education?: Array<{ id: string; degree: string }>;
    }>({
      temperature: 0.2,
      maxTokens: 2000,
      messages: [
        {
          role: "system",
          content: `Translate the resume content naturally and professionally into ${targetLanguage}. Preserve exact JSON structure and all IDs. Do NOT alter email addresses, URLs, phone numbers, company proper names, or numerical metrics. Return strict JSON with keys: role, summary, skills, technicalSkills, experience (array of {id, role, overview, bullets}), education (array of {id, degree}).`,
        },
        {
          role: "user",
          content: JSON.stringify({
            role: content.role,
            summary: content.summary,
            skills: content.skills || [],
            technicalSkills: content.technicalSkills || [],
            experience: (content.experience || []).map((e: any) => ({
              id: e.id,
              role: e.role,
              overview: e.overview || "",
              bullets: Array.isArray(e.bullets) ? e.bullets : [],
            })),
            education: (content.education || []).map((ed: any) => ({
              id: ed.id,
              degree: ed.degree,
            })),
          }),
        },
      ],
    });

    if (ai.ok && ai.data) {
      const t = ai.data;
      const merged = {
        ...content,
        role: t.role || content.role,
        summary: t.summary || content.summary,
        skills: Array.isArray(t.skills) && t.skills.length > 0 ? t.skills : content.skills,
        technicalSkills:
          Array.isArray(t.technicalSkills) && t.technicalSkills.length > 0
            ? t.technicalSkills
            : content.technicalSkills,
        experience: (content.experience || []).map((e: any) => {
          const match = (t.experience || []).find((te) => te.id === e.id);
          if (!match) return e;
          const bullets = Array.isArray(match.bullets) && match.bullets.length > 0 ? match.bullets : e.bullets;
          return {
            ...e,
            role: match.role || e.role,
            overview: match.overview ?? e.overview,
            bullets,
            description: Array.isArray(bullets)
              ? bullets.map((b: string) => `\u2022 ${b}`).join("\n")
              : e.description,
          };
        }),
        education: (content.education || []).map((ed: any) => {
          const match = (t.education || []).find((ted) => ted.id === ed.id);
          return match ? { ...ed, degree: match.degree || ed.degree } : ed;
        }),
      };

      return NextResponse.json({
        translated: merged,
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    return NextResponse.json({
      translated: null,
      mode: "fallback-dictionary",
      note: "Add AI_API_KEY in .env for full neural translation of custom bullets.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Translation failed", detail: err?.message },
      { status: 500 }
    );
  }
}