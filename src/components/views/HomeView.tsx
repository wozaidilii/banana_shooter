"use client";

import { useEffect, useState } from "react";
import type { CharacterId } from "~/data/characters";
import {
  formatCountdown,
  getCountdown,
  getLeaderboard,
  getTotalVotes,
} from "~/lib/vote";
import { TombstoneCard } from "~/components/TombstoneCard";

interface HomeViewProps {
  onNavigate: (view: "vote" | "chat", params?: { characterId?: CharacterId }) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const [cd, setCd] = useState(getCountdown());
  const board = getLeaderboard();
  const top3 = board.slice(0, 3);
  const total = getTotalVotes();

  useEffect(() => {
    const timer = setInterval(() => setCd(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="glitch-wrap">
          <h1 className="hero-title glitch" data-text="赛博墓碑">
            赛博墓碑
          </h1>
        </div>
        <p className="hero-sub">人物复活投票 · AI亡灵对话 · 梗图皮肤共创</p>
        <div className={`countdown-box${cd.ended ? " ended" : ""}`}>
          <span className="countdown-label">{cd.ended ? "复活赛已结束" : "复活赛倒计时"}</span>
          <span className="countdown-value">{formatCountdown(cd)}</span>
          <span className="countdown-hint">
            截止 2026.07.31 · 已有 {total.toLocaleString()} 票
          </span>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => onNavigate("vote")}>
            ⚡ 进入复活赛
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate("chat")}>
            💬 与亡灵对话
          </button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="section-icon">🏆</span> 复活榜 TOP3
        </h2>
        <div className="podium">
          {top3.map((c, i) => (
            <div key={c.id} className={`podium-item rank-${i + 1}`}>
              <span className="podium-rank">{["🥇", "🥈", "🥉"][i]}</span>
              <span className="podium-emoji">{c.emoji}</span>
              <span className="podium-name">{c.name}</span>
              <span className="podium-votes">{c.voteCount.toLocaleString()} 票</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="section-icon">⚰️</span> 冥界居民
        </h2>
        <div className="tombstone-grid">
          {board.map((c) => (
            <TombstoneCard
              key={c.id}
              char={c}
              extra={
                <div className="tombstone-meta">
                  <span>{c.voteCount.toLocaleString()} 票</span>
                  <button className="btn-sm" onClick={() => onNavigate("chat", { characterId: c.id })}>
                    对话
                  </button>
                </div>
              }
            />
          ))}
        </div>
      </section>

      <section className="section features">
        <h2 className="section-title">
          <span className="section-icon">🔮</span> 核心玩法
        </h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span>⚡</span>
            <h4>复活赛投票</h4>
            <p>投票决定谁能在赛博世界重生</p>
          </div>
          <div className="feature-card">
            <span>💬</span>
            <h4>AI亡灵对话</h4>
            <p>缺德抽象，人设拉满</p>
          </div>
          <div className="feature-card">
            <span>🎨</span>
            <h4>梗图皮肤共创</h4>
            <p>上传你的史诗级抽象皮肤</p>
          </div>
          <div className="feature-card">
            <span>👑</span>
            <h4>专属称号</h4>
            <p>造梗出圈，赢取冥界头衔</p>
          </div>
        </div>
      </section>
    </>
  );
}
