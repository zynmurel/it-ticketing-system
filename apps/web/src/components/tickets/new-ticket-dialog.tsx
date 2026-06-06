"use client";

import { useEffect, useMemo, useState } from "react";
import type { TicketTypeSummary } from "@it-ticketing/shared";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, ApiError } from "@/lib/api";

const emptyForm = {
  title: "",
  description: "",
  ticketTypeId: "",
};

type NewTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TicketTypeSummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketTypeItems = useMemo(
    () => ticketTypes.map((type) => ({ label: type.name, value: type.id })),
    [ticketTypes],
  );

  useEffect(() => {
    if (!open) return;

    setLoadingTypes(true);
    setError(null);

    authFetch<{ ticketTypes: TicketTypeSummary[] }>("/tickets/ticket-types")
      .then((data) => setTicketTypes(data.ticketTypes))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load ticket types.",
        ),
      )
      .finally(() => setLoadingTypes(false));
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(emptyForm);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await authFetch<{ ticket: { id: string } }>("/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      handleOpenChange(false);
      router.push(`/tickets/${data.ticket.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create ticket. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            Submit a new request. It will enter the first department queue as
            unassigned.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-ticket-title">Title</Label>
            <Input
              id="new-ticket-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-ticket-type">Ticket type</Label>
            <Select
              value={form.ticketTypeId || null}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ticketTypeId: value ?? "",
                }))
              }
              items={ticketTypeItems}
              disabled={loadingTypes}
            >
              <SelectTrigger id="new-ticket-type" className="w-full">
                <SelectValue placeholder="Select a ticket type" />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-ticket-description">Description</Label>
            <Textarea
              id="new-ticket-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the issue or request in detail"
              rows={5}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="px-3 pb-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.ticketTypeId || loadingTypes}
            >
              {submitting ? "Creating…" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
