/** 赛博人物 ID — 支持官方与用户上传 */
export type CharacterId = string;

export type CharacterStatus = "candidate" | "resurrected";

/** 角色展示数据（不含对话/提示词，那些分别在 dialogue/ 与 prompts/ 目录） */
export interface Character {
  id: CharacterId;
  name: string;
  realName: string;
  emoji: string;
  tagline: string;
  status: CharacterStatus;
  votes: number;
  color: string;
  epitaph: string;
}

/** 复活赛截止：2026年7月31日 23:59:59 */
export const RESURRECTION_DEADLINE = new Date("2026-07-31T23:59:59+08:00");

export const CHARACTERS: Character[] = [
  {
    id: "laoda",
    name: "牢大",
    realName: "科比·布莱恩特",
    emoji: "🏀",
    tagline: "冰红茶喝到位，协调性就到位",
    status: "candidate",
    votes: 3156,
    color: "#f59e0b",
    epitaph: "Man, what can I say... Mamba out.",
  },
  {
    id: "zhangxuefeng",
    name: "张雪峰",
    realName: "考研名师",
    emoji: "📢",
    tagline: "北方水土不服？那是你分不够",
    status: "candidate",
    votes: 2847,
    color: "#3b82f6",
    epitaph: "考研可以重来，人生不能重来。",
  },
  {
    id: "dingzhen",
    name: "丁真",
    realName: "理塘王子",
    emoji: "🐴",
    tagline: "纯真の赛博小马",
    status: "candidate",
    votes: 1923,
    color: "#22c55e",
    epitaph: "鲜衣怒马少年时。",
  },
  {
    id: "mabaoguo",
    name: "马保国",
    realName: "武术大师",
    emoji: "🥋",
    tagline: "年轻人不讲武德",
    status: "candidate",
    votes: 1678,
    color: "#a855f7",
    epitaph: "耗子尾汁。",
  },
  {
    id: "caixukun",
    name: "蔡徐坤",
    realName: "练习时长两年半",
    emoji: "🐔",
    tagline: "鸡你太美",
    status: "candidate",
    votes: 2456,
    color: "#ec4899",
    epitaph: "只因你太美。",
  },
  {
    id: "fengge",
    name: "峰哥亡命天涯",
    realName: "三线城市观察家",
    emoji: "🛣️",
    tagline: "底层视角看冥界",
    status: "candidate",
    votes: 1432,
    color: "#64748b",
    epitaph: "没有容易的人生。",
  },
];

export function getCharacter(id: string | null | undefined): Character | null {
  if (!id) return null;
  return CHARACTERS.find((c) => c.id === id) ?? null;
}

export function getResurrectedCharacters(): Character[] {
  return CHARACTERS.filter((c) => c.status === "resurrected");
}

export function getCandidates(): Character[] {
  return CHARACTERS.filter((c) => c.status === "candidate");
}
