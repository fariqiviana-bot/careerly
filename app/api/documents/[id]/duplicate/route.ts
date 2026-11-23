import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/prisma";
import { getWorkspaceUser, serializeDocument } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();

    const src = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });
    if (!src) {
      return NextResponse.json({ error: "Source document not found" }, { status: 404 });
    }

    const copyId = `doc_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const copy = await prisma.document.create({
      data: {
        id: copyId,
        userId: user.id,
        type: src.type,
        title: `${src.title} (Copy)`,
        seriesId: src.seriesId,
        activeTab: src.activeTab,
        language: src.language,
        accent: src.accent,
        font: src.font,
        score: src.score,
        pinned: false,
        label: src.label,
        targetJobTitle: src.targetJobTitle,
        targetCompany: src.targetCompany,
        targetJd: src.targetJd,
        contentJson: src.contentJson,
        settingsJson: src.settingsJson,
        visibilityJson: src.visibilityJson,
        sectionOrderJson: src.sectionOrderJson,
        customLabelsJson: src.customLabelsJson,
        headerFooterJson: src.headerFooterJson,
      },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: copy.id,
        label: `Duplicated from ${src.title}`,
        trigger: "auto",
        seriesId: copy.seriesId,
        contentJson: copy.contentJson,
        settingsJson: copy.settingsJson,
        visibilityJson: copy.visibilityJson,
        sectionOrderJson: copy.sectionOrderJson,
      },
    });

    return NextResponse.json({ document: serializeDocument(copy) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to duplicate document", detail: err?.message },
      { status: 500 }
    );
  }
}