# Portal guide

*راهنمای پورتال — one sentence per route*

Advisor Portal is the founder **control plane** for berlin × kawe OS. All routes except `/login` require the passcode cookie.

**Live:** [https://berlinxkw.vercel.app](https://berlinxkw.vercel.app)

---

## Navigation map

```mermaid
flowchart TB
  L[/login] --> P[/portal]
  P --> D[/portal/daily]
  P --> I[/portal/ideas]
  P --> R[/portal/review]
  P --> C[/portal/chat]
  P --> S[/portal/system]
```

---

## Routes

| Route | EN | FA |
|-------|----|----|
| **`/login`** | Passcode gate before any portal page. | ورود با رمز — دروازه قبل از پورتال. |
| **`/portal`** | **Weekly report** — current week metrics, summary, primary operating view. | **گزارش هفتگی** — متریک و خلاصه هفته جاری. |
| **`/portal/daily`** | **Daily pulse** — demo day-by-day snapshots (secondary while IG paused). | **نبض روزانه** — نمای روزانه (ثانویه). |
| **`/portal/ideas`** | **Ideas Inbox** — founder drops text/media; agents read inbox/queued. | **صندوق ایده** — ثبت ایده؛ مغز شرکت می‌خواند. |
| **`/portal/review`** | **Weekly review** — score last week's decisions (1–5 + notes). | **بازبینی هفتگی** — امتیازدهی به تصمیم‌های هفته قبل. |
| **`/portal/chat`** | **Company Brain** — streaming LangGraph chat (Persian-friendly). | **مغز شرکت** — گفتگوی زنده با عامل‌ها. |
| **`/portal/system`** | **راهبری / System** — agent roster, storage & tracing status, edit `brainMemory`. | **راهبری** — وضعیت ذخیره‌سازی و حافظه استراتژی. |

---

## API (for integrators)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Passcode → session cookie |
| POST | `/api/chat` | NDJSON LangGraph stream |
| GET/PATCH | `/api/system` | Read/update `brainMemory`, status |
| GET | `/api/state` | AppState snapshot |
| GET/POST | `/api/ideas` | List / create ideas |
| PATCH | `/api/ideas/[id]` | Update idea status, notes |
| GET/POST | `/api/decisions` | List / create decisions |
| POST | `/api/decisions/[id]/evaluate` | Weekly review scores |
| GET | `/api/sessions` | Chat session list |

All agent routes: **Node.js** runtime.

---

## Related docs

- [Architecture](ARCHITECTURE.md) — agents, storage, tracing  
- [Workflows](WORKFLOWS.md) — daily OS, inbox, chat, deploy  
- [README](../README.md) — quick start
