# IT Ticketing System

Internal IT support portal where employees submit requests and support teams work them through department queues.

**End users** create tickets (hardware, software, network, and more), track status, and view history on their own requests. **Department members** triage their team’s queue—assign work, update status, escalate to the next department in the pipeline, and add remarks. Every change is recorded in a full activity log.

Tickets follow **type-specific pipelines** (for example, Help Desk → Tier 2 → Infrastructure). New tickets enter the first step unassigned; escalation moves them to the next department until resolved or closed.

Built as a monorepo: **Express + TypeScript API**, **Next.js web**, **PostgreSQL**, JWT auth.

| App               | URL                   | Folder               |
| ----------------- | --------------------- | -------------------- |
| Web               | http://localhost:3000 | `apps/web`           |
| API               | http://localhost:4000 | `apps/api`           |
| Postgres (Docker) | `127.0.0.1:5433`      | `docker-compose.yml` |

---

## Quick start (first time)

Run every command from the **repo root**.

```bash
# 1. Clone and enter the repo
cd /path/to/it-ticketing-system

# 2. Install dependencies (approve build scripts when prompted — see Step 1 below)
pnpm install

# 3. Create env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start Postgres
pnpm db:up

# 5. Build shared types, generate Prisma client, migrate, and seed
pnpm db:setup

# 6. Verify everything builds
pnpm check

# 7. Run Express Backend
pnpm dev:api

# 8. Run NextJS Frontend
pnpm dev:web
```

Steps 7–8 need **separate terminals** (API and web run at the same time). See [Run the app](#run-the-app-every-day).

**Success looks like:** `pnpm db:setup` prints `Seed complete`, `pnpm check` exits with code 0, and http://localhost:3000 loads in the browser.

---

## Prerequisites

Install before you start:

| Tool           | Version | Check                          |
| -------------- | ------- | ------------------------------ |
| Node.js        | 20+     | `node -v`                      |
| pnpm           | 10+     | `pnpm -v`                      |
| Docker Desktop | latest  | Docker running in the menu bar |

Install pnpm if needed: `npm install -g pnpm`

---

## First-time setup (step by step)

### Step 1 — Install dependencies

```bash
cd /path/to/it-ticketing-system
pnpm install
```

**Important:** pnpm may ask you to approve native build scripts. You **must** allow these packages or Prisma and bcrypt will not work:

- `prisma`
- `@prisma/engines`
- `@prisma/client`
- `bcrypt`

When prompted, press **`a`** (select all) then **Enter**.

If you already ran `pnpm install` and skipped this, run:

```bash
cd apps/api
pnpm approve-builds
# Select prisma, @prisma/engines, @prisma/client, bcrypt → Enter
cd ../..
pnpm install
```

### Step 2 — Environment files

**API** — required:

```bash
cp apps/api/.env.example apps/api/.env
```

Default values work with Docker Compose:

```env
DATABASE_URL="postgresql://ticketing:ticketing@127.0.0.1:5433/ticketing"
JWT_SECRET="change-me-in-production"
PORT=4000
```

**Web** — required for the UI to call the API:

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

Confirm the container is healthy (STATUS should say `healthy` or `Up`):

```bash
docker ps --filter name=it-ticketing-db
```

### Step 4 — Prepare the database

```bash
pnpm db:setup
```

This single command:

1. Builds `@it-ticketing/shared` (types used by the API seed)
2. Generates the Prisma client (`PrismaClient`)
3. Applies database migrations
4. Seeds demo users and tickets

**Expected output:** ends with `Seed complete` and `Password for all accounts: password123`.

To re-seed later (clears and reloads demo data):

```bash
pnpm db:seed
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

Builds shared, typechecks and builds the API, and builds the Next.js app.

**Exit code 0 = ready to run.**

---

## Run the app (every day)

You need **Docker**, plus **two terminals** for the API and web.

### Terminal 1 — Database (if not already running)

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

| Email                  | Role        | Use for                   |
| ---------------------- | ----------- | ------------------------- |
| `jordan@company.local` | End user    | Create / view own tickets |
| `sam@company.local`    | End user    | Create tickets            |
| `alice@helpdesk.local` | Dept member | Help Desk queue           |
| `bob@helpdesk.local`   | Dept member | Help Desk queue           |
| `carol@tier2.local`    | Dept member | Tier 2 queue              |
| `dave@tier2.local`     | Dept member | Tier 2 queue              |
| `eve@infra.local`      | Dept member | Infrastructure queue      |
| `frank@infra.local`    | Dept member | Infrastructure queue      |

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

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `pnpm install`     | Install all workspace packages                          |
| `pnpm check`       | Build shared + API + web (catch TS/build errors)        |
| `pnpm db:up`       | Start Postgres in Docker                                |
| `pnpm db:setup`    | Build shared, generate Prisma client, migrate, seed     |
| `pnpm db:seed`     | Re-run seed only (also rebuilds shared + Prisma client) |
| `pnpm db:generate` | Regenerate Prisma client after schema changes           |
| `pnpm dev:api`     | API on port 4000 (hot reload)                           |
| `pnpm dev:web`     | Web on port 3000 (hot reload)                           |
| `pnpm lint:web`    | ESLint for Next.js app                                  |

---

## Troubleshooting

### `Module "@prisma/client" has no exported member "PrismaClient"`

The Prisma client was not generated. Fix:

```bash
pnpm db:generate
pnpm db:setup
```

This usually happens if build scripts were not approved during `pnpm install` (see Step 1).

### `Cannot find module '@it-ticketing/shared/dist/index.js'`

The shared package was not built. Fix:

```bash
pnpm --filter @it-ticketing/shared run build
pnpm db:seed
```

Or just run `pnpm db:setup`, which builds shared automatically.

### `pnpm: command not found`

Install pnpm: `npm install -g pnpm`

### `User was denied access` / Prisma P1010 on migrate

Another Postgres may be using port **5432**. This project uses Docker on **5433** — keep `DATABASE_URL` port `5433` in `apps/api/.env`.

### `Ignored build scripts` (bcrypt / prisma)

```bash
cd apps/api
pnpm approve-builds
# Select prisma, @prisma/engines, @prisma/client, bcrypt → Enter
cd ../..
pnpm install
pnpm db:setup
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
