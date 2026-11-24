import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/server/prisma";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    const res = NextResponse.json({ ok: true, authenticated: false });
    clearSessionCookie(res);
    return res;
  } catch (err: any) {
    console.error("[auth/logout]", err);
    const res = NextResponse.json({ ok: false, error: "Logout failed" }, { status: 500 });
    clearSessionCookie(res);
    return res;
  }
}