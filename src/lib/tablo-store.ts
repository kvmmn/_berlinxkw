import seed from "../../data/seed.json";
import type { AppState, Tablo } from "./types";

/** Prefer persisted tablos; fall back to seed demos when store has none yet (existing Blob). */
export function tablosFromState(state: AppState): Tablo[] {
  const persisted = state.tablos ?? [];
  if (persisted.length > 0) return persisted;
  const seeded = (seed as AppState).tablos ?? [];
  return seeded;
}
