import type { AuthUser, DepartmentRef } from "@it-ticketing/shared";
import { Building2Icon } from "lucide-react";
import { getRoleLabel } from "@/lib/role-display";

type DepartmentDetailsProps = {
  department: DepartmentRef;
  role?: AuthUser["role"];
  compact?: boolean;
};

export function DepartmentDetails({
  department,
  role,
  compact = false,
}: DepartmentDetailsProps) {
  if (compact) {
    return (
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{department.name}</span>
        {role ? <> · {getRoleLabel(role)}</> : null}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="min-w-0 flex-1 text-sm leading-tight">
        <p className="truncate font-medium">{department.name}</p>
        {role ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {getRoleLabel(role)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
