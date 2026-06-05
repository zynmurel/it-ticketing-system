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
function isContiguousFromZero(steps) {
    return steps.every((step, index) => step.stepOrder === index);
}
/** Ordered pipeline departments for a ticket type (step 0 = first queue on create). */
async function getPipelineSteps(ticketTypeId) {
    const steps = await prisma_1.prisma.ticketTypePipelineStep.findMany({
        where: { ticketTypeId },
        orderBy: { stepOrder: "asc" },
        include: stepInclude,
    });
    if (!isContiguousFromZero(steps)) {
        throw new Error("INVALID_PIPELINE");
    }
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
    const steps = await getPipelineSteps(ticketTypeId);
    return steps.find((step) => step.stepOrder > currentIndex) ?? null;
}
