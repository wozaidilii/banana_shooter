"use client";

import { useEffect, useState } from "react";
import type { CharacterId } from "~/data/characters";
import { grantTitle } from "~/lib/storage";
import { getLeaderboard } from "~/lib/vote";
import { useHeroes } from "~/context/HeroContext";
import { SiteFooter, SiteHeader } from "./SiteHeader";
import { ToastContainer } from "./Toast";
import { AdminView } from "./views/AdminView";
import { ChatView } from "./views/ChatView";
import { HomeView } from "./views/HomeView";
import { ProfileView } from "./views/ProfileView";
import { SkinsView } from "./views/SkinsView";
import { SubmitHeroView } from "./views/SubmitHeroView";
import { VoteView } from "./views/VoteView";

export type ViewName = "home" | "vote" | "chat" | "skins" | "profile" | "submit" | "admin";

export function CyberTombApp() {
  const { heroes, refetch } = useHeroes();
  const [currentView, setCurrentView] = useState<ViewName>("home");
  const [chatCharacterId, setChatCharacterId] = useState<CharacterId | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    grantTitle("early_bird");
  }, []);

  const navigate = (view: ViewName, params?: { characterId?: CharacterId }) => {
    setCurrentView(view);
    if (params?.characterId) setChatCharacterId(params.characterId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __cyberTomb?: unknown }).__cyberTomb = {
        navigate,
        getLeaderboard: () => getLeaderboard(heroes),
        heroes,
      };
    }
  }, [heroes]);

  void refreshKey;

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
      <SiteHeader currentView={currentView} onNavigate={navigate} />
      <main className="main">
        {currentView === "home" && (
          <HomeView onNavigate={(view, params) => navigate(view, params)} />
        )}
        {currentView === "vote" && <VoteView onRefresh={refresh} />}
        {currentView === "chat" && <ChatView initialCharacterId={chatCharacterId} />}
        {currentView === "skins" && <SkinsView />}
        {currentView === "profile" && <ProfileView />}
        {currentView === "submit" && <SubmitHeroView />}
        {currentView === "admin" && <AdminView />}
      </main>
      <SiteFooter />
      <ToastContainer />
    </>
  );
}
