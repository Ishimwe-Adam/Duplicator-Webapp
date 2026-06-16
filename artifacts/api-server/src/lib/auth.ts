import { supabase, mapUser, type User } from "@workspace/db";
import type { Request, Response } from "express";
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
  await supabase.from("sessions").insert({
    token,
    user_id: userId,
    user_agent: req.headers["user-agent"] ?? null,
    ip_address: req.ip ?? null,
    expires_at: expiresAt.toISOString(),
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

  const now = new Date().toISOString();

  const { data: sessionRow } = await supabase
    .from("sessions")
    .select("*")
    .eq("token", token)
    .gt("expires_at", now)
    .limit(1)
    .single();

  if (!sessionRow) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", (sessionRow as Record<string, unknown>).user_id)
    .single();

  if (!userRow) return null;

  const user = mapUser(userRow as Record<string, unknown>);
  if (!user.isActive) return null;

  void supabase
    .from("sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", (sessionRow as Record<string, unknown>).id as number)
    .then(() => {}, () => {});

  return user;
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await supabase.from("sessions").delete().eq("token", token);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
