"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Role,
  TicketStatus,
  type DepartmentMember,
  type TicketDetail,
} from "@it-ticketing/shared";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  Loader2Icon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch, ApiError } from "@/lib/api";
import { useEscalateTicket } from "@/hooks/use-escalate-ticket";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";
import { Separator } from "../ui/separator";
import { EscalateTicketDialogs } from "./escalate-ticket-dialogs";
import { StatusChangeDialog } from "./status-change-dialog";

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
  const [statusChangeTarget, setStatusChangeTarget] =
    useState<TicketStatus | null>(null);
  const [statusRemark, setStatusRemark] = useState("");

  const canManage =
    user?.role === Role.DEPARTMENT_MEMBER &&
    ticket.currentDepartmentId === user.departmentId && !["CLOSED"].includes(ticket.status);

  const canChangeStatus =
    canManage && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.ESCALATED && ticket.status !== TicketStatus.OPEN;

  const canAssign = canManage && ticket.status !== TicketStatus.CLOSED;

  const canEscalate = canManage;

  const actionsUnavailableMessage =
    user?.role === Role.END_USER
      ? "Only support agents can update status and assignments."
      : user?.role === Role.DEPARTMENT_MEMBER &&
          ticket.currentDepartmentId !== user.departmentId
        ? `This ticket is in ${ticket.currentDepartment.name}, not your department. Actions are only available for tickets in your queue.`
        : null;

  const refreshTicket = useCallback(async () => {
    const data = await authFetch<{ ticket: TicketDetail }>(
      `/tickets/${ticket.id}`,
    );
    onTicketUpdated(data.ticket);
  }, [ticket.id, onTicketUpdated]);

  const escalation = useEscalateTicket(
    ticket.id,
    ticket.status,
    refreshTicket,
  );

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

  function onStatusSelect(status: TicketDetail["status"]) {
    if (!canChangeStatus || status === ticket.status) return;

    setStatusRemark("");
    setStatusChangeTarget(status);
  }

  async function handleStatusChangeConfirm() {
    if (!canChangeStatus || !statusChangeTarget) return;

    const status = statusChangeTarget;
    const message = statusRemark.trim();

    setUpdating(true);
    setActionError(null);
    try {
      await authFetch(`/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          message: message || undefined,
        }),
      });
      await refreshTicket();
      setStatusChangeTarget(null);
      setStatusRemark("");
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

          {canEscalate ? (
            <div className="flex flex-col gap-0">
              <div className="group hidden lg:flex items-center gap-2 rounded-md lg:px-2 lg:py-1.5">
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                  Escalate
                </span>
              </div>
              <div className="flex px-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  disabled={
                    updating ||
                    escalation.dialogUpdating ||
                    escalation.escalatePreviewLoading
                  }
                  onClick={() => void escalation.startEscalate()}
                >
                  {escalation.escalatePreviewLoading ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRightIcon className="size-3.5" />
                  )}
                  Escalate ticket
                </Button>
              </div>
            </div>
          ) : null}

          {actionError || escalation.actionError ? (
            <p className="px-2 pt-1 text-xs text-destructive" role="alert">
              {actionError ?? escalation.actionError}
            </p>
          ) : null}
        </CollapsibleContent>
      </Collapsible>

      <StatusChangeDialog
        open={Boolean(statusChangeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setStatusChangeTarget(null);
            setStatusRemark("");
          }
        }}
        status={statusChangeTarget}
        ticketTitle={ticket.title}
        remark={statusRemark}
        onRemarkChange={setStatusRemark}
        updating={updating}
        onConfirm={() => void handleStatusChangeConfirm()}
      />

      <EscalateTicketDialogs
        escalateFlow={escalation.escalateFlow}
        onEscalateFlowChange={(open) => {
          if (!open) escalation.setEscalateFlow(null);
        }}
        escalateMessage={escalation.escalateMessage}
        onEscalateMessageChange={escalation.setEscalateMessage}
        noNextDepartmentOpen={escalation.noNextDepartmentOpen}
        onNoNextDepartmentOpenChange={escalation.setNoNextDepartmentOpen}
        escalateBlockedOpen={escalation.escalateBlockedOpen}
        onEscalateBlockedOpenChange={escalation.setEscalateBlockedOpen}
        dialogUpdating={escalation.dialogUpdating}
        onEscalateConfirm={() => void escalation.handleEscalateConfirm()}
      />
    </aside>
  );
}
