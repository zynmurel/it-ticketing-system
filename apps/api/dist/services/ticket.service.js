"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextStep = exports.getPipelineSteps = void 0;
exports.createTicket = createTicket;
exports.getTicketForActor = getTicketForActor;
exports.getTicketById = getTicketById;
exports.listMyTickets = listMyTickets;
exports.listEscalatedTickets = listEscalatedTickets;
exports.listDepartmentUnassigned = listDepartmentUnassigned;
exports.listDepartmentAssigned = listDepartmentAssigned;
exports.getDepartmentQueue = getDepartmentQueue;
exports.listTicketTypes = listTicketTypes;
exports.assignTicket = assignTicket;
exports.updateTicketStatus = updateTicketStatus;
exports.escalateTicket = escalateTicket;
exports.addTicketRemark = addTicketRemark;
const shared_1 = require("@it-ticketing/shared");
const prisma_1 = require("../lib/prisma");
const pipeline_1 = require("../lib/pipeline");
var pipeline_2 = require("../lib/pipeline");
Object.defineProperty(exports, "getPipelineSteps", { enumerable: true, get: function () { return pipeline_2.getPipelineSteps; } });
Object.defineProperty(exports, "getNextStep", { enumerable: true, get: function () { return pipeline_2.getNextStep; } });
const ticketInclude = {
    ticketType: { select: { id: true, name: true } },
    currentDepartment: { select: { id: true, name: true, slug: true } },
    createdBy: { select: { id: true, name: true, email: true } },
    assignee: { select: { id: true, name: true, email: true } },
};
async function recordActivity(tx, data) {
    return tx.ticketActivity.create({ data });
}
async function createTicket(actor, input) {
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || !description) {
        throw new Error("INVALID_INPUT");
    }
    const ticketType = await prisma_1.prisma.ticketType.findUnique({
        where: { id: input.ticketTypeId },
    });
    if (!ticketType) {
        throw new Error("TICKET_TYPE_NOT_FOUND");
    }
    const steps = await (0, pipeline_1.getPipelineSteps)(input.ticketTypeId);
    const firstStep = steps[0];
    if (!firstStep) {
        throw new Error("NO_PIPELINE");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.create({
            data: {
                title,
                description,
                ticketTypeId: input.ticketTypeId,
                createdById: actor.id,
                currentDepartmentId: firstStep.departmentId,
                pipelineStepIndex: 0,
                status: shared_1.TicketStatus.OPEN,
            },
            include: ticketInclude,
        });
        await recordActivity(tx, {
            ticketId: ticket.id,
            type: shared_1.ActivityType.TICKET_CREATED,
            actorId: actor.id,
            targetDepartmentId: firstStep.departmentId,
            newStatus: shared_1.TicketStatus.OPEN,
        });
        return ticket;
    });
}
async function ticketHasDepartmentActivity(ticketId, departmentId) {
    const count = await prisma_1.prisma.ticketActivity.count({
        where: {
            ticketId,
            actor: { departmentId },
        },
    });
    return count > 0;
}
async function canViewTicket(actor, ticket) {
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
async function getTicketForActor(actor, id) {
    const ticket = await getTicketById(id);
    if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
    }
    if (!(await canViewTicket(actor, ticket))) {
        throw new Error("FORBIDDEN");
    }
    return ticket;
}
async function getTicketById(id) {
    return prisma_1.prisma.ticket.findUnique({
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
/** Personal tickets: created by or assigned to the user, excluding unassigned. */
async function listMyTickets(actor) {
    return prisma_1.prisma.ticket.findMany({
        where: {
            assigneeId: { not: null },
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
async function listEscalatedTickets(actor) {
    if (actor.role === "DEPARTMENT_MEMBER") {
        return prisma_1.prisma.ticket.findMany({
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
    return prisma_1.prisma.ticket.findMany({
        where: {
            createdById: actor.id,
            activities: {
                some: { type: shared_1.ActivityType.ESCALATED },
            },
        },
        orderBy: { updatedAt: "desc" },
        include: ticketInclude,
    });
}
function departmentTicketWhere(actor) {
    if (actor.role !== "DEPARTMENT_MEMBER") {
        throw new Error("FORBIDDEN");
    }
    return { currentDepartmentId: actor.departmentId };
}
/** Unassigned requests currently in the member's department queue. */
async function listDepartmentUnassigned(actor) {
    return prisma_1.prisma.ticket.findMany({
        where: { ...departmentTicketWhere(actor), assigneeId: null },
        orderBy: { createdAt: "asc" },
        include: ticketInclude,
    });
}
/** Assigned tickets currently in the member's department. */
async function listDepartmentAssigned(actor) {
    return prisma_1.prisma.ticket.findMany({
        where: { ...departmentTicketWhere(actor), assigneeId: { not: null } },
        orderBy: { updatedAt: "desc" },
        include: ticketInclude,
    });
}
/** Department view: unassigned queue + assigned in-progress tickets. */
async function getDepartmentQueue(actor) {
    const [unassigned, assigned] = await Promise.all([
        listDepartmentUnassigned(actor),
        listDepartmentAssigned(actor),
    ]);
    return { unassigned, assigned };
}
async function listTicketTypes() {
    return prisma_1.prisma.ticketType.findMany({
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
async function assignTicket(actor, ticketId, assigneeId) {
    const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
    }
    if (actor.role === "DEPARTMENT_MEMBER") {
        if (ticket.currentDepartmentId !== actor.departmentId) {
            throw new Error("FORBIDDEN");
        }
    }
    const assignee = await prisma_1.prisma.user.findUnique({
        where: { id: assigneeId },
    });
    if (!assignee ||
        assignee.departmentId !== ticket.currentDepartmentId ||
        assignee.role !== "DEPARTMENT_MEMBER") {
        throw new Error("INVALID_ASSIGNEE");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: {
                assigneeId,
                status: ticket.status === shared_1.TicketStatus.OPEN
                    ? shared_1.TicketStatus.IN_PROGRESS
                    : ticket.status,
            },
            include: ticketInclude,
        });
        await recordActivity(tx, {
            ticketId,
            type: ticket.assigneeId ? shared_1.ActivityType.REASSIGNED : shared_1.ActivityType.ASSIGNED,
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
async function updateTicketStatus(actor, ticketId, status) {
    const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
    }
    if (actor.role !== "DEPARTMENT_MEMBER" ||
        ticket.currentDepartmentId !== actor.departmentId) {
        throw new Error("FORBIDDEN");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status },
            include: ticketInclude,
        });
        await recordActivity(tx, {
            ticketId,
            type: shared_1.ActivityType.STATUS_CHANGED,
            actorId: actor.id,
            previousStatus: ticket.status,
            newStatus: status,
        });
        return updated;
    });
}
async function escalateTicket(actor, ticketId, message) {
    const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
    }
    if (actor.role !== "DEPARTMENT_MEMBER" ||
        ticket.currentDepartmentId !== actor.departmentId) {
        throw new Error("FORBIDDEN");
    }
    if (ticket.status === shared_1.TicketStatus.RESOLVED ||
        ticket.status === shared_1.TicketStatus.CLOSED) {
        throw new Error("ESCALATION_NOT_ALLOWED");
    }
    const nextStep = await (0, pipeline_1.getNextStep)(ticket.ticketTypeId, ticket.pipelineStepIndex);
    if (!nextStep) {
        throw new Error("NO_NEXT_STEP");
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: {
                currentDepartmentId: nextStep.departmentId,
                pipelineStepIndex: nextStep.stepOrder,
                assigneeId: null,
                status: shared_1.TicketStatus.ESCALATED,
            },
            include: ticketInclude,
        });
        await recordActivity(tx, {
            ticketId,
            type: shared_1.ActivityType.ESCALATED,
            actorId: actor.id,
            targetDepartmentId: nextStep.departmentId,
            sourceDepartmentId: ticket.currentDepartmentId,
            message: message?.trim() || undefined,
            previousStatus: ticket.status,
            newStatus: shared_1.TicketStatus.ESCALATED,
        });
        return updated;
    });
}
async function addTicketRemark(actor, ticketId, message) {
    const text = message.trim();
    if (!text) {
        throw new Error("INVALID_INPUT");
    }
    const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
    }
    if (actor.role !== "DEPARTMENT_MEMBER" ||
        ticket.currentDepartmentId !== actor.departmentId) {
        throw new Error("FORBIDDEN");
    }
    await recordActivity(prisma_1.prisma, {
        ticketId,
        type: shared_1.ActivityType.REMARK_ADDED,
        actorId: actor.id,
        message: text,
    });
    return getTicketById(ticketId);
}
