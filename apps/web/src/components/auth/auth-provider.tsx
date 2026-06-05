"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, LoginResponse } from "@it-ticketing/shared";
import { authFetch } from "@/lib/api";
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from "@/lib/auth-storage";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (session: LoginResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (storedUser?.department) {
      setUser(storedUser);
    }

    authFetch<{ user: AuthUser }>("/auth/me")
      .then(({ user }) => {
        saveSession({ token, user });
        setUser(user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setSession = useCallback((session: LoginResponse) => {
    saveSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, setSession, logout }),
    [user, isLoading, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
