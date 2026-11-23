import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/server/prisma";
import { getWorkspaceUser } from "@/lib/server/workspace";

export const runtime = "nodejs";

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
      return NextResponse.json({ share: null });
    }

    const share = await prisma.shareLink.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ share });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load share settings", detail: err?.message },
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
    const body = await req.json().catch(() => ({}));

    const doc = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: "Save document first before sharing." }, { status: 404 });
    }

    const existing = await prisma.shareLink.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const updated = await prisma.shareLink.update({
        where: { id: existing.id },
        data: {
          active: typeof body.active === "boolean" ? body.active : true,
          showContact:
            typeof body.showContact === "boolean" ? body.showContact : existing.showContact,
        },
      });
      return NextResponse.json({ share: updated });
    }

    const token = randomBytes(9).toString("base64url");
    const created = await prisma.shareLink.create({
      data: {
        token,
        documentId: id,
        active: typeof body.active === "boolean" ? body.active : true,
        showContact: typeof body.showContact === "boolean" ? body.showContact : true,
      },
    });

    return NextResponse.json({ share: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update share link", detail: err?.message },
      { status: 500 }
    );
  }
}