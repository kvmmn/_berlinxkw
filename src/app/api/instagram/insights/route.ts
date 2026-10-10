import { NextResponse } from "next/server";
import { authorizeInstagramInsights } from "@/lib/instagram/publish-auth";
import {
  INSIGHTS_METHOD_NOT_ALLOWED_STATUS,
  insightsMethodNotAllowedBody,
} from "@/lib/instagram/insights-http";
import { executeInsightsQuery, parseInsightsQuery } from "@/lib/instagram/insights";
import { resolveIgCredentials } from "@/lib/instagram/client";
import {
  getOrInitTokenRecord,
  hasInstagramPublishCredentials,
  InstagramNotConfiguredError,
} from "@/lib/instagram/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!authorizeInstagramInsights(req)) {
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
  const parsed = parseInsightsQuery(url.searchParams);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const record = await getOrInitTokenRecord();
    const creds = await resolveIgCredentials(record);
    const body = await executeInsightsQuery(parsed, creds);
    return NextResponse.json(body, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof InstagramNotConfiguredError) {
      return NextResponse.json(
        { error: err.message, code: "instagram_not_configured" },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    const safe = msg.replace(/access_token=[^&\s]+/gi, "access_token=[redacted]");
    console.error("[instagram] insights failed:", safe);
    return NextResponse.json({ error: safe }, { status: 502 });
  }
}

export async function POST() {
  return NextResponse.json(insightsMethodNotAllowedBody(), {
    status: INSIGHTS_METHOD_NOT_ALLOWED_STATUS,
  });
}
