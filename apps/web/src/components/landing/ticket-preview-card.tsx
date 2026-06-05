import { Badge } from "@/components/ui/badge";
import { ticketStatusStyles } from "@/lib/ticket-status-theme";
import { TicketStatus } from "@it-ticketing/shared";
import { ArrowRight, Circle } from "lucide-react";

const pipeline = ["Help Desk", "Tier 2", "Infrastructure"];

export function TicketPreviewCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-lg ring-1 ring-foreground/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            IT Hardware · #TK-1042
          </p>
          <p className="mt-1 font-medium">Laptop fan noise after update</p>
        </div>
        <Badge
          variant="secondary"
          className={ticketStatusStyles[TicketStatus.IN_PROGRESS].className}
        >
          In progress
        </Badge>
      </div>

      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        {pipeline.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span
              className={
                i === 0
                  ? "rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary dark:text-brand-green"
                  : "px-1"
              }
            >
              {step}
            </span>
            {i < pipeline.length - 1 ? (
              <ArrowRight className="size-3 opacity-50" />
            ) : null}
          </span>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl bg-muted/50 p-3 text-xs">
        <p className="font-medium text-muted-foreground">Activity</p>
        <div className="flex gap-2">
          <Circle className="mt-1 size-1.5 shrink-0 fill-primary text-primary" />
          <p>
            <span className="text-foreground">Ticket created</span>
            <span className="text-muted-foreground"> · Help Desk queue</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Circle className="mt-1 size-1.5 shrink-0 fill-brand-orange text-brand-orange" />
          <p>
            <span className="text-foreground">Assigned to Bob Reyes</span>
          </p>
        </div>
      </div>
    </div>
  );
}
