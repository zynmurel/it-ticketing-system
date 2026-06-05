"use client";

import { useState } from "react";
import type { LoginResponse } from "@it-ticketing/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (session: LoginResponse) => void;
  onSwitchToRegister?: () => void;
};

export function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
  onSwitchToRegister,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(session);
      onSuccess?.(session);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Use your work email to access the ticketing portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="px-0 pb-4">
            <div className=" w-full flex items-center justify-center">
              <Button
                type="submit"
                className="w-full sm:w-auto px-20 py-4"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </DialogFooter>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={onSwitchToRegister}
          >
            Create one
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
