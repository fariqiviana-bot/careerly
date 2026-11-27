import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateBundleZipBuffer } from "@/lib/server/docx-injector";
import { buildSafeContentDisposition } from "@/lib/server/export-options";

export const runtime = "nodejs";
const MAX_BUNDLE_EXPORT_BYTES = 4 * 1024 * 1024;

const BundleExportSchema = z.object({
  seriesId: z.string().default("11"),
  pageSize: z.string().optional().default("A4").transform((v): "A4" | "Letter" => (v.toLowerCase() === "letter" ? "Letter" : "A4")),
  pageCount: z.coerce.number().int().min(1).max(3).catch(1).transform((n): 1 | 2 | 3 => (n === 2 ? 2 : n === 3 ? 3 : 1)),
  fileName: z.string().optional(),
  visibility: z.record(z.boolean()).optional(),
  sectionOrder: z.array(z.any()).optional(),
  customLabels: z.record(z.string()).optional(),
  content: z
    .record(z.any())
    .refine((c) => Object.keys(c).length > 0, { message: "Resume content is required" })
    .refine((c) => !Array.isArray(c.experience) || c.experience.length <= 60, { message: "Maximum 60 experience entries allowed" }),
});

export async function POST(req: NextRequest) {
  try {
    const declaredLen = Number(req.headers.get("content-length") || 0);
    if (declaredLen > MAX_BUNDLE_EXPORT_BYTES) {
      return NextResponse.json({ error: "Export payload exceeds 4 MB limit" }, { status: 413 });
    }
    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_BUNDLE_EXPORT_BYTES) {
      return NextResponse.json({ error: "Export payload exceeds 4 MB limit" }, { status: 413 });
    }
    let raw: any;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = BundleExportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bundle export payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const rawName = d.fileName || String(d.content?.name || "Farnavi_Application");
    const baseName = rawName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "Farnavi_Application";

    const buffer = await generateBundleZipBuffer({
      seriesId: d.seriesId,
      pageSize: d.pageSize,
      pageCount: d.pageCount,
      baseFileName: baseName,
      content: d.content,
      visibility: d.visibility,
      sectionOrder: d.sectionOrder,
      customLabels: d.customLabels,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": buildSafeContentDisposition(rawName, "_Complete_Package.zip"),
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
