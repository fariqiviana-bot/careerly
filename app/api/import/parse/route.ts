import { NextRequest, NextResponse } from "next/server";
import {
  extractLinesFromDocxBuffer,
  extractLinesFromPdfBuffer,
  parseResumeLinesDeterministic,
  parseResumeTextDeterministic,
  maybeEnhanceWithAI,
} from "@/lib/server/import-parser";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "No file uploaded. Please attach a .pdf, .docx, or .txt resume." },
          { status: 400 }
        );
      }

      if (file.size === 0) {
        return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
      }

      const fileName = file.name || "resume";
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const buffer = Buffer.from(await file.arrayBuffer());

      let base;
      let rawText = "";

      if (ext === "pdf" || file.type === "application/pdf") {
        const lines = await extractLinesFromPdfBuffer(buffer);
        rawText = lines.map((l) => l.text).join("\n");
        if (rawText.trim().length < 15) {
          return NextResponse.json(
            {
              error:
                "Could not extract readable text from this PDF. If it is a scanned image PDF, please paste the text or upload a text-based PDF/DOCX.",
            },
            { status: 422 }
          );
        }
        base = parseResumeLinesDeterministic(lines, { sourceType: "pdf", fileName });
      } else if (
        ext === "docx" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const lines = await extractLinesFromDocxBuffer(buffer);
        rawText = lines.map((l) => l.text).join("\n");
        if (rawText.trim().length < 15) {
          return NextResponse.json(
            { error: "Could not extract readable text from this DOCX file." },
            { status: 422 }
          );
        }
        base = parseResumeLinesDeterministic(lines, { sourceType: "docx", fileName });
      } else if (ext === "txt" || file.type.startsWith("text/")) {
        rawText = buffer.toString("utf-8");
        base = parseResumeTextDeterministic(rawText, { sourceType: "txt", fileName });
      } else {
        return NextResponse.json(
          { error: `Unsupported file type ".${ext}". Please upload PDF, DOCX, or TXT.` },
          { status: 400 }
        );
      }

      const finalResult = await maybeEnhanceWithAI(rawText, base);
      return NextResponse.json(finalResult);
    }

    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const sourceType = body?.sourceType === "linkedin" ? "linkedin" : "paste";
    const linkedinUrl = typeof body?.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";

    if (text.length < 20) {
      return NextResponse.json(
        {
          error:
            sourceType === "linkedin"
              ? "Please upload your LinkedIn 'Save to PDF' file or paste your LinkedIn profile text below."
              : "Please paste at least a few lines of your resume text.",
        },
        { status: 400 }
      );
    }

    const base = parseResumeTextDeterministic(text, { sourceType });
    if (linkedinUrl && !base.parsed.linkedin) {
      base.parsed.linkedin = linkedinUrl.replace(/^https?:\/\/(www\.)?/i, "");
    }
    const finalResult = await maybeEnhanceWithAI(text, base);
    return NextResponse.json(finalResult);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to parse resume", detail: err?.message },
      { status: 500 }
    );
  }
}