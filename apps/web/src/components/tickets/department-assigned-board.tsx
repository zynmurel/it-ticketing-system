"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  TicketStatus,
  type DepartmentBoard,
  type TicketSummary,
} from "@it-ticketing/shared";
import { ArrowDown, ArrowUpRightIcon, Loader2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDepartmentBoardMutations } from "@/hooks/use-department-board-mutations";
import {
  BOARD_COLUMNS,
  buildColumnTickets,
  resolveTargetColumn,
  type BoardColumnId,
} from "@/lib/department-board-shared";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";
import { format } from "date-fns";
import { DepartmentBoardActionDialogs } from "./department-board-action-dialogs";

type DepartmentAssignedBoardProps = {
  departmentId: string;
  board: DepartmentBoard;
  onBoardChange: (board: DepartmentBoard) => void;
};

function BoardTicketCard({
  ticket,
  draggable,
  isDragging,
  isPending,
  showDepartment,
}: {
  ticket: TicketSummary;
  draggable: boolean;
  isDragging?: boolean;
  isPending?: boolean;
  showDepartment?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dragging,
  } = useDraggable({
    id: ticket.id,
    disabled: !draggable || isPending,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const canDrag = draggable && !isPending;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm select-none",
        canDrag && "cursor-grab touch-manipulation active:cursor-grabbing",
        !draggable && "cursor-not-allowed",
        (isDragging || dragging) && "opacity-40",
        isPending && "pointer-events-none opacity-70",
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug">
            {ticket.title}
          </p>
          {isPending ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 h-5"
            render={<Link href={`/tickets/${ticket.id}`} />}
          >
            <ArrowUpRightIcon />
          </Button>
        </div>
        <p className="text-xs opacity-70">{ticket.ticketType.name}</p>
        <time
          dateTime={ticket.createdAt}
          className="block text-xs text-muted-foreground"
        >
          {format(new Date(ticket.createdAt), "MMM d, yyyy hh:mm a")}
        </time>
        {showDepartment && ticket.currentDepartment ? (
          <span className="text-xs text-muted-foreground">
            {ticket.currentDepartment.name}
          </span>
        ) : null}
        {ticket.assignee ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar size="sm" className="size-4">
              <AvatarFallback className="text-[8px] font-semibold">
                {getUserInitials(ticket.assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{ticket.assignee.name}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Unassigned</p>
        )}
      </div>
    </div>
  );
}

function BoardColumn({
  columnId,
  label,
  tickets,
  activeTicketId,
  pendingTicketIds,
}: {
  columnId: BoardColumnId;
  label: string;
  tickets: TicketSummary[];
  activeTicketId: string | null;
  pendingTicketIds: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const columnStyle = ticketStatusStyles[columnId as TicketStatus] ?? {
    className: "",
    label,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 lg:w-96 shrink-0 flex-col rounded-md bg-card/50 relative overflow-hidden",
        isOver && "ring-offset-background",
      )}
    >
      {isOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 dark:bg-background/80 backdrop-blur-sm top-[41px]">
          <div className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2 shadow-sm">
            <ArrowDown className="size-4 text-primary" />
            <span className="text-sm font-medium">Move ticket here</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              ticketStatusDot[columnId as TicketStatus],
            )}
          />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-medium",
            columnStyle.className,
          )}
        >
          {tickets.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-hidden overflow-x-hidden p-2">
        {tickets.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No tickets
          </p>
        ) : (
          tickets.map((ticket) => (
            <BoardTicketCard
              key={ticket.id}
              ticket={ticket}
              draggable={
                columnId !== "ESCALATED" &&
                ticket.status !== TicketStatus.CLOSED &&
                !pendingTicketIds.has(ticket.id)
              }
              isDragging={activeTicketId === ticket.id}
              isPending={pendingTicketIds.has(ticket.id)}
              showDepartment={columnId === "ESCALATED"}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DragPreview({ ticket }: { ticket: TicketSummary }) {
  return (
    <div className="w-72 rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="line-clamp-2 text-sm font-medium">{ticket.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {ticket.ticketType.name}
      </p>
    </div>
  );
}

export function DepartmentAssignedBoard({
  departmentId,
  board,
  onBoardChange,
}: DepartmentAssignedBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const columns = useMemo(() => buildColumnTickets(board), [board]);

  const ticketById = useMemo(() => {
    const map = new Map<string, TicketSummary>();
    for (const ticket of [...board.inDepartment, ...board.escalated]) {
      map.set(ticket.id, ticket);
    }
    return map;
  }, [board]);

  const activeTicket = activeId ? ticketById.get(activeId) : null;

  const mutations = useDepartmentBoardMutations(
    board,
    onBoardChange,
    departmentId,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = String(active.id);
    const targetColumn = resolveTargetColumn(over.id, columns);
    const ticket = ticketById.get(ticketId);
    if (!ticket || !targetColumn) return;

    mutations.moveToColumn(ticket, targetColumn);
  }

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

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-primary flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-3">
          {BOARD_COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              columnId={column.id}
              label={column.label}
              tickets={columns[column.id]}
              activeTicketId={activeId}
              pendingTicketIds={mutations.pendingTicketIds}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? <DragPreview ticket={activeTicket} /> : null}
        </DragOverlay>
      </DndContext>

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
