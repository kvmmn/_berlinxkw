import { NextResponse } from "next/server";
import { authorizeInstagramRefresh } from "@/lib/instagram/auth-request";
import {
  hasInstagramPublishCredentials,
  InstagramNotConfiguredError,
  refreshTokenIfDue,
} from "@/lib/instagram/service";
import { daysUntilExpiry } from "@/lib/instagram/token-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await authorizeInstagramRefresh(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasInstagramPublishCredentials())) {
    return NextResponse.json(
      {
        error: "Instagram publish is not configured (IG_ACCESS_TOKEN missing).",
        code: "instagram_not_configured",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  try {
    const result = await refreshTokenIfDue(force);
    const daysLeft = daysUntilExpiry(result.record.expiresAt);

    if (result.error) {
      return NextResponse.json(
        {
          refreshed: result.refreshed,
          ok: false,
          error: result.error,
          daysUntilExpiry: daysLeft,
          expiresAt: result.record.expiresAt,
          lastRefreshOk: result.record.lastRefreshOk,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      refreshed: result.refreshed,
      ok: true,
      daysUntilExpiry: daysLeft,
      expiresAt: result.record.expiresAt,
      lastRefreshAt: result.record.lastRefreshAt,
      lastRefreshOk: result.record.lastRefreshOk,
    });
  } catch (err) {
    if (err instanceof InstagramNotConfiguredError) {
      return NextResponse.json(
        { error: err.message, code: "instagram_not_configured" },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[instagram] refresh-token route failed:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
