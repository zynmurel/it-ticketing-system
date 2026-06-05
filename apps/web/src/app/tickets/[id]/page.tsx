"use client";

import { useCallback, useEffect, useState } from "react";
import type { TicketDetail } from "@it-ticketing/shared";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TicketActionsPanel } from "@/components/tickets/ticket-actions-panel";
import { TicketActivities } from "@/components/tickets/ticket-activities";
import { TicketDetailsCard } from "@/components/tickets/ticket-details-card";
import { authFetch, ApiError } from "@/lib/api";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = useCallback(() => {
    return authFetch<{ ticket: TicketDetail }>(`/tickets/${params.id}`)
      .then((data) => setTicket(data.ticket))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load ticket details.",
        ),
      );
  }, [params.id]);

  useEffect(() => {
    loadTicket().finally(() => setLoading(false));
  }, [loadTicket]);

  return (
    <AppShell title="Ticket details">
      <div className="mx-auto w-full max-w-6xl">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading ticket…</p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : ticket ? (
          <div className=" w-full">
            <div className="min-w-0 space-y-8">
              <section className="space-y-3">
                <h2 className="text-lg font-medium">Ticket details</h2>
                <div className=" flex flex-col-reverse lg:grid gap-2 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <TicketDetailsCard ticket={ticket} />
                  <TicketActionsPanel
                    ticket={ticket}
                    onTicketUpdated={setTicket}
                  />
                </div>
              </section>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                <TicketActivities activities={ticket.activities} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
