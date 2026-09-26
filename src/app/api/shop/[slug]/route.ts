import { NextResponse } from "next/server";
import { normalizeTabloFrameFields } from "@/lib/frame-finish";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const { state } = await loadState();
  const raw = tablosFromState(state).find((t) => t.slug === slug && t.status === "listed");
  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [tablo] = withPublicTabloImages([raw]).map(normalizeTabloFrameFields);
  return NextResponse.json({ tablo });
}
