import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, KEY_LEN);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hashBuf = Buffer.from(hashHex, "hex");
  const test = await scryptAsync(password, salt, KEY_LEN);
  if (test.length !== hashBuf.length) return false;
  return timingSafeEqual(hashBuf, test);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
