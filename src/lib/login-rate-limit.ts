/** Best-effort in-process throttle for failed portal logins (serverless: per instance). */

type Entry = { failures: number; blockedUntil: number };

const byIp = new Map<string, Entry>();

const MAX_FAILURES_BEFORE_SLOW = 3;
const BASE_DELAY_MS = 250;
const MAX_DELAY_MS = 3000;

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function resetLoginRateLimitForTests(): void {
  byIp.clear();
}

export async function enforceLoginRateLimit(req: Request): Promise<Response | null> {
  const key = clientKey(req);
  const entry = byIp.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (entry.blockedUntil > now) {
    const waitSec = Math.ceil((entry.blockedUntil - now) / 1000);
    return new Response(JSON.stringify({ error: "Too many attempts; try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, waitSec)),
      },
    });
  }
  return null;
}

export async function noteFailedLogin(req: Request): Promise<void> {
  const key = clientKey(req);
  const now = Date.now();
  const prev = byIp.get(key) ?? { failures: 0, blockedUntil: 0 };
  const failures = prev.failures + 1;
  let delay = 0;
  if (failures >= MAX_FAILURES_BEFORE_SLOW) {
    delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (failures - MAX_FAILURES_BEFORE_SLOW + 1));
  }
  byIp.set(key, { failures, blockedUntil: now + delay });
  if (delay > 0) {
    await new Promise((r) => setTimeout(r, delay));
  }
}

export function noteSuccessfulLogin(req: Request): void {
  byIp.delete(clientKey(req));
}
