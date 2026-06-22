"use client";

import type { ViewName } from "./CyberTombApp";
import { LoginButton } from "./LoginButton";

interface SiteHeaderProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

const NAV_ITEMS: { view: ViewName; label: string }[] = [
  { view: "home", label: "首页" },
  { view: "vote", label: "复活赛" },
  { view: "chat", label: "对话" },
  { view: "submit", label: "造英雄" },
  { view: "skins", label: "皮肤" },
  { view: "profile", label: "称号" },
  { view: "admin", label: "管理" },
];

export function SiteHeader({ currentView, onNavigate }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <button className="logo" type="button" onClick={() => onNavigate("home")}>
        <span className="logo-icon">⚰️</span>
        <span className="logo-text">赛博墓碑</span>
      </button>
      <nav className="nav" aria-label="主导航">
        {NAV_ITEMS.map(({ view, label }) => (
          <button
            key={view}
            className={`nav-btn${currentView === view ? " active" : ""}`}
            data-view={view}
            onClick={() => onNavigate(view)}
          >
            {label}
          </button>
        ))}
      </nav>
      <LoginButton />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>赛博墓碑 v2.0 · 抽象梗文化实验品 · 复活赛S1截止 2026.07.31</p>
      <p className="footer-hint">第二季 · 合成 · 成就 · 复活名人堂 …… 敬请期待</p>
    </footer>
  );
}
