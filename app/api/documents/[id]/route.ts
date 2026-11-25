import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { UpdateDocumentSchema } from "@/lib/server/schemas";
import { getWorkspaceUser, serializeDocument } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 30 } },
    });

    if (!doc) {
      if (req.nextUrl.searchParams.get("optional") === "1") {
        return NextResponse.json({ document: null }, { status: 200 });
      }
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document: serializeDocument(doc) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch document", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();
    const raw = await req.json();
    const parsed = UpdateDocumentSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid patch payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    const d = parsed.data;
    if (existing && d.expectedUpdatedAt) {
      const expectedMs = Date.parse(d.expectedUpdatedAt);
      const actualMs = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      if (Number.isFinite(expectedMs) && actualMs > expectedMs + 50) {
        return NextResponse.json(
          {
            error: "Document was updated in another session or tab",
            code: "CONFLICT",
            serverUpdatedAt: existing.updatedAt,
            document: serializeDocument(existing),
          },
          { status: 409 }
        );
      }
    }
    const data: Record<string, any> = {};
    if (d.type !== undefined) data.type = d.type;
    if (d.slug !== undefined) data.slug = d.slug ? d.slug.toLowerCase() : null;
    if (d.title !== undefined) data.title = d.title;
    if (d.seriesId !== undefined) data.seriesId = d.seriesId;
    if (d.activeTab !== undefined) data.activeTab = d.activeTab;
    if (d.language !== undefined) data.language = d.language;
    if (d.accent !== undefined) data.accent = d.accent;
    if (d.font !== undefined) data.font = d.font;
    if (d.score !== undefined) data.score = d.score;
    if (d.pinned !== undefined) data.pinned = d.pinned;
    if (d.label !== undefined) data.label = d.label;
    if (d.targetJobTitle !== undefined) data.targetJobTitle = d.targetJobTitle;
    if (d.targetCompany !== undefined) data.targetCompany = d.targetCompany;
    if (d.targetJd !== undefined) data.targetJd = d.targetJd;
    if (d.content !== undefined) data.contentJson = JSON.stringify(d.content);
    if (d.settings !== undefined) data.settingsJson = JSON.stringify(d.settings);
    if (d.visibility !== undefined) data.visibilityJson = JSON.stringify(d.visibility);
    if (d.sectionOrder !== undefined) data.sectionOrderJson = JSON.stringify(d.sectionOrder);
    if (d.customLabels !== undefined) data.customLabelsJson = JSON.stringify(d.customLabels);
    if (d.headerFooter !== undefined) data.headerFooterJson = JSON.stringify(d.headerFooter);

    let saved;
    if (!existing) {
      if (req.nextUrl.searchParams.get("upsert") !== "1") {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      const SEEDED_DOC_IDS = new Set(["doc-executive","doc-ivy-league","doc-elegant","doc-photo-column","doc-modern","doc-contemporary","doc-minimal","doc-single-column"]);
      const existingAny = await prisma.document.findUnique({ where: { id }, select: { userId: true } });
      if (existingAny && existingAny.userId !== user.id) {
        if (SEEDED_DOC_IDS.has(id)) {
          saved = await prisma.document.update({ where: { id }, data: { ...data, userId: user.id } });
        } else {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
      } else {
        saved = await prisma.document.create({
          data: {
            id,
            userId: user.id,
            type: d.type ?? "resume",
            title: d.title ?? "Untitled Resume",
            seriesId: d.seriesId ?? "11",
            activeTab: d.activeTab ?? "resume",
            language: d.language ?? "English",
            accent: d.accent ?? "#202124",
            font: d.font ?? "Merriweather",
            score: d.score ?? 0,
            pinned: d.pinned ?? false,
            contentJson: JSON.stringify(d.content ?? {}),
            settingsJson: JSON.stringify(d.settings ?? {}),
            visibilityJson: JSON.stringify(d.visibility ?? {}),
            sectionOrderJson: JSON.stringify(d.sectionOrder ?? []),
            customLabelsJson: JSON.stringify(d.customLabels ?? {}),
            headerFooterJson: JSON.stringify(d.headerFooter ?? { headerText: "", footerText: "", pageNumbering: "none" }),
          },
        });
      }
    } else {
      saved = await prisma.document.update({
        where: { id },
        data,
      });
    }

    return NextResponse.json({
      document: serializeDocument(saved),
      savedAt: saved.updatedAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update document", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getWorkspaceUser();

    const existing = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete document", detail: err?.message },
      { status: 500 }
    );
  }
}