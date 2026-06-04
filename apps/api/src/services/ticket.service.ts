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

  const firstStep = await getPipelineStepAt(input.ticketTypeId, 0);
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

function canViewTicket(actor: AuthUser, ticket: { createdById: string; currentDepartmentId: string }) {
  if (actor.role === "END_USER") {
    return ticket.createdById === actor.id;
  }
  return ticket.currentDepartmentId === actor.departmentId;
}

export async function getTicketForActor(actor: AuthUser, id: string) {
  const ticket = await getTicketById(id);
  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }
  if (!canViewTicket(actor, ticket)) {
    throw new Error("FORBIDDEN");
  }
  return ticket;
}

export async function getTicketById(id: string) {
  return prisma.ticket.findUnique({
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
}

/** End users: tickets they submitted. */
export async function listMyTickets(actor: AuthUser) {
  return prisma.ticket.findMany({
    where: { createdById: actor.id },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
  });
}

/** Department view: unassigned queue + assigned in-progress tickets. */
export async function getDepartmentQueue(actor: AuthUser) {
  if (actor.role !== "DEPARTMENT_MEMBER") {
    throw new Error("FORBIDDEN");
  }

  const baseWhere: Prisma.TicketWhereInput = {
    currentDepartmentId: actor.departmentId,
  };

  const [unassigned, assigned] = await Promise.all([
    prisma.ticket.findMany({
      where: { ...baseWhere, assigneeId: null },
      orderBy: { createdAt: "asc" },
      include: ticketInclude,
    }),
    prisma.ticket.findMany({
      where: { ...baseWhere, assigneeId: { not: null } },
      orderBy: { updatedAt: "desc" },
      include: ticketInclude,
    }),
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
      type: ticket.assigneeId
        ? ActivityType.REASSIGNED
        : ActivityType.ASSIGNED,
      actorId: actor.id,
      targetUserId: assigneeId,
      message: ticket.assigneeId
        ? `Reassigned to ${assignee.name}`
        : `Assigned to ${assignee.name}`,
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
      previousStatus: ticket.status,
      newStatus: status,
    });

    return updated;
  });
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
      targetDepartmentId: nextStep.departmentId,
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
