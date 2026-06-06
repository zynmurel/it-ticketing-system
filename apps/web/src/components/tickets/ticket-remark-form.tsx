"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, ApiError } from "@/lib/api";

type TicketRemarkFormProps = {
  ticketId: string;
  onRemarkAdded: () => void;
};

export function TicketRemarkForm({
  ticketId,
  onRemarkAdded,
}: TicketRemarkFormProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const text = message.trim();
    if (!text) return;

    setSubmitting(true);
    setError(null);

    try {
      await authFetch(`/tickets/${ticketId}/remarks`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessage("");
      onRemarkAdded();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not add remark.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="ticket-remark">Add a remark</Label>
        <Textarea
          id="ticket-remark"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Leave a note for the team or requester…"
          rows={3}
          disabled={submitting}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={submitting || !message.trim()}>
        {submitting ? "Adding…" : "Add remark"}
      </Button>
    </form>
  );
}
