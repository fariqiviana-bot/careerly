import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { resolveWorkspaceUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const CreateTrackSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  title: z.string().trim().min(1, "Job title is required").max(200),
  company: z.string().trim().min(1, "Company name is required").max(200),
  url: z.string().max(500).optional().default(""),
  status: z.enum(["recommended", "shortlist", "auto", "saved", "applied", "interviewing", "offer", "rejected", "archived"]).optional().default("shortlist"),
  location: z.string().max(160).optional().default("Remote"),
  salary: z.string().max(120).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  date: z.string().max(60).optional(),
  resumeId: z.string().nullable().optional(),
  coverId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await resolveWorkspaceUser();
    const rows = await prisma.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: rows });
  } catch (err: any) {
    console.error("[GET /api/tracker]", err);
    return NextResponse.json({ error: "Failed to load tracker items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveWorkspaceUser();
    const raw = await req.json().catch(() => null);
    const parsed = CreateTrackSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid tracker payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    for (const refId of [d.resumeId, d.coverId]) {
      if (refId) {
        const refDoc = await prisma.document.findUnique({ where: { id: refId }, select: { userId: true } });
        if (refDoc && refDoc.userId !== user.id) {
          return NextResponse.json({ error: "Cannot link a document owned by another user" }, { status: 403 });
        }
      }
    }
    const item = await prisma.jobApplication.create({
      data: {
        ...(d.id ? { id: d.id } : {}),
        userId: user.id,
        title: d.title,
        company: d.company,
        url: d.url,
        status: d.status,
        location: d.location,
        salary: d.salary,
        notes: d.notes,
        date: d.date || new Date().toISOString().slice(0, 10),
        resumeId: d.resumeId ?? null,
        coverId: d.coverId ?? null,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tracker]", err);
    return NextResponse.json({ error: "Failed to save job application" }, { status: 500 });
  }
}