"use client";

import { useEffect, useState } from "react";
import {
  Role,
  TicketStatus,
  type DepartmentMember,
  type TicketDetail,
} from "@it-ticketing/shared";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  UserPlusIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch, ApiError } from "@/lib/api";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";
import { Separator } from "../ui/separator";

const allStatuses = Object.values(TicketStatus).filter(
  (status) => status !== TicketStatus.ESCALATED,
);

type TicketActionsPanelProps = {
  ticket: TicketDetail;
  onTicketUpdated: (ticket: TicketDetail) => void;
};

function StatusBadge({ status }: { status: TicketDetail["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-2 py-[2px] lg:py-0.5 text-sm font-medium",
        ticketStatusStyles[status].className,
      )}
    >
      <span className={cn("size-2 rounded-full", ticketStatusDot[status])} />
      {ticketStatusStyles[status].label}
    </span>
  );
}

export function TicketActionsPanel({
  ticket,
  onTicketUpdated,
}: TicketActionsPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const canManage =
    user?.role === Role.DEPARTMENT_MEMBER &&
    ticket.currentDepartmentId === user.departmentId;

  const canChangeStatus =
    canManage &&
    Boolean(ticket.assigneeId) &&
    !["CLOSED"].includes(ticket.status as TicketStatus);

  const canAssign = canManage && ticket.status !== TicketStatus.CLOSED;

  const actionsUnavailableMessage =
    user?.role === Role.END_USER
      ? "Only support agents can update status and assignments."
      : user?.role === Role.DEPARTMENT_MEMBER &&
          ticket.currentDepartmentId !== user.departmentId
        ? `This ticket is in ${ticket.currentDepartment.name}, not your department. Actions are only available for tickets in your queue.`
        : null;

  useEffect(() => {
    if (!canAssign) return;

    setLoadingMembers(true);
    authFetch<{ members: DepartmentMember[] }>("/departments/members")
      .then((data) =>
        setMembers(
          data.members.filter((m) => m.role === Role.DEPARTMENT_MEMBER),
        ),
      )
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [canAssign]);

  async function refreshTicket() {
    const data = await authFetch<{ ticket: TicketDetail }>(
      `/tickets/${ticket.id}`,
    );
    onTicketUpdated(data.ticket);
  }

  function onStatusSelect(status: TicketDetail["status"]) {
    if (!canChangeStatus || status === ticket.status) return;

    if (status === TicketStatus.CLOSED) {
      setCloseConfirmOpen(true);
      return;
    }

    void handleStatusChange(status);
  }

  async function handleStatusChange(status: TicketDetail["status"]) {
    if (!canChangeStatus || status === ticket.status) return;

    setUpdating(true);
    setActionError(null);
    try {
      await authFetch(`/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshTicket();
      setCloseConfirmOpen(false);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update status.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssign(assigneeId: string) {
    if (!canAssign || assigneeId === ticket.assigneeId) return;

    setUpdating(true);
    setActionError(null);
    try {
      await authFetch(`/tickets/${ticket.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ assigneeId }),
      });
      await refreshTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not assign ticket.",
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <aside className="h-fit rounded-xl lg:border border-border lg:bg-card/60 lg:p-3 lg:sticky lg:top-4">
      <Collapsible defaultOpen>
        <div className="lg:flex w-full items-center hidden justify-between rounded-md px-2 py-1.5 text-sm font-medium">
          Actions
        </div>

        <CollapsibleContent className="lg:mt-2 flex-row flex lg:flex-col lg:gap-1">
          {/* Status */}
          <div className=" flex flex-row lg:flex-col gap-0">
            <div className="group hidden lg:flex items-center gap-2 rounded-md lg:px-2 lg:py-1.5">
              <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                Status
              </span>
            </div>

            <div className=" flex px-1">
              {canChangeStatus ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={updating}
                    render={
                      <button
                        type="button"
                        className="group/status flex items-center gap-1 rounded-md lg:px-1 lg:py-0.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      />
                    }
                  >
                    <StatusBadge status={ticket.status} />
                    <ChevronRightIcon className="size-3.5 text-muted-foreground opacity-0 hidden lg:flex transition-opacity group-hover/status:opacity-100 group-data-popup-open/status:opacity-100" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      {allStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onStatusSelect(status)}
                          className={cn(
                            ticket.status === status &&
                              "bg-muted/60 font-medium",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              ticketStatusDot[status],
                            )}
                          />
                          {ticketStatusStyles[status].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>
          </div>

          {/* Assigned user */}
          <div className=" flex flex-col gap-0">
            <div className="group hidden lg:flex items-center gap-2 rounded-md lg:px-2 lg:py-1.5">
              <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                Assigned user
              </span>
            </div>
            <div className=" flex px-1">
              {canAssign ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={updating || loadingMembers}
                    render={
                      <button
                        type="button"
                        className="group/assign flex max-w-[9rem] items-center gap-1 rounded-md  lg:px-1 lg:py-0.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      />
                    }
                  >
                    {ticket.assignee ? (
                      <>
                        <Avatar size="sm" className="size-5">
                          <AvatarFallback className="text-[9px] font-semibold">
                            {getUserInitials(ticket.assignee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium hidden lg:block">
                          {ticket.assignee.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">Assign user</span>
                      </>
                    )}
                    <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/assign:opacity-100 group-data-popup-open/assign:opacity-100" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuGroup>
                      {members.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No team members found
                        </DropdownMenuItem>
                      ) : (
                        members.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onClick={() => handleAssign(member.id)}
                            className={cn(
                              ticket.assigneeId === member.id &&
                                "bg-muted/60 font-medium",
                            )}
                          >
                            <Avatar size="sm" className="size-5">
                              <AvatarFallback className="text-[9px] font-semibold">
                                {getUserInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{member.name}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : ticket.assignee ? (
                <span className="truncate text-sm font-medium flex items-center gap-2">
                  <Avatar size="sm" className="size-5">
                    <AvatarFallback className="text-[9px] font-semibold">
                      {getUserInitials(ticket.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  {ticket.assignee.name}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground px-2">
                  Unassigned
                </span>
              )}
            </div>
            {!canManage && actionsUnavailableMessage ? (
              <>
                <Separator className={"my-2 mt-3"} />
                <p className="px-2 pt-1 text-xs leading-relaxed text-brand-orange">
                  {actionsUnavailableMessage}
                </p>
              </>
            ) : null}
          </div>

          {actionError ? (
            <p className="px-2 pt-1 text-xs text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close this ticket?</DialogTitle>
            <DialogDescription>
              Closing marks the ticket as finished. The requester will no longer
              receive updates, and assignment and status changes will be locked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCloseConfirmOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleStatusChange(TicketStatus.CLOSED)}
              disabled={updating}
            >
              {updating ? "Closing…" : "Close ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
