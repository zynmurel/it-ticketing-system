"use client";

import type { DepartmentRef } from "@it-ticketing/shared";
import { ESCALATE_ONLY_IN_PROGRESS_MESSAGE } from "@/lib/department-board-shared";
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

type EscalateTicketDialogsProps = {
  escalateFlow: { nextDepartment: DepartmentRef } | null;
  onEscalateFlowChange: (open: boolean) => void;
  escalateMessage: string;
  onEscalateMessageChange: (value: string) => void;
  noNextDepartmentOpen: boolean;
  onNoNextDepartmentOpenChange: (open: boolean) => void;
  escalateBlockedOpen: boolean;
  onEscalateBlockedOpenChange: (open: boolean) => void;
  dialogUpdating: boolean;
  onEscalateConfirm: () => void;
  fromBoard?: boolean;
};

export function EscalateTicketDialogs({
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
  fromBoard = false,
}: EscalateTicketDialogsProps) {
  return (
    <>
      <Dialog
        open={Boolean(escalateFlow)}
        onOpenChange={(open) => !open && onEscalateFlowChange(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escalate this ticket?</DialogTitle>
            <DialogDescription>
              This ticket will be escalated to{" "}
              <span className="font-medium text-foreground">
                {escalateFlow?.nextDepartment.name}
              </span>
              , leave your department, and return unassigned in that
              department&apos;s queue.
              {fromBoard
                ? " It will remain listed here under Escalated so you can still track it."
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="escalate-note">Remark (optional)</Label>
            <Textarea
              id="escalate-note"
              value={escalateMessage}
              onChange={(e) => onEscalateMessageChange(e.target.value)}
              placeholder="Reason for escalation…"
              rows={3}
              disabled={dialogUpdating}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onEscalateFlowChange(false)}
              disabled={dialogUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onEscalateConfirm}
              disabled={dialogUpdating}
            >
              {dialogUpdating ? "Escalating…" : "Escalate ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noNextDepartmentOpen}
        onOpenChange={onNoNextDepartmentOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No department to move forward</DialogTitle>
            <DialogDescription>
              This ticket is already at the final step in its pipeline. There is
              no next department to escalate it to.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => onNoNextDepartmentOpenChange(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={escalateBlockedOpen}
        onOpenChange={onEscalateBlockedOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot escalate this ticket</DialogTitle>
            <DialogDescription>
              {ESCALATE_ONLY_IN_PROGRESS_MESSAGE}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => onEscalateBlockedOpenChange(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
