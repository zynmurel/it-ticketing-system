import {
  TicketStatus,
  type DepartmentBoard,
  type TicketSummary,
} from "@it-ticketing/shared";

export type BoardColumnId = "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED";

export const BOARD_COLUMNS: {
  id: BoardColumnId;
  label: string;
}[] = [
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CLOSED", label: "Closed" },
  { id: "ESCALATED", label: "Escalated" },
];

export function columnForInDepartmentTicket(
  status: TicketStatus,
): BoardColumnId {
  if (status === TicketStatus.CLOSED) return "CLOSED";
  if (status === TicketStatus.RESOLVED) return "RESOLVED";
  return "IN_PROGRESS";
}

export function statusForColumn(column: BoardColumnId): TicketStatus | null {
  if (column === "IN_PROGRESS") return TicketStatus.IN_PROGRESS;
  if (column === "RESOLVED") return TicketStatus.RESOLVED;
  if (column === "CLOSED") return TicketStatus.CLOSED;
  return null;
}

export function buildColumnTickets(board: DepartmentBoard) {
  const columns: Record<BoardColumnId, TicketSummary[]> = {
    IN_PROGRESS: [],
    RESOLVED: [],
    CLOSED: [],
    ESCALATED: [...board.escalated],
  };

  for (const ticket of board.inDepartment) {
    columns[columnForInDepartmentTicket(ticket.status)].push(ticket);
  }

  return columns;
}

export function getTicketColumn(
  ticket: TicketSummary,
  departmentId: string,
): BoardColumnId {
  if (ticket.currentDepartmentId !== departmentId) return "ESCALATED";
  return columnForInDepartmentTicket(ticket.status);
}

export function applyStatusToBoard(
  board: DepartmentBoard,
  ticketId: string,
  status: TicketStatus,
): DepartmentBoard {
  return {
    ...board,
    inDepartment: board.inDepartment.map((ticket) =>
      ticket.id === ticketId
        ? { ...ticket, status, updatedAt: new Date().toISOString() }
        : ticket,
    ),
  };
}

export function applyEscalateToBoard(
  board: DepartmentBoard,
  ticketId: string,
): DepartmentBoard {
  const ticket = board.inDepartment.find((item) => item.id === ticketId);
  if (!ticket) return board;

  const escalatedTicket: TicketSummary = {
    ...ticket,
    status: TicketStatus.ESCALATED,
    assigneeId: null,
    assignee: null,
    updatedAt: new Date().toISOString(),
  };

  return {
    inDepartment: board.inDepartment.filter((item) => item.id !== ticketId),
    escalated: [escalatedTicket, ...board.escalated],
  };
}

export function resolveTargetColumn(
  overId: string | number,
  columns: Record<BoardColumnId, TicketSummary[]>,
): BoardColumnId | null {
  const overKey = String(overId);
  if (BOARD_COLUMNS.some((column) => column.id === overKey)) {
    return overKey as BoardColumnId;
  }

  for (const column of BOARD_COLUMNS) {
    if (columns[column.id].some((ticket) => ticket.id === overKey)) {
      return column.id;
    }
  }

  return null;
}

export const ESCALATE_ONLY_IN_PROGRESS_MESSAGE = (
  <div>
    Only <span className="font-bold">In progress</span> tickets can be escalated. Move the ticket to
    In progress first.
  </div>
);

export function canEscalateFromColumn(sourceColumn: BoardColumnId): boolean {
  return sourceColumn === "IN_PROGRESS";
}

export function getMoveTargets(sourceColumn: BoardColumnId): BoardColumnId[] {
  if (sourceColumn === "ESCALATED" || sourceColumn === "CLOSED") {
    return [];
  }

  return BOARD_COLUMNS.map((column) => column.id).filter((column) => {
    if (column === sourceColumn) return false;
    if (column === "ESCALATED") return canEscalateFromColumn(sourceColumn);
    return true;
  });
}
