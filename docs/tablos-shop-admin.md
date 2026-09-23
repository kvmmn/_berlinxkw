# Tablos shop — admin notes

Portal: **`/portal/tablos`**. Public listings: **`/shop`**.

## Artwork vs framed sample

| Field | Role |
|-------|------|
| `image` | Flat original artwork — primary shop photo. |
| `framedImage` | Optional finished piece on wall — second shop photo. |
| `framedImagesByFinish` | Optional map of finish slug → image when you have one mockup per metal finish. |

**Orientation:** framed sample photos must match the artwork (landscape stays landscape, portrait stays portrait). Do not crop or rotate the artwork to force a portrait frame in the mockup.

## Frame finishes (structured, not free text)

Each tablo stores:

- `frameFinishes` — array of slugs buyers can order (default: all three).
- `defaultFrameFinish` — pre-selected on the shop detail page (default: `bronze`).

Allowed slugs only:

- `bronze` (برنز)
- `matte-black-brushed`
- `matte-steel-brushed`

Listing does **not** depend on having framed mockups; enable finishes first, add `framedImage` / `framedImagesByFinish` when photos or a separate mockup pipeline are ready.

## Multipart uploads (`POST` / `PATCH /api/tablos/[id]`)

Blob paths (when using Vercel Blob):

| Field | Stored as | Blob prefix |
|-------|-----------|-------------|
| `artwork` or `image` | `image` | `berlinxkw/tablos/{id}/artwork/{filename}` |
| `framed` | `framedImage` (+ mirrors to `framedImagesByFinish.bronze` when bronze is an available finish) | `berlinxkw/tablos/{id}/framed/{filename}` |
| `framed-bronze` | `framedImagesByFinish.bronze` | `berlinxkw/tablos/{id}/framed/bronze/{filename}` |
| `framed-matte-black-brushed` | `framedImagesByFinish["matte-black-brushed"]` | `…/framed/matte-black-brushed/{filename}` |
| `framed-matte-steel-brushed` | `framedImagesByFinish["matte-steel-brushed"]` | `…/framed/matte-steel-brushed/{filename}` |

Optional camelCase aliases: `framedBronze`, `framedMatteBlackBrushed`, `framedMatteSteelBrushed`.

Clear flags (send value `true`):

- `clearFramed` — removes `framedImage`
- `clearFramed-bronze`, `clearFramed-matte-black-brushed`, `clearFramed-matte-steel-brushed` (aliases: `clearFramedBronze`, …) — removes that finish from `framedImagesByFinish` and deletes its blob

Example — upload three per-finish mockups on an existing tablo (portal session cookie or auth as your deploy requires):

```bash
curl -X PATCH "https://YOUR_HOST/api/tablos/TABLO_ID" \
  -H "Cookie: YOUR_PORTAL_SESSION" \
  -F "framed-bronze=@./mockups/bronze.jpg;type=image/jpeg" \
  -F "framed-matte-black-brushed=@./mockups/black.jpg;type=image/jpeg" \
  -F "framed-matte-steel-brushed=@./mockups/steel.jpg;type=image/jpeg"
```

The shop detail page uses `framedImagesByFinish[finish]` when present, otherwise falls back to `framedImage`.
