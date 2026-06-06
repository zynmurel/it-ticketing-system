"use client";

import { TicketStatus } from "@it-ticketing/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ticketStatusStyles } from "@/lib/ticket-status-theme";

type StatusChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: TicketStatus | null;
  ticketTitle?: string;
  remark: string;
  onRemarkChange: (value: string) => void;
  updating: boolean;
  onConfirm: () => void;
};

function getDialogCopy(status: TicketStatus | null, ticketTitle?: string) {
  if (!status) {
    return {
      title: "Update status",
      description: "Add an optional remark. It will appear in the activity log.",
      confirmLabel: "Update status",
      destructive: false,
    };
  }

  const label = ticketStatusStyles[status].label;

  if (status === TicketStatus.CLOSED) {
    return {
      title: "Close this ticket?",
      description:
        "Closing marks the ticket as finished. The requester will no longer receive updates, and assignment and status changes will be locked.",
      confirmLabel: "Close ticket",
      destructive: true,
    };
  }

  return {
    title: `Move to ${label}?`,
    description: ticketTitle
      ? `Update "${ticketTitle}" to ${label}. Add an optional remark — it will be logged in the activity history.`
      : `Update this ticket to ${label}. Add an optional remark — it will be logged in the activity history.`,
    confirmLabel: `Set ${label}`,
    destructive: false,
  };
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  status,
  ticketTitle,
  remark,
  onRemarkChange,
  updating,
  onConfirm,
}: StatusChangeDialogProps) {
  const copy = getDialogCopy(status, ticketTitle);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="status-change-remark">Remark (optional)</Label>
          <Textarea
            id="status-change-remark"
            value={remark}
            onChange={(event) => onRemarkChange(event.target.value)}
            placeholder="Why are you changing the status?"
            rows={3}
            disabled={updating}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={updating}
          >
            {updating ? "Saving…" : copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
