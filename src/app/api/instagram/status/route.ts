import { NextResponse } from "next/server";
import { authorizeInstagramPortal } from "@/lib/instagram/auth-request";
import { getInstagramStatus, hasInstagramPublishCredentials } from "@/lib/instagram/service";
import { getTokenStoreBackend } from "@/lib/instagram/token-store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await authorizeInstagramPortal())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await hasInstagramPublishCredentials())) {
    return NextResponse.json(
      {
        configured: false,
        storeBackend: getTokenStoreBackend(),
        error: "Instagram publish is not configured (IG_ACCESS_TOKEN missing).",
        code: "instagram_not_configured",
      },
      { status: 503 },
    );
  }

  try {
    const status = await getInstagramStatus();
    const httpStatus = status.configured ? 200 : 503;
    return NextResponse.json(status, { status: httpStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, configured: false }, { status: 503 });
  }
}
