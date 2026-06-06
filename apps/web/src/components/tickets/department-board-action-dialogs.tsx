"use client";

import type { TicketSummary } from "@it-ticketing/shared";
import { TicketStatus } from "@it-ticketing/shared";
import { StatusChangeDialog } from "./status-change-dialog";
import { EscalateTicketDialogs } from "./escalate-ticket-dialogs";

type DepartmentBoardActionDialogsProps = {
  statusChangePending: {
    ticket: TicketSummary;
    status: TicketStatus;
  } | null;
  onStatusChangePendingChange: (open: boolean) => void;
  statusRemark: string;
  onStatusRemarkChange: (value: string) => void;
  onStatusChangeConfirm: () => void;
  escalateFlow: {
    ticket: TicketSummary;
    nextDepartment: { id: string; name: string; slug: string };
  } | null;
  onEscalateFlowChange: (open: boolean) => void;
  escalateMessage: string;
  onEscalateMessageChange: (value: string) => void;
  noNextDepartmentOpen: boolean;
  onNoNextDepartmentOpenChange: (open: boolean) => void;
  escalateBlockedOpen: boolean;
  onEscalateBlockedOpenChange: (open: boolean) => void;
  dialogUpdating: boolean;
  onEscalateConfirm: () => void;
};

export function DepartmentBoardActionDialogs({
  statusChangePending,
  onStatusChangePendingChange,
  statusRemark,
  onStatusRemarkChange,
  onStatusChangeConfirm,
  escalateFlow,
  onEscalateFlowChange,
  escalateMessage,
  onEscalateMessageChange,
  noNextDepartmentOpen,
  onNoNextDepartmentOpenChange,
  escalateBlockedOpen,
  onEscalateBlockedOpenChange,
  dialogUpdating,
  onEscalateConfirm,
}: DepartmentBoardActionDialogsProps) {
  return (
    <>
      <StatusChangeDialog
        open={Boolean(statusChangePending)}
        onOpenChange={(open) => {
          if (!open) {
            onStatusChangePendingChange(false);
            onStatusRemarkChange("");
          }
        }}
        status={statusChangePending?.status ?? null}
        ticketTitle={statusChangePending?.ticket.title}
        remark={statusRemark}
        onRemarkChange={onStatusRemarkChange}
        updating={dialogUpdating}
        onConfirm={onStatusChangeConfirm}
      />

      <EscalateTicketDialogs
        escalateFlow={
          escalateFlow
            ? { nextDepartment: escalateFlow.nextDepartment }
            : null
        }
        onEscalateFlowChange={(open) => {
          if (!open) onEscalateFlowChange(false);
        }}
        escalateMessage={escalateMessage}
        onEscalateMessageChange={onEscalateMessageChange}
        noNextDepartmentOpen={noNextDepartmentOpen}
        onNoNextDepartmentOpenChange={onNoNextDepartmentOpenChange}
        escalateBlockedOpen={escalateBlockedOpen}
        onEscalateBlockedOpenChange={onEscalateBlockedOpenChange}
        dialogUpdating={dialogUpdating}
        onEscalateConfirm={onEscalateConfirm}
        fromBoard
      />
    </>
  );
}
