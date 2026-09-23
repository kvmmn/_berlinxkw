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
