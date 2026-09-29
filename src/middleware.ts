import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "bk_portal_session";

/** Browser pages that never require a portal session cookie (unknown paths → Next 404). */
const PUBLIC_PAGE_PREFIXES = ["/shop", "/login"] as const;

/** API routes reachable without portal session (shop listing unchanged). */
const PUBLIC_API_PREFIXES = ["/api/shop", "/api/auth/login"] as const;

/** Routes that authenticate via Bearer secret inside the handler (not portal cookie). */
const BEARER_AUTH_API_PATHS = ["/api/instagram/publish", "/api/instagram/refresh-token"] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PAGE_PREFIXES.some((p) => matchesPrefix(pathname, p))) return true;
  if (PUBLIC_API_PREFIXES.some((p) => matchesPrefix(pathname, p))) return true;
  if (BEARER_AUTH_API_PATHS.some((p) => pathname === p)) return true;
  return false;
}

/** Portal pages and non-public API routes (explicit allowlist-style guard). */
function isProtectedPath(pathname: string): boolean {
  if (matchesPrefix(pathname, "/portal")) return true;
  if (!pathname.startsWith("/api/")) return false;
  if (isPublicPath(pathname)) return false;
  if (BEARER_AUTH_API_PATHS.some((p) => pathname === p)) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
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
