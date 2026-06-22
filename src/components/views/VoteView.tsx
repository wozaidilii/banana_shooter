"use client";

import { useEffect, useState } from "react";
import { useHeroes } from "~/context/HeroContext";
import {
  formatCountdown,
  getCountdown,
  getLeaderboard,
  isVotingEnded,
  vote,
} from "~/lib/vote";
import { showToast } from "~/components/Toast";

interface VoteViewProps {
  onRefresh: () => void;
}

export function VoteView({ onRefresh }: VoteViewProps) {
  const { heroes } = useHeroes();
  const [cd, setCd] = useState(getCountdown());
  const [tick, setTick] = useState(0);
  const ended = isVotingEnded();
  const board = getLeaderboard(heroes);
  const maxVotes = board[0]?.voteCount || 1;

  void tick;

  useEffect(() => {
    const timer = setInterval(() => setCd(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVote = (id: string) => {
    const result = vote(id, heroes);
    if (result.ok) {
      showToast("投票成功！冥界感受到了你的力量", "success");
      setTick((t) => t + 1);
      onRefresh();
    } else {
      showToast(result.reason ?? "投票失败", "error");
    }
  };

  return (
    <>
      <section className="page-header">
        <h2>⚡ 复活赛投票</h2>
        <p>投票决定谁能从赛博冥界重生</p>
        <div className={`countdown-inline${ended ? " ended" : ""}`}>
          {ended ? "投票已截止" : `剩余 ${formatCountdown(cd)}`}
        </div>
      </section>

      <section className="vote-list">
        {board.map((c, i) => {
          const pct = Math.round((c.voteCount / maxVotes) * 100);
          return (
            <div
              key={c.id}
              className={`vote-card${c.voted ? " voted" : ""}`}
              style={{ "--accent": c.color } as React.CSSProperties}
            >
              <div className="vote-rank">#{i + 1}</div>
              <span className="vote-emoji">{c.emoji}</span>
              <div className="vote-info">
                <h3>
                  {c.name} <span className="vote-real">{c.realName}</span>
                </h3>
                <p>{c.tagline}</p>
                <div className="vote-bar">
                  <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="vote-count">
                  {c.voteCount.toLocaleString()} 票 · {pct}%
                </span>
              </div>
              <button
                className={`btn-vote${c.voted ? " done" : ""}`}
                disabled={ended || c.voted}
                onClick={() => handleVote(c.id)}
              >
                {c.voted ? "已投票 ✓" : ended ? "已截止" : "投票复活"}
              </button>
            </div>
          );
        })}
      </section>

      <section className="section hint-box">
        <p>
          💡 复活赛第一季截止 <strong>2026年7月31日</strong>
          ，票数最高的亡灵将优先获得完整对话能力。用户上传的英雄需管理员审核后参与投票。
        </p>
      </section>
    </>
  );
}
