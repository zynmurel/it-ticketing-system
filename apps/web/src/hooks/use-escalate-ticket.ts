"use client";

import { useCallback, useState } from "react";
import { type DepartmentRef, type EscalationPreview, type TicketStatus } from "@it-ticketing/shared";
import { authFetch, ApiError } from "@/lib/api";
import { canEscalateTicketStatus } from "@/lib/department-board-shared";

export function useEscalateTicket(
  ticketId: string,
  ticketStatus: TicketStatus,
  onEscalated: () => void | Promise<void>,
) {
  const [escalateFlow, setEscalateFlow] = useState<{
    nextDepartment: DepartmentRef;
  } | null>(null);
  const [noNextDepartmentOpen, setNoNextDepartmentOpen] = useState(false);
  const [escalateBlockedOpen, setEscalateBlockedOpen] = useState(false);
  const [escalatePreviewLoading, setEscalatePreviewLoading] = useState(false);
  const [dialogUpdating, setDialogUpdating] = useState(false);
  const [escalateMessage, setEscalateMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const startEscalate = useCallback(async () => {
    if (!canEscalateTicketStatus(ticketStatus)) {
      setEscalateBlockedOpen(true);
      return;
    }

    setEscalatePreviewLoading(true);
    setActionError(null);

    try {
      const preview = await authFetch<EscalationPreview>(
        `/tickets/${ticketId}/escalation-preview`,
      );

      if (!preview.canEscalate || !preview.nextDepartment) {
        setNoNextDepartmentOpen(true);
        return;
      }

      setEscalateMessage("");
      setEscalateFlow({ nextDepartment: preview.nextDepartment });
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not check escalation options.",
      );
    } finally {
      setEscalatePreviewLoading(false);
    }
  }, [ticketId, ticketStatus]);

  const handleEscalateConfirm = useCallback(async () => {
    if (!escalateFlow) return;

    const message = escalateMessage.trim();
    setDialogUpdating(true);
    setEscalateFlow(null);
    setActionError(null);

    try {
      await authFetch(`/tickets/${ticketId}/escalate`, {
        method: "POST",
        body: JSON.stringify({ message: message || undefined }),
      });
      setEscalateMessage("");
      await onEscalated();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not escalate ticket.",
      );
    } finally {
      setDialogUpdating(false);
    }
  }, [escalateFlow, escalateMessage, onEscalated, ticketId]);

  return {
    escalateFlow,
    setEscalateFlow,
    noNextDepartmentOpen,
    setNoNextDepartmentOpen,
    escalateBlockedOpen,
    setEscalateBlockedOpen,
    escalatePreviewLoading,
    dialogUpdating,
    escalateMessage,
    setEscalateMessage,
    actionError,
    setActionError,
    startEscalate,
    handleEscalateConfirm,
  };
}
