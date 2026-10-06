import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createSessionToken,
  sessionCookieMaxAgeSec,
  verifyPasscode,
} from "@/lib/auth";
import {
  enforceLoginRateLimit,
  noteFailedLogin,
  noteSuccessfulLogin,
} from "@/lib/login-rate-limit";

export async function POST(req: Request) {
  const rateLimited = await enforceLoginRateLimit(req);
  if (rateLimited) return rateLimited;

  const body = (await req.json()) as { passcode?: string };
  if (!body.passcode || !verifyPasscode(body.passcode)) {
    await noteFailedLogin(req);
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Portal sessions are not configured on this deployment." },
      { status: 503 },
    );
  }

  noteSuccessfulLogin(req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionCookieMaxAgeSec(),
  });
  return res;
}
