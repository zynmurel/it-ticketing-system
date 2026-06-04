"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPipelineSteps = getPipelineSteps;
exports.getPipelineStepAt = getPipelineStepAt;
exports.getNextStep = getNextStep;
const prisma_1 = require("./prisma");
const stepInclude = {
    department: {
        select: { id: true, name: true, slug: true },
    },
};
function toPipelineStep(step) {
    return {
        stepOrder: step.stepOrder,
        departmentId: step.departmentId,
        department: step.department,
    };
}
/** Ordered pipeline departments for a ticket type (step 0 = first queue on create). */
async function getPipelineSteps(ticketTypeId) {
    const steps = await prisma_1.prisma.ticketTypePipelineStep.findMany({
        where: { ticketTypeId },
        orderBy: { stepOrder: "asc" },
        include: stepInclude,
    });
    return steps.map(toPipelineStep);
}
async function getPipelineStepAt(ticketTypeId, stepIndex) {
    const step = await prisma_1.prisma.ticketTypePipelineStep.findUnique({
        where: {
            ticketTypeId_stepOrder: { ticketTypeId, stepOrder: stepIndex },
        },
        include: stepInclude,
    });
    return step ? toPipelineStep(step) : null;
}
/** Next department in the pipeline, or null if already at the last step. */
async function getNextStep(ticketTypeId, currentIndex) {
    return getPipelineStepAt(ticketTypeId, currentIndex + 1);
}
