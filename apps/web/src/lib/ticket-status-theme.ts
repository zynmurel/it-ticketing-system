import { TicketStatus } from "@it-ticketing/shared";

/** Badge classes aligned with the app light/dark palette */
export const ticketStatusStyles: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Open",
    className:
      "bg-muted text-muted-foreground dark:bg-secondary dark:text-secondary-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "bg-brand-blue/15 text-blue-700 dark:bg-blue-500/15 dark:text-blue",
  },
  ESCALATED: {
    label: "Escalated",
    className:
      "bg-accent text-accent-foreground dark:bg-brand-orange/15 dark:text-brand-orange",
  },
  RESOLVED: {
    label: "Resolved",
    className:
      "bg-brand-green/15 text-green-700 dark:bg-brand-green/10 dark:text-brand-green",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-muted text-muted-foreground",
  },
};

/** Dot color for status pills in activity timeline */
export const ticketStatusDot: Record<TicketStatus, string> = {
  OPEN: "bg-white",
  IN_PROGRESS: "bg-blue-500",
  ESCALATED: "bg-orange-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-zinc-400",
};
