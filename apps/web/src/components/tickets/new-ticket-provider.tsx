"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";

type NewTicketContextValue = {
  open: boolean;
  openNewTicket: () => void;
  closeNewTicket: () => void;
};

const NewTicketContext = createContext<NewTicketContextValue | null>(null);

export function NewTicketProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openNewTicket = useCallback(() => setOpen(true), []);
  const closeNewTicket = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openNewTicket, closeNewTicket }),
    [open, openNewTicket, closeNewTicket],
  );

  return (
    <NewTicketContext.Provider value={value}>
      {children}
      <NewTicketDialog open={open} onOpenChange={setOpen} />
    </NewTicketContext.Provider>
  );
}

export function useNewTicket() {
  const context = useContext(NewTicketContext);
  if (!context) {
    throw new Error("useNewTicket must be used within NewTicketProvider");
  }
  return context;
}
