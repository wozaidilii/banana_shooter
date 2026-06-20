// 复活赛投票逻辑

import { RESURRECTION_DEADLINE, CHARACTERS } from "./data.js";
import {
  castVote,
  getVoteCounts,
  getUserVotes,
  grantTitle,
  getTitles,
} from "./storage.js";

/** 复活赛是否已结束 */
export function isVotingEnded() {
  return Date.now() >= RESURRECTION_DEADLINE.getTime();
}

/** 倒计时数据 */
export function getCountdown() {
  const diff = RESURRECTION_DEADLINE.getTime() - Date.now();
  if (diff <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { ended: false, days, hours, minutes, seconds, total: diff };
}

/** 格式化倒计时显示 */
export function formatCountdown(cd) {
  if (!cd || cd.ended) return "已截止";
  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
  if (cd.days > 0) return `${cd.days}天 ${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
  return `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
}

/** 获取排行榜 */
export function getLeaderboard() {
  const counts = getVoteCounts();
  const userVotes = getUserVotes();

  return CHARACTERS.map((c) => ({
    ...c,
    voteCount: Number(counts[c.id]) || Number(c.votes) || 0,
    voted: !!userVotes[c.id],
  }))
    .sort((a, b) => b.voteCount - a.voteCount);
}

/** 投票并检查称号 */
export function vote(characterId) {
  if (isVotingEnded()) return { ok: false, reason: "复活赛已截止" };

  const result = castVote(characterId);
  if (!result.ok) return result;

  const titles = getTitles();

  // 首票称号
  if (!titles.includes("first_vote")) {
    grantTitle("first_vote");
  }

  // 全票称号
  const userVotes = getUserVotes();
  const allVoted = CHARACTERS.every((c) => userVotes[c.id]);
  if (allVoted && !titles.includes("vote_all")) {
    grantTitle("vote_all");
  }

  return { ok: true, leaderboard: getLeaderboard() };
}

/** 总票数 */
export function getTotalVotes() {
  const counts = getVoteCounts();
  return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
