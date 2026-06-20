"use client";

import { useEffect, useState } from "react";
import type { CharacterId } from "~/data/characters";
import { CHARACTERS } from "~/data/characters";
import { initStorage } from "~/lib/storage";
import { getLeaderboard } from "~/lib/vote";
import { SiteFooter, SiteHeader } from "./SiteHeader";
import { ToastContainer } from "./Toast";
import { ChatView } from "./views/ChatView";
import { HomeView } from "./views/HomeView";
import { ProfileView } from "./views/ProfileView";
import { SkinsView } from "./views/SkinsView";
import { VoteView } from "./views/VoteView";

export type ViewName = "home" | "vote" | "chat" | "skins" | "profile";

export function CyberTombApp() {
  const [currentView, setCurrentView] = useState<ViewName>("home");
  const [chatCharacterId, setChatCharacterId] = useState<CharacterId | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initStorage(CHARACTERS);
  }, []);

  const navigate = (view: ViewName, params?: { characterId?: CharacterId }) => {
    setCurrentView(view);
    if (params?.characterId) setChatCharacterId(params.characterId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __cyberTomb?: unknown }).__cyberTomb = {
        navigate,
        getLeaderboard,
        CHARACTERS,
      };
    }
  }, []);

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
      </main>
      <SiteFooter />
      <ToastContainer />
    </>
  );
}
