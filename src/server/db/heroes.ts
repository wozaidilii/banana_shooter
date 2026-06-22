import { promises as fs } from "node:fs";
import path from "node:path";
import { CHARACTERS } from "~/data/characters";
import { CHARACTER_DIALOGUES } from "~/characters/dialogue/keywords";
import { SYSTEM_PROMPTS } from "~/characters/prompts";
import type { HeroInput, HeroRecord, HeroReviewStatus } from "./types";
import { generateHeroId, toPublicHero, type PublicHero } from "./types";

const STORE_DIR = path.join(process.cwd(), "data", "store");
const STORE_FILE = path.join(STORE_DIR, "heroes.json");

let memoryCache: HeroRecord[] | null = null;

/** 从官方数据生成种子 */
function buildSeedHeroes(): HeroRecord[] {
  const now = Date.now();
  return CHARACTERS.map((c) => {
    const dialogue = CHARACTER_DIALOGUES[c.id as keyof typeof CHARACTER_DIALOGUES];
    const prompt = SYSTEM_PROMPTS[c.id as keyof typeof SYSTEM_PROMPTS];
    return {
      id: c.id,
      name: c.name,
      realName: c.realName,
      emoji: c.emoji,
      tagline: c.tagline,
      status: c.status,
      votes: c.votes,
      color: c.color,
      epitaph: c.epitaph,
      source: "official" as const,
      reviewStatus: "approved" as const,
      dialogue: {
        greeting: dialogue?.greeting ?? `你好，我是${c.name}。`,
        persona: prompt?.content ?? `你是${c.name}。`,
        keywords: dialogue?.keywords ?? {},
        fallbacks: dialogue?.fallbacks ?? [],
      },
      createdAt: now,
      updatedAt: now,
    };
  });
}

async function readFromDisk(): Promise<HeroRecord[] | null> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as HeroRecord[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeToDisk(heroes: HeroRecord[]): Promise<void> {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(heroes, null, 2), "utf-8");
  } catch {
    // serverless 等只读环境：仅保留内存
  }
}

/** 加载全部英雄 */
export async function loadHeroes(): Promise<HeroRecord[]> {
  if (memoryCache) return memoryCache;

  const fromDisk = await readFromDisk();
  if (fromDisk?.length) {
    memoryCache = fromDisk;
    return memoryCache;
  }

  memoryCache = buildSeedHeroes();
  await writeToDisk(memoryCache);
  return memoryCache;
}

async function persist(heroes: HeroRecord[]): Promise<void> {
  memoryCache = heroes;
  await writeToDisk(heroes);
}

/** 已审核通过的英雄 */
export async function listApprovedHeroes(): Promise<PublicHero[]> {
  const heroes = await loadHeroes();
  return heroes.filter((h) => h.reviewStatus === "approved").map(toPublicHero);
}

/** 获取单个英雄（含对话） */
export async function getHeroById(id: string): Promise<HeroRecord | null> {
  if (!id) return null;
  const heroes = await loadHeroes();
  return heroes.find((h) => h.id === id) ?? null;
}

/** 用户提交 — 待审核 */
export async function submitHero(
  input: HeroInput,
  submitter: { openId: string; nickname: string },
): Promise<HeroRecord> {
  const heroes = await loadHeroes();
  const now = Date.now();
  const hero: HeroRecord = {
    id: generateHeroId(input.name),
    name: input.name.trim().slice(0, 30),
    realName: input.realName.trim().slice(0, 50),
    emoji: input.emoji.trim().slice(0, 4) || "💀",
    tagline: input.tagline.trim().slice(0, 100),
    epitaph: input.epitaph.trim().slice(0, 200),
    color: input.color || "#00ffcc",
    status: "candidate",
    votes: 0,
    source: "user",
    reviewStatus: "pending",
    submittedBy: submitter,
    dialogue: input.dialogue,
    createdAt: now,
    updatedAt: now,
  };
  heroes.unshift(hero);
  await persist(heroes);
  return hero;
}

/** 管理员直接创建 — 已通过 */
export async function createHeroAsAdmin(input: HeroInput): Promise<HeroRecord> {
  const heroes = await loadHeroes();
  const now = Date.now();
  const hero: HeroRecord = {
    id: generateHeroId(input.name),
    name: input.name.trim().slice(0, 30),
    realName: input.realName.trim().slice(0, 50),
    emoji: input.emoji.trim().slice(0, 4) || "💀",
    tagline: input.tagline.trim().slice(0, 100),
    epitaph: input.epitaph.trim().slice(0, 200),
    color: input.color || "#00ffcc",
    status: input.status ?? "candidate",
    votes: 0,
    source: "admin",
    reviewStatus: "approved",
    dialogue: input.dialogue,
    createdAt: now,
    updatedAt: now,
  };
  heroes.unshift(hero);
  await persist(heroes);
  return hero;
}

/** 更新英雄 */
export async function updateHero(id: string, patch: Partial<HeroInput>): Promise<HeroRecord | null> {
  const heroes = await loadHeroes();
  const idx = heroes.findIndex((h) => h.id === id);
  if (idx < 0) return null;

  const current = heroes[idx]!;
  const updated: HeroRecord = {
    ...current,
    name: patch.name?.trim().slice(0, 30) ?? current.name,
    realName: patch.realName?.trim().slice(0, 50) ?? current.realName,
    emoji: patch.emoji?.trim().slice(0, 4) ?? current.emoji,
    tagline: patch.tagline?.trim().slice(0, 100) ?? current.tagline,
    epitaph: patch.epitaph?.trim().slice(0, 200) ?? current.epitaph,
    color: patch.color ?? current.color,
    status: patch.status ?? current.status,
    dialogue: patch.dialogue ?? current.dialogue,
    updatedAt: Date.now(),
  };
  heroes[idx] = updated;
  await persist(heroes);
  return updated;
}

/** 删除英雄（不可删官方种子） */
export async function deleteHero(id: string): Promise<boolean> {
  const heroes = await loadHeroes();
  const hero = heroes.find((h) => h.id === id);
  if (!hero || hero.source === "official") return false;

  const next = heroes.filter((h) => h.id !== id);
  await persist(next);
  return true;
}

/** 审核用户提交 */
export async function reviewHero(
  id: string,
  decision: "approved" | "rejected",
  reviewNote?: string,
): Promise<HeroRecord | null> {
  const heroes = await loadHeroes();
  const idx = heroes.findIndex((h) => h.id === id);
  if (idx < 0) return null;

  const hero = heroes[idx]!;
  if (hero.reviewStatus !== "pending") return null;

  hero.reviewStatus = decision as HeroReviewStatus;
  hero.reviewNote = reviewNote?.trim().slice(0, 200);
  hero.reviewedAt = Date.now();
  hero.updatedAt = Date.now();
  heroes[idx] = hero;
  await persist(heroes);
  return hero;
}

/** 管理员：全部英雄 */
export async function listAllHeroes(): Promise<HeroRecord[]> {
  return loadHeroes();
}

/** 待审核列表 */
export async function listPendingHeroes(): Promise<HeroRecord[]> {
  const heroes = await loadHeroes();
  return heroes.filter((h) => h.reviewStatus === "pending");
}

/** 用户自己的提交 */
export async function listHeroesBySubmitter(openId: string): Promise<HeroRecord[]> {
  if (!openId) return [];
  const heroes = await loadHeroes();
  return heroes.filter((h) => h.submittedBy?.openId === openId);
}

/** 供对话引擎使用的 system prompt */
export async function getHeroPersona(id: string): Promise<string | null> {
  const hero = await getHeroById(id);
  if (!hero || hero.reviewStatus !== "approved") return null;
  return hero.dialogue.persona;
}

/** 供对话引擎使用的完整对话配置 */
export async function getHeroDialogue(id: string) {
  const hero = await getHeroById(id);
  if (!hero || hero.reviewStatus !== "approved") return null;
  return hero.dialogue;
}
