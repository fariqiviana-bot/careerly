import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[api/cv] JSON parse fallback:", err);
    return fallback;
  }
}

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();
    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    let doc = await prisma.document.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
      },
    });

    if (!doc && cleanSlug === "viana-fariqi") {
      doc =
        (await prisma.document.findFirst({
          where: { type: "website" },
          orderBy: { updatedAt: "desc" },
        })) ||
        (await prisma.document.findFirst({
          orderBy: { updatedAt: "desc" },
        }));
    }

    if (!doc) {
      return NextResponse.json({ error: "Personal website not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        slug: doc.slug || cleanSlug,
        type: "website",
        title: doc.title,
        series: doc.seriesId,
        seriesId: doc.seriesId,
        template: doc.seriesId,
        activeTab: doc.activeTab,
        language: doc.language,
        accent: doc.accent,
        font: doc.font,
        score: doc.score,
        content: safeParse(doc.contentJson, {}),
        settings: safeParse(doc.settingsJson, {}),
        visibility: safeParse(doc.visibilityJson, {}),
        sectionOrder: safeParse(doc.sectionOrderJson, []),
        updatedAt: doc.updatedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/cv/[slug]]", err);
    return NextResponse.json({ error: "Failed to load personal website" }, { status: 500 });
  }
}