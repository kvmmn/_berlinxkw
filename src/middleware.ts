import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "bk_portal_session";
const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|svg|ico)$/)
  ) {
    return NextResponse.next();
  }
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const session = request.cookies.get(AUTH_COOKIE)?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
