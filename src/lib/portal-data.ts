import { getCurrentWeek, getPreviousWeek } from "./brain";
import { getWeekMetricsSource } from "./metrics-provenance";
import { getStorageMode, loadState } from "./storage";
import type { MetricsSource, StorageMode } from "./types";

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
  const currentMetricsSource: MetricsSource = getWeekMetricsSource(currentWeek);

  return {
    state,
    currentWeek,
    previousWeek,
    currentMetricsSource,
    storageNote,
    storageMode: mode,
    configuredStorageMode: getStorageMode(),
  };
}
