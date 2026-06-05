import type { Response } from "express";

const statusByCode: Record<string, number> = {
  INVALID_INPUT: 400,
  TICKET_TYPE_NOT_FOUND: 404,
  TICKET_NOT_FOUND: 404,
  DEPARTMENT_NOT_FOUND: 404,
  NO_PIPELINE: 400,
  INVALID_PIPELINE: 400,
  NO_NEXT_STEP: 400,
  ESCALATION_NOT_ALLOWED: 400,
  INVALID_ASSIGNEE: 400,
  FORBIDDEN: 403,
  EMAIL_IN_USE: 409,
};

export function sendServiceError(res: Response, err: unknown, fallback = 500) {
  if (err instanceof Error && err.message in statusByCode) {
    const status = statusByCode[err.message];
    const messages: Record<string, string> = {
      INVALID_INPUT: "Invalid input",
      TICKET_TYPE_NOT_FOUND: "Ticket type not found",
      TICKET_NOT_FOUND: "Ticket not found",
      NO_PIPELINE: "Ticket type has no pipeline configured",
      INVALID_PIPELINE: "Ticket type pipeline must have contiguous steps starting at 0",
      NO_NEXT_STEP: "Ticket is already at the final pipeline step",
      ESCALATION_NOT_ALLOWED: "Resolved or closed tickets cannot be escalated",
      INVALID_ASSIGNEE: "Assignee must be a member of the ticket's current department",
      FORBIDDEN: "You do not have permission to perform this action",
    };
    res.status(status).json({
      error: messages[err.message] ?? err.message,
    });
    return;
  }
  res.status(fallback).json({ error: "Internal server error" });
}
