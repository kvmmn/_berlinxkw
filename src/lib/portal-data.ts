import { getCurrentWeek, getPreviousWeek } from "./brain";
import { getStorageMode, loadState } from "./storage";

export async function getPortalContext() {
  const { state, mode } = await loadState();
  const currentWeek = getCurrentWeek(state);
  const previousWeek = getPreviousWeek(state, currentWeek);
  const storageNote =
    mode === "readonly"
      ? "Read-only demo storage on Vercel — attach a Blob store (BLOB_READ_WRITE_TOKEN) to persist sessions."
      : undefined;
  return { state, currentWeek, previousWeek, storageNote, storageMode: getStorageMode() };
}
