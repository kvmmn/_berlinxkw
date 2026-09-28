# Instagram publishing · @berlinxkw

Automated feed posts via **Instagram API with Instagram Login** (`graph.instagram.com`). This is separate from optional **Meta Graph metrics sync** (`INSTAGRAM_*` in [INSTAGRAM_METRICS.md](./INSTAGRAM_METRICS.md)).

## Meta app

- App: **berlinxkw-app-IG** (Development mode)
- Login product: Instagram API with Instagram Login (no Facebook Page)
- Scopes: `instagram_business_basic`, `instagram_business_content_publish`
- Tester: @berlinxkw (Creator account)

Generate a **long-lived user access token** (60 days) in the Meta dashboard and set it in Vercel as `IG_ACCESS_TOKEN`. The app seeds private storage on first publish/refresh, then refreshes daily.

## Environment variables (Vercel production)

| Variable | Required | Purpose |
|----------|----------|---------|
| `IG_ACCESS_TOKEN` | Yes (initial seed) | Long-lived Instagram user token from Meta |
| `IG_PUBLISH_SECRET` | Recommended | Bearer secret for `POST /api/instagram/publish` (agents / CI) |
| `CRON_SECRET` | Recommended | Bearer secret for Vercel Cron → `/api/instagram/refresh-token` |
| `PORTAL_PASSCODE` | Yes | Portal login (existing) |
| `BLOB_READ_WRITE_TOKEN` | Yes on Vercel | Private token store fallback + public post JPEGs |
| `DATABASE_URL` | Preferred | Private Postgres row for token (same Neon as LangGraph checkpoints) |

Do **not** commit tokens. Do not store tokens in public URLs or client-side code.

### Token storage choice

1. **`DATABASE_URL` (preferred)** — JSON payload in Postgres table `berlinxkw_instagram_token`. Same durable store pattern as LangGraph checkpoints; not exposed via Blob proxy.
2. **`BLOB_READ_WRITE_TOKEN` fallback** — fixed private path `berlinxkw/system/instagram-token.json` (server-only, same access model as `store.json`).
3. **Local dev** — `data/instagram-token.json` on disk.

## Limits

- **100 API-published posts per 24 hours** (Meta platform limit).
- **JPEG only** for `imageUrls` (validated via `Content-Type` and JPEG headers).
- **Aspect ratio** width/height between **0.8 (4:5)** and **1.91:1**.
- **Caption** ≤ 2200 characters, ≤ **30 hashtags**.
- **Carousel**: 2–10 images; single image = one-image post.

## Endpoints

All Instagram routes except public media are gated by portal cookie `bk_portal_session` and/or Bearer secrets as noted.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/instagram/publish` | Portal **or** `Authorization: Bearer $IG_PUBLISH_SECRET` | Validate and publish |
| `GET` | `/api/instagram/status` | Portal | Token expiry, username, refresh health |
| `GET` | `/api/instagram/refresh-token` | `CRON_SECRET` **or** portal | Refresh long-lived token (daily cron) |
| `POST` | `/api/instagram/media` | Portal | Upload JPEG → public Blob URL |
| `GET` | `/api/shop/media?pathname=…` | Public | Serve tablo or `berlinxkw/instagram/…` JPEGs |

When `IG_ACCESS_TOKEN` is unset and nothing is stored, publish (non–dry run), status, and refresh return **503** with `instagram_not_configured`. **dryRun** publish works without a token (validation only).

### Publish body

```json
{
  "imageUrls": ["https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.jpg"],
  "caption": "berlin × kawe · archive",
  "dryRun": true
}
```

- `dryRun: true` — run all validations, no Meta calls.
- Success publish — returns `permalink` when Meta provides it.

### Token refresh

Vercel Cron (daily, Hobby plan) hits `/api/instagram/refresh-token` with `Authorization: Bearer $CRON_SECRET`.

Logic:

- If last refresh (or seed) was **≥ 24h ago**, call  
  `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…`
- Persist new token + expiry.
- `GET /api/instagram/status` shows **days until expiry**; warns if **&lt; 10 days** or last refresh failed.

## Upload post images

1. Log in to the portal (`POST /api/auth/login`).
2. `POST /api/instagram/media` with `multipart/form-data` field `file` (JPEG).
3. Use returned `absoluteUrl` in `imageUrls` for publish.

Public URLs use `/api/shop/media?pathname=berlinxkw/instagram/{uuid}/…`.

**Demo JPEG (preview dryRun without Blob upload):**

`/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.jpg`  
(served from repo asset when the Blob object is absent)

## curl examples

Portal login (save cookie):

```bash
curl -c cookies.txt -X POST "https://berlinxkw.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"passcode":"YOUR_PORTAL_PASSCODE"}'
```

Dry run validation:

```bash
curl -b cookies.txt -X POST "https://berlinxkw.vercel.app/api/instagram/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "caption": "berlin × kawe",
    "imageUrls": [
      "https://berlinxkw.vercel.app/api/shop/media?pathname=berlinxkw/instagram/demo/publish-sample.jpg"
    ]
  }'
```

Agent publish (Bearer):

```bash
curl -X POST "https://berlinxkw.vercel.app/api/instagram/publish" \
  -H "Authorization: Bearer $IG_PUBLISH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"caption":"…","imageUrls":["https://…"]}'
```

Status:

```bash
curl -b cookies.txt "https://berlinxkw.vercel.app/api/instagram/status"
```

Cron refresh (Vercel):

```bash
curl "https://berlinxkw.vercel.app/api/instagram/refresh-token" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Implementation

- Client: [`src/lib/instagram/client.ts`](../src/lib/instagram/client.ts)
- Validation: [`src/lib/instagram/validate.ts`](../src/lib/instagram/validate.ts)
- Token store: [`src/lib/instagram/token-store.ts`](../src/lib/instagram/token-store.ts)
- Cron: [`vercel.json`](../vercel.json)

Metrics sync remains optional and uses different env vars — see [INSTAGRAM_METRICS.md](./INSTAGRAM_METRICS.md).
