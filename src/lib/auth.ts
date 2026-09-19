import { cookies } from "next/headers";

export const AUTH_COOKIE = "bk_portal_session";

export function getExpectedPasscode(): string {
  return process.env.PORTAL_PASSCODE ?? "berlinxkw";
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const session = jar.get(AUTH_COOKIE)?.value;
  if (!session) return false;
  const expected = getExpectedPasscode();
  return session === hashPasscode(expected);
}

export function hashPasscode(passcode: string): string {
  // Simple constant-time-ish compare token (not cryptographic — MVP gate)
  let h = 0;
  for (let i = 0; i < passcode.length; i++) {
    h = (Math.imul(31, h) + passcode.charCodeAt(i)) | 0;
  }
  return `bk_${h.toString(36)}`;
}

export function verifyPasscode(input: string): boolean {
  return input === getExpectedPasscode();
}
