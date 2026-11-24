import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { resolveWorkspaceUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const CreateInterviewSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  title: z.string().trim().min(1, "Role title is required").max(200),
  company: z.string().trim().min(1, "Company name is required").max(200),
  seniority: z.string().max(60).optional().default("Mid"),
  mode: z.string().max(60).optional().default("Basic"),
  resumeId: z.string().nullable().optional(),
  answers: z.array(z.any()).optional(),
  score: z.number().int().min(0).max(100).optional().default(0),
});

function serializeInterview(row: any) {
  let answers: any[] = [];
  try { answers = JSON.parse(row.answersJson || "[]"); } catch (err) { console.warn("[interviews] parse:", err); }
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    seniority: row.seniority,
    mode: row.mode,
    resumeId: row.resumeId,
    answers,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const user = await resolveWorkspaceUser();
    const rows = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: rows.map(serializeInterview) });
  } catch (err: any) {
    console.error("[GET /api/interviews]", err);
    return NextResponse.json({ error: "Failed to load interviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveWorkspaceUser();
    const raw = await req.json().catch(() => null);
    const parsed = CreateInterviewSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid interview payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const row = await prisma.interviewSession.create({
      data: {
        ...(d.id ? { id: d.id } : {}),
        userId: user.id,
        title: d.title,
        company: d.company,
        seniority: d.seniority,
        mode: d.mode,
        resumeId: d.resumeId ?? null,
        answersJson: JSON.stringify(d.answers || []),
        score: d.score,
      },
    });
    return NextResponse.json({ item: serializeInterview(row) }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/interviews]", err);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}