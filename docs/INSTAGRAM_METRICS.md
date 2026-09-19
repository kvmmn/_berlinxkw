# Instagram metrics (free) · @berlinxkw

The advisor portal tracks **berlin × kawe** Instagram numbers without Postiz, Apify, or other paid scrapers.

## Primary paths (no Meta API)

1. **Manual entry** — `/portal/system` → fill followers, reach, posts, engagement, saves, profile visits, optional daily JSON, week summary → **save manual metrics**.
2. **Insights paste / import** — same page: paste a weekly snapshot copied from the Instagram app **Insights** (Persian or English), or upload a screenshot. `POST /api/metrics/import` uses **OpenAI** (`OPENAI_API_KEY`) to extract structured metrics and saves with provenance **live (import)**. No Instagram password stored.

## Optional (often blocked)

3. **Meta Graph API sync** — only if Meta grants app access and you set `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID`. Many founders (including this project) cannot get API approval; the **Sync** button appears only when env is configured. Prefer manual + import.

## Provenance badges

| Badge | Meaning |
|-------|---------|
| **demo seed** | Placeholder from `data/seed.json` — not real growth |
| **live (manual)** | Founder-entered real numbers |
| **live (import)** | Parsed from Insights paste or screenshot via OpenAI |
| **live (Meta)** | Last sync from Meta Graph API (optional) |

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

## Insights paste / import

1. In the Instagram app: **Professional dashboard → Insights** (weekly view).
2. Copy visible stats into the **Insights paste / import** textarea and/or upload a screenshot.
3. Click **import from Insights**. Review extracted numbers in the form; adjust and **save manual metrics** if needed.

Requires `OPENAI_API_KEY` (same as Company Brain chat). Images are sent to OpenAI vision for extraction only during the request — not stored in AppState.

---

## Meta Graph API setup (optional — often blocked)

**پیش‌نیاز:** حساب اینستاگرام Professional (Business/Creator) برای @berlinxkw، Meta app، and **approved** permissions. Internal portals frequently stay in development mode or fail app review — use manual + import instead.

### 1. Professional account

In the Instagram app: **Settings → Account type** → switch to **Professional** (Business or Creator).

### 2. Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/) → **Create app** (type: Business).
2. Add product **Instagram** (Instagram API with Instagram Login and/or Facebook Login for Business).
3. App review is required for production; many small brands never receive insights scopes — **do not depend on this path**.

### 3. Permissions

Request scopes appropriate to your login product, for example:

- `instagram_business_basic` — profile + media counts  
- `instagram_business_manage_insights` — reach, profile views, saves (requires eligible follower counts for some metrics)

### 4. Tokens and IDs

1. Generate a **User access token** (long-lived recommended) with the Instagram permissions above.
2. Find **Instagram Business Account ID** (numeric IG user id) in Meta Business Suite or via Graph API.

### 5. Environment variables

Add to `.env.local` (local) or Vercel project env (production):

```bash
INSTAGRAM_ACCESS_TOKEN=   # long-lived user token
INSTAGRAM_BUSINESS_ACCOUNT_ID=   # IG user id (numeric)
```

See [`.env.example`](../.env.example).

### 6. Sync

When env is set, **Sync from Instagram (Meta API)** appears on **/portal/system**. Credentials stay in env only; the app never stores Instagram passwords.

**Accounts under ~100 followers:** Meta may return empty insights; profile counts may still sync. Use manual or import for engagement.

---

## API (auth-gated)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/metrics/manual` | Save manual week metrics |
| `POST` | `/api/metrics/import` | Extract from Insights text/image → save (OpenAI) |
| `GET` | `/api/metrics/sync` | Whether Meta env is configured |
| `POST` | `/api/metrics/sync` | Pull from Meta into current week (optional) |

Implementation: [`src/lib/instagram-metrics.ts`](../src/lib/instagram-metrics.ts), [`src/lib/metrics-import.ts`](../src/lib/metrics-import.ts).

---

## What we deliberately do not use

- Postiz or other paid social APIs  
- Scraping login sessions or storing Instagram passwords  
- Paid Apify actors for follower counts  

Brand lockup remains **berlin × kawe** (multiplication sign ×).
