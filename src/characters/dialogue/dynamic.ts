import type { HeroDialogue } from "~/server/db/types";
import { appendSessionMessage } from "~/lib/chat-sessions";
import { incrementChatCount } from "~/lib/storage";
import { DIALOGUE_SETTINGS } from "./settings";
import type { ChatMessage, GenerateReplyResult } from "./types";
import { CHARACTER_DIALOGUES, getGreeting as getStaticGreeting } from "./keywords";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchKeywordFromConfig(dialogue: HeroDialogue, message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, replies] of Object.entries(dialogue.keywords ?? {})) {
    if (message.includes(key) || lower.includes(key.toLowerCase())) {
      if (replies.length > 0) {
        return replies[Math.floor(Math.random() * replies.length)]!;
      }
    }
  }
  return null;
}

function fallbackFromConfig(dialogue: HeroDialogue): string {
  const pool = dialogue.fallbacks ?? [];
  if (!pool.length) return DIALOGUE_SETTINGS.defaultFallback;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** 使用动态对话配置生成模板回复 */
export async function generateTemplateReplyWithConfig(
  dialogue: HeroDialogue,
  userMessage: string,
): Promise<{ reply: string; source: "keyword" | "fallback" }> {
  const msg = userMessage.trim();
  const { typingDelayMin, typingDelayMax } = DIALOGUE_SETTINGS;
  await delay(typingDelayMin + Math.random() * (typingDelayMax - typingDelayMin));

  const keywordMatch = matchKeywordFromConfig(dialogue, msg);
  if (keywordMatch) {
    return { reply: keywordMatch, source: "keyword" };
  }
  return { reply: fallbackFromConfig(dialogue), source: "fallback" };
}

export function getGreetingFromConfig(dialogue: HeroDialogue): string {
  return dialogue.greeting?.trim() || DIALOGUE_SETTINGS.defaultFallback;
}

/** 静态英雄 greeting（兼容旧逻辑） */
export function getGreeting(characterId: string): string {
  const config = CHARACTER_DIALOGUES[characterId as keyof typeof CHARACTER_DIALOGUES];
  if (config) return getStaticGreeting(characterId as Parameters<typeof getStaticGreeting>[0]);
  return DIALOGUE_SETTINGS.defaultFallback;
}

export type LLMFetcher = (
  characterId: string,
  message: string,
  history: ChatMessage[],
) => Promise<string | null>;

/** 生成角色回复 — 支持动态 dialogue 配置 */
export async function generateReplyWithDialogue(
  characterId: string,
  userMessage: string,
  dialogue: HeroDialogue,
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
    const template = await generateTemplateReplyWithConfig(dialogue, msg);
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
