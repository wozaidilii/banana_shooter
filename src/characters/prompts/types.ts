import type { CharacterId } from "~/data/characters";

/** 系统提示词结构 — 供 LLM API 使用 */
export interface SystemPrompt {
  characterId: CharacterId;
  /** 角色名称，用于日志与调试 */
  name: string;
  /** 核心 system prompt */
  content: string;
  /** 可选：补充行为约束 */
  constraints?: string[];
}

export type SystemPromptMap = Record<CharacterId, SystemPrompt>;
