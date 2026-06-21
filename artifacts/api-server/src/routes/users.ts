import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const ADMIN_ROLES = ["super_admin", "admin"] as const;
const ASSIGNABLE_ROLES = ["super_admin", "admin", "staff"] as const;

router.get("/", requireAuth, requireRole(...ADMIN_ROLES), async (_req, res) => {
  const rows = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(inArray(usersTable.role, [...ASSIGNABLE_ROLES]));

  rows.sort((a, b) => a.name.localeCompare(b.name));

  res.json({ users: rows });
});

export default router;
