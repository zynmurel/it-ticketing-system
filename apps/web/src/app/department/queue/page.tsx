"use client";

import { useEffect, useMemo, useState } from "react";
import type { TicketSummary } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { DepartmentMemberGuard } from "@/components/department/department-member-guard";
import { AppShell } from "@/components/layout/app-shell";
import { DepartmentQueueTable } from "@/components/tickets/department-queue-table";
import { TicketSearch } from "@/components/tickets/ticket-search";
import { authFetch, ApiError } from "@/lib/api";
import { filterTicketsBySearch } from "@/lib/filter-tickets";

export default function DepartmentQueuePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTickets = useMemo(
    () => filterTicketsBySearch(tickets, search),
    [tickets, search],
  );

  useEffect(() => {
    if (!user) return;

    authFetch<{ tickets: TicketSummary[] }>("/tickets/department/unassigned")
      .then((data) => setTickets(data.tickets))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load department queue.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DepartmentMemberGuard>
      <AppShell title="Department Queue">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Department Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Unassigned requests currently in{" "}
              <span className="font-medium text-foreground">
                {user?.department.name}
              </span>
              .
            </p>
          </div>

          {!loading && !error ? (
            <TicketSearch value={search} onChange={setSearch} />
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading queue…</p>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <DepartmentQueueTable
              tickets={filteredTickets}
              onTicketAssigned={(ticketId) =>
                setTickets((current) =>
                  current.filter((ticket) => ticket.id !== ticketId),
                )
              }
              emptyMessage={
                tickets.length === 0
                  ? "No unassigned requests in your department queue."
                  : "No tickets match your search."
              }
            />
          )}
        </div>
      </AppShell>
    </DepartmentMemberGuard>
  );
}
