"use client";

import type { TicketDetail } from "@it-ticketing/shared";
import { Badge } from "@/components/ui/badge";
import { ticketStatusStyles } from "@/lib/ticket-status-theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TicketDetailsCardProps = {
  ticket: TicketDetail;
};

export function TicketDetailsCard({ ticket }: TicketDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription className="mt-1">
              {ticket.ticketType.name} · Created by {ticket.createdBy.name}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={ticketStatusStyles[ticket.status].className}
          >
            {ticketStatusStyles[ticket.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Description</p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Current department</dt>
            <dd className="text-muted-foreground">
              {ticket.currentDepartment.name}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Assignee</dt>
            <dd className="text-muted-foreground">
              {ticket.assignee?.name ?? <span className=" opacity-50">Unassigned</span>}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Created</dt>
            <dd className="text-muted-foreground">
              {new Date(ticket.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Last updated</dt>
            <dd className="text-muted-foreground">
              {new Date(ticket.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
