"use client";

import { useCallback, useState } from "react";
import {
  TicketStatus,
  type DepartmentBoard,
  type DepartmentRef,
  type EscalationPreview,
  type TicketSummary,
} from "@it-ticketing/shared";
import { authFetch, ApiError } from "@/lib/api";
import {
  applyEscalateToBoard,
  applyStatusToBoard,
  canEscalateFromColumn,
  getTicketColumn,
  statusForColumn,
  type BoardColumnId,
} from "@/lib/department-board-shared";

export function useDepartmentBoardMutations(
  board: DepartmentBoard,
  onBoardChange: (board: DepartmentBoard) => void,
  departmentId: string,
) {
  const [pendingTicketIds, setPendingTicketIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dialogUpdating, setDialogUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusChangePending, setStatusChangePending] = useState<{
    ticket: TicketSummary;
    status: TicketStatus;
  } | null>(null);
  const [statusRemark, setStatusRemark] = useState("");
  const [escalateFlow, setEscalateFlow] = useState<{
    ticket: TicketSummary;
    nextDepartment: DepartmentRef;
  } | null>(null);
  const [noNextDepartmentOpen, setNoNextDepartmentOpen] = useState(false);
  const [escalateBlockedOpen, setEscalateBlockedOpen] = useState(false);
  const [escalatePreviewLoading, setEscalatePreviewLoading] = useState(false);
  const [escalateMessage, setEscalateMessage] = useState("");

  const syncBoard = useCallback(
    (nextBoard: DepartmentBoard) => {
      onBoardChange(nextBoard);
    },
    [onBoardChange],
  );

  const refreshBoard = useCallback(async () => {
    const data = await authFetch<DepartmentBoard>("/tickets/department/board");
    syncBoard(data);
    return data;
  }, [syncBoard]);

  const runBoardMutation = useCallback(
    async (
      ticketId: string,
      applyOptimistic: (current: DepartmentBoard) => DepartmentBoard,
      request: () => Promise<unknown>,
    ) => {
      let previousBoard: DepartmentBoard | null = null;

      const optimisticBoard = applyOptimistic(board);
      previousBoard = board;
      syncBoard(optimisticBoard);

      setPendingTicketIds((current) => new Set(current).add(ticketId));
      setActionError(null);

      try {
        await request();
        await refreshBoard();
      } catch (err) {
        if (previousBoard) {
          syncBoard(previousBoard);
        }
        setActionError(
          err instanceof ApiError ? err.message : "Could not update ticket.",
        );
      } finally {
        setPendingTicketIds((current) => {
          const next = new Set(current);
          next.delete(ticketId);
          return next;
        });
      }
    },
    [board, refreshBoard, syncBoard],
  );

  const openEscalateFlow = useCallback(async (ticket: TicketSummary) => {
    setEscalatePreviewLoading(true);
    setActionError(null);

    try {
      const preview = await authFetch<EscalationPreview>(
        `/tickets/${ticket.id}/escalation-preview`,
      );

      if (!preview.canEscalate || !preview.nextDepartment) {
        setNoNextDepartmentOpen(true);
        return;
      }

      setEscalateFlow({
        ticket,
        nextDepartment: preview.nextDepartment,
      });
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not check escalation options.",
      );
    } finally {
      setEscalatePreviewLoading(false);
    }
  }, []);

  const moveToColumn = useCallback(
    (ticket: TicketSummary, targetColumn: BoardColumnId) => {
      if (pendingTicketIds.has(ticket.id)) return;

      const sourceColumn = getTicketColumn(ticket, departmentId);
      if (sourceColumn === targetColumn) return;
      if (sourceColumn === "ESCALATED") return;
      if (ticket.status === TicketStatus.CLOSED) return;

      if (targetColumn === "ESCALATED") {
        if (!canEscalateFromColumn(sourceColumn)) {
          setActionError(null);
          setEscalateBlockedOpen(true);
          return;
        }

        void openEscalateFlow(ticket);
        return;
      }

      const status = statusForColumn(targetColumn);
      if (!status) return;

      setStatusRemark("");
      setStatusChangePending({ ticket, status });
    },
    [departmentId, openEscalateFlow, pendingTicketIds],
  );

  const handleStatusChangeConfirm = useCallback(async () => {
    if (!statusChangePending) return;

    const { ticket, status } = statusChangePending;
    const message = statusRemark.trim();
    setDialogUpdating(true);
    setStatusChangePending(null);
    setStatusRemark("");

    await runBoardMutation(
      ticket.id,
      (current) => applyStatusToBoard(current, ticket.id, status),
      () =>
        authFetch(`/tickets/${ticket.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status,
            message: message || undefined,
          }),
        }),
    );

    setDialogUpdating(false);
  }, [runBoardMutation, statusChangePending, statusRemark]);

  const handleEscalateConfirm = useCallback(async () => {
    if (!escalateFlow) return;

    const ticketId = escalateFlow.ticket.id;
    const message = escalateMessage.trim();
    setDialogUpdating(true);
    setEscalateFlow(null);
    setEscalateMessage("");

    await runBoardMutation(
      ticketId,
      (current) => applyEscalateToBoard(current, ticketId),
      () =>
        authFetch(`/tickets/${ticketId}/escalate`, {
          method: "POST",
          body: JSON.stringify({ message: message || undefined }),
        }),
    );

    setEscalateMessage("");
    setDialogUpdating(false);
  }, [escalateFlow, escalateMessage, runBoardMutation]);

  return {
    pendingTicketIds,
    dialogUpdating,
    actionError,
    statusChangePending,
    setStatusChangePending,
    statusRemark,
    setStatusRemark,
    handleStatusChangeConfirm,
    escalateFlow,
    setEscalateFlow,
    noNextDepartmentOpen,
    setNoNextDepartmentOpen,
    escalateBlockedOpen,
    setEscalateBlockedOpen,
    escalatePreviewLoading,
    escalateMessage,
    setEscalateMessage,
    moveToColumn,
    openEscalateFlow,
    handleEscalateConfirm,
    runBoardMutation,
    refreshBoard,
    syncBoard,
  };
}
