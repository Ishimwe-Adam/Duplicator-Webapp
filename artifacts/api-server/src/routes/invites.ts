import { Router, type IRouter } from "express";
import { db, invitesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { CreateInviteBody } from "@workspace/api-zod";
import { toAuthUser } from "../lib/auth";

const router: IRouter = Router();

const AUTHORIZED_ROLES = ["super_admin", "admin", "manager"] as const;

router.get("/", requireAuth, requireRole(...AUTHORIZED_ROLES), async (_req, res) => {
  const rows = await db
    .select({
      id: invitesTable.id,
      email: invitesTable.email,
      code: invitesTable.code,
      role: invitesTable.role,
      createdAt: invitesTable.createdAt,
      usedAt: invitesTable.usedAt,
      invitedBy: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      },
    })
    .from(invitesTable)
    .innerJoin(usersTable, eq(invitesTable.invitedById, usersTable.id))
    .orderBy(desc(invitesTable.createdAt));

  res.json({ invites: rows });
});

router.post("/", requireAuth, requireRole(...AUTHORIZED_ROLES), async (req, res) => {
  const parsed = CreateInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { email, role } = parsed.data;

  // Generate a random 8-character uppercase code
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [inserted] = await db
    .insert(invitesTable)
    .values({
      email: email.toLowerCase(),
      code,
      role,
      invitedById: user.id,
    })
    .returning();

  if (!inserted) {
    res.status(500).json({ error: "Failed to create invite" });
    return;
  }

  const inviteWithUser = {
    ...inserted,
    invitedBy: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };

  res.status(201).json(inviteWithUser);
});

export default router;
