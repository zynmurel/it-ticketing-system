"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, PlusIcon, TicketIcon, UsersIcon } from "lucide-react";
import { Role } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { DepartmentDetails } from "@/components/department/department-details";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNewTicket } from "@/components/tickets/new-ticket-provider";
import { getUserInitials } from "@/lib/user-initials";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openNewTicket } = useNewTicket();

  if (!user) return null;

  const initials = getUserInitials(user.name);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="px-2 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              {user.department ? (
                <div className="mt-3">
                  <DepartmentDetails
                    department={user.department}
                    role={user.role}
                  />
                </div>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/tickets" />}>
            <TicketIcon />
            {user.role === Role.DEPARTMENT_MEMBER ? "Tickets" : "My tickets"}
          </DropdownMenuItem>
          {user.role === Role.DEPARTMENT_MEMBER ? (
            <DropdownMenuItem render={<Link href="/members" />}>
              <UsersIcon />
              Members
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
