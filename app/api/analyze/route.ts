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
    const raw = await req.json();
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