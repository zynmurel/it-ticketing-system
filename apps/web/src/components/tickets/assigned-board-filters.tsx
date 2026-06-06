"use client";

import { useEffect, useState } from "react";
import {
  Role,
  type DepartmentMember,
  type TicketTypeSummary,
} from "@it-ticketing/shared";
import { LayersIcon, TagIcon, UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TicketSearch } from "@/components/tickets/ticket-search";
import type { DepartmentBoardFilters } from "@/lib/department-board-shared";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";

type AssignedBoardFiltersProps = {
  filters: DepartmentBoardFilters;
  onChange: (filters: DepartmentBoardFilters) => void;
};

export function AssignedBoardFilters({
  filters,
  onChange,
}: AssignedBoardFiltersProps) {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch<{ members: DepartmentMember[] }>("/departments/members"),
      authFetch<{ ticketTypes: TicketTypeSummary[] }>("/tickets/ticket-types"),
    ])
      .then(([membersData, typesData]) => {
        setMembers(
          membersData.members.filter(
            (member) => member.role === Role.DEPARTMENT_MEMBER,
          ),
        );
        setTicketTypes(typesData.ticketTypes);
      })
      .catch(() => {
        setMembers([]);
        setTicketTypes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedMember = members.find(
    (member) => member.id === filters.assigneeId,
  );
  const selectedType = ticketTypes.find(
    (type) => type.id === filters.ticketTypeId,
  );

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.assigneeId) ||
    Boolean(filters.ticketTypeId);

  function patch(partial: Partial<DepartmentBoardFilters>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({
      assigneeId: null,
      search: "",
      ticketTypeId: null,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TicketSearch
        value={filters.search}
        onChange={(search) => patch({ search })}
        className="min-w-[200px] flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label="Filter by assignee"
              disabled={loading}
            />
          }
        >
          <UsersIcon />
          {selectedMember ? selectedMember.name : "All users"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Assigned to</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => patch({ assigneeId: null })}
              className={cn(!filters.assigneeId && "bg-muted/60 font-medium")}
            >
              <UsersIcon className="size-4 text-muted-foreground" />
              All users
            </DropdownMenuItem>
            {members.map((member) => (
              <DropdownMenuItem
                key={member.id}
                onClick={() => patch({ assigneeId: member.id })}
                className={cn(
                  filters.assigneeId === member.id &&
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
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label="Filter by ticket type"
              disabled={loading}
            />
          }
        >
          <LayersIcon />
          {selectedType ? selectedType.name : "All types"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Ticket type</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => patch({ ticketTypeId: null })}
              className={cn(
                !filters.ticketTypeId && "bg-muted/60 font-medium",
              )}
            >
              <LayersIcon className="size-4 text-muted-foreground" />
              All types
            </DropdownMenuItem>
            {ticketTypes.map((type) => (
              <DropdownMenuItem
                key={type.id}
                onClick={() => patch({ ticketTypeId: type.id })}
                className={cn(
                  filters.ticketTypeId === type.id &&
                    "bg-muted/60 font-medium",
                )}
              >
                <TagIcon className="size-4 text-muted-foreground" />
                <span className="truncate">{type.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground"
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
