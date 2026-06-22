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
  isVotingEnded,
  vote,
} from "~/lib/vote";
import { CharacterPortrait } from "~/components/CharacterPortrait";
import { SkinSubmitModal } from "~/components/SkinSubmitModal";
import { showToast } from "~/components/Toast";
import { TombstoneCard } from "~/components/TombstoneCard";

interface HomeViewProps {
  onNavigate: (view: "vote" | "chat" | "submit", params?: { characterId?: CharacterId }) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { heroes, isLoading } = useHeroes();
  const [cd, setCd] = useState(getCountdown());
  const [tick, setTick] = useState(0);
  const [skinModal, setSkinModal] = useState<{ id: string; name: string } | null>(null);
  const ended = isVotingEnded();

  void tick;

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

  const handleVote = (characterId: string) => {
    const result = vote(characterId, heroes);
    if (result.ok) {
      showToast("投票成功！冥界感受到了你的力量", "success");
      setTick((t) => t + 1);
    } else {
      showToast(result.reason ?? "投票失败", "error");
    }
  };

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
          <div className="hero-leader-spot" aria-label="复活榜第一名">
            {leader ? (
              <>
                <div className="hero-leader-head">
                  <span className="hero-leader-badge">#01 · TOP SIGNAL</span>
                  <span className="hero-leader-votes">{leader.voteCount.toLocaleString()} 票</span>
                </div>
                <CharacterPortrait
                  characterId={leader.id}
                  characterName={leader.name}
                  size="lg"
                  showLabel
                  showDots
                />
                <div className="hero-leader-meta">
                  <strong>{leader.name}</strong>
                  <span>{leader.realName}</span>
                </div>
              </>
            ) : (
              <p className="hero-leader-empty">等待榜首接入…</p>
            )}
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
              <CharacterPortrait characterId={c.id} characterName={c.name} size="lg" showLabel showDots />
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
          <p>每张墓碑都是一段断线人格，投票、对话或上传梗图皮肤。</p>
        </div>
        <div className="tombstone-grid">
          {board.map((c) => (
            <TombstoneCard
              key={c.id}
              char={c}
              extra={
                <div className="tombstone-meta">
                  <span className="tombstone-votes">{c.voteCount.toLocaleString()} 票</span>
                  <div className="tombstone-actions">
                    <button
                      className={`btn-sm btn-vote-inline${c.voted ? " done" : ""}`}
                      disabled={ended || c.voted}
                      onClick={() => handleVote(c.id)}
                    >
                      {c.voted ? "已投" : ended ? "截止" : "投票"}
                    </button>
                    <button className="btn-sm" onClick={() => onNavigate("chat", { characterId: c.id })}>
                      对话
                    </button>
                    <button
                      className="btn-sm btn-skin-inline"
                      onClick={() => setSkinModal({ id: c.id, name: c.name })}
                    >
                      上传皮肤
                    </button>
                  </div>
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

      {skinModal && (
        <SkinSubmitModal
          open
          characterId={skinModal.id}
          characterName={skinModal.name}
          onClose={() => setSkinModal(null)}
        />
      )}
    </>
  );
}
