import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import type { Request, Response } from "express";
import type { User } from "@workspace/db";
import { generateSessionToken } from "./password";

export const SESSION_COOKIE = "duplicator_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AuthUserPayload = {
  id: number;
  email: string;
  name: string;
  role: User["role"];
  phone: string | null;
  companyName: string | null;
  profilePictureUrl: string | null;
};

export function toAuthUser(u: User): AuthUserPayload {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    companyName: u.companyName,
    profilePictureUrl: u.profilePictureUrl,
  };
}

export async function createSession(
  userId: number,
  req: Request,
  res: Response,
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({
    token,
    userId,
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
    expiresAt,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const now = new Date();

  const [sessionRow] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);

  if (!sessionRow || sessionRow.expiresAt <= now) return null;

  const [userRow] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, sessionRow.userId))
    .limit(1);

  if (!userRow || !userRow.isActive) return null;

  void db
    .update(sessionsTable)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessionsTable.id, sessionRow.id))
    .then(() => {}, () => {});

  return userRow as User;
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
