import type { ActivityType, Role, TicketStatus } from "./enums";

export type DepartmentRef = {
  id: string;
  name: string;
  slug: string;
};

export type UserRef = {
  id: string;
  name: string;
  email: string;
};

/** Authenticated user (JWT / session). */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string;
  department: DepartmentRef;
};

export type DepartmentMember = UserRef & {
  role: Role;
};

export type PipelineStep = {
  stepOrder: number;
  departmentId: string;
  department: DepartmentRef;
};

export type TicketTypeSummary = {
  id: string;
  name: string;
  description: string | null;
  pipelineSteps?: {
    stepOrder: number;
    department: DepartmentRef;
  }[];
};

/** Ticket as returned in list / queue views. */
export type TicketSummary = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  ticketTypeId: string;
  pipelineStepIndex: number;
  currentDepartmentId: string;
  createdById: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  ticketType: { id: string; name: string };
  currentDepartment: DepartmentRef;
  createdBy: UserRef;
  assignee: UserRef | null;
  /** Assignee before this department escalated the ticket (board escalated column). */
  escalatedFromAssigneeId?: string | null;
};

export type ActivityItem = {
  id: string;
  ticketId: string;
  type: ActivityType;
  message: string | null;
  actorId: string;
  targetUserId: string | null;
  targetDepartmentId: string | null;
  previousStatus: TicketStatus | null;
  newStatus: TicketStatus | null;
  createdAt: string;
  actor: { id: string; name: string };
  targetDepartment: DepartmentRef | null;
  targetUser: UserRef | null;
};

/** Full ticket with chronological activity log. */
export type TicketDetail = TicketSummary & {
  activities: ActivityItem[];
};

export type DepartmentQueue = {
  unassigned: TicketSummary[];
  assigned: TicketSummary[];
};

export type DepartmentBoard = {
  inDepartment: TicketSummary[];
  escalated: TicketSummary[];
};

export type EscalationPreview = {
  canEscalate: boolean;
  nextDepartment: DepartmentRef | null;
};

export type LoginResponse = {
  user: AuthUser;
  token: string;
};

export type ApiError = {
  error: string;
};
