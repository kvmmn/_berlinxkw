import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { hasBlobToken, readBlobJson, writeBlobText } from "@/lib/blob-private";

const FS_PATH = join(process.cwd(), "data", "instagram-token.json");
const BLOB_PATH = "berlinxkw/system/instagram-token.json";

export type InstagramTokenRecord = {
  accessToken: string;
  /** ISO-8601 expiry (best effort from Meta expires_in). */
  expiresAt: string;
  igUserId?: string;
  username?: string;
  seededFromEnv?: boolean;
  updatedAt: string;
  lastRefreshAt?: string;
  lastRefreshOk?: boolean;
  lastRefreshError?: string;
};

export type TokenStoreBackend = "postgres" | "blob" | "filesystem" | "none";

function nowIso(): string {
  return new Date().toISOString();
}

export function getTokenStoreBackend(): TokenStoreBackend {
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  if (hasBlobToken()) return "blob";
  if (!process.env.VERCEL) return "filesystem";
  return "none";
}

async function ensurePostgresTable(): Promise<void> {
  const url = process.env.DATABASE_URL!.trim();
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS berlinxkw_instagram_token (
        id TEXT PRIMARY KEY DEFAULT 'default',
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    await pool.end();
  }
}

async function readPostgres(): Promise<InstagramTokenRecord | null> {
  await ensurePostgresTable();
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!.trim() });
  try {
    const res = await pool.query<{ payload: InstagramTokenRecord }>(
      `SELECT payload FROM berlinxkw_instagram_token WHERE id = 'default' LIMIT 1`,
    );
    if (res.rows.length === 0) return null;
    return res.rows[0].payload;
  } finally {
    await pool.end();
  }
}

async function writePostgres(record: InstagramTokenRecord): Promise<void> {
  await ensurePostgresTable();
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!.trim() });
  try {
    await pool.query(
      `INSERT INTO berlinxkw_instagram_token (id, payload, updated_at)
       VALUES ('default', $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [JSON.stringify(record)],
    );
  } finally {
    await pool.end();
  }
}

function readFilesystem(): InstagramTokenRecord | null {
  if (!existsSync(FS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(FS_PATH, "utf-8")) as InstagramTokenRecord;
  } catch {
    return null;
  }
}

function writeFilesystem(record: InstagramTokenRecord): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(FS_PATH, JSON.stringify(record, null, 2), "utf-8");
}

export async function loadInstagramTokenRecord(): Promise<{
  record: InstagramTokenRecord | null;
  backend: TokenStoreBackend;
}> {
  const backend = getTokenStoreBackend();

  if (backend === "postgres") {
    return { record: await readPostgres(), backend };
  }
  if (backend === "blob") {
    const record = await readBlobJson<InstagramTokenRecord>(BLOB_PATH, false);
    return { record, backend };
  }
  if (backend === "filesystem") {
    return { record: readFilesystem(), backend };
  }
  return { record: null, backend };
}

export async function saveInstagramTokenRecord(record: InstagramTokenRecord): Promise<TokenStoreBackend> {
  const backend = getTokenStoreBackend();
  record.updatedAt = nowIso();

  if (backend === "postgres") {
    await writePostgres(record);
    return backend;
  }
  if (backend === "blob") {
    await writeBlobText(BLOB_PATH, JSON.stringify(record, null, 2), "application/json");
    return backend;
  }
  if (backend === "filesystem") {
    writeFilesystem(record);
    return backend;
  }
  throw new Error("No private token store configured (set DATABASE_URL or BLOB_READ_WRITE_TOKEN).");
}

/** Seed from IG_ACCESS_TOKEN when store is empty. */
export function buildRecordFromEnvToken(token: string): InstagramTokenRecord {
  const trimmed = token.trim();
  // Meta long-lived tokens are ~60 days; exact expiry unknown until /refresh or debug.
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  return {
    accessToken: trimmed,
    expiresAt,
    seededFromEnv: true,
    updatedAt: nowIso(),
  };
}

export function daysUntilExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function isTokenRefreshDue(record: InstagramTokenRecord): boolean {
  const anchor = record.lastRefreshAt ?? record.updatedAt;
  const ageMs = Date.now() - new Date(anchor).getTime();
  return ageMs >= 24 * 60 * 60 * 1000;
}
