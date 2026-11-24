import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { attachSessionCookie, createSessionForUser, toPublicUser, verifyPassword } from "@/lib/server/auth";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid login credentials" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionForUser(user.id);
    const res = NextResponse.json({ authenticated: true, user: toPublicUser(user) }, { status: 200 });
    attachSessionCookie(res, token, expiresAt);
    return res;
  } catch (err: any) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Login failed", detail: err?.message }, { status: 500 });
  }
}