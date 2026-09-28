import "server-only";

import { isAuthenticated } from "@/lib/auth";

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function verifyPublishSecret(req: Request): boolean {
  const secret = process.env.IG_PUBLISH_SECRET?.trim();
  if (!secret) return false;
  const token = bearerToken(req);
  return Boolean(token && token === secret);
}

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const token = bearerToken(req);
  return Boolean(token && token === secret);
}

/** Portal session cookie or IG_PUBLISH_SECRET bearer. */
export async function authorizeInstagramPublish(req: Request): Promise<boolean> {
  if (await isAuthenticated()) return true;
  return verifyPublishSecret(req);
}

/** Portal session only (status, media upload). */
export async function authorizeInstagramPortal(): Promise<boolean> {
  return isAuthenticated();
}

/** Vercel Cron (CRON_SECRET) or portal session. */
export async function authorizeInstagramRefresh(req: Request): Promise<boolean> {
  if (verifyCronSecret(req)) return true;
  return isAuthenticated();
}
