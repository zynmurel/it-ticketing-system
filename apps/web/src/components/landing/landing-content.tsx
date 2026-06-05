"use client";

import {
  Activity,
  ArrowUpRight,
  GitBranch,
  LayoutGrid,
  UserCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketPreviewCard } from "@/components/landing/ticket-preview-card";

const infoCards = [
  {
    icon: UserCircle,
    title: "Accounts",
    description:
      "Requesters submit and follow their own tickets. Support agents work the department queue—assign, escalate, update status, and add remarks. Everyone is linked to one home department.",
  },
  {
    icon: GitBranch,
    title: "Pipelines",
    description:
      "Each ticket type has an ordered list of departments. A new ticket enters step one unassigned; escalation advances it to the next department.",
  },
  {
    icon: LayoutGrid,
    title: "Statuses",
    description:
      "Tickets use Open, In Progress, Escalated, Resolved, and Closed. Changes are recorded in the activity log with who made them and when.",
  },
  {
    icon: Users,
    title: "Department Queue",
    description:
      "Agents see unassigned work in their department plus tickets already assigned. The queue splits those two views for day-to-day triage.",
  },
  {
    icon: Activity,
    title: "Activity log",
    description:
      "Every ticket keeps a running history: created, assigned or reassigned, status changes, escalations (with optional note), and remarks.",
  },
];

type LandingContentProps = {
  onRegister: () => void;
  onLogin: () => void;
};

export function LandingContent({ onRegister, onLogin }: LandingContentProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Background */}
      <div
        className="pointer-events-none absolute -right-24 top-0 size-[28rem] rounded-full bg-primary/25 blur-3xl dark:bg-primary/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-1/4 size-80 rounded-full bg-brand-orange/20 blur-3xl dark:bg-brand-orange/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_70%)]"
        aria-hidden
      />

      <section className="relative px-6 pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-primary dark:bg-brand-green" />
                Internal IT support portal
              </p>

              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.25rem]">
                IT Ticketing
                <span className="block text-muted-foreground">
                  System overview
                </span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Create tickets, route them through department pipelines, and
                keep a full audit trail. This page describes how the application
                is organized before you sign in.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-6"
                  onClick={onRegister}
                >
                  Create account
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6 bg-card/50 backdrop-blur-sm"
                  onClick={onLogin}
                >
                  Log in
                </Button>
              </div>
            </div>

            <div className="relative lg:pl-4">
              <div
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-brand-orange/20 opacity-80 dark:from-brand-green/15 dark:to-brand-red/10"
                aria-hidden
              />
              <TicketPreviewCard />
            </div>
          </div>

          {/* How it flows */}
          <div className="mt-16 md:mt-20">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Typical pipeline
            </h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {["Help Desk", "Tier 2 Support", "Infrastructure"].map(
                (dept, i, arr) => (
                  <div key={dept} className="flex items-center gap-3">
                    <div className="flex min-w-[9rem] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary dark:bg-brand-green/15 dark:text-brand-green">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{dept}</span>
                    </div>
                    {i < arr.length - 1 ? (
                      <span className="hidden text-muted-foreground sm:inline">
                        →
                      </span>
                    ) : null}
                  </div>
                ),
              )}
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Example path for hardware-related tickets. Other ticket types can
              use shorter or different sequences.
            </p>
          </div>

          {/* Info grid */}
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoCards.map((item, index) => (
              <Card
                key={item.title}
                className={`rounded-3xl border-border/80 bg-card/80 shadow-sm backdrop-blur-sm ${
                  index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-brand-green/10 dark:text-brand-green">
                    <item.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-brand-orange/10 p-8 md:flex md:items-center md:justify-between md:gap-6 dark:from-brand-green/10 dark:to-brand-red/10">
            <div>
              <p className="font-medium">Ready to use the portal?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Register with your role and department, or log in if you already
                have an account.
              </p>
            </div>
            <div className="mt-4 flex shrink-0 flex-wrap gap-3 md:mt-0">
              <Button className="rounded-full" onClick={onRegister}>
                Sign up
              </Button>
              <Button
                variant="outline"
                className="rounded-full bg-background/60"
                onClick={onLogin}
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
