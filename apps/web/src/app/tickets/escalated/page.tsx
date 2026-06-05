"use client";

import { useEffect, useMemo, useState } from "react";
import { Role, type TicketStatus, type TicketSummary } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import {
  TicketStatusFilter,
  createDefaultStatusFilter,
  filterTicketsByStatus,
} from "@/components/tickets/ticket-status-filter";
import { TicketSearch } from "@/components/tickets/ticket-search";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { authFetch, ApiError } from "@/lib/api";
import { filterTicketsBySearch } from "@/lib/filter-tickets";

export default function EscalatedTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<TicketStatus>>(
    createDefaultStatusFilter,
  );
  const [search, setSearch] = useState("");

  const filteredTickets = useMemo(() => {
    const searched = filterTicketsBySearch(tickets, search);
    return filterTicketsByStatus(searched, statusFilter);
  }, [tickets, search, statusFilter]);

  const isDepartmentMember = user?.role === Role.DEPARTMENT_MEMBER;

  useEffect(() => {
    if (!user) return;

    authFetch<{ tickets: TicketSummary[] }>("/tickets/escalated")
      .then((data) => setTickets(data.tickets))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load escalated tickets.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppShell title="Escalated tickets">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Escalated tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDepartmentMember
              ? `Tickets your department worked on that have moved on from ${user?.department.name}.`
              : "Tickets you submitted that have been escalated to another department."}
          </p>
        </div>

        {!loading && !error ? (
          <div className="space-y-2">
            <TicketStatusFilter
              selected={statusFilter}
              onChange={setStatusFilter}
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
                ? "No escalated tickets yet."
                : search.trim()
                  ? "No tickets match your search."
                  : "No tickets match the selected statuses."
            }
          />
        )}
      </div>
    </AppShell>
  );
}
