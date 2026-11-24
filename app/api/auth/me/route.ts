import { NextResponse } from "next/server";
import { getSessionUser, toPublicUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json({ authenticated: true, user: toPublicUser(user) }, { status: 200 });
  } catch (err: any) {
    console.error("[auth/me]", err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}