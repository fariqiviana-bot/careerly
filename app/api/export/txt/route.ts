import { NextRequest, NextResponse } from "next/server";
import { buildPlainTextExport } from "@/lib/server/docx-injector";
import { buildSafeContentDisposition } from "@/lib/server/export-options";

export const runtime = "nodejs";
const MAX_TXT_EXPORT_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const declaredLen = Number(req.headers.get("content-length") || 0);
    if (declaredLen > MAX_TXT_EXPORT_BYTES) {
      return NextResponse.json({ error: "Export payload exceeds 4 MB limit" }, { status: 413 });
    }
    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_TXT_EXPORT_BYTES) {
      return NextResponse.json({ error: "Export payload exceeds 4 MB limit" }, { status: 413 });
    }
    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid TXT export payload" }, { status: 400 });
    }

    const txt = buildPlainTextExport(body?.content || {}, {
      visibility: body?.visibility,
      sectionOrder: body?.sectionOrder,
      customLabels: body?.customLabels,
    });

    return new NextResponse(txt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": buildSafeContentDisposition(
          String(body?.fileName || body?.content?.name || "Farnavi_Resume"),
          "_ATS.txt"
        ),
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
