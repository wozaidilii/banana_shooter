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
  return SYSTEM_PROMPTS[characterId].content;
}

/** 获取完整 SystemPrompt 对象 */
export function getSystemPromptMeta(characterId: CharacterId): SystemPrompt {
  return SYSTEM_PROMPTS[characterId];
}

/** 构建 LLM messages 格式的 system 消息 */
export function buildSystemMessage(characterId: CharacterId): {
  role: "system";
  content: string;
} {
  const prompt = SYSTEM_PROMPTS[characterId];
  const parts = [prompt.content];
  if (prompt.constraints?.length) {
    parts.push("\n\n行为约束：\n" + prompt.constraints.map((c) => `- ${c}`).join("\n"));
  }
  return { role: "system", content: parts.join("") };
}

export type { SystemPrompt, SystemPromptMap };
