import type { TicketSummary } from "@it-ticketing/shared";

export function filterTicketsBySearch(
  tickets: TicketSummary[],
  query: string,
): TicketSummary[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tickets;

  return tickets.filter((ticket) => {
    const title = ticket.title.toLowerCase();
    const type = ticket.ticketType.name.toLowerCase();
    return title.includes(normalized) || type.includes(normalized);
  });
}

export function filterTicketsByTicketType(
  tickets: TicketSummary[],
  ticketTypeId: string | null,
): TicketSummary[] {
  if (!ticketTypeId) return tickets;
  return tickets.filter((ticket) => ticket.ticketTypeId === ticketTypeId);
}
