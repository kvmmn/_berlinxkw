import { timingSafeEqual } from "crypto";

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

function timingSafeSecretEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyPublishSecret(req: Request): boolean {
  const secret = process.env.IG_PUBLISH_SECRET?.trim();
  if (!secret) return false;
  const token = bearerToken(req);
  if (!token) return false;
  return timingSafeSecretEqual(token, secret);
}

/** Bearer IG_PUBLISH_SECRET only — portal session is not accepted. */
export function authorizeInstagramInsights(req: Request): boolean {
  return verifyPublishSecret(req);
}
