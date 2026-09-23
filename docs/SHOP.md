# Shop ops loop — berlin × kawe tablos

Public shop: **`/shop`** (no passcode). Advisor CRUD: **`/portal/tablos`** (same passcode as the rest of the portal).

## Fields

| Field | Purpose |
| --- | --- |
| `title` | Work name on cards and detail |
| `slug` | URL `/shop/[slug]` — auto-slugified from title if omitted on create |
| `description` | Archival copy on detail page |
| `priceEur` | Display price (EUR) |
| `status` | `draft` (portal only), `listed` (public shop), `sold` (hidden from shop grid) |
| `image` | Artwork file — stored in private Vercel Blob under `berlinxkw/tablos/…` or local `public/uploads/tablos/` in dev |
| `marketplaceUrl` | Optional Etsy / external **Buy now** link |
| `captionDraft` | Instagram caption template; include `{shopLink}` — replaced with the live listing URL |

Blob stays **private**. Listed tablo images are served via **`/api/shop/media?pathname=…`** (tablo prefix only). Portal uploads use the same pattern as Ideas (`/api/blob` when authenticated).

## Weekly loop (MVP)

1. **Artwork ready** — photograph / export final tablo asset.
2. **Portal → Shop** — create tablo, upload image, set price + description, status **`listed`**.
3. **Buy path** — add `marketplaceUrl` when Etsy (or other) listing is live; until then public **Buy via DM** falls back to [@berlinxkw](https://instagram.com/berlinxkw).
4. **Site link** — copy listing URL from portal (`https://berlinxkw.vercel.app/shop/your-slug` or preview URL).
5. **Instagram (later)** — paste `captionDraft` with `{shopLink}` filled; no auto-post in this MVP.

## Environment

- `NEXT_PUBLIC_SITE_URL` — optional canonical origin for `{shopLink}` in captions (defaults to `VERCEL_URL` on Vercel).
- `BLOB_READ_WRITE_TOKEN` — required on Vercel for persisting tablos alongside portal state (`berlinxkw/store.json`).

## Seed demos

`data/seed.json` includes two **listed** demo tablos with static SVG placeholders under `/shop/demo/` so `/shop` is never empty on fresh deploys before Blob is written.
