"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNewTicket } from "@/components/tickets/new-ticket-provider";

export default function NewTicketPage() {
  const router = useRouter();
  const { openNewTicket } = useNewTicket();

  useEffect(() => {
    openNewTicket();
    router.replace("/tickets");
  }, [openNewTicket, router]);

  return null;
}
