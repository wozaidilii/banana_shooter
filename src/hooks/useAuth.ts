"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_EVENT, getAuthUser, logout, type AuthUser } from "~/lib/auth";

/** 登录状态 Hook */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    setReady(true);

    const onAuthChange = (e: Event) => {
      const detail = (e as CustomEvent<AuthUser | null>).detail;
      setUser(detail ?? getAuthUser());
    };

    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return { user, ready, isLoggedIn: Boolean(user), logout: handleLogout };
}
