"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Role,
  type DepartmentMember,
  type TicketSummary,
} from "@it-ticketing/shared";
import { ArrowUpRightIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authFetch, ApiError } from "@/lib/api";
import { ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";

type DepartmentQueueTableProps = {
  tickets: TicketSummary[];
  onTicketAssigned: (ticketId: string) => void;
  emptyMessage?: string;
};

export function DepartmentQueueTable({
  tickets,
  onTicketAssigned,
  emptyMessage = "No tickets in the queue.",
}: DepartmentQueueTableProps) {
  const [assignTicket, setAssignTicket] = useState<TicketSummary | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignTicket) return;

    setLoadingMembers(true);
    setAssignError(null);

    authFetch<{ members: DepartmentMember[] }>("/departments/members")
      .then((data) =>
        setMembers(
          data.members.filter((member) => member.role === Role.DEPARTMENT_MEMBER),
        ),
      )
      .catch(() => {
        setMembers([]);
        setAssignError("Could not load department members.");
      })
      .finally(() => setLoadingMembers(false));
  }, [assignTicket]);

  async function handleAssign(member: DepartmentMember) {
    if (!assignTicket) return;

    setAssigningId(member.id);
    setAssignError(null);

    try {
      await authFetch(`/tickets/${assignTicket.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ assigneeId: member.id }),
      });
      onTicketAssigned(assignTicket.id);
      setAssignTicket(null);
    } catch (err) {
      setAssignError(
        err instanceof ApiError ? err.message : "Could not assign ticket.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-secondary/50 p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="max-w-xs font-medium">
                  {ticket.title}
                </TableCell>
                <TableCell>{ticket.ticketType.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={ticketStatusStyles[ticket.status].className}
                  >
                    {ticketStatusStyles[ticket.status].label}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.createdBy.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2"
                      onClick={() => setAssignTicket(ticket)}
                    >
                      <UserPlusIcon className="size-3.5" />
                      Assign
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/tickets/${ticket.id}`} />}
                    >
                      <ArrowUpRightIcon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(assignTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignTicket(null);
            setAssignError(null);
            setAssigningId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign ticket</DialogTitle>
            <DialogDescription>
              {assignTicket ? (
                <>
                  Select a team member to assign{" "}
                  <span className="font-medium text-foreground">
                    {assignTicket.title}
                  </span>
                  . The ticket will move to{" "}
                  <span className="font-medium text-foreground">
                    In progress
                  </span>{" "}
                  on the assigned board.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {assignError ? (
            <p className="text-sm text-destructive" role="alert">
              {assignError}
            </p>
          ) : null}

          <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-primary">
            {loadingMembers ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Loading members…
              </div>
            ) : members.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No department members available.
              </p>
            ) : (
              members.map((member) => {
                const isAssigning = assigningId === member.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={Boolean(assigningId)}
                    onClick={() => void handleAssign(member)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      isAssigning && "bg-muted/60",
                      assigningId && !isAssigning && "opacity-50",
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getUserInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                    {isAssigning ? (
                      <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
