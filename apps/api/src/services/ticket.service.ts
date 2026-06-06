import {
  ActivityType,
  TicketStatus,
  type AuthUser,
} from "@it-ticketing/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  getNextStep,
  getPipelineStepAt,
  getPipelineSteps,
} from "../lib/pipeline";

export { getPipelineSteps, getNextStep } from "../lib/pipeline";

const ticketInclude = {
  ticketType: { select: { id: true, name: true } },
  currentDepartment: { select: { id: true, name: true, slug: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketInclude;

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: typeof ticketInclude;
}>;

async function recordActivity(
  tx: Prisma.TransactionClient,
  data: {
    ticketId: string;
    type: ActivityType;
    actorId: string;
    message?: string;
    targetUserId?: string;
    targetDepartmentId?: string;
    sourceDepartmentId?: string;
    previousStatus?: TicketStatus;
    newStatus?: TicketStatus;
  },
) {
  return tx.ticketActivity.create({ data });
}

export async function createTicket(
  actor: AuthUser,
  input: { title: string; description: string; ticketTypeId: string },
) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    throw new Error("INVALID_INPUT");
  }

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: input.ticketTypeId },
  });
  if (!ticketType) {
    throw new Error("TICKET_TYPE_NOT_FOUND");
  }

  const steps = await getPipelineSteps(input.ticketTypeId);
  const firstStep = steps[0];
  if (!firstStep) {
    throw new Error("NO_PIPELINE");
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        title,
        description,
        ticketTypeId: input.ticketTypeId,
        createdById: actor.id,
        currentDepartmentId: firstStep.departmentId,
        pipelineStepIndex: 0,
        status: TicketStatus.OPEN,
      },
      include: ticketInclude,
    });

    await recordActivity(tx, {
      ticketId: ticket.id,
      type: ActivityType.TICKET_CREATED,
      actorId: actor.id,
      targetDepartmentId: firstStep.departmentId,
      newStatus: TicketStatus.OPEN,
    });

    return ticket;
  });
}

async function ticketHasDepartmentActivity(
  ticketId: string,
  departmentId: string,
) {
  const count = await prisma.ticketActivity.count({
    where: {
      ticketId,
      actor: { departmentId },
    },
  });
  return count > 0;
}

async function canViewTicket(
  actor: AuthUser,
  ticket: { id: string; createdById: string; currentDepartmentId: string },
) {
  if (actor.role === "END_USER") {
    return ticket.createdById === actor.id;
  }

  if (ticket.currentDepartmentId === actor.departmentId) {
    return true;
  }

  if (ticket.createdById === actor.id) {
    return true;
  }

  return ticketHasDepartmentActivity(ticket.id, actor.departmentId);
}

export async function getTicketForActor(actor: AuthUser, id: string) {
  const ticket = await getTicketById(id);
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }
  if (!(await canViewTicket(actor, ticket))) {
    throw new Error("FORBIDDEN");
  }
  return ticket;
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      ...ticketInclude,
      activities: {
        orderBy: { createdAt: "asc" },
        include: {
          actor: { select: { id: true, name: true } },
          targetDepartment: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!ticket) return null;

  const targetUserIds = [
    ...new Set(
      ticket.activities
        .map((activity) => activity.targetUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const targetUsers =
    targetUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const targetUserById = new Map(targetUsers.map((user) => [user.id, user]));

  return {
    ...ticket,
    activities: ticket.activities.map((activity) => ({
      ...activity,
      targetUser: activity.targetUserId
        ? (targetUserById.get(activity.targetUserId) ?? null)
        : null,
    })),
  };
}

/** Personal tickets: created by or assigned to the user. */
export async function listMyTickets(actor: AuthUser) {
  return prisma.ticket.findMany({
    where: {
      OR: [{ createdById: actor.id }, { assigneeId: actor.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
  });
}

/**
 * Tickets that left the viewer's department after department activity.
 * Department members: activity by someone in their dept, ticket no longer there.
 * End users: tickets they created with at least one escalation.
 */
export async function listEscalatedTickets(actor: AuthUser) {
  if (actor.role === "DEPARTMENT_MEMBER") {
    return prisma.ticket.findMany({
      where: {
        currentDepartmentId: { not: actor.departmentId },
        activities: {
          some: {
            actor: { departmentId: actor.departmentId },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: ticketInclude,
    });
  }

  return prisma.ticket.findMany({
    where: {
      createdById: actor.id,
      activities: {
        some: { type: ActivityType.ESCALATED },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
  });
}

function departmentTicketWhere(actor: AuthUser): Prisma.TicketWhereInput {
  if (actor.role !== "DEPARTMENT_MEMBER") {
    throw new Error("FORBIDDEN");
  }

  return { currentDepartmentId: actor.departmentId };
}

/** Unassigned requests currently in the member's department queue. */
export async function listDepartmentUnassigned(actor: AuthUser) {
  return prisma.ticket.findMany({
    where: { ...departmentTicketWhere(actor), assigneeId: null },
    orderBy: { createdAt: "asc" },
    include: ticketInclude,
  });
}

/** Assigned tickets currently in the member's department. */
export async function listDepartmentAssigned(actor: AuthUser) {
  return prisma.ticket.findMany({
    where: { ...departmentTicketWhere(actor), assigneeId: { not: null } },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
  });
}

/** Tickets escalated away from this department — stay on the assigned board. */
export async function listDepartmentBoardEscalated(actor: AuthUser) {
  const tickets = await prisma.ticket.findMany({
    where: {
      currentDepartmentId: { not: actor.departmentId },
      activities: {
        some: {
          type: ActivityType.ESCALATED,
          OR: [
            { sourceDepartmentId: actor.departmentId },
            {
              sourceDepartmentId: null,
              actor: { departmentId: actor.departmentId },
            },
          ],
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      ...ticketInclude,
      activities: {
        where: {
          type: ActivityType.ESCALATED,
          OR: [
            { sourceDepartmentId: actor.departmentId },
            {
              sourceDepartmentId: null,
              actor: { departmentId: actor.departmentId },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { actorId: true, targetUserId: true },
      },
    },
  });

  return tickets.map(({ activities, ...ticket }) => {
    const escalation = activities[0];
    return {
      ...ticket,
      escalatedFromAssigneeId:
        escalation?.targetUserId ?? escalation?.actorId ?? null,
    };
  });
}

export async function getDepartmentBoard(actor: AuthUser) {
  const [inDepartment, escalated] = await Promise.all([
    listDepartmentAssigned(actor),
    listDepartmentBoardEscalated(actor),
  ]);

  return { inDepartment, escalated };
}

/** Department view: unassigned queue + assigned in-progress tickets. */
export async function getDepartmentQueue(actor: AuthUser) {
  const [unassigned, assigned] = await Promise.all([
    listDepartmentUnassigned(actor),
    listDepartmentAssigned(actor),
  ]);

  return { unassigned, assigned };
}

export async function listTicketTypes() {
  return prisma.ticketType.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      pipelineSteps: {
        orderBy: { stepOrder: "asc" },
        select: {
          stepOrder: true,
          department: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
}

export async function assignTicket(
  actor: AuthUser,
  ticketId: string,
  assigneeId: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (actor.role === "DEPARTMENT_MEMBER") {
    if (ticket.currentDepartmentId !== actor.departmentId) {
      throw new Error("FORBIDDEN");
    }
  }

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
  });
  if (
    !assignee ||
    assignee.departmentId !== ticket.currentDepartmentId ||
    assignee.role !== "DEPARTMENT_MEMBER"
  ) {
    throw new Error("INVALID_ASSIGNEE");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId,
        status:
          ticket.status === TicketStatus.OPEN
            ? TicketStatus.IN_PROGRESS
            : ticket.status,
      },
      include: ticketInclude,
    });

    await recordActivity(tx, {
      ticketId,
      type: ticket.assigneeId ? ActivityType.REASSIGNED : ActivityType.ASSIGNED,
      actorId: actor.id,
      targetUserId: assigneeId,
      previousStatus: ticket.status,
      newStatus: updated.status,
    });

    return updated;
  });
}

export async function updateTicketStatus(
  actor: AuthUser,
  ticketId: string,
  status: TicketStatus,
  message?: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (
    actor.role !== "DEPARTMENT_MEMBER" ||
    ticket.currentDepartmentId !== actor.departmentId
  ) {
    throw new Error("FORBIDDEN");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: ticketInclude,
    });

    await recordActivity(tx, {
      ticketId,
      type: ActivityType.STATUS_CHANGED,
      actorId: actor.id,
      message: message?.trim() || undefined,
      previousStatus: ticket.status,
      newStatus: status,
    });

    return updated;
  });
}

export async function getEscalationPreview(actor: AuthUser, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (
    actor.role !== "DEPARTMENT_MEMBER" ||
    ticket.currentDepartmentId !== actor.departmentId
  ) {
    throw new Error("FORBIDDEN");
  }
  if (
    ticket.status === TicketStatus.RESOLVED ||
    ticket.status === TicketStatus.CLOSED
  ) {
    throw new Error("ESCALATION_NOT_ALLOWED");
  }

  const nextStep = await getNextStep(
    ticket.ticketTypeId,
    ticket.pipelineStepIndex,
  );

  return {
    canEscalate: nextStep !== null,
    nextDepartment: nextStep?.department ?? null,
  };
}

export async function escalateTicket(
  actor: AuthUser,
  ticketId: string,
  message?: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (
    actor.role !== "DEPARTMENT_MEMBER" ||
    ticket.currentDepartmentId !== actor.departmentId
  ) {
    throw new Error("FORBIDDEN");
  }
  if (
    ticket.status === TicketStatus.RESOLVED ||
    ticket.status === TicketStatus.CLOSED
  ) {
    throw new Error("ESCALATION_NOT_ALLOWED");
  }

  const nextStep = await getNextStep(
    ticket.ticketTypeId,
    ticket.pipelineStepIndex,
  );
  if (!nextStep) {
    throw new Error("NO_NEXT_STEP");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        currentDepartmentId: nextStep.departmentId,
        pipelineStepIndex: nextStep.stepOrder,
        assigneeId: null,
        status: TicketStatus.ESCALATED,
      },
      include: ticketInclude,
    });

    await recordActivity(tx, {
      ticketId,
      type: ActivityType.ESCALATED,
      actorId: actor.id,
      targetUserId: ticket.assigneeId ?? undefined,
      targetDepartmentId: nextStep.departmentId,
      sourceDepartmentId: ticket.currentDepartmentId,
      message: message?.trim() || undefined,
      previousStatus: ticket.status,
      newStatus: TicketStatus.ESCALATED,
    });

    return updated;
  });
}

export async function addTicketRemark(
  actor: AuthUser,
  ticketId: string,
  message: string,
) {
  const text = message.trim();
  if (!text) {
    throw new Error("INVALID_INPUT");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (
    actor.role !== "DEPARTMENT_MEMBER" ||
    ticket.currentDepartmentId !== actor.departmentId
  ) {
    throw new Error("FORBIDDEN");
  }

  await recordActivity(prisma, {
    ticketId,
    type: ActivityType.REMARK_ADDED,
    actorId: actor.id,
    message: text,
  });

  return getTicketById(ticketId);
}
