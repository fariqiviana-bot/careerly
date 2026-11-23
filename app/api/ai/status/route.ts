import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/server/ai-client";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getAiStatus());
}