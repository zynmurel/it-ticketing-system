import type { TicketSummary } from "@it-ticketing/shared";

export type MyTicketsOwnershipFilter = {
  created: boolean;
  assigned: boolean;
};

export function createDefaultOwnershipFilter(): MyTicketsOwnershipFilter {
  return { created: true, assigned: true };
}

export function filterTicketsByOwnership(
  tickets: TicketSummary[],
  userId: string,
  filter: MyTicketsOwnershipFilter,
): TicketSummary[] {
  if (!filter.created && !filter.assigned) return [];

  return tickets.filter((ticket) => {
    const isCreated = ticket.createdById === userId;
    const isAssigned = ticket.assigneeId === userId;

    if (filter.created && filter.assigned) {
      return isCreated || isAssigned;
    }
    if (filter.created) return isCreated;
    return isAssigned;
  });
}

export function hasActiveOwnershipFilter(
  filter: MyTicketsOwnershipFilter,
): boolean {
  return !filter.created || !filter.assigned;
}
