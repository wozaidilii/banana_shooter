/** 英雄审核与来源 */

export type HeroReviewStatus = "approved" | "pending" | "rejected";
export type HeroSource = "official" | "admin" | "user";
export type HeroStatus = "candidate" | "resurrected";

/** 对话配置 — 用户提交时可简化，管理员可补全 */
export interface HeroDialogue {
  greeting: string;
  persona: string;
  keywords: Record<string, string[]>;
  fallbacks: string[];
}

export interface HeroSubmitter {
  openId: string;
  nickname: string;
}

/** 完整英雄记录 */
export interface HeroRecord {
  id: string;
  name: string;
  realName: string;
  emoji: string;
  tagline: string;
  status: HeroStatus;
  votes: number;
  color: string;
  epitaph: string;
  source: HeroSource;
  reviewStatus: HeroReviewStatus;
  submittedBy?: HeroSubmitter;
  reviewNote?: string;
  reviewedAt?: number;
  dialogue: HeroDialogue;
  createdAt: number;
  updatedAt: number;
}

/** 对外展示的英雄（不含完整 persona） */
export type PublicHero = Omit<HeroRecord, "dialogue"> & {
  dialogue?: Pick<HeroDialogue, "greeting">;
};

export interface HeroInput {
  name: string;
  realName: string;
  emoji: string;
  tagline: string;
  epitaph: string;
  color: string;
  status?: HeroStatus;
  dialogue: HeroDialogue;
}

export function toPublicHero(hero: HeroRecord): PublicHero {
  return {
    ...hero,
    dialogue: { greeting: hero.dialogue.greeting },
  };
}

/** 解析用户填写的兜底话术（每行一条） */
export function parseFallbackLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** 生成唯一英雄 ID */
export function generateHeroId(name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_\u4e00-\u9fff]/g, "")
      .slice(0, 16) || "hero";
  return `${base}_${Date.now().toString(36).slice(-6)}`;
}

/** 默认对话配置 */
export function defaultDialogue(name: string, persona: string, greeting: string, fallbacks: string[]): HeroDialogue {
  return {
    greeting: greeting.trim() || `你好，我是${name}。欢迎来到赛博墓碑。`,
    persona: persona.trim() || `你是${name}，赛博墓碑中的冥界人物。说话自然、有梗但不刻意。`,
    keywords: {},
    fallbacks: fallbacks.length
      ? fallbacks
      : [`我是${name}，赛博墓碑见。`, "冥界信号不太好，再说一遍？"],
  };
}
