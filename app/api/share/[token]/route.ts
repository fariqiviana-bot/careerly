import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { serializeDocument } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: { document: true },
    });

    if (share) {
      if (!share.active) {
        return NextResponse.json(
          { error: "This share link has been disabled by the owner." },
          { status: 403 }
        );
      }

      const updated = await prisma.shareLink.update({
        where: { id: share.id },
        data: { viewCount: { increment: 1 } },
      });

      const doc = serializeDocument(share.document);
      if (!share.showContact && doc.content) {
        doc.content = {
          ...doc.content,
          email: "hidden@private.link",
          phone: "(Hidden for privacy)",
          location: doc.content.location ? "Location hidden" : "",
        };
      }

      return NextResponse.json({
        document: doc,
        share: {
          token: updated.token,
          viewCount: updated.viewCount,
          showContact: updated.showContact,
        },
      });
    }

    return NextResponse.json({ error: "Shared resume not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load shared resume", detail: err?.message },
      { status: 500 }
    );
  }
}