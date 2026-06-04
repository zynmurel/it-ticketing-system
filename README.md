# IT Ticketing System

Monorepo for the take-home project: **Express + TypeScript API**, **Next.js web**, **PostgreSQL**, JWT auth.

| App | URL | Folder |
|-----|-----|--------|
| Web | http://localhost:3000 | `apps/web` |
| API | http://localhost:4000 | `apps/api` |
| Postgres (Docker) | `127.0.0.1:5433` | `docker-compose.yml` |

---

## Prerequisites

Install before you start:

1. **Node.js 20+** — `node -v`
2. **pnpm 10+** — `pnpm -v` (or `npm install -g pnpm`)
3. **Docker Desktop** — for PostgreSQL

---

## First-time setup (do once)

Run every command from the **repo root** unless noted.

### Step 1 — Install dependencies

```bash
cd /path/to/it-ticketing-system
pnpm install
```

If pnpm asks to approve build scripts (`prisma`, `bcrypt`, etc.), press **`a`** (select all) then **Enter**.

### Step 2 — Environment files

**API** (`apps/api/.env`):

```bash
cp apps/api/.env.example apps/api/.env
```

Default values work with Docker Compose:

```env
DATABASE_URL="postgresql://ticketing:ticketing@127.0.0.1:5433/ticketing"
JWT_SECRET="change-me-in-production"
PORT=4000
```

**Web** (`apps/web/.env.local`) — when the UI calls the API:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 3 — Start the database

```bash
pnpm db:up
```

Wait until the container is healthy:

```bash
docker ps --filter name=it-ticketing-db
```

### Step 4 — Migrate and seed

```bash
pnpm db:setup
```

For a **new migration** during development:

```bash
cd apps/api
pnpm exec prisma migrate dev --name your_migration_name
```

### Step 5 — Verify there are no build/type errors

```bash
pnpm check
```

This builds `@it-ticketing/shared`, typechecks and builds the API, and builds the Next.js app. **Exit code 0 = no errors.**

---

## Run the app (every day)

You need **two terminals** (API + web) and Docker running.

### Terminal 1 — Database (if not already up)

```bash
pnpm db:up
```

### Terminal 2 — API

```bash
pnpm dev:api
```

Wait for: `API listening on http://localhost:4000`

### Terminal 3 — Web

```bash
pnpm dev:web
```

Open **http://localhost:3000** in the browser.

---

## Quick smoke test (API)

With `pnpm dev:api` running:

```bash
# Health
curl http://localhost:4000/health

# Login (seed user)
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@helpdesk.local","password":"password123"}'

# Use the token from the response:
# curl http://localhost:4000/tickets/department/queue \
#   -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Seed accounts

Password for **all** seeded users: `password123`

| Email | Role | Use for |
|-------|------|---------|
| `jordan@company.local` | End user | Create / view own tickets |
| `sam@company.local` | End user | Create tickets |
| `alice@helpdesk.local` | Dept member | Help Desk queue |
| `bob@helpdesk.local` | Dept member | Help Desk queue |
| `carol@tier2.local` | Dept member | Tier 2 queue |
| `dave@tier2.local` | Dept member | Tier 2 queue |
| `eve@infra.local` | Dept member | Infrastructure queue |
| `frank@infra.local` | Dept member | Infrastructure queue |

Re-seed anytime:

```bash
pnpm db:seed
```

---

## Monorepo layout

```text
apps/
  api/              Express API + Prisma  →  see apps/api/README.md
  web/              Next.js frontend      →  see apps/web/README.md
packages/
  shared/           Shared types/enums    →  see packages/shared/README.md
docker-compose.yml
```

### Root scripts

| Command | What it does |
|---------|----------------|
| `pnpm install` | Install all workspace packages |
| `pnpm check` | Build shared + API + web (catch TS/build errors) |
| `pnpm db:up` | Start Postgres in Docker |
| `pnpm db:setup` | Migrate + seed database |
| `pnpm db:seed` | Re-run seed only |
| `pnpm dev:api` | API on port 4000 (hot reload) |
| `pnpm dev:web` | Web on port 3000 (hot reload) |
| `pnpm lint:web` | ESLint for Next.js app |

---

## Troubleshooting

### `pnpm: command not found`

Install pnpm: `npm install -g pnpm`

### `User was denied access` / Prisma P1010 on migrate

Another Postgres may be using port **5432**. This project uses Docker on **5433** — keep `DATABASE_URL` port `5433` in `apps/api/.env`.

### `Ignored build scripts` (bcrypt / prisma)

```bash
cd apps/api
pnpm approve-builds
# Select prisma, @prisma/engines, @prisma/client, bcrypt → Enter
pnpm install
```

### API starts but web cannot reach it

- API must be running on port **4000**
- `apps/web/.env.local` must have `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Restart the web dev server after changing `.env.local`

### Next.js “multiple lockfiles” warning

Install only from the **repo root** (`pnpm install`). Do not run `pnpm install` inside `apps/web` alone.

### Port already in use

- API: change `PORT` in `apps/api/.env`
- Web: `pnpm --filter web run dev -- -p 3001`

---

## Design notes (submission)

- **Pipelines:** `TicketTypePipelineStep` defines ordered departments; new tickets start unassigned at step 0.
- **Auth:** JWT Bearer token; `END_USER` vs `DEPARTMENT_MEMBER` roles.
- **Activity log:** `TicketActivity` records create, assign/reassign, status, escalate (optional message), remarks.
- **Shared types:** `@it-ticketing/shared` keeps API and web enums/types in sync.

More detail: [apps/api/README.md](./apps/api/README.md)
