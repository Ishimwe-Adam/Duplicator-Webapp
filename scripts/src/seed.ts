import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const args = new Set(process.argv.slice(2));
const isProduction = (process.env.NODE_ENV ?? "").toLowerCase() === "production";

if (!args.has("--demo")) {
  throw new Error(
    "Refusing to seed without an explicit mode. Use `pnpm seed` or `pnpm --filter @workspace/scripts seed:demo`.",
  );
}

if (isProduction && !args.has("--allow-production")) {
  throw new Error(
    "Refusing to seed demo users in production without --allow-production.",
  );
}

const scryptAsync = promisify(scrypt) as (
  p: string,
  s: string,
  k: number,
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

const seedUsers: Array<{
  email: string;
  name: string;
  role: "super_admin" | "admin" | "staff" | "client";
  password: string;
  companyName?: string;
}> = [
  { email: "admin@duplicator.rw", name: "Adam (Owner)", role: "super_admin", password: "Admin@2026" },
  { email: "manager@duplicator.rw", name: "Sales Manager", role: "admin", password: "Manager@2026" },
  { email: "staff@duplicator.rw", name: "Print Operator", role: "staff", password: "Staff@2026" },
  { email: "client@example.com", name: "Demo Client", role: "client", password: "Client@2026", companyName: "Acme Co." },
];

for (const u of seedUsers) {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, u.email))
    .limit(1);
  if (existing.length > 0) {
    console.log(`SKIP ${u.email} (already exists)`);
    continue;
  }
  const passwordHash = await hashPassword(u.password);
  await db.insert(usersTable).values({
    email: u.email,
    name: u.name,
    role: u.role,
    passwordHash,
    companyName: u.companyName ?? null,
  });
  console.log(`CREATED ${u.role}: ${u.email} / ${u.password}`);
}

process.exit(0);
