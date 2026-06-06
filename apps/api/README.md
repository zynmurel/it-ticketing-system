# API (`apps/api`)

Express + TypeScript + Prisma + PostgreSQL.

**Base URL:** http://localhost:4000

---

## Setup

From **repo root** (recommended):

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:up
pnpm db:setup   # builds shared, generates Prisma client, migrates, seeds
```

Or from this folder (manual steps):

```bash
cp .env.example .env
pnpm --filter @it-ticketing/shared run build
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
```

---

## Run

From repo root:

```bash
pnpm dev:api
```

From this folder:

```bash
pnpm dev
```

(`predev` builds `@it-ticketing/shared` automatically.)

Production-style start:

```bash
pnpm run build
pnpm start
```

---

## Verify no errors

From repo root:

```bash
pnpm --filter @it-ticketing/shared run build
pnpm exec tsc --noEmit
pnpm run build
```

Or only API:

```bash
cd apps/api
pnpm --filter @it-ticketing/shared run build
pnpm exec tsc --noEmit
pnpm run build
```

---

## Smoke test

```bash
curl http://localhost:4000/health
# → {"ok":true}

curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@helpdesk.local","password":"password123"}'
```

---

## Environment

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://ticketing:ticketing@127.0.0.1:5433/ticketing` | Prisma → Postgres |
| `JWT_SECRET` | long random string | Sign access tokens |
| `PORT` | `4000` | HTTP port |

---

## Prisma

```bash
# Apply migrations (CI / first setup)
pnpm exec prisma migrate deploy

# Create a new migration (development)
pnpm exec prisma migrate dev --name describe_change

# Seed demo data
pnpm exec prisma db seed

# Open DB GUI
pnpm exec prisma studio
```

---

## API routes

**Public**

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`

**Authenticated** (`Authorization: Bearer <token>`)

- `GET /auth/me`
- `GET /tickets/ticket-types`
- `GET /tickets/my` — end user tickets
- `GET /tickets/department/queue` — `{ unassigned, assigned }`
- `POST /tickets` — `{ title, description, ticketTypeId }`
- `GET /tickets/:id`
- `POST /tickets/:id/assign` — `{ assigneeId }`
- `POST /tickets/:id/escalate` — optional `{ message }`
- `PATCH /tickets/:id/status` — `{ status }`
- `POST /tickets/:id/remarks` — `{ message }`

CORS allows `http://localhost:3000` for the web app.

---

## Project structure

```text
src/
  index.ts           Express app entry
  routes/            auth, tickets
  middleware/        authMiddleware, requireRole
  services/          auth, ticket business logic
  lib/               prisma, jwt, pipeline, errors
prisma/
  schema.prisma
  seed.ts
```
