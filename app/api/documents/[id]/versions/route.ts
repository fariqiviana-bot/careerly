import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { CreateVersionSchema } from "@/lib/server/schemas";
import { getWorkspaceUser, serializeVersion } from "@/lib/server/workspace";

export const runtime = "nodejs";

const MAX_VERSIONS_PER_DOC = 30;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ versions: [] });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
      take: MAX_VERSIONS_PER_DOC,
    });

    return NextResponse.json({
      versions: versions.map(serializeVersion),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load versions", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();
    const raw = await req.json().catch(() => ({}));
    const parsed = CreateVersionSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid version payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const label =
      parsed.data.label ||
      `Snapshot (${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })})`;

    const created = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        label,
        trigger: parsed.data.trigger,
        seriesId: doc.seriesId,
        contentJson: doc.contentJson,
        settingsJson: doc.settingsJson,
        visibilityJson: doc.visibilityJson,
        sectionOrderJson: doc.sectionOrderJson,
      },
    });

    // Prune versions beyond MAX_VERSIONS_PER_DOC
    const overflow = await prisma.documentVersion.findMany({
      where: { documentId: doc.id },
      orderBy: { createdAt: "desc" },
      skip: MAX_VERSIONS_PER_DOC,
      select: { id: true },
    });
    if (overflow.length > 0) {
      await prisma.documentVersion.deleteMany({
        where: { id: { in: overflow.map((o) => o.id) } },
      });
    }

    return NextResponse.json({ version: serializeVersion(created) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create snapshot", detail: err?.message },
      { status: 500 }
    );
  }
}