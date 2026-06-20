import type { CharacterId } from "~/data/characters";
import { appendSessionMessage } from "~/lib/chat-sessions";
import { incrementChatCount } from "~/lib/storage";
import { CHARACTER_DIALOGUES } from "./keywords";
import { DIALOGUE_SETTINGS } from "./settings";
import type { ChatMessage, GenerateReplyResult } from "./types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchKeyword(characterId: CharacterId, message: string): string | null {
  const config = CHARACTER_DIALOGUES[characterId];
  const lower = message.toLowerCase();

  for (const [key, replies] of Object.entries(config.keywords)) {
    if (message.includes(key) || lower.includes(key.toLowerCase())) {
      if (replies.length > 0) {
        return replies[Math.floor(Math.random() * replies.length)]!;
      }
    }
  }
  return null;
}

function fallbackReply(characterId: CharacterId): string {
  const pool = CHARACTER_DIALOGUES[characterId].fallbacks;
  if (!pool.length) return DIALOGUE_SETTINGS.defaultFallback;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export type LLMFetcher = (
  characterId: CharacterId,
  message: string,
  history: ChatMessage[],
) => Promise<string | null>;

/** 模板引擎回复（关键词 / 兜底），仅在 LLM 不可用时使用 */
export async function generateTemplateReply(
  characterId: CharacterId,
  userMessage: string,
): Promise<{ reply: string; source: "keyword" | "fallback" }> {
  const msg = userMessage.trim();
  const { typingDelayMin, typingDelayMax } = DIALOGUE_SETTINGS;
  await delay(typingDelayMin + Math.random() * (typingDelayMax - typingDelayMin));

  const keywordMatch = matchKeyword(characterId, msg);
  if (keywordMatch) {
    return { reply: keywordMatch, source: "keyword" };
  }
  return { reply: fallbackReply(characterId), source: "fallback" };
}

/** 生成角色回复 — 优先 LLM，失败时回退模板引擎 */
export async function generateReply(
  characterId: CharacterId,
  userMessage: string,
  history: ChatMessage[] = [],
  options?: { llmFetcher?: LLMFetcher; sessionId?: string },
): Promise<GenerateReplyResult> {
  const msg = userMessage.trim();
  if (!msg) {
    return { ok: false, reply: "说点什么吧，冥界不收空消息。" };
  }

  let reply: string;
  let source: GenerateReplyResult["source"];

  const llmReply = options?.llmFetcher
    ? await options.llmFetcher(characterId, msg, history)
    : null;

  if (llmReply) {
    reply = llmReply;
    source = "llm";
  } else {
    const template = await generateTemplateReply(characterId, msg);
    reply = template.reply;
    source = template.source;
  }

  if (options?.sessionId) {
    appendSessionMessage(options.sessionId, "user", msg);
    appendSessionMessage(options.sessionId, "assistant", reply);
  }
  incrementChatCount();

  return { ok: true, reply, characterId, source };
}

export { getGreeting } from "./keywords";
