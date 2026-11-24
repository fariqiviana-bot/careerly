import { NextResponse } from "next/server";
import { attachSessionCookie, createSessionForUser, getOrCreateDemoUser, toPublicUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getOrCreateDemoUser();
    const { token, expiresAt } = await createSessionForUser(user.id);
    const res = NextResponse.json({ authenticated: true, demo: true, user: toPublicUser(user) });
    attachSessionCookie(res, token, expiresAt);
    return res;
  } catch (err: any) {
    console.error("[auth/demo]", err);
    return NextResponse.json({ error: "Could not open demo workspace" }, { status: 500 });
  }
}