"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react";
import type { DepartmentBoard, TicketSummary } from "@it-ticketing/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDepartmentBoardMutations } from "@/hooks/use-department-board-mutations";
import {
  BOARD_COLUMNS,
  buildColumnTickets,
  getMoveTargets,
  type BoardColumnId,
} from "@/lib/department-board-shared";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { DepartmentBoardActionDialogs } from "./department-board-action-dialogs";

type DepartmentAssignedTableProps = {
  departmentId: string;
  board: DepartmentBoard;
  onBoardChange: (board: DepartmentBoard) => void;
};

function MoveTicketMenu({
  ticket,
  sourceColumn,
  pending,
  onMove,
}: {
  ticket: TicketSummary;
  sourceColumn: BoardColumnId;
  pending: boolean;
  onMove: (ticket: TicketSummary, target: BoardColumnId) => void;
}) {
  const targets = getMoveTargets(sourceColumn);
  const targetLabels = Object.fromEntries(
    BOARD_COLUMNS.map((column) => [column.id, column.label]),
  ) as Record<BoardColumnId, string>;

  if (targets.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        render={
          <Button variant="outline" size="sm" className="h-7 gap-1 px-2">
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <>
                Move
                <ChevronDownIcon className="size-3.5 opacity-60" />
              </>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          {targets.map((target) => (
            <DropdownMenuItem
              key={target}
              onClick={() => onMove(ticket, target)}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  ticketStatusDot[target as keyof typeof ticketStatusDot],
                )}
              />
              {targetLabels[target]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DepartmentAssignedTable({
  departmentId,
  board,
  onBoardChange,
}: DepartmentAssignedTableProps) {
  const columns = useMemo(() => buildColumnTickets(board), [board]);

  const mutations = useDepartmentBoardMutations(
    board,
    onBoardChange,
    departmentId,
  );

  return (
    <div className="min-w-0 space-y-3">
      {mutations.actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {mutations.actionError}
        </p>
      ) : null}

      {mutations.escalatePreviewLoading ? (
        <p className="text-xs text-muted-foreground">Checking escalation…</p>
      ) : null}

      <Tabs defaultValue="IN_PROGRESS">
        <TabsList>
          {BOARD_COLUMNS.map((column) => (
            <TabsTrigger key={column.id} value={column.id}>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  ticketStatusDot[column.id as keyof typeof ticketStatusDot],
                )}
              />
              {column.label}
              <span className="text-muted-foreground">
                ({columns[column.id].length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {BOARD_COLUMNS.map((column) => {
          const tickets = columns[column.id];

          return (
            <TabsContent key={column.id} value={column.id} className="mt-3">
              {tickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                  No {column.label.toLowerCase()} tickets.
                </div>
              ) : (
                <div className="rounded-xl bg-secondary/50 p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        {column.id === "ESCALATED" ? (
                          <TableHead>Department</TableHead>
                        ) : null}
                        <TableHead>Assignee</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[140px] text-right">
                          Actions
                        </TableHead>
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
                              className={
                                ticketStatusStyles[ticket.status].className
                              }
                            >
                              {ticketStatusStyles[ticket.status].label}
                            </Badge>
                          </TableCell>
                          {column.id === "ESCALATED" ? (
                            <TableCell>
                              {ticket.currentDepartment.name}
                            </TableCell>
                          ) : null}
                          <TableCell>
                            {ticket.assignee?.name ?? (
                              <span className="text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(
                              new Date(ticket.createdAt),
                              "MMM d, yyyy hh:mm a",
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <MoveTicketMenu
                                ticket={ticket}
                                sourceColumn={column.id}
                                pending={mutations.pendingTicketIds.has(
                                  ticket.id,
                                )}
                                onMove={mutations.moveToColumn}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                render={
                                  <Link href={`/tickets/${ticket.id}`} />
                                }
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
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <DepartmentBoardActionDialogs
        closePending={mutations.closePending}
        onClosePendingChange={(open) => !open && mutations.setClosePending(null)}
        escalateFlow={mutations.escalateFlow}
        onEscalateFlowChange={(open) => {
          if (!open) {
            mutations.setEscalateFlow(null);
            mutations.setEscalateMessage("");
          }
        }}
        escalateMessage={mutations.escalateMessage}
        onEscalateMessageChange={mutations.setEscalateMessage}
        noNextDepartmentOpen={mutations.noNextDepartmentOpen}
        onNoNextDepartmentOpenChange={mutations.setNoNextDepartmentOpen}
        escalateBlockedOpen={mutations.escalateBlockedOpen}
        onEscalateBlockedOpenChange={mutations.setEscalateBlockedOpen}
        dialogUpdating={mutations.dialogUpdating}
        onCloseConfirm={() => void mutations.handleCloseConfirm()}
        onEscalateConfirm={() => void mutations.handleEscalateConfirm()}
      />
    </div>
  );
}
