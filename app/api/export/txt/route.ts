import { NextRequest, NextResponse } from "next/server";
import { buildPlainTextExport } from "@/lib/server/docx-injector";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txt = buildPlainTextExport(body?.content || {});
    const base = String(body?.fileName || body?.content?.name || "Farnavi_Resume")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "Farnavi_Resume";

    return new NextResponse(txt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}_ATS.txt"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to export TXT", detail: err?.message },
      { status: 500 }
    );
  }
}