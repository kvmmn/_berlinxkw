import { NextResponse } from "next/server";
import { getStorageMode, loadState } from "@/lib/storage";

export async function GET() {
  const { state, mode } = await loadState();
  return NextResponse.json({
    state,
    storage: { mode: getStorageMode(), writable: mode !== "readonly" },
  });
}
