# App theme guide

Based on the reference UI (light + dark mobile mock). Use **semantic shadcn tokens** in components — not raw hex in JSX.

## Light mode

| Token | Reference | Use |
|-------|-----------|-----|
| `background` | White `#FFFFFF` | Page shell |
| `foreground` | Near black | Body text |
| `primary` | Purple `#9D7BFF` | Main actions, links |
| `accent` | Orange wash `#FFA54F` | Highlights, escalated feel |
| `muted-foreground` | Grey `#8E8E93` | Timestamps, hints |
| `card` | White | Panels, bottom-sheet style cards |

## Dark mode

| Token | Reference | Use |
|-------|-----------|-----|
| `background` | Navy `#05071A` | Page shell |
| `foreground` | White | Body text |
| `primary` | Neon green `#22FF82` | Main actions |
| `accent` / `destructive` | Red `#FF4B4B` | Alerts, escalation |
| `muted-foreground` | `#4B5563` | Secondary text |
| `card` | Elevated navy | Cards |

## Extra brand utilities

- `bg-brand-purple` / `text-brand-purple`
- `bg-brand-orange` / `text-brand-orange`
- `bg-brand-green` / `text-brand-green`
- `bg-brand-red` / `text-brand-red`

## Radius

Base `--radius: 1rem`. Use `rounded-3xl` on cards (matches reference ~32px corners).

## Toggle theme

```tsx
import { ThemeToggle } from "@/components/theme-toggle";
```

Provider is wired in `src/app/layout.tsx` via `next-themes` (`class` on `<html>`).

## Ticket badges

```tsx
import { ticketStatusStyles } from "@/lib/ticket-status-theme";
```
