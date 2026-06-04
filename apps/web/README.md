# Web (`apps/web`)

Next.js (App Router) frontend for the IT Ticketing System.

**URL:** http://localhost:3000

The API must be running at http://localhost:4000 (see [apps/api/README.md](../api/README.md)).

---

## Setup

From **repo root**:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local` if your API port differs:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> Restart `pnpm dev:web` after changing env vars.

---

## Run

From repo root (with API already running):

```bash
pnpm dev:web
```

From this folder:

```bash
pnpm dev
```

Production build:

```bash
pnpm run build
pnpm start
```

---

## Verify no errors

From repo root:

```bash
pnpm --filter web run build
pnpm --filter web run lint
```

Or from this folder:

```bash
pnpm run build
pnpm run lint
```

Full monorepo check (shared + API + web):

```bash
# from repo root
pnpm check
```

---

## Manual test in the browser

1. Start database: `pnpm db:up` (repo root)
2. Start API: `pnpm dev:api`
3. Start web: `pnpm dev:web`
4. Open http://localhost:3000

Until ticket UI pages are implemented, a successful **Next.js starter page** with no console errors means the web app runs correctly.

To confirm API connectivity from the browser devtools console (once UI uses the API):

```js
fetch("http://localhost:4000/health").then((r) => r.json()).then(console.log);
```

---

## Add shared types (optional)

When wiring API types in the UI:

```bash
# In apps/web/package.json
"@it-ticketing/shared": "workspace:*"
```

```ts
import { Role, type TicketDetail } from "@it-ticketing/shared";
```

Then `pnpm install` from repo root and import from `@it-ticketing/shared`.

---

## Project structure

```text
src/
  app/           pages (App Router)
  components/    UI components
  lib/           utilities
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cannot reach API | Run `pnpm dev:api`; check `NEXT_PUBLIC_API_URL` |
| CORS errors | API allows `http://localhost:3000` — use that origin |
| Env not applied | File must be `.env.local`; restart dev server |
| Wrong workspace | Run `pnpm install` from **repo root**, not only in `apps/web` |
