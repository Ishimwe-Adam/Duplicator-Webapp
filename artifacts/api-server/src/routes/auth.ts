import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  type AuthResponse,
  type AuthUser,
} from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  createSession,
  destroySession,
  getUserFromRequest,
  toAuthUser,
} from "../lib/auth";

const router: IRouter = Router();

const MAX_FAILED = 5;
const LOCK_MS = 30 * 60 * 1000;

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { email, password, name, phone, companyName } = parsed.data;
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone: phone ?? null,
      companyName: companyName ?? null,
      role: "client",
    })
    .returning();
  await createSession(user.id, req, res);
  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(201).json(body);
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    res
      .status(423)
      .json({ error: "Account temporarily locked. Try again later." });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    // Atomic increment + conditional lock via single SQL statement.
    // Avoids the read-modify-write race where concurrent failed logins
    // could clobber each other's increments and bypass the threshold.
    const lockUntil = new Date(Date.now() + LOCK_MS);
    await db
      .update(usersTable)
      .set({
        failedLoginAttempts: sql`CASE
          WHEN ${usersTable.failedLoginAttempts} + 1 >= ${MAX_FAILED} THEN 0
          ELSE ${usersTable.failedLoginAttempts} + 1
        END`,
        lockedUntil: sql`CASE
          WHEN ${usersTable.failedLoginAttempts} + 1 >= ${MAX_FAILED} THEN ${lockUntil}
          ELSE ${usersTable.lockedUntil}
        END`,
      })
      .where(eq(usersTable.id, user.id));
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
    await db
      .update(usersTable)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(usersTable.id, user.id));
  }
  await createSession(user.id, req, res);
  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(200).json(body);
});

router.post("/logout", async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
});

router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const body: AuthUser = toAuthUser(user);
  res.status(200).json(body);
});

export default router;
