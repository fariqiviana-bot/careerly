import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { resolveWorkspaceUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const PatchInterviewSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().min(1).max(200).optional(),
  seniority: z.string().max(60).optional(),
  mode: z.string().max(60).optional(),
  answers: z.array(z.any()).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await resolveWorkspaceUser();
    const existing = await prisma.interviewSession.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = PatchInterviewSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { answers, ...rest } = parsed.data;
    const updated = await prisma.interviewSession.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(answers !== undefined ? { answersJson: JSON.stringify(answers) } : {}),
      },
    });
    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("[PATCH /api/interviews/[id]]", err);
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await resolveWorkspaceUser();
    const existing = await prisma.interviewSession.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }
    await prisma.interviewSession.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/interviews/[id]]", err);
    return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
  }
}