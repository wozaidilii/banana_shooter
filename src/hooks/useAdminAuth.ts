"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminToken, clearAdminToken, ADMIN_AUTH_EVENT } from "~/lib/admin-auth";
import { api } from "~/trpc/react";

export { getAdminToken, setAdminToken, clearAdminToken, ADMIN_AUTH_EVENT } from "~/lib/admin-auth";

/** 管理员登录状态 */
export function useAdminAuth() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAdminToken()));
    setReady(true);
    const onChange = () => setHasToken(Boolean(getAdminToken()));
    window.addEventListener(ADMIN_AUTH_EVENT, onChange);
    return () => window.removeEventListener(ADMIN_AUTH_EVENT, onChange);
  }, []);

  const { data, refetch, isLoading } = api.admin.verify.useQuery(undefined, {
    enabled: hasToken,
    retry: false,
  });

  const logout = useCallback(() => {
    clearAdminToken();
    setHasToken(false);
    void refetch();
  }, [refetch]);

  const isAdmin = Boolean(data?.isAdmin);

  return { isAdmin, ready: ready && (!hasToken || !isLoading), logout, refresh: () => void refetch() };
}
