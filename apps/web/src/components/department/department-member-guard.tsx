"use client";

import { useEffect } from "react";
import { Role } from "@it-ticketing/shared";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function DepartmentMemberGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== Role.DEPARTMENT_MEMBER) {
      router.replace("/tickets");
    }
  }, [user, router]);

  if (user?.role !== Role.DEPARTMENT_MEMBER) {
    return null;
  }

  return children;
}
