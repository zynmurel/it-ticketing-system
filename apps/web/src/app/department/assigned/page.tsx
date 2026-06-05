"use client";

import { useEffect, useState } from "react";
import { LayoutGridIcon, TableIcon } from "lucide-react";
import type { DepartmentBoard } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { DepartmentMemberGuard } from "@/components/department/department-member-guard";
import { AppShell } from "@/components/layout/app-shell";
import { DepartmentAssignedBoard } from "@/components/tickets/department-assigned-board";
import { DepartmentAssignedTable } from "@/components/tickets/department-assigned-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authFetch, ApiError } from "@/lib/api";

export default function DepartmentAssignedPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState<DepartmentBoard | null>(null);
  const [activeView, setActiveView] = useState("board");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    authFetch<DepartmentBoard>("/tickets/department/board")
      .then((data) => setBoard(data))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load assigned board.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <DepartmentMemberGuard>
      <AppShell title="Department assigned">
        <div className="min-w-0 w-full max-w-full space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Assigned tickets
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage assigned tickets on the board or table view. Assigning from
              the queue places tickets in{" "}
              <span className="font-medium text-foreground">In progress</span>.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading assigned tickets…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : board && user ? (
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList>
                <TabsTrigger value="board">
                  <LayoutGridIcon />
                  Board
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon />
                  Table
                </TabsTrigger>
              </TabsList>

              <TabsContent value="board" className="mt-4">
                {activeView === "board" ? (
                  <DepartmentAssignedBoard
                    departmentId={user.departmentId}
                    board={board}
                    onBoardChange={setBoard}
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                {activeView === "table" ? (
                  <DepartmentAssignedTable
                    departmentId={user.departmentId}
                    board={board}
                    onBoardChange={setBoard}
                  />
                ) : null}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </AppShell>
    </DepartmentMemberGuard>
  );
}
