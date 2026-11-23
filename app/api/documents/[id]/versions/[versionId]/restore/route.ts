import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getWorkspaceUser, serializeDocument } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await context.params;
    const user = await getWorkspaceUser();

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const version = await prisma.documentVersion.findFirst({
      where: { id: versionId, documentId: doc.id },
    });
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Automatically capture a safety backup before overwriting current state
    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        label: `Auto-Backup before restoring "${version.label}"`,
        trigger: "pre-restore",
        seriesId: doc.seriesId,
        contentJson: doc.contentJson,
        settingsJson: doc.settingsJson,
        visibilityJson: doc.visibilityJson,
        sectionOrderJson: doc.sectionOrderJson,
      },
    });

    const restored = await prisma.document.update({
      where: { id: doc.id },
      data: {
        seriesId: version.seriesId,
        contentJson: version.contentJson,
        settingsJson: version.settingsJson,
        visibilityJson: version.visibilityJson,
        sectionOrderJson: version.sectionOrderJson,
      },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 30 } },
    });

    return NextResponse.json({ document: serializeDocument(restored) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to restore version", detail: err?.message },
      { status: 500 }
    );
  }
}