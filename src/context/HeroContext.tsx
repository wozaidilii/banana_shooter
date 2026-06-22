"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { PublicHero } from "~/server/db/types";
import { api } from "~/trpc/react";

interface HeroContextValue {
  heroes: PublicHero[];
  isLoading: boolean;
  refetch: () => void;
  getHero: (id: string) => PublicHero | undefined;
}

const HeroContext = createContext<HeroContextValue | null>(null);

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = api.hero.listApproved.useQuery(undefined, {
    staleTime: 30_000,
  });

  const heroes = data ?? [];

  const getHero = useCallback(
    (id: string) => heroes.find((h) => h.id === id),
    [heroes],
  );

  const value = useMemo(
    () => ({
      heroes,
      isLoading,
      refetch: () => void refetch(),
      getHero,
    }),
    [heroes, isLoading, refetch, getHero],
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHeroes() {
  const ctx = useContext(HeroContext);
  if (!ctx) {
    throw new Error("useHeroes must be used within HeroProvider");
  }
  return ctx;
}
