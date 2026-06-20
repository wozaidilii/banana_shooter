import { CHARACTERS, RESURRECTION_DEADLINE, type Character } from "~/data/characters";
import {
  castVote,
  getTitles,
  getUserVotes,
  getVoteCounts,
  grantTitle,
} from "~/lib/storage";

export interface Countdown {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export interface LeaderboardEntry extends Character {
  voteCount: number;
  voted: boolean;
}

export function isVotingEnded(): boolean {
  return Date.now() >= RESURRECTION_DEADLINE.getTime();
}

export function getCountdown(): Countdown {
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

export function formatCountdown(cd: Countdown): string {
  if (!cd || cd.ended) return "已截止";
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
  if (cd.days > 0) {
    return `${cd.days}天 ${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
  }
  return `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
}

export function getLeaderboard(): LeaderboardEntry[] {
  const counts = getVoteCounts();
  const userVotes = getUserVotes();

  return CHARACTERS.map((c) => ({
    ...c,
    voteCount: Number(counts[c.id]) || Number(c.votes) || 0,
    voted: !!userVotes[c.id],
  })).sort((a, b) => b.voteCount - a.voteCount);
}

export function vote(characterId: string): { ok: boolean; reason?: string } {
  if (isVotingEnded()) return { ok: false, reason: "复活赛已截止" };

  const result = castVote(characterId);
  if (!result.ok) return result;

  const titles = getTitles();
  if (!titles.includes("first_vote")) {
    grantTitle("first_vote");
  }

  const userVotes = getUserVotes();
  const allVoted = CHARACTERS.every((c) => userVotes[c.id]);
  if (allVoted && !titles.includes("vote_all")) {
    grantTitle("vote_all");
  }

  return { ok: true };
}

export function getTotalVotes(): number {
  const counts = getVoteCounts();
  return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
