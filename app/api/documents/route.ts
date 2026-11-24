import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/prisma";
import { CreateDocumentSchema } from "@/lib/server/schemas";
import { getWorkspaceUser, serializeDocument } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getWorkspaceUser();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const seriesId = searchParams.get("seriesId");

    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
        ...(type ? { type } : {}),
        ...(seriesId ? { seriesId } : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      documents: docs.map((d) => serializeDocument(d)),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load documents", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getWorkspaceUser();
    const raw = await req.json();
    const parsed = CreateDocumentSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid document payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const id = d.id || `doc_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const saved = await prisma.document.upsert({
      where: { id },
      update: {
        type: d.type,
      ...(d.slug !== undefined ? { slug: d.slug ? d.slug.toLowerCase() : null } : {}),
        title: d.title,
        seriesId: d.seriesId,
        activeTab: d.activeTab,
        language: d.language,
        accent: d.accent,
        font: d.font,
        score: d.score,
        pinned: d.pinned,
        label: d.label ?? null,
        targetJobTitle: d.targetJobTitle ?? null,
        targetCompany: d.targetCompany ?? null,
        targetJd: d.targetJd ?? null,
        contentJson: JSON.stringify(d.content),
        settingsJson: JSON.stringify(d.settings),
        visibilityJson: JSON.stringify(d.visibility),
        sectionOrderJson: JSON.stringify(d.sectionOrder),
        customLabelsJson: JSON.stringify(d.customLabels),
        headerFooterJson: JSON.stringify(d.headerFooter),
      },
      create: {
        id,
        userId: user.id,
        type: d.type,
      ...(d.slug !== undefined ? { slug: d.slug ? d.slug.toLowerCase() : null } : {}),
        title: d.title,
        seriesId: d.seriesId,
        activeTab: d.activeTab,
        language: d.language,
        accent: d.accent,
        font: d.font,
        score: d.score,
        pinned: d.pinned,
        label: d.label ?? null,
        targetJobTitle: d.targetJobTitle ?? null,
        targetCompany: d.targetCompany ?? null,
        targetJd: d.targetJd ?? null,
        contentJson: JSON.stringify(d.content),
        settingsJson: JSON.stringify(d.settings),
        visibilityJson: JSON.stringify(d.visibility),
        sectionOrderJson: JSON.stringify(d.sectionOrder),
        customLabelsJson: JSON.stringify(d.customLabels),
        headerFooterJson: JSON.stringify(d.headerFooter),
      },
    });

    // Create initial baseline snapshot if document has no versions yet
    const existingCount = await prisma.documentVersion.count({
      where: { documentId: saved.id },
    });
    if (existingCount === 0) {
      await prisma.documentVersion.create({
        data: {
          documentId: saved.id,
          label: "Initial Version",
          trigger: "auto",
          seriesId: saved.seriesId,
          contentJson: saved.contentJson,
          settingsJson: saved.settingsJson,
          visibilityJson: saved.visibilityJson,
          sectionOrderJson: saved.sectionOrderJson,
        },
      });
    }

    const withVersions = await prisma.document.findUnique({
      where: { id: saved.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 30 } },
    });

    return NextResponse.json(
      { document: serializeDocument(withVersions || saved) },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save document", detail: err?.message },
      { status: 500 }
    );
  }
}