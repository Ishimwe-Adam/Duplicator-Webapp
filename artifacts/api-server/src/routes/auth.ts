import { Router, type IRouter } from "express";
import { db, mapUser, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
import { OAuth2Client } from "google-auth-library";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const MAX_FAILED = 5;
const LOCK_MINUTES = 30;

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
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
  const [inserted] = await db
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

  if (!inserted) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  await createSession(inserted.id, req, res);
  const body: AuthResponse = { user: toAuthUser(inserted as any) };
  res.status(201).json(body);
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [raw] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!raw) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = raw as any;

  if (!user.isActive) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    res.status(423).json({ error: "Account temporarily locked. Try again later." });
    return;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await db.execute(sql`SELECT record_failed_login(${user.id}, ${MAX_FAILED}, ${LOCK_MINUTES})`);
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

router.post("/google", async (req, res) => {
  const { credential } = req.body as { credential?: unknown };
  if (!credential || typeof credential !== "string") {
    res.status(400).json({ error: "Missing Google credential" });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "Google sign-in is not configured on this server" });
    return;
  }

  let email: string;
  let fullName: string;
  let picture: string | undefined;
  try {
    const oauthClient = new OAuth2Client(clientId);
    const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email_verified || !payload.email) {
      res.status(401).json({ error: "Google account email not verified" });
      return;
    }
    email = payload.email;
    fullName = payload.name ?? email.split("@")[0];
    picture = payload.picture;
  } catch {
    res.status(401).json({ error: "Invalid Google credential" });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  let user: any;
  if (existing) {
    user = existing;
    if (!user.isActive) {
      res.status(401).json({ error: "Account is deactivated" });
      return;
    }
    if (picture && !user.profilePictureUrl) {
      await db
        .update(usersTable)
        .set({ profilePictureUrl: picture })
        .where(eq(usersTable.id, user.id));
      user = { ...user, profilePictureUrl: picture };
    }
  } else {
    const passwordHash = await hashPassword(
      `google_oauth_${Math.random().toString(36)}_${Date.now()}`
    );
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: fullName,
        profilePictureUrl: picture ?? null,
        role: "client",
      })
      .returning();

    if (!inserted) {
      res.status(500).json({ error: "Failed to create account" });
      return;
    }
    user = inserted;
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
  const body: AuthUser = toAuthUser(user as any);
  res.status(200).json(body);
});

export default router;
