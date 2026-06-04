/** Mirrors Prisma `Role` — keep in sync with `schema.prisma`. */
export const Role = {
  END_USER: "END_USER",
  DEPARTMENT_MEMBER: "DEPARTMENT_MEMBER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Mirrors Prisma `TicketStatus`. */
export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

/** Mirrors Prisma `ActivityType`. */
export const ActivityType = {
  TICKET_CREATED: "TICKET_CREATED",
  ASSIGNED: "ASSIGNED",
  REASSIGNED: "REASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ESCALATED: "ESCALATED",
  REMARK_ADDED: "REMARK_ADDED",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
