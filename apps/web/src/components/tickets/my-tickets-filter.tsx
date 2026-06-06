"use client";

import {
  TicketStatus,
  type TicketStatus as TicketStatusType,
} from "@it-ticketing/shared";
import { FilterIcon, UserIcon, UserPlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MyTicketsOwnershipFilter } from "@/components/tickets/ticket-ownership-filter";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";

const allStatuses = Object.values(TicketStatus);

const ownershipOptions = [
  {
    key: "created" as const,
    label: "Created by me",
    icon: UserIcon,
  },
  {
    key: "assigned" as const,
    label: "Assigned to me",
    icon: UserPlusIcon,
  },
];

type MyTicketsFilterProps = {
  ownership: MyTicketsOwnershipFilter;
  onOwnershipChange: (ownership: MyTicketsOwnershipFilter) => void;
  status: Set<TicketStatusType>;
  onStatusChange: (status: Set<TicketStatusType>) => void;
};

export function MyTicketsFilter({
  ownership,
  onOwnershipChange,
  status,
  onStatusChange,
}: MyTicketsFilterProps) {
  function toggleStatus(nextStatus: TicketStatusType, checked: boolean) {
    const next = new Set(status);
    if (checked) {
      next.add(nextStatus);
    } else {
      next.delete(nextStatus);
    }
    onStatusChange(next);
  }

  function removeStatus(nextStatus: TicketStatusType) {
    const next = new Set(status);
    next.delete(nextStatus);
    onStatusChange(next);
  }

  function toggleOwnership(
    key: keyof MyTicketsOwnershipFilter,
    checked: boolean,
  ) {
    onOwnershipChange({ ...ownership, [key]: checked });
  }

  function removeOwnership(key: keyof MyTicketsOwnershipFilter) {
    onOwnershipChange({ ...ownership, [key]: false });
  }

  const selectedStatuses = allStatuses.filter((item) => status.has(item));
  const selectedOwnership = ownershipOptions.filter(
    (option) => ownership[option.key],
  );
  const hasBadges = selectedOwnership.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" aria-label="Filter tickets" />
          }
        >
          <FilterIcon />
          Filter
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Filter</DropdownMenuLabel>
            {ownershipOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.key}
                checked={ownership[option.key]}
                onCheckedChange={(checked) =>
                  toggleOwnership(option.key, checked)
                }
                closeOnClick={false}
              >
                <option.icon className="size-4 text-muted-foreground" />
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {allStatuses.map((item) => (
              <DropdownMenuCheckboxItem
                key={item}
                checked={status.has(item)}
                onCheckedChange={(checked) => toggleStatus(item, checked)}
                closeOnClick={false}
              >
                <span
                  className={cn("size-1.5 rounded-full", ticketStatusDot[item])}
                />
                {ticketStatusStyles[item].label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasBadges ? (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {selectedOwnership.map((option) => (
            <span
              key={option.key}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground"
            >
              <option.icon className="size-3 text-muted-foreground" />
              {option.label}
              <button
                type="button"
                onClick={() => removeOwnership(option.key)}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remove ${option.label} filter`}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          {selectedStatuses.map((item) => (
            <span
              key={item}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                ticketStatusStyles[item].className,
              )}
            >
              {ticketStatusStyles[item].label}
              <button
                type="button"
                onClick={() => removeStatus(item)}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remove ${ticketStatusStyles[item].label} filter`}
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
