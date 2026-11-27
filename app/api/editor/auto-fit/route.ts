import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeSmartPageFit } from "@/lib/server/smart-fit";

export const runtime = "nodejs";

const AutoFitSchema = z.object({
  content: z.record(z.any()),
  seriesId: z.string().optional().default("11"),
  pageSize: z.enum(["A4", "Letter"]).optional().default("A4"),
  targetPages: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(1),
});

export async function POST(req: NextRequest) {
  try {
    const MAX_ANALYZE_BYTES = 2 * 1024 * 1024;
    const declaredLen = Number(req.headers.get("content-length") || 0);
    if (declaredLen > MAX_ANALYZE_BYTES) {
      return NextResponse.json({ error: "Payload exceeds 2 MB limit" }, { status: 413 });
    }
    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_ANALYZE_BYTES) {
      return NextResponse.json({ error: "Payload exceeds 2 MB limit" }, { status: 413 });
    }
    let raw: any;
    try { raw = JSON.parse(rawText); } catch { return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }); }
    const parsed = AutoFitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid auto-fit request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = computeSmartPageFit(parsed.data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Auto-fit failed", detail: err?.message },
      { status: 500 }
    );
  }
}