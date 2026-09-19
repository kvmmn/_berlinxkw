import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  hashPasscode,
  verifyPasscode,
} from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { passcode?: string };
  if (!body.passcode || !verifyPasscode(body.passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, hashPasscode(body.passcode), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
