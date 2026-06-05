"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import type { TicketSummary } from "@it-ticketing/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ticketStatusStyles } from "@/lib/ticket-status-theme";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TicketsTableProps = {
  tickets: TicketSummary[];
  emptyMessage?: string;
};

export function TicketsTable({
  tickets,
  emptyMessage = "No tickets yet.",
}: TicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-secondary/50 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="max-w-xs font-medium">
                {ticket.title}
              </TableCell>
              <TableCell>{ticket.ticketType.name}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={ticketStatusStyles[ticket.status].className}
                >
                  {ticketStatusStyles[ticket.status].label}
                </Badge>
              </TableCell>
              <TableCell>{ticket.currentDepartment.name}</TableCell>
              <TableCell>
                {ticket.assignee?.name ?? (
                  <span className=" opacity-50">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={`/tickets/${ticket.id}`} />}
                >
                  <ArrowUpRightIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
