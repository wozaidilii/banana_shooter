"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateReply, getGreeting, type LLMFetcher } from "~/characters/dialogue";
import type { CharacterId } from "~/data/characters";
import { CHARACTERS } from "~/data/characters";
import { showToast } from "~/components/Toast";
import {
  clearChatHistory,
  getChatCount,
  getChatHistory,
  grantTitle,
  type StoredChatMessage,
} from "~/lib/storage";
import { api } from "~/trpc/react";

interface ChatViewProps {
  initialCharacterId?: CharacterId;
}

export function ChatView({ initialCharacterId }: ChatViewProps) {
  const [activeId, setActiveId] = useState<CharacterId>(
    initialCharacterId ?? CHARACTERS[0]!.id,
  );
  const [history, setHistory] = useState<StoredChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: llmStatus } = api.chat.isConfigured.useQuery();
  const { mutateAsync: generateLLMReply } = api.chat.generateReply.useMutation();

  const char = CHARACTERS.find((c) => c.id === activeId);

  const loadHistory = useCallback((id: CharacterId) => {
    const all = getChatHistory();
    setHistory(all[id] ?? []);
  }, []);

  useEffect(() => {
    loadHistory(activeId);
  }, [activeId, loadHistory]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [history, typing]);

  const llmFetcher: LLMFetcher = useCallback(
    async (characterId, message, chatHistory) => {
      try {
        const result = await generateLLMReply({
          characterId,
          message,
          history: chatHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        if (result.ok && result.reply) {
          return result.reply;
        }

        if (result.reason) {
          console.warn("[ChatView] LLM fallback:", result.reason);
        }
        return null;
      } catch (err) {
        console.error("[ChatView] LLM request failed:", err);
        return null;
      }
    },
    [generateLLMReply],
  );

  const handleSelect = (id: CharacterId) => {
    setActiveId(id);
    setInput("");
  };

  const handleClear = () => {
    clearChatHistory(activeId);
    loadHistory(activeId);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;

    setInput("");
    // 立即显示用户消息，再等待 AI 回复
    setHistory((prev) => [...prev, { role: "user", content: text, ts: Date.now() }]);
    setTyping(true);

    const result = await generateReply(activeId, text, history, { llmFetcher });

    setTyping(false);

    if (result.ok) {
      setHistory(getChatHistory()[activeId] ?? []);
      if (result.source !== "llm" && llmStatus?.configured) {
        showToast("AI 暂时没响应，已改用模板回复", "info");
      }
      if (getChatCount() >= 10) grantTitle("chat_10");
    } else {
      setHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
      showToast(result.reply, "error");
    }
  };

  const greeting = getGreeting(activeId);

  return (
    <>
      <section className="page-header">
        <h2>💬 亡灵对话</h2>
        <p>
          缺德抽象，人设拉满 — 和赛博亡灵聊聊天
          {llmStatus?.configured && (
            <span className="chat-mode-badge"> · AI 已连接 ({llmStatus.model})</span>
          )}
        </p>
      </section>

      <div className="chat-layout">
        <aside className="chat-sidebar">
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              className={`chat-contact${c.id === activeId ? " active" : ""}`}
              onClick={() => handleSelect(c.id)}
            >
              <span>{c.emoji}</span>
              <div>
                <strong>{c.name}</strong>
                <small>{c.tagline}</small>
              </div>
            </button>
          ))}
        </aside>

        <div className="chat-main">
          <div className="chat-header">
            <span className="chat-header-emoji">{char?.emoji}</span>
            <div>
              <strong>{char?.name}</strong>
              <small>{char?.realName}</small>
            </div>
            <button className="btn-sm btn-ghost" onClick={handleClear}>
              清空
            </button>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            <div className="chat-bubble assistant">
              <span className="bubble-avatar">{char?.emoji}</span>
              <div className="bubble-content">{greeting}</div>
            </div>
            {history.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role === "user" ? "user" : "assistant"}`}>
                {m.role !== "user" && <span className="bubble-avatar">{char?.emoji}</span>}
                <div className="bubble-content">{m.content}</div>
              </div>
            ))}
            {typing && (
              <div className="chat-bubble assistant typing">
                <span className="bubble-avatar">{char?.emoji}</span>
                <div className="bubble-content">
                  <span className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSend()}
              placeholder="说点什么缺德的……"
              maxLength={500}
              autoComplete="off"
            />
            <button className="btn btn-primary" onClick={() => void handleSend()} disabled={typing}>
              发送
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
