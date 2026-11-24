import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { attachSessionCookie, createSessionForUser, hashPassword, toPublicUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid registration details";
      return NextResponse.json({ error: msg, issues: parsed.error.flatten() }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        plan: "Free",
        passwordHash: hashPassword(parsed.data.password),
      },
    });

    const { token, expiresAt } = await createSessionForUser(user.id);
    const res = NextResponse.json({ authenticated: true, user: toPublicUser(user) }, { status: 201 });
    attachSessionCookie(res, token, expiresAt);
    return res;
  } catch (err: any) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Registration failed", detail: err?.message }, { status: 500 });
  }
}