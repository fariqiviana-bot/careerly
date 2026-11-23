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
    const raw = await req.json();
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