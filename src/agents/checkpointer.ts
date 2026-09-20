import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { readBlobByPrefix, writeBlobText } from "@/lib/blob-private";

const DATA_DIR = join(process.cwd(), "data");
const FS_CHECKPOINT_PATH = join(DATA_DIR, "langgraph-checkpoints.json");
const BLOB_CHECKPOINT_PATH = "berlinxkw/langgraph-checkpoints.json";

export type CheckpointBackend = "postgres" | "blob" | "filesystem" | "memory";

type CheckpointDump = {
  storage: Record<string, unknown>;
  writes: Record<string, unknown>;
};

let postgresSaver: PostgresSaver | null = null;
let postgresSetupDone = false;
let persistingSaver: PersistingMemorySaver | null = null;

/** In-memory saver that flushes JSON to Blob or local filesystem (not production-only MemorySaver). */
class PersistingMemorySaver extends MemorySaver {
  constructor(private flush: () => Promise<void>) {
    super();
  }

  hydrate(dump: CheckpointDump | null) {
    if (!dump) return;
    if (dump.storage && typeof dump.storage === "object") {
      this.storage = dump.storage as MemorySaver["storage"];
    }
    if (dump.writes && typeof dump.writes === "object") {
      this.writes = dump.writes as MemorySaver["writes"];
    }
  }

  private snapshot(): CheckpointDump {
    return { storage: this.storage, writes: this.writes };
  }

  override async put(...args: Parameters<MemorySaver["put"]>) {
    const result = await super.put(...args);
    await this.flush();
    return result;
  }

  override async putWrites(...args: Parameters<MemorySaver["putWrites"]>) {
    await super.putWrites(...args);
    await this.flush();
  }

  override async deleteThread(threadId: string) {
    await super.deleteThread(threadId);
    await this.flush();
  }

  exportSnapshot(): CheckpointDump {
    return this.snapshot();
  }
}

async function readBlobDump(): Promise<CheckpointDump | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const text = await readBlobByPrefix(BLOB_CHECKPOINT_PATH);
    if (text === null) return null;
    return JSON.parse(text) as CheckpointDump;
  } catch {
    return null;
  }
}

async function writeBlobDump(dump: CheckpointDump): Promise<boolean> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  try {
    await writeBlobText(BLOB_CHECKPOINT_PATH, JSON.stringify(dump), "application/json");
    return true;
  } catch {
    return false;
  }
}

function readFsDump(): CheckpointDump | null {
  if (!existsSync(FS_CHECKPOINT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(FS_CHECKPOINT_PATH, "utf-8")) as CheckpointDump;
  } catch {
    return null;
  }
}

function writeFsDump(dump: CheckpointDump): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FS_CHECKPOINT_PATH, JSON.stringify(dump), "utf-8");
}

export function getCheckpointBackend(): CheckpointBackend {
  if (process.env.DATABASE_URL) return "postgres";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "filesystem";
  return "memory";
}

export async function getCheckpointer(): Promise<{
  checkpointer: BaseCheckpointSaver;
  backend: CheckpointBackend;
}> {
  const backend = getCheckpointBackend();

  if (backend === "postgres" && process.env.DATABASE_URL) {
    if (!postgresSaver) {
      postgresSaver = PostgresSaver.fromConnString(process.env.DATABASE_URL);
    }
    if (!postgresSetupDone) {
      await postgresSaver.setup();
      postgresSetupDone = true;
    }
    return { checkpointer: postgresSaver, backend };
  }

  if (!persistingSaver) {
    const backendKind = backend === "blob" ? "blob" : backend === "filesystem" ? "filesystem" : "memory";
    const initial =
      backendKind === "blob"
        ? await readBlobDump()
        : backendKind === "filesystem"
          ? readFsDump()
          : null;

    persistingSaver = new PersistingMemorySaver(async () => {
      if (!persistingSaver) return;
      const dump = persistingSaver.exportSnapshot();
      if (backendKind === "blob") {
        await writeBlobDump(dump);
      } else if (backendKind === "filesystem") {
        writeFsDump(dump);
      }
    });
    persistingSaver.hydrate(initial);
  }

  return {
    checkpointer: persistingSaver,
    backend: backend === "memory" ? "memory" : backend,
  };
}
