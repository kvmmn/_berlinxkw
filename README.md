# berlin × kawe

Brand kit and operating system for **berlin × kawe** ([@berlinxkw](https://instagram.com/berlinxkw)).

Repository layout:

- `Berlin_x_Kawe_Typeface_Kit/` — typography and brand templates (preserved)
- `inspiration for brand/` — reference assets
- `logo.png` — mark (neon lime orb + bear)
- `src/` — **Advisor Portal** Next.js app (Company Brain MVP)

## Advisor Portal (MVP)

Web app for advisors to consult the **Company Brain** (AI growth executive), review weekly Instagram metrics (demo data while posting is paused), log decisions, and evaluate last week’s outcomes.

### Run locally

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY for streaming chat
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default passcode: `berlinxkw` (override with `PORTAL_PASSCODE`).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For chat | OpenAI API key for Company Brain streaming (`gpt-4o-mini`) |
| `PORTAL_PASSCODE` | Recommended | Advisor login passcode (default `berlinxkw`) |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for persisting sessions/decisions on serverless |

Copy from [`.env.example`](.env.example).

### Data & persistence

- **Seed data:** [`data/seed.json`](data/seed.json) — weeks, demo metrics, sample sessions/decisions, brain memory markdown.
- **Local dev:** mutable copy at `data/store.json` (gitignored), created on first read.
- **Vercel:** filesystem is read-only without Blob. Attach a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store to the project so `BLOB_READ_WRITE_TOKEN` is set; the app reads/writes `berlinxkw/store.json`. Without Blob, the UI runs in **read-only demo mode** (banner in header).

### Deploy on Vercel

1. Import this repo in Vercel (root directory = repository root).
2. Set `OPENAI_API_KEY` and `PORTAL_PASSCODE`.
3. Add **Blob** storage and redeploy so sessions and decisions persist.
4. `npm run build` is the build command (default).

### App routes

| Path | Purpose |
|------|---------|
| `/login` | Passcode gate |
| `/portal` | **Weekly report** (primary) |
| `/portal/daily` | Daily metric snapshots |
| `/portal/review` | Evaluate prior-week decisions |
| `/portal/chat` | Streaming Company Brain session |
| `/portal/ideas` | **Ideas Inbox** — founder drops (text, image, video) for the OS |

### Ideas Inbox

Founder-facing capture for works that feed the Company Brain. Status flow: `inbox` → `queued` → `used` / `archived`.

- **API:** `GET/POST /api/ideas`, `PATCH/DELETE /api/ideas/[id]` (same passcode session as other portal APIs).
- **Brain context:** Latest ~10 `inbox` + `queued` ideas (title, description, status, media URLs) are appended to the Company Brain system prompt.
- **Media limits:** images ≤ **8MB**, video ≤ **40MB** (validated client + server). Only `image/*` and `video/*`.
- **Storage:**
  - **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`): JSON store at `berlinxkw/store.json`; media at `berlinxkw/ideas/<ideaId>/<filename>` (public URLs returned by Blob).
  - **Local dev:** JSON at `data/store.json`; media files under `public/uploads/ideas/<ideaId>/` (gitignored), served as static assets at `/uploads/ideas/...`.
  - **Read-only Vercel without Blob:** ideas UI loads seed/demo data; uploads return 503.

On Vercel serverless, very large multipart bodies may hit platform payload limits — use local dev or Blob for heavy video uploads if a deploy rejects the request.

### Company Brain behavior

System prompt includes brand rules, standing strategy (`brainMemory`), current/previous week metrics, recent decisions, and founder **ideas inbox** entries. Proposed decisions may appear as `DECISION:: …` lines and are stored as `proposed` records when chat persistence is enabled.

Instagram posting/automation is **out of scope** for this MVP.

## Type tokens

UI imports [`Berlin_x_Kawe_Typeface_Kit/07_Tokens/type-tokens.css`](Berlin_x_Kawe_Typeface_Kit/07_Tokens/type-tokens.css). Accent color `--bk-lime` matches the logo orb.
