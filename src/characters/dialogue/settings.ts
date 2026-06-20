import type { DialogueSettings } from "./types";

/** 对话引擎全局配置 — 接入 LLM 前可在此调整行为 */
export const DIALOGUE_SETTINGS: DialogueSettings = {
  typingDelayMin: 400,
  typingDelayMax: 1200,
  maxHistoryForLLM: 10,
  maxStoredMessages: 50,
  defaultFallback: "……（冥界信号不好）",
};

/** LLM API 配置（可在运行时通过环境变量或客户端注入覆盖） */
export function getLLMConfig(): {
  endpoint?: string;
  key?: string;
  model?: string;
} {
  if (typeof window !== "undefined") {
    const api = (
      window as Window & {
        CYBER_TOMB_API?: { endpoint?: string; key?: string; model?: string };
      }
    ).CYBER_TOMB_API;
    if (api?.endpoint) return api;
  }
  return {
    endpoint: process.env.NEXT_PUBLIC_LLM_ENDPOINT,
    key: process.env.NEXT_PUBLIC_LLM_API_KEY,
    model: process.env.NEXT_PUBLIC_LLM_MODEL ?? "deepseek-v4-flash",
  };
}
