"use client";

import Link from "next/link";
import { Role } from "@it-ticketing/shared";
import { Building2Icon, PlusIcon, TicketIcon, UsersIcon } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { DepartmentDetails } from "@/components/department/department-details";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useNewTicket } from "@/components/tickets/new-ticket-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { openNewTicket } = useNewTicket();

  const departmentTicketItems = [
    {
      title: "Queue Table",
      url: "/department/queue",
    },
    {
      title: "Assigned (Board & Table)",
      url: "/department/assigned",
    },
  ];

  const personalTicketItems = [
    {
      title: "My tickets",
      url: "/tickets",
    },
    {
      title: "Escalated tickets",
      url: "/tickets/escalated",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/tickets" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TicketIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">IT Ticketing</span>
                <span className="truncate text-xs">Support portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user?.department ? (
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <DepartmentDetails department={user.department} role={user.role} />
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        {user?.role === Role.DEPARTMENT_MEMBER ? (
          <NavMain
            groupLabel="Department tickets"
            items={[
              {
                title: "Department tickets",
                url: "/department",
                icon: <Building2Icon />,
                items: departmentTicketItems,
              },
            ]}
          />
        ) : null}
        <NavMain
          groupLabel="Tickets"
          items={[
            {
              title: "Tickets",
              url: "/tickets",
              icon: <TicketIcon />,
              items: personalTicketItems,
            },
            ...(user?.role === Role.DEPARTMENT_MEMBER
              ? [
                  {
                    title: "Members",
                    url: "/members",
                    icon: <UsersIcon />,
                  },
                ]
              : []),
          ]}
        />
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Quick action</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={openNewTicket} tooltip="New ticket">
                <PlusIcon />
                <span>Create ticket</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
