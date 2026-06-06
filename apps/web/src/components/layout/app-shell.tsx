"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full min-w-0 overflow-x-hidden h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0 md:px-8 md:py-6 w-full max-w-full h-full overflow-y-auto scrollbar-primary">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
