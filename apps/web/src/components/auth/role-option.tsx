"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@it-ticketing/shared";

type RoleOptionProps = {
  title: string;
  description: string;
  value: Role;
  selected: boolean;
  onSelect: (value: Role) => void;
};

export function RoleOption({
  title,
  description,
  value,
  selected,
  onSelect,
}: RoleOptionProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 dark:bg-primary/10"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 bg-background",
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
