import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { resolveWorkspaceUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const PatchTrackSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().min(1).max(200).optional(),
  url: z.string().max(500).optional(),
  status: z.enum(["recommended", "shortlist", "auto", "saved", "applied", "interviewing", "offer", "rejected", "archived"]).optional(),
  location: z.string().max(160).optional(),
  salary: z.string().max(120).optional(),
  notes: z.string().max(5000).optional(),
  date: z.string().max(60).optional(),
  resumeId: z.string().nullable().optional(),
  coverId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await resolveWorkspaceUser();
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = PatchTrackSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const item = await prisma.jobApplication.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    console.error("[PATCH /api/tracker/[id]]", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await resolveWorkspaceUser();
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    await prisma.jobApplication.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/tracker/[id]]", err);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}