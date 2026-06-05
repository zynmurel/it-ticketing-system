"use client";

import { useEffect, useState } from "react";
import { Role, type DepartmentMember } from "@it-ticketing/shared";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { MembersTable } from "@/components/members/members-table";
import { authFetch, ApiError } from "@/lib/api";

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== Role.DEPARTMENT_MEMBER) {
      router.replace("/tickets");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== Role.DEPARTMENT_MEMBER) return;

    authFetch<{ members: DepartmentMember[] }>("/departments/members")
      .then((data) => setMembers(data.members))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load department members.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role !== Role.DEPARTMENT_MEMBER) {
    return null;
  }

  return (
    <AppShell title="Members">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Everyone in {user.department.name}.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <MembersTable members={members} />
        )}
      </div>
    </AppShell>
  );
}
