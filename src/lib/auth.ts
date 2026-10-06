import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  createSessionToken,
  sessionCookieMaxAgeSec,
  verifySessionToken,
} from "./session-token";

export { AUTH_COOKIE };

export function getExpectedPasscode(): string | null {
  const value = process.env.PORTAL_PASSCODE?.trim();
  return value || null;
}

export function verifyPasscode(input: string): boolean {
  const expected = getExpectedPasscode();
  if (!expected) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const session = jar.get(AUTH_COOKIE)?.value;
  return verifySessionToken(session);
}

export { createSessionToken, sessionCookieMaxAgeSec, verifySessionToken };
