import { NextResponse } from "next/server";
import { getStorageMode, isStorageWritable, loadState } from "@/lib/storage";

export async function GET() {
  const { state, mode } = await loadState();
  return NextResponse.json({
    state,
    storage: { mode, configuredMode: getStorageMode(), writable: isStorageWritable(mode) },
  });
}
