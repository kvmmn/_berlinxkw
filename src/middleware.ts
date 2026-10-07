import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/session-token";

/** Browser pages that never require a portal session cookie (unknown paths → Next 404). */
const PUBLIC_PAGE_PREFIXES = ["/shop", "/login"] as const;

/** API routes reachable without portal session (shop listing unchanged). */
const PUBLIC_API_PREFIXES = ["/api/shop", "/api/auth/login"] as const;

/** Routes that authenticate via Bearer secret inside the handler (not portal cookie). */
const BEARER_AUTH_API_PATHS = ["/api/instagram/publish", "/api/instagram/refresh-token"] as const;

const STATIC_EXT = /\.(png|jpg|svg|ico|webp)$/i;

/** Reels under public/ig/{slug}/*.mp4 — not a global .mp4 bypass. */
const PUBLIC_IG_MP4 = /^\/ig\/[^/]+\/[^/]+\.mp4$/i;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Static files from public/ (e.g. /ig/**) — never skip auth for /api/* or /portal*. */
export function isPublicStaticAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/api/") || matchesPrefix(pathname, "/portal")) {
    return false;
  }
  if (pathname.startsWith("/favicon")) return true;
  if (PUBLIC_IG_MP4.test(pathname)) return true;
  return STATIC_EXT.test(pathname);
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

async function rejectUnauthenticated(request: NextRequest, pathname: string): Promise<NextResponse> {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || isPublicStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(AUTH_COOKIE)?.value;
  const ok = await verifySessionToken(session);
  if (!ok) {
    return rejectUnauthenticated(request, pathname);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
