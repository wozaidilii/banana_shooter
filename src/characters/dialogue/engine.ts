import type { CharacterId } from "~/data/characters";
import { buildSystemMessage } from "~/characters/prompts";
import { appendChatMessage, incrementChatCount } from "~/lib/storage";
import { CHARACTER_DIALOGUES } from "./keywords";
import { DIALOGUE_SETTINGS, getLLMConfig } from "./settings";
import type { ChatMessage, GenerateReplyResult } from "./types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchKeyword(
  characterId: CharacterId,
  message: string,
): string | null {
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

/** 调用 DeepSeek Chat Completions API */
async function callLLM(
  characterId: CharacterId,
  message: string,
  history: ChatMessage[],
): Promise<string | null> {
  const api = getLLMConfig();
  if (!api.endpoint || !api.key) return null;

  const systemMessage = buildSystemMessage(characterId);
  const recentHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-DIALOGUE_SETTINGS.maxHistoryForLLM)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const res = await fetch(api.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api.key}`,
      },
      body: JSON.stringify({
        model: api.model ?? "deepseek-v4-flash",
        messages: [
          systemMessage,
          ...recentHistory,
          { role: "user", content: message },
        ],
        thinking: { type: "disabled" },
        temperature: 0.85,
        max_tokens: 512,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/** 生成角色回复 — 主入口 */
export async function generateReply(
  characterId: CharacterId,
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<GenerateReplyResult> {
  const msg = userMessage.trim();
  if (!msg) {
    return { ok: false, reply: "说点什么吧，冥界不收空消息。" };
  }

  const llmReply = await callLLM(characterId, msg, history);
  let reply: string;
  let source: GenerateReplyResult["source"];

  if (llmReply) {
    reply = llmReply;
    source = "llm";
  } else {
    const { typingDelayMin, typingDelayMax } = DIALOGUE_SETTINGS;
    await delay(typingDelayMin + Math.random() * (typingDelayMax - typingDelayMin));
    const keywordMatch = matchKeyword(characterId, msg);
    if (keywordMatch) {
      reply = keywordMatch;
      source = "keyword";
    } else {
      reply = fallbackReply(characterId);
      source = "fallback";
    }
  }

  appendChatMessage(characterId, "user", msg);
  appendChatMessage(characterId, "assistant", reply);
  incrementChatCount();

  return { ok: true, reply, characterId, source };
}

export { getGreeting } from "./keywords";
