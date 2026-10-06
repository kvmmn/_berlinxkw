import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStorageMode, isStorageWritable, loadState } from "@/lib/storage";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { state, mode } = await loadState();
  return NextResponse.json({
    state,
    storage: { mode, configuredMode: getStorageMode(), writable: isStorageWritable(mode) },
  });
}
