import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import seed from "../../data/seed.json";
import { hasBlobToken, readBlobByPrefix, writeBlobText } from "./blob-private";
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
  if (!Array.isArray(state.tablos)) {
    state.tablos = [];
  }
  return state;
}

function readSeedFromDisk(): AppState {
  if (existsSync(SEED_PATH)) {
    return normalizeState(JSON.parse(readFileSync(SEED_PATH, "utf-8")) as AppState);
  }
  return seedState();
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

async function blobPutOnce(state: AppState): Promise<void> {
  await writeBlobText(BLOB_PATH, JSON.stringify(state, null, 2), "application/json");
}

async function readBlobStore(): Promise<AppState | null> {
  if (!hasBlobToken()) return null;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await readBlobByPrefix(BLOB_PATH);
      if (text === null) {
        const initial = seedState();
        await blobPutOnce(initial);
        return initial;
      }
      return normalizeState(JSON.parse(text) as AppState);
    } catch (err) {
      lastError = err;
    }
  }

  console.error("[storage] readBlobStore failed after retry:", lastError);
  return null;
}

async function writeBlobStore(state: AppState): Promise<boolean> {
  if (!hasBlobToken()) return false;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await blobPutOnce(state);
      return true;
    } catch (err) {
      lastError = err;
    }
  }

  console.error("[storage] writeBlobStore failed after retry:", lastError);
  return false;
}

/** Configured backend (does not reflect transient Blob failures). */
export function getStorageMode(): StorageMode {
  if (hasBlobToken()) return "blob";
  if (process.env.VERCEL) return "readonly";
  return "filesystem";
}

export function isStorageWritable(mode: StorageMode): boolean {
  return mode === "filesystem" || mode === "blob";
}

export async function loadState(): Promise<{ state: AppState; mode: StorageMode }> {
  const configured = getStorageMode();

  if (configured === "blob") {
    const fromBlob = await readBlobStore();
    if (fromBlob) return { state: fromBlob, mode: "blob" };
    return { state: readSeedFromDisk(), mode: "blob-error" };
  }

  if (configured === "filesystem") {
    return { state: readFilesystemStore(), mode: "filesystem" };
  }

  return { state: readSeedFromDisk(), mode: "readonly" };
}

export async function saveState(state: AppState): Promise<{ ok: boolean; mode: StorageMode }> {
  const configured = getStorageMode();

  if (configured === "blob") {
    const ok = await writeBlobStore(state);
    return { ok, mode: ok ? "blob" : "blob-error" };
  }

  if (configured === "filesystem") {
    writeFilesystemStore(state);
    return { ok: true, mode: "filesystem" };
  }

  return { ok: false, mode: "readonly" };
}

/** Reset local dev store from seed (API/admin use). */
export function resetLocalStoreFromSeed(): void {
  if (!existsSync(SEED_PATH)) return;
  copyFileSync(SEED_PATH, STORE_PATH);
}
