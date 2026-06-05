"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function SiteHeader({ onLogin, onRegister }: SiteHeaderProps) {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket className="size-6" />
          </span>
          <div className="flex flex-col">
            <div className="text-xl font-bold">IT Ticketing</div>
            <div className="-mt-1 text-sm text-muted-foreground">
              Internal Support Portal
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && user ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" onClick={onLogin}>
                Log in
              </Button>
              <Button onClick={onRegister}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
