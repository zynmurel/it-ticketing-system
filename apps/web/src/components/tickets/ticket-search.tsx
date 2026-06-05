"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TicketSearchProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TicketSearch({ value, onChange, className }: TicketSearchProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by title or type…"
        className="pr-9 pl-8"
        aria-label="Search tickets by title or type"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <XIcon className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
