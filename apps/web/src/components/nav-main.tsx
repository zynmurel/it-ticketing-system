"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";

export type NavMainItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  items?: {
    title: string;
    url?: string;
    onClick?: () => void;
  }[];
};

function isNavItemActive(pathname: string, item: NavMainItem) {
  if (item.isActive) return true;

  if (
    item.items?.some(
      (subItem) =>
        subItem.url &&
        (pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)),
    )
  ) {
    return true;
  }

  return pathname === item.url || pathname.startsWith(`${item.url}/`);
}

export function NavMain({
  items,
  groupLabel = "Menu",
}: {
  items: NavMainItem[];
  groupLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item);

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  tooltip={item.title}
                  isActive={isActive}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              defaultOpen={isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      {subItem.onClick ? (
                        <SidebarMenuSubButton onClick={subItem.onClick}>
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      ) : (
                        <SidebarMenuSubButton
                          render={<Link href={subItem.url ?? "#"} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
