import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeResume } from "@/lib/server/resume-analyzer";

export const runtime = "nodejs";

const AnalyzeRequestSchema = z.object({
  content: z.record(z.any()),
  seriesId: z.string().optional().default("11"),
  settings: z.record(z.any()).optional().default({}),
  jobTitle: z.string().optional(),
  jobCompany: z.string().optional(),
  jobDescription: z.string().optional(),
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
    const parsed = AnalyzeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid analyze payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = analyzeResume(parsed.data);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to analyze resume", detail: err?.message },
      { status: 500 }
    );
  }
}