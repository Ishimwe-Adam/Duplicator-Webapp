import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { usersTable, userRoleEnum } from "./users";

export const invitesTable = pgTable("invites", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  invitedById: integer("invited_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type Invite = typeof invitesTable.$inferSelect;
export type InsertInvite = typeof invitesTable.$inferInsert;
