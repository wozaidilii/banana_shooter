import type { CharacterId } from "~/data/characters";
import { DIALOGUE_SETTINGS } from "~/characters/dialogue";

const KEYS = {
  votes: "cyberTomb_votes",
  userVotes: "cyberTomb_userVotes",
  skins: "cyberTomb_skins",
  titles: "cyberTomb_titles",
  chatCount: "cyberTomb_chatCount",
  profile: "cyberTomb_profile",
  chatHistory: "cyberTomb_chatHistory",
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export interface UserProfile {
  nickname: string;
  avatar: string;
  joinedAt: number;
}

export interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export type SkinReviewStatus = "pending" | "approved" | "rejected";

export interface UserSkin {
  id: string;
  name: string;
  desc: string;
  characterId: string;
  templateId: string;
  emoji: string;
  author: string;
  likes: number;
  adopted: boolean;
  createdAt: number;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  reviewStatus?: SkinReviewStatus;
  reviewNote?: string;
  reviewedAt?: number;
}

export function getProfile(): UserProfile {
  return safeGet<UserProfile>(KEYS.profile, {
    nickname: "冥界游魂",
    avatar: "👻",
    joinedAt: Date.now(),
  });
}

export function saveProfile(patch: Partial<UserProfile>): boolean {
  const current = getProfile();
  return safeSet(KEYS.profile, { ...current, ...patch });
}

export function getVoteCounts(): Record<string, number> {
  return safeGet<Record<string, number>>(KEYS.votes, {});
}

export function saveVoteCounts(counts: Record<string, number>): boolean {
  return safeSet(KEYS.votes, counts);
}

export function getUserVotes(): Record<string, boolean> {
  return safeGet<Record<string, boolean>>(KEYS.userVotes, {});
}

export function castVote(characterId: string): { ok: boolean; reason?: string } {
  if (!characterId) return { ok: false, reason: "无效角色" };

  const userVotes = getUserVotes();
  if (userVotes[characterId]) return { ok: false, reason: "已经投过票了" };

  const counts = getVoteCounts();
  counts[characterId] = (Number(counts[characterId]) || 0) + 1;
  userVotes[characterId] = true;

  safeSet(KEYS.votes, counts);
  safeSet(KEYS.userVotes, userVotes);

  return { ok: true };
}

export function getTitles(): string[] {
  const earned = safeGet<string[]>(KEYS.titles, []);
  return Array.isArray(earned) ? earned : [];
}

export function grantTitle(titleId: string): boolean {
  if (!titleId) return false;
  const titles = getTitles();
  if (titles.includes(titleId)) return false;
  titles.push(titleId);
  return safeSet(KEYS.titles, titles);
}

export function getChatCount(): number {
  return Number(safeGet(KEYS.chatCount, 0)) || 0;
}

export function incrementChatCount(): number {
  const count = getChatCount() + 1;
  safeSet(KEYS.chatCount, count);
  return count;
}

export function getChatHistory(): Record<string, StoredChatMessage[]> {
  return safeGet<Record<string, StoredChatMessage[]>>(KEYS.chatHistory, {});
}

export function appendChatMessage(
  characterId: CharacterId,
  role: "user" | "assistant",
  content: string,
): void {
  if (!characterId || !content) return;
  const history = getChatHistory();
  if (!Array.isArray(history[characterId])) history[characterId] = [];
  history[characterId]!.push({ role, content, ts: Date.now() });
  const max = DIALOGUE_SETTINGS.maxStoredMessages;
  if (history[characterId]!.length > max) {
    history[characterId] = history[characterId]!.slice(-max);
  }
  safeSet(KEYS.chatHistory, history);
}

export function clearChatHistory(characterId?: CharacterId): void {
  const history = getChatHistory();
  if (characterId) {
    delete history[characterId];
  } else {
    for (const k of Object.keys(history)) {
      delete history[k];
    }
  }
  safeSet(KEYS.chatHistory, history);
}

export function getSkins(): UserSkin[] {
  const skins = safeGet<UserSkin[]>(KEYS.skins, []);
  if (!Array.isArray(skins)) return [];
  return skins.map((skin) => ({
    ...skin,
    reviewStatus: skin.reviewStatus ?? "approved",
  }));
}

export function getPendingSkins(): UserSkin[] {
  return getSkins().filter((s) => s.reviewStatus === "pending");
}

export function reviewSkin(
  skinId: string,
  decision: "approved" | "rejected",
  reviewNote?: string,
): { ok: boolean; reason?: string } {
  if (!skinId) return { ok: false, reason: "无效皮肤" };
  const skins = getSkins();
  const skin = skins.find((s) => s.id === skinId);
  if (!skin) return { ok: false, reason: "皮肤不存在" };
  if (skin.reviewStatus !== "pending") return { ok: false, reason: "该皮肤已审核" };

  skin.reviewStatus = decision;
  skin.reviewNote = reviewNote?.trim() || undefined;
  skin.reviewedAt = Date.now();
  safeSet(KEYS.skins, skins);
  return { ok: true };
}

export function addSkin(skin: {
  name?: string;
  characterId?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}): { ok: boolean; reason?: string; skin?: UserSkin } {
  if (!skin.name?.trim()) return { ok: false, reason: "皮肤名称不能为空" };
  if (!skin.imageUrl) return { ok: false, reason: "请上传皮肤图片" };
  const skins = getSkins();
  const entry: UserSkin = {
    id: `skin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(skin.name).trim().slice(0, 30),
    desc: "",
    characterId: skin.characterId ?? "",
    templateId: "",
    emoji: "",
    author: getProfile().nickname,
    likes: 0,
    adopted: false,
    createdAt: Date.now(),
    imageUrl: skin.imageUrl,
    imageWidth: skin.imageWidth,
    imageHeight: skin.imageHeight,
    reviewStatus: "pending",
  };
  skins.unshift(entry);
  safeSet(KEYS.skins, skins);
  return { ok: true, skin: entry };
}

export function likeSkin(skinId: string): number | false {
  if (!skinId) return false;
  const skins = getSkins();
  const skin = skins.find((s) => s.id === skinId);
  if (!skin || skin.reviewStatus !== "approved") return false;
  skin.likes = (Number(skin.likes) || 0) + 1;
  safeSet(KEYS.skins, skins);
  return skin.likes;
}

export function initStorage(characters: { id: string; votes: number }[]): void {
  const counts = getVoteCounts();
  let changed = false;
  for (const c of characters) {
    if (counts[c.id] == null) {
      counts[c.id] = Number(c.votes) || 0;
      changed = true;
    }
  }
  if (changed) saveVoteCounts(counts);
  grantTitle("early_bird");
}
