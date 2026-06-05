import type { PipelineStep } from "@it-ticketing/shared";
import { prisma } from "./prisma";

export type { PipelineStep };

const stepInclude = {
  department: {
    select: { id: true, name: true, slug: true },
  },
} as const;

function toPipelineStep(step: {
  stepOrder: number;
  departmentId: string;
  department: PipelineStep["department"];
}): PipelineStep {
  return {
    stepOrder: step.stepOrder,
    departmentId: step.departmentId,
    department: step.department,
  };
}

function isContiguousFromZero(steps: { stepOrder: number }[]) {
  return steps.every((step, index) => step.stepOrder === index);
}

/** Ordered pipeline departments for a ticket type (step 0 = first queue on create). */
export async function getPipelineSteps(
  ticketTypeId: string,
): Promise<PipelineStep[]> {
  const steps = await prisma.ticketTypePipelineStep.findMany({
    where: { ticketTypeId },
    orderBy: { stepOrder: "asc" },
    include: stepInclude,
  });

  if (!isContiguousFromZero(steps)) {
    throw new Error("INVALID_PIPELINE");
  }

  return steps.map(toPipelineStep);
}

export async function getPipelineStepAt(
  ticketTypeId: string,
  stepIndex: number,
): Promise<PipelineStep | null> {
  const step = await prisma.ticketTypePipelineStep.findUnique({
    where: {
      ticketTypeId_stepOrder: { ticketTypeId, stepOrder: stepIndex },
    },
    include: stepInclude,
  });

  return step ? toPipelineStep(step) : null;
}

/** Next department in the pipeline, or null if already at the last step. */
export async function getNextStep(
  ticketTypeId: string,
  currentIndex: number,
): Promise<PipelineStep | null> {
  const steps = await getPipelineSteps(ticketTypeId);
  return steps.find((step) => step.stepOrder > currentIndex) ?? null;
}
