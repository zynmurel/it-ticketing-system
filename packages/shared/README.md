# `@it-ticketing/shared`

Shared TypeScript enums and API types for `apps/api` and `apps/web`.

---

## Build

Required before running or typechecking the API:

```bash
# From repo root
pnpm --filter @it-ticketing/shared run build
```

The API `predev` script runs this automatically.

---

## Usage

```json
"@it-ticketing/shared": "workspace:*"
```

```ts
import {
  Role,
  TicketStatus,
  ActivityType,
  type TicketDetail,
  type ActivityItem,
  type AuthUser,
} from "@it-ticketing/shared";
```

---

## Exports

**Enums (const + type):** `Role`, `TicketStatus`, `ActivityType`

**Types:** `AuthUser`, `TicketSummary`, `TicketDetail`, `ActivityItem`, `DepartmentQueue`, `PipelineStep`, `TicketTypeSummary`, …

Keep values in sync with `apps/api/prisma/schema.prisma`.
