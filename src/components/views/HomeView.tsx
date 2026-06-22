"use client";

import { useEffect, useState } from "react";
import type { CharacterId } from "~/data/characters";
import { useHeroes } from "~/context/HeroContext";
import {
  formatCountdown,
  getCountdown,
  getLeaderboard,
  getTotalVotes,
  initVoteStorage,
} from "~/lib/vote";
import { TombstoneCard } from "~/components/TombstoneCard";

interface HomeViewProps {
  onNavigate: (view: "vote" | "chat" | "submit", params?: { characterId?: CharacterId }) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { heroes, isLoading } = useHeroes();
  const [cd, setCd] = useState(getCountdown());

  useEffect(() => {
    if (heroes.length) initVoteStorage(heroes);
  }, [heroes]);

  const board = getLeaderboard(heroes);
  const top3 = board.slice(0, 3);
  const total = getTotalVotes(heroes);
  const leader = board[0];
  const liveCandidates = board.length;

  useEffect(() => {
    const timer = setInterval(() => setCd(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading && !heroes.length) {
    return <p className="empty">加载冥界居民中…</p>;
  }

  return (
    <>
      <section className="hero hero-shell" aria-labelledby="home-hero-title">
        <div className="hero-copy-panel">
          <span className="hero-kicker">NIGHT CITY MEMORIAL LINK // SEASON 01</span>
          <div className="glitch-wrap">
            <h1 id="home-hero-title" className="hero-title glitch" data-text="赛博墓碑">
              赛博墓碑
            </h1>
          </div>
          <p className="hero-sub">
            把被互联网埋葬的抽象人物重新接上线。投票、造梗、对话，让亡灵在霓虹信号里重生。
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onNavigate("vote")}>
              进入复活赛
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate("chat")}>
              接入亡灵频道
            </button>
            <button className="btn btn-signal" onClick={() => onNavigate("submit")}>
              上传新亡灵
            </button>
          </div>

          <div className="hero-signal-grid" aria-label="赛季状态">
            <div className="signal-card">
              <span className="signal-label">TOTAL VOTES</span>
              <strong>{total.toLocaleString()}</strong>
              <span>全网复活电流</span>
            </div>
            <div className="signal-card signal-card-hot">
              <span className="signal-label">TOP SIGNAL</span>
              <strong>{leader?.name ?? "等待接入"}</strong>
              <span>{leader ? `${leader.voteCount.toLocaleString()} 票领先` : "暂无榜首"}</span>
            </div>
            <div className="signal-card">
              <span className="signal-label">CANDIDATES</span>
              <strong>{liveCandidates}</strong>
              <span>冥界居民在线</span>
            </div>
          </div>
        </div>

        <div className="hero-control-panel" aria-label="复活赛控制台">
          <div className="terminal-topline">
            <span>RESURRECTION_PROTOCOL</span>
            <span className={cd.ended ? "status-danger" : "status-live"}>{cd.ended ? "CLOSED" : "LIVE"}</span>
          </div>
          <div className={`countdown-box${cd.ended ? " ended" : ""}`}>
            <span className="countdown-label">{cd.ended ? "复活赛已结束" : "复活赛倒计时"}</span>
            <span className="countdown-value">{formatCountdown(cd)}</span>
            <span className="countdown-hint">截止 2026.07.31 · 已有 {total.toLocaleString()} 票</span>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="city-card">
              <span className="city-sun" />
              <span className="city-line city-line-a" />
              <span className="city-line city-line-b" />
              <span className="city-line city-line-c" />
              <span className="city-spike city-spike-a" />
              <span className="city-spike city-spike-b" />
              <span className="city-spike city-spike-c" />
              <span className="neural-ring neural-ring-a" />
              <span className="neural-ring neural-ring-b" />
            </div>
          </div>
          <div className="terminal-footer">
            <span>MEMEWARE SYNC</span>
            <span>GHOST_CHAT READY</span>
          </div>
        </div>
      </section>

      <section className="section leaderboard-section">
        <div className="section-heading-block">
          <h2 className="section-title">复活榜 TOP3</h2>
          <p>当前信号最强的三位亡灵，正在争夺完整复活协议。</p>
        </div>
        <div className="podium">
          {top3.map((c, i) => (
            <div key={c.id} className={`podium-item rank-${i + 1}`}>
              <span className="podium-rank">#{String(i + 1).padStart(2, "0")}</span>
              <span className="podium-emoji">{c.emoji}</span>
              <span className="podium-name">{c.name}</span>
              <span className="podium-real">{c.realName}</span>
              <span className="podium-votes">{c.voteCount.toLocaleString()} 票</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section archive-section">
        <div className="section-heading-block">
          <h2 className="section-title">冥界居民</h2>
          <p>每张墓碑都是一段断线人格，点击接入专属亡灵频道。</p>
        </div>
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
        <div className="section-heading-block">
          <h2 className="section-title">核心玩法</h2>
          <p>从投票到对话再到共创，整套系统都围绕“把梗复活”运转。</p>
        </div>
        <div className="feature-grid feature-strip">
          <div className="feature-card">
            <span className="feature-index">VOTE</span>
            <h4>复活赛投票</h4>
            <p>投票决定谁能在赛博世界重生</p>
          </div>
          <div className="feature-card">
            <span className="feature-index">CHAT</span>
            <h4>AI亡灵对话</h4>
            <p>缺德抽象，人设拉满</p>
          </div>
          <div className="feature-card">
            <span className="feature-index">SKIN</span>
            <h4>梗图皮肤共创</h4>
            <p>上传你的史诗级抽象皮肤</p>
          </div>
          <div className="feature-card">
            <span className="feature-index">TITLE</span>
            <h4>专属称号</h4>
            <p>造梗出圈，赢取冥界头衔</p>
          </div>
        </div>
      </section>
    </>
  );
}
