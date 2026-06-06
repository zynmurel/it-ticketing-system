"use client";

import { useEffect, useMemo, useState } from "react";
import { Role, type TicketStatus, type TicketSummary } from "@it-ticketing/shared";
import { PlusIcon } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useNewTicket } from "@/components/tickets/new-ticket-provider";
import { AppShell } from "@/components/layout/app-shell";
import { MyTicketsFilter } from "@/components/tickets/my-tickets-filter";
import {
  createDefaultOwnershipFilter,
  filterTicketsByOwnership,
} from "@/components/tickets/ticket-ownership-filter";
import {
  createDefaultStatusFilter,
  filterTicketsByStatus,
} from "@/components/tickets/ticket-status-filter";
import { TicketSearch } from "@/components/tickets/ticket-search";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { Button } from "@/components/ui/button";
import { authFetch, ApiError } from "@/lib/api";
import { filterTicketsBySearch } from "@/lib/filter-tickets";

export default function TicketsPage() {
  const { user } = useAuth();
  const { openNewTicket } = useNewTicket();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<TicketStatus>>(
    createDefaultStatusFilter,
  );
  const [ownershipFilter, setOwnershipFilter] = useState(
    createDefaultOwnershipFilter,
  );
  const [search, setSearch] = useState("");

  const filteredTickets = useMemo(() => {
    if (!user) return [];

    const owned = filterTicketsByOwnership(tickets, user.id, ownershipFilter);
    const searched = filterTicketsBySearch(owned, search);
    return filterTicketsByStatus(searched, statusFilter);
  }, [tickets, search, statusFilter, ownershipFilter, user]);

  const isDepartmentMember = user?.role === Role.DEPARTMENT_MEMBER;

  useEffect(() => {
    if (!user) return;

    authFetch<{ tickets: TicketSummary[] }>("/tickets/my")
      .then((data) => setTickets(data.tickets))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load tickets. Try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppShell title="My tickets">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My tickets</h1>
            <p className="text-sm text-muted-foreground">
              {isDepartmentMember
                ? "Tickets you created or are assigned to."
                : "Tickets you created and any requests assigned to you."}
            </p>
          </div>
          <Button onClick={openNewTicket}>
            <PlusIcon />
            New ticket
          </Button>
        </div>

        {!loading && !error ? (
          <div className="space-y-2">
            <MyTicketsFilter
              ownership={ownershipFilter}
              onOwnershipChange={setOwnershipFilter}
              status={statusFilter}
              onStatusChange={setStatusFilter}
            />
            <TicketSearch value={search} onChange={setSearch} />
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tickets…</p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <TicketsTable
            tickets={filteredTickets}
            emptyMessage={
              tickets.length === 0
                ? "No tickets yet. Create one to get started."
                : search.trim()
                  ? "No tickets match your search."
                  : filteredTickets.length === 0
                    ? "No tickets match the selected filters."
                    : "No tickets match the selected statuses."
            }
          />
        )}
      </div>
    </AppShell>
  );
}
