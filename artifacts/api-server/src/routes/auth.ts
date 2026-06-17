import { Router, type IRouter } from "express";
import { supabase, mapUser } from "@workspace/db";
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

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .limit(1);

  if (existing && existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      phone: phone ?? null,
      company_name: companyName ?? null,
      role: "client",
    })
    .select()
    .single();

  if (error || !inserted) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  const user = mapUser(inserted as Record<string, unknown>);
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

  const { data: rows } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .limit(1);

  const raw = rows?.[0];
  if (!raw) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = mapUser(raw as Record<string, unknown>);

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
    await supabase.rpc("record_failed_login", {
      p_user_id: user.id,
      p_max_failed: MAX_FAILED,
      p_lock_minutes: LOCK_MINUTES,
    });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
    await supabase
      .from("users")
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq("id", user.id);
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

  const { data: rows } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .limit(1);

  let user;
  if (rows && rows.length > 0) {
    user = mapUser(rows[0] as Record<string, unknown>);
    if (!user.isActive) {
      res.status(401).json({ error: "Account is deactivated" });
      return;
    }
    if (picture && !user.profilePictureUrl) {
      await supabase.from("users").update({ profile_picture_url: picture }).eq("id", user.id);
      user = { ...user, profilePictureUrl: picture };
    }
  } else {
    const passwordHash = await hashPassword(
      `google_oauth_${Math.random().toString(36)}_${Date.now()}`
    );
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: fullName,
        profile_picture_url: picture ?? null,
        role: "client",
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      res.status(500).json({ error: "Failed to create account" });
      return;
    }
    user = mapUser(inserted as Record<string, unknown>);
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
