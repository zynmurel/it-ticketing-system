"use client";

import type { ActivityItem, TicketStatus } from "@it-ticketing/shared";
import {
  ArrowUpRightIcon,
  CircleDotIcon,
  MessageSquareIcon,
  UserPlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ticketStatusDot, ticketStatusStyles } from "@/lib/ticket-status-theme";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-initials";

function formatRelativeTime(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((then - now) / 1000);
  const abs = Math.abs(seconds);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, size] of units) {
    if (abs >= size || unit === "second") {
      const value = Math.round(seconds / size);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        value,
        unit,
      );
    }
  }

  return "just now";
}

function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground">
      <span className={cn("size-1.5 rounded-full", ticketStatusDot[status])} />
      {ticketStatusStyles[status].label}
    </span>
  );
}

function ActorName({ name }: { name: string }) {
  return <span className="font-medium text-foreground">{name}</span>;
}

function assigneeLabel(activity: ActivityItem): string | null {
  if (activity.targetUser) return activity.targetUser.name;
  if (!activity.message) return null;

  const match = activity.message.match(/^(?:Re)?assigned to (.+)$/i);
  return match?.[1] ?? null;
}

function isSelfAssignment(activity: ActivityItem): boolean {
  if (activity.targetUserId) {
    return activity.targetUserId === activity.actorId;
  }

  const assignee = assigneeLabel(activity);
  return (
    assignee?.localeCompare(activity.actor.name, undefined, {
      sensitivity: "accent",
    }) === 0
  );
}

type ActivityVisual =
  | { kind: "user"; name: string; className: string }
  | { kind: "icon"; icon: React.ReactNode; className: string };

function getActivityVisual(activity: ActivityItem): ActivityVisual {
  switch (activity.type) {
    case "TICKET_CREATED":
      return {
        kind: "user",
        name: activity.actor.name,
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      };
    case "ASSIGNED":
    case "REASSIGNED":
      return {
        kind: "icon",
        icon: <UserPlusIcon className="size-3" />,
        className: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      };
    case "STATUS_CHANGED":
      return {
        kind: "icon",
        icon: <CircleDotIcon className="size-3" />,
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      };
    case "ESCALATED":
      return {
        kind: "icon",
        icon: <ArrowUpRightIcon className="size-3" />,
        className: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      };
    case "REMARK_ADDED":
      return {
        kind: "icon",
        icon: <MessageSquareIcon className="size-3" />,
        className: "bg-muted text-muted-foreground",
      };
    default:
      return {
        kind: "user",
        name: activity.actor.name,
        className: "bg-muted text-muted-foreground",
      };
  }
}

function ActivityContent({ activity }: { activity: ActivityItem }) {
  const actor = <ActorName name={activity.actor.name} />;

  switch (activity.type) {
    case "TICKET_CREATED":
      return (
        <p className="text-sm text-muted-foreground">
          {actor} created the ticket
        </p>
      );
    case "ASSIGNED": {
      if (isSelfAssignment(activity)) {
        return (
          <p className="text-sm text-muted-foreground">
            {actor} self-assigned this ticket and moved it to{" "}
            {<StatusPill status={"IN_PROGRESS"} />}
          </p>
        );
      }

      const assignee = assigneeLabel(activity);
      return (
        <p className="text-sm text-muted-foreground">
          {actor} assigned the ticket to{" "}
          {assignee ? <ActorName name={assignee} /> : "this ticket"}{" "}
          and moved it to {<StatusPill status={"IN_PROGRESS"} />}
        </p>
      );
    }
    case "REASSIGNED": {
      if (isSelfAssignment(activity)) {
        return (
          <p className="text-sm text-muted-foreground">
            {actor} self-reassigned this ticket and moved it to{" "}
            {<StatusPill status={"IN_PROGRESS"} />}
          </p>
        );
      }

      const assignee = assigneeLabel(activity);
      return (
        <p className="text-sm text-muted-foreground">
          {actor} reassigned the ticket to{" "}
          {assignee ? <ActorName name={assignee} /> : "this ticket"} {" "}
          and moved it to {<StatusPill status={"IN_PROGRESS"} />}
        </p>
      );
    }
    case "STATUS_CHANGED":
      return (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {actor} changed status
            {activity.previousStatus ? (
              <>
                {" "}
                from <StatusPill status={activity.previousStatus} />
              </>
            ) : null}
            {activity.newStatus ? (
              <>
                {" "}
                to <StatusPill status={activity.newStatus} />
              </>
            ) : null}
          </p>
          {activity.message ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground/90">
              {activity.message}
            </p>
          ) : null}
        </div>
      );
    case "ESCALATED":
      return (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {actor} escalated
            {activity.targetDepartment ? (
              <>
                {" "}
                to{" "}
                <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground">
                  {activity.targetDepartment.name}
                </span>
              </>
            ) : (
              " this ticket"
            )}
          </p>
          {activity.message ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground/90">
              {activity.message}
            </p>
          ) : null}
        </div>
      );
    case "REMARK_ADDED":
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {actor} added a remark
          </p>
          {activity.message ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground/90">
              {activity.message}
            </p>
          ) : null}
        </div>
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          {actor} updated this ticket
        </p>
      );
  }
}

function ActivityIcon({ activity }: { activity: ActivityItem }) {
  const visual = getActivityVisual(activity);

  if (visual.kind === "icon") {
    return (
      <div
        className={cn(
          "flex size-[22px] items-center justify-center rounded-full ring-2 ring-background",
          visual.className,
        )}
      >
        {visual.icon}
      </div>
    );
  }

  return (
    <Avatar size="sm" className="size-[22px] ring-2 ring-background">
      <AvatarFallback
        className={cn("text-[10px] font-semibold", visual.className)}
      >
        {getUserInitials(visual.name)}
      </AvatarFallback>
    </Avatar>
  );
}

type TicketActivitiesProps = {
  activities: ActivityItem[];
};

export function TicketActivities({ activities }: TicketActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <section>
      <h2 className="mb-5 text-base font-semibold tracking-tight">Activity</h2>
      <div className="relative">
        {sorted.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < sorted.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-6 left-[11px] h-[calc(100%-12px)] w-px bg-border"
              />
            ) : null}

            <div className="relative z-10 shrink-0 pt-0.5">
              <ActivityIcon activity={activity} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <ActivityContent activity={activity} />
                </div>
                <time
                  dateTime={activity.createdAt}
                  className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground"
                >
                  · {formatRelativeTime(activity.createdAt)}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
