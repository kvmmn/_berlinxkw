# Instagram metrics (free) · @berlinxkw

The advisor portal tracks **berlin × kawe** Instagram numbers without Postiz, Apify, or other paid scrapers. Two paths:

1. **Manual entry (immediate, always free)** — `/portal/system` → save followers, reach, posts, engagement, saves, profile visits, optional daily JSON, week summary. Persisted in AppState (filesystem or Vercel Blob).
2. **Meta Graph API sync (optional, free for your own Professional account)** — set env tokens; click **Sync from Instagram** on the same page.

## Provenance badges

| Badge | Meaning |
|-------|---------|
| **demo seed** | Placeholder from `data/seed.json` — not real growth |
| **live (manual)** | Founder-entered real numbers |
| **live (Meta)** | Last sync from Meta Graph API |

Agents read `metricsProvenance` from `get_portal_state` and must **not** treat demo seed as real @berlinxkw performance.

---

## Manual metrics

1. Log in to the portal (`PORTAL_PASSCODE`).
2. Open **/portal/system** (راهبری).
3. Fill **Instagram metrics** for the current week and click **save manual metrics**.

Daily snapshots accept a JSON array:

```json
[
  { "date": "2025-09-19", "followers": 1200, "reach": 800, "engagementRate": 4.1 }
]
```

---

## Meta Graph API setup (optional)

**پیش‌نیاز:** حساب اینستاگرام Professional (Business/Creator) برای @berlinxkw و اتصال به یک Meta app.

### 1. Professional account

In the Instagram app: **Settings → Account type** → switch to **Professional** (Business or Creator).

### 2. Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/) → **Create app** (type: Business).
2. Add product **Instagram** (Instagram API with Instagram Login and/or Facebook Login for Business).
3. Complete app review only if you need permissions beyond your own account; for **your own** account, development mode + your user as tester is often enough for internal portal sync.

### 3. Permissions

Request scopes appropriate to your login product, for example:

- `instagram_business_basic` — profile + media counts  
- `instagram_business_manage_insights` — reach, profile views, saves (requires eligible follower counts for some metrics)

Facebook Login equivalents may appear as `instagram_basic`, `instagram_manage_insights`, etc., depending on product version — match what the Meta app dashboard shows for **Instagram Graph API**.

### 4. Tokens and IDs

1. Generate a **User access token** (long-lived recommended) with the Instagram permissions above.
2. Find **Instagram Business Account ID** (numeric IG user id) in Meta Business Suite or via Graph API `me/accounts` → connected Instagram account.

### 5. Environment variables

Add to `.env.local` (local) or Vercel project env (production):

```bash
INSTAGRAM_ACCESS_TOKEN=   # long-lived user token
INSTAGRAM_BUSINESS_ACCOUNT_ID=   # IG user id (numeric)
```

See [`.env.example`](../.env.example).

### 6. Sync

On **/portal/system**, click **Sync from Instagram**. The server calls `graph.facebook.com` — credentials stay in env only; the app never stores Instagram passwords.

**Accounts under ~100 followers:** Meta may return empty insights; profile `followers_count` / `media_count` still sync. Enter engagement manually if needed.

---

## API (auth-gated)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/metrics/manual` | Save manual week metrics |
| `GET` | `/api/metrics/sync` | Whether Meta env is configured |
| `POST` | `/api/metrics/sync` | Pull from Meta into current week |

Implementation: [`src/lib/instagram-metrics.ts`](../src/lib/instagram-metrics.ts).

---

## What we deliberately do not use

- Postiz or other paid social APIs  
- Scraping login sessions or storing Instagram passwords  
- Paid Apify actors for follower counts  

Brand lockup remains **berlin × kawe** (multiplication sign ×).
