"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyDepartmentQueuePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/department/queue");
  }, [router]);

  return null;
}
