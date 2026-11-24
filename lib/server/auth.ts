import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

export const SESSION_COOKIE_NAME = "farnavi_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const DEMO_WORKSPACE_EMAIL = process.env.FARNAVI_DEMO_EMAIL || "fariqiviana@gmail.com";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  try {
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (derivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  } catch (err) {
    console.warn("[auth] password verification error:", err);
    return false;
  }
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function createSessionForUser(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { token, userId, expiresAt },
  });
  return { token, expiresAt };
}

export function attachSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;

    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch((err) => {
        console.warn("[auth] expired session cleanup:", err);
      });
      return null;
    }
    return session.user;
  } catch (err) {
    console.warn("[auth] getSessionUser failed:", err);
    return null;
  }
}

export async function getOrCreateDemoUser(): Promise<User> {
  return prisma.user.upsert({
    where: { email: DEMO_WORKSPACE_EMAIL },
    update: {},
    create: {
      email: DEMO_WORKSPACE_EMAIL,
      name: "Viana Fariqi",
      plan: "Pro",
    },
  });
}

export async function resolveWorkspaceUser(): Promise<User> {
  const authed = await getSessionUser();
  if (authed) return authed;
  return getOrCreateDemoUser();
}