import { getCurrentWeek, getPreviousWeek } from "./brain";
import { getStorageMode, loadState } from "./storage";
import type { StorageMode } from "./types";

export function storageBannerForMode(mode: StorageMode): string | undefined {
  if (mode === "readonly") {
    return "Demo mode — changes on this deployment won’t be saved. Contact your admin if you need a live workspace.";
  }
  if (mode === "blob-error") {
    return "Cloud storage is temporarily unavailable — changes may not persist. Please retry in a few minutes.";
  }
  return undefined;
}

export async function getPortalContext() {
  const { state, mode } = await loadState();
  const currentWeek = getCurrentWeek(state);
  const previousWeek = getPreviousWeek(state, currentWeek);
  const storageNote = storageBannerForMode(mode);
  return {
    state,
    currentWeek,
    previousWeek,
    storageNote,
    storageMode: mode,
    configuredStorageMode: getStorageMode(),
  };
}
