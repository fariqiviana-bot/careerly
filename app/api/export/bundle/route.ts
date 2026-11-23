import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateBundleZipBuffer } from "@/lib/server/docx-injector";

export const runtime = "nodejs";

const BundleExportSchema = z.object({
  seriesId: z.string().default("11"),
  pageSize: z.string().optional().default("A4").transform((v): "A4" | "Letter" => (v.toLowerCase() === "letter" ? "Letter" : "A4")),
  pageCount: z.coerce.number().int().min(1).max(3).catch(1).transform((n): 1 | 2 | 3 => (n === 2 ? 2 : n === 3 ? 3 : 1)),
  fileName: z.string().optional(),
  content: z.record(z.any()).refine((c) => Object.keys(c).length > 0, { message: "Resume content is required" }),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = BundleExportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bundle export payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const baseName = (d.fileName || String(d.content?.name || "Farnavi_Application"))
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "Farnavi_Application";

    const buffer = await generateBundleZipBuffer({
      seriesId: d.seriesId,
      pageSize: d.pageSize,
      pageCount: d.pageCount,
      baseFileName: baseName,
      content: d.content,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${baseName}_Complete_Package.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to build ZIP package", detail: err?.message },
      { status: 500 }
    );
  }
}