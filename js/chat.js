// 对话引擎 — 人设模板回复 + LLM API 预留

import { getCharacter } from "./data.js";
import { appendChatMessage, incrementChatCount } from "./storage.js";

/** 从关键词表匹配回复 */
function matchKeyword(character, message) {
  const keywords = character.keywords;
  if (!keywords || typeof keywords !== "object") return null;

  const lower = message.toLowerCase();
  for (const [key, replies] of Object.entries(keywords)) {
    if (message.includes(key) || lower.includes(key.toLowerCase())) {
      const pool = Array.isArray(replies) ? replies : [];
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return null;
}

/** 随机兜底回复 */
function fallbackReply(character) {
  const pool = character.fallbacks;
  if (!Array.isArray(pool) || !pool.length) return "……（冥界信号不好）";
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 模拟打字延迟 */
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 未来 LLM 接入点
 * 设置 window.CYBER_TOMB_API = { endpoint, key } 即可启用
 */
async function callLLM(character, message, history) {
  const api = typeof window !== "undefined" ? window.CYBER_TOMB_API : null;
  if (!api?.endpoint) return null;

  try {
    const res = await fetch(api.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(api.key ? { Authorization: `Bearer ${api.key}` } : {}),
      },
      body: JSON.stringify({
        character: character.id,
        persona: character.persona,
        message,
        history: (history || []).slice(-10),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.reply || data?.content || null;
  } catch {
    return null;
  }
}

/** 生成角色回复 */
export async function generateReply(characterId, userMessage) {
  const character = getCharacter(characterId);
  if (!character) return { ok: false, reply: "该亡灵尚未苏醒……" };

  const msg = String(userMessage || "").trim();
  if (!msg) return { ok: false, reply: "说点什么吧，冥界不收空消息。" };

  // 先尝试 LLM
  const history = [];
  const llmReply = await callLLM(character, msg, history);
  let reply;
  if (llmReply) {
    reply = llmReply;
  } else {
    // 模板引擎
    await delay(400 + Math.random() * 800);
    reply = matchKeyword(character, msg) || fallbackReply(character);
  }

  appendChatMessage(characterId, "user", msg);
  appendChatMessage(characterId, "assistant", reply);
  incrementChatCount();

  return { ok: true, reply, character };
}

/** 开场白 */
export function getGreeting(characterId) {
  const c = getCharacter(characterId);
  if (!c) return "";
  const greetings = {
    laoda: "Man, what can I say... 欢迎来到赛博墓碑。有票吗？",
    zhangxuefeng: "同学你好，我是张雪峰。先别问考研了，先问问你投票了没？",
    dingzhen: "你好，我是丁真。今天天气很好，适合投票。",
    mabaoguo: "年轻人，你好。我劝你投票，要讲武德。",
    caixukun: "你好，练习时长两年半的蔡徐坤，在线等票。",
    fengge: "峰哥亡命天涯，冥界分部。聊点真实的？",
  };
  return greetings[c.id] || `我是${c.name}。赛博墓碑见。`;
}
