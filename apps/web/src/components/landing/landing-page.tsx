"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginResponse } from "@it-ticketing/shared";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginDialog } from "@/components/auth/login-dialog";
import { RegisterDialog } from "@/components/auth/register-dialog";
import { LandingContent } from "@/components/landing/landing-content";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export function LandingPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  function openLogin() {
    setRegisterOpen(false);
    setLoginOpen(true);
  }

  function openRegister() {
    setLoginOpen(false);
    setRegisterOpen(true);
  }

  function handleAuthSuccess(session: LoginResponse) {
    setSession(session);
    session.user.role === "END_USER"
      ? router.push("/tickets")
      : router.push("/department/queue");
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader onLogin={openLogin} onRegister={openRegister} />

      <main className="flex flex-1 flex-col">
        <LandingContent onRegister={openRegister} onLogin={openLogin} />
      </main>

      <SiteFooter />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={openRegister}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={openLogin}
      />
    </div>
  );
}
