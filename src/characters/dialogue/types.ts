import type { CharacterId } from "~/data/characters";

/** 关键词 → 回复列表 */
export type KeywordReplies = Record<string, string[]>;

/** 单个角色的对话配置 */
export interface CharacterDialogueConfig {
  characterId: CharacterId;
  keywords: KeywordReplies;
  fallbacks: string[];
  greeting: string;
}

export type CharacterDialogueMap = Record<CharacterId, CharacterDialogueConfig>;

/** 对话引擎全局设置 */
export interface DialogueSettings {
  /** 模拟打字延迟范围（毫秒） */
  typingDelayMin: number;
  typingDelayMax: number;
  /** 发送给 LLM 的历史消息条数上限 */
  maxHistoryForLLM: number;
  /** localStorage 聊天记录条数上限 */
  maxStoredMessages: number;
  /** 无匹配时的默认回复 */
  defaultFallback: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts?: number;
}

export interface GenerateReplyResult {
  ok: boolean;
  reply: string;
  characterId?: CharacterId;
  source?: "llm" | "keyword" | "fallback";
}

export interface LLMApiConfig {
  endpoint: string;
  key?: string;
}
