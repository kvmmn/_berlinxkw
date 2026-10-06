import "server-only";

import {
  publishReelsToInstagram,
  publishToInstagram,
  refreshInstagramAccessToken,
  resolveIgCredentials,
} from "./client";
import {
  buildRecordFromEnvToken,
  daysUntilExpiry,
  isTokenRefreshDue,
  loadInstagramTokenRecord,
  saveInstagramTokenRecord,
  type InstagramTokenRecord,
} from "./token-store";
import {
  validatePublishPayload,
  validateReelsPayload,
  type PublishValidationResult,
  type ReelsValidationResult,
} from "./validate";

export function isInstagramPublishConfigured(): boolean {
  return Boolean(process.env.IG_ACCESS_TOKEN?.trim());
}

export async function hasInstagramPublishCredentials(): Promise<boolean> {
  if (isInstagramPublishConfigured()) return true;
  const { record } = await loadInstagramTokenRecord();
  return Boolean(record?.accessToken);
}

export class InstagramNotConfiguredError extends Error {
  constructor() {
    super(
      "Instagram publish is not configured. Set IG_ACCESS_TOKEN in Vercel (or seed via env on first use).",
    );
    this.name = "InstagramNotConfiguredError";
  }
}

export async function getOrInitTokenRecord(): Promise<InstagramTokenRecord> {
  const { record } = await loadInstagramTokenRecord();
  if (record?.accessToken) return record;

  const envToken = process.env.IG_ACCESS_TOKEN?.trim();
  if (!envToken) throw new InstagramNotConfiguredError();

  const seeded = buildRecordFromEnvToken(envToken);
  await saveInstagramTokenRecord(seeded);
  return seeded;
}

export async function refreshTokenIfDue(force = false): Promise<{
  refreshed: boolean;
  record: InstagramTokenRecord;
  error?: string;
}> {
  let record: InstagramTokenRecord;
  try {
    record = await getOrInitTokenRecord();
  } catch (err) {
    if (err instanceof InstagramNotConfiguredError) throw err;
    throw err;
  }

  if (!force && !isTokenRefreshDue(record)) {
    return { refreshed: false, record };
  }

  try {
    const result = await refreshInstagramAccessToken(record.accessToken);
    record = {
      ...record,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      lastRefreshAt: new Date().toISOString(),
      lastRefreshOk: true,
      lastRefreshError: undefined,
    };
    await saveInstagramTokenRecord(record);
    return { refreshed: true, record };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    record = {
      ...record,
      lastRefreshAt: new Date().toISOString(),
      lastRefreshOk: false,
      lastRefreshError: msg,
    };
    await saveInstagramTokenRecord(record);
    console.error("[instagram] token refresh failed:", msg);
    return { refreshed: false, record, error: msg };
  }
}

export async function getInstagramStatus(): Promise<{
  configured: boolean;
  storeBackend: string;
  username?: string;
  igUserId?: string;
  expiresAt?: string;
  daysUntilExpiry?: number;
  tokenWarning?: string;
  lastRefreshAt?: string;
  lastRefreshOk?: boolean;
  lastRefreshError?: string;
}> {
  const envConfigured = isInstagramPublishConfigured();
  const { record, backend } = await loadInstagramTokenRecord();

  if (!record && !envConfigured) {
    return { configured: false, storeBackend: backend };
  }

  let active: InstagramTokenRecord;
  try {
    active = record ?? (await getOrInitTokenRecord());
  } catch {
    return { configured: false, storeBackend: backend };
  }

  const daysLeft = daysUntilExpiry(active.expiresAt);
  let tokenWarning: string | undefined;
  if (active.lastRefreshOk === false) {
    tokenWarning = `Last token refresh failed: ${active.lastRefreshError ?? "unknown error"}`;
  } else if (daysLeft < 10) {
    tokenWarning = `Instagram token expires in ${daysLeft} day(s). Re-auth in Meta if refresh fails.`;
  }

  let username = active.username;
  let igUserId = active.igUserId;
  if (envConfigured && active.accessToken) {
    try {
      const creds = await resolveIgCredentials(active);
      igUserId = creds.igUserId;
      username = creds.username ?? username;
      if (!active.igUserId || active.username !== username) {
        active = { ...active, igUserId, username };
        await saveInstagramTokenRecord(active);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      tokenWarning = tokenWarning ?? `Could not load Instagram profile: ${msg}`;
    }
  }

  return {
    configured: true,
    storeBackend: backend,
    username,
    igUserId,
    expiresAt: active.expiresAt,
    daysUntilExpiry: daysLeft,
    tokenWarning,
    lastRefreshAt: active.lastRefreshAt,
    lastRefreshOk: active.lastRefreshOk,
    lastRefreshError: active.lastRefreshError,
  };
}

export async function dryRunOrPublish(
  imageUrls: string[],
  caption: string,
  dryRun: boolean,
): Promise<
  | { dryRun: true; validation: PublishValidationResult }
  | { dryRun: false; validation: PublishValidationResult; mediaId: string; permalink?: string }
> {
  const validation = await validatePublishPayload(imageUrls, caption, { dryRun });
  if (dryRun || !validation.ok) {
    return { dryRun: true, validation };
  }

  const record = await getOrInitTokenRecord();
  const creds = await resolveIgCredentials(record);
  if (!record.igUserId) {
    await saveInstagramTokenRecord({
      ...record,
      igUserId: creds.igUserId,
      username: creds.username,
    });
  }

  const result = await publishToInstagram(
    creds.accessToken,
    creds.igUserId,
    imageUrls,
    caption,
  );

  return {
    dryRun: false,
    validation,
    mediaId: result.mediaId,
    permalink: result.permalink,
  };
}

export async function dryRunOrPublishReels(
  input: {
    videoUrl: string;
    caption: string;
    coverUrl?: string;
    shareToFeed?: boolean;
  },
  dryRun: boolean,
  opts?: { startedAtMs?: number },
): Promise<
  | { dryRun: true; validation: ReelsValidationResult }
  | {
      dryRun: false;
      validation: ReelsValidationResult;
      published: true;
      containerId: string;
      mediaId: string | null;
      mediaIdNote?: string;
      permalink?: string;
    }
> {
  const requestStartedAtMs = opts?.startedAtMs ?? Date.now();
  const validation = await validateReelsPayload(input);
  if (dryRun || !validation.ok) {
    return { dryRun: true, validation };
  }

  const record = await getOrInitTokenRecord();
  const creds = await resolveIgCredentials(record);
  if (!record.igUserId) {
    await saveInstagramTokenRecord({
      ...record,
      igUserId: creds.igUserId,
      username: creds.username,
    });
  }

  const result = await publishReelsToInstagram(
    creds.accessToken,
    creds.igUserId,
    {
      videoUrl: input.videoUrl,
      caption: input.caption,
      coverUrl: input.coverUrl,
      shareToFeed: input.shareToFeed !== false,
    },
    { startedAtMs: requestStartedAtMs },
  );

  return {
    dryRun: false,
    validation,
    published: result.published,
    containerId: result.containerId,
    mediaId: result.mediaId,
    mediaIdNote: result.mediaIdNote,
    permalink: result.permalink,
  };
}
