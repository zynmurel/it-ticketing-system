"use client";

import { TicketStatus, type TicketStatus as TicketStatusType } from "@it-ticketing/shared";
import { FilterIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";

const allStatuses = Object.values(TicketStatus);

export function createDefaultStatusFilter(): Set<TicketStatusType> {
  return new Set(
    allStatuses.filter((status) => status !== TicketStatus.CLOSED),
  );
}

type TicketStatusFilterProps = {
  selected: Set<TicketStatusType>;
  onChange: (selected: Set<TicketStatusType>) => void;
};

export function TicketStatusFilter({
  selected,
  onChange,
}: TicketStatusFilterProps) {
  function toggle(status: TicketStatusType, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(status);
    } else {
      next.delete(status);
    }
    onChange(next);
  }

  function remove(status: TicketStatusType) {
    const next = new Set(selected);
    next.delete(status);
    onChange(next);
  }

  const selectedStatuses = allStatuses.filter((status) =>
    selected.has(status),
  );

  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" aria-label="Filter by status" />
          }
        >
          <FilterIcon />
          Filter
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {allStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selected.has(status)}
                onCheckedChange={(checked) => toggle(status, checked)}
                closeOnClick={false}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    ticketStatusDot[status],
                  )}
                />
                {ticketStatusStyles[status].label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedStatuses.length > 0 ? (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {selectedStatuses.map((status) => (
            <span
              key={status}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                ticketStatusStyles[status].className,
              )}
            >
              {ticketStatusStyles[status].label}
              <button
                type="button"
                onClick={() => remove(status)}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remove ${ticketStatusStyles[status].label} filter`}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function filterTicketsByStatus<T extends { status: TicketStatusType }>(
  tickets: T[],
  selected: Set<TicketStatusType>,
): T[] {
  if (selected.size === 0) return [];
  return tickets.filter((ticket) => selected.has(ticket.status));
}
