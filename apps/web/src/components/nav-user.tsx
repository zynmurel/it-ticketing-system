"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, PlusIcon, TicketIcon, UsersIcon } from "lucide-react";
import { Role } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { DepartmentDetails } from "@/components/department/department-details";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNewTicket } from "@/components/tickets/new-ticket-provider";
import { getUserInitials } from "@/lib/user-initials";
import { ChevronsUpDownIcon } from "lucide-react";

export function NavUser() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openNewTicket } = useNewTicket();
  const { isMobile } = useSidebar();

  if (!user) return null;

  const initials = getUserInitials(user.name);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
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
                Tickets
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
