import type { CharacterId } from "~/data/characters";
import { caixukunPrompt } from "./caixukun";
import { dingzhenPrompt } from "./dingzhen";
import { fenggePrompt } from "./fengge";
import { laodaPrompt } from "./laoda";
import { mabaoguoPrompt } from "./mabaoguo";
import type { SystemPrompt, SystemPromptMap } from "./types";
import { zhangxuefengPrompt } from "./zhangxuefeng";

/** 所有赛博人物的系统提示词 */
export const SYSTEM_PROMPTS: SystemPromptMap = {
  laoda: laodaPrompt,
  zhangxuefeng: zhangxuefengPrompt,
  dingzhen: dingzhenPrompt,
  mabaoguo: mabaoguoPrompt,
  caixukun: caixukunPrompt,
  fengge: fenggePrompt,
};

/** 获取角色的 system prompt 文本（供 LLM 调用） */
export function getSystemPrompt(characterId: CharacterId): string {
  const prompt = SYSTEM_PROMPTS[characterId as keyof typeof SYSTEM_PROMPTS];
  return prompt?.content ?? `你是赛博墓碑中的角色 ${characterId}。`;
}

/** 获取完整 SystemPrompt 对象 */
export function getSystemPromptMeta(characterId: CharacterId): SystemPrompt | null {
  return SYSTEM_PROMPTS[characterId as keyof typeof SYSTEM_PROMPTS] ?? null;
}

/** 全局对话风格约束 — 每次请求都会附加，防止模型刻意堆哏 */
const GLOBAL_CONVERSATION_CONSTRAINTS = [
  "像本人真实口吻说话，日常以正常交流为主，不要表演式玩梗",
  "网络哏是背景知识，仅在语境合适时隐晦带过；禁止每句硬塞哏、禁止连续堆梗",
  "10 条回复里含明显哏的通常不超过 2-3 条，其余应像正常人聊天",
  "用户没提哏时，不要主动把话题拐到哏上",
];

/** 构建 LLM messages 格式的 system 消息 */
export function buildSystemMessage(characterId: CharacterId): {
  role: "system";
  content: string;
} {
  const prompt = SYSTEM_PROMPTS[characterId as keyof typeof SYSTEM_PROMPTS];
  if (!prompt) {
    return { role: "system", content: `你是赛博墓碑中的角色 ${characterId}。` };
  }
  const parts = [prompt.content];
  const constraints = [
    ...(prompt.constraints ?? []),
    ...GLOBAL_CONVERSATION_CONSTRAINTS,
  ];
  if (constraints.length) {
    parts.push("\n\n行为约束：\n" + constraints.map((c) => `- ${c}`).join("\n"));
  }
  return { role: "system", content: parts.join("") };
}

export type { SystemPrompt, SystemPromptMap };
