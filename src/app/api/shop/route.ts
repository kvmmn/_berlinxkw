import { NextResponse } from "next/server";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const { state } = await loadState();
  const tablos = [...tablosFromState(state)]
    .filter((t) => t.status === "listed")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return NextResponse.json({ tablos: withPublicTabloImages(tablos) });
}
