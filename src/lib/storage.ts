import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import seed from "../../data/seed.json";
import type { AppState, StorageMode } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "store.json");
const SEED_PATH = join(DATA_DIR, "seed.json");
const BLOB_PATH = "berlinxkw/store.json";

function seedState(): AppState {
  return normalizeState(JSON.parse(JSON.stringify(seed)) as AppState);
}

export function normalizeState(state: AppState): AppState {
  if (!Array.isArray(state.ideas)) {
    state.ideas = [];
  }
  return state;
}

function readFilesystemStore(): AppState {
  if (!existsSync(STORE_PATH)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const initial = seedState();
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  return normalizeState(JSON.parse(readFileSync(STORE_PATH, "utf-8")) as AppState);
}

function writeFilesystemStore(state: AppState): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

async function readBlobStore(): Promise<AppState | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { list, put } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (blobs.length === 0) {
      const initial = seedState();
      await put(BLOB_PATH, JSON.stringify(initial, null, 2), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });
      return initial;
    }
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return normalizeState((await res.json()) as AppState);
  } catch {
    return null;
  }
}

async function writeBlobStore(state: AppState): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  try {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, JSON.stringify(state, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

export function getStorageMode(): StorageMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) return "readonly";
  return "filesystem";
}

export async function loadState(): Promise<{ state: AppState; mode: StorageMode }> {
  const mode = getStorageMode();
  if (mode === "blob") {
    const fromBlob = await readBlobStore();
    if (fromBlob) return { state: fromBlob, mode };
  }
  if (mode === "filesystem") {
    return { state: readFilesystemStore(), mode };
  }
  // Vercel without blob: read-only seed
  if (existsSync(SEED_PATH)) {
    return {
      state: normalizeState(JSON.parse(readFileSync(SEED_PATH, "utf-8")) as AppState),
      mode: "readonly",
    };
  }
  return { state: seedState(), mode: "readonly" };
}

export async function saveState(state: AppState): Promise<{ ok: boolean; mode: StorageMode }> {
  const mode = getStorageMode();
  if (mode === "blob") {
    const ok = await writeBlobStore(state);
    return { ok, mode };
  }
  if (mode === "filesystem") {
    writeFilesystemStore(state);
    return { ok: true, mode };
  }
  return { ok: false, mode: "readonly" };
}

/** Reset local dev store from seed (API/admin use). */
export function resetLocalStoreFromSeed(): void {
  if (!existsSync(SEED_PATH)) return;
  copyFileSync(SEED_PATH, STORE_PATH);
}
