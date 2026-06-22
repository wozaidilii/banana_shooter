"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateReplyWithDialogue,
  getGreetingFromConfig,
  type LLMFetcher,
} from "~/characters/dialogue";
import type { CharacterId } from "~/data/characters";
import { useHeroes } from "~/context/HeroContext";
import { showToast } from "~/components/Toast";
import {
  createSession,
  deleteSession,
  ensureSessionForCharacter,
  formatSessionTime,
  getSessionMessages,
  getSessionsForCharacter,
  migrateLegacyChatHistory,
  setActiveSession,
  type ChatSession,
} from "~/lib/chat-sessions";
import { getChatCount, grantTitle, type StoredChatMessage } from "~/lib/storage";
import { api } from "~/trpc/react";

interface ChatViewProps {
  initialCharacterId?: CharacterId;
}

export function ChatView({ initialCharacterId }: ChatViewProps) {
  const { heroes } = useHeroes();
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterId>(
    initialCharacterId ?? heroes[0]?.id ?? "laoda",
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: llmStatus } = api.chat.isConfigured.useQuery();
  const { mutateAsync: generateLLMReply } = api.chat.generateReply.useMutation();
  const { data: dialogueConfig } = api.hero.getDialogue.useQuery(
    { id: activeCharacterId },
    { enabled: Boolean(activeCharacterId) },
  );

  const char = heroes.find((c) => c.id === activeCharacterId);

  const refreshSessions = useCallback((characterId: CharacterId, sessionId?: string) => {
    migrateLegacyChatHistory();
    const session = sessionId
      ? getSessionsForCharacter(characterId).find((s) => s.id === sessionId) ??
        ensureSessionForCharacter(characterId)
      : ensureSessionForCharacter(characterId);

    setSessions(getSessionsForCharacter(characterId));
    setActiveSessionId(session.id);
    setActiveSession(characterId, session.id);
    setMessages(getSessionMessages(session.id));
    return session;
  }, []);

  useEffect(() => {
    refreshSessions(activeCharacterId);
  }, [activeCharacterId, refreshSessions]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages, typing]);

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

  const handleSelectCharacter = (id: CharacterId) => {
    setActiveCharacterId(id);
    setInput("");
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveSession(activeCharacterId, sessionId);
    setMessages(getSessionMessages(sessionId));
    setInput("");
  };

  const handleNewSession = () => {
    const session = createSession(activeCharacterId);
    refreshSessions(activeCharacterId, session.id);
    setInput("");
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = deleteSession(sessionId);
    if (next) {
      refreshSessions(activeCharacterId, next.id);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const session = activeSessionId
      ? refreshSessions(activeCharacterId, activeSessionId)
      : refreshSessions(activeCharacterId);

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, ts: Date.now() }]);
    setTyping(true);

    const result = dialogueConfig
      ? await generateReplyWithDialogue(activeCharacterId, text, dialogueConfig, messages, {
          llmFetcher,
          sessionId: session.id,
        })
      : { ok: false as const, reply: "角色对话配置加载中，请稍后再试" };

    setTyping(false);

    if (result.ok) {
      setMessages(getSessionMessages(session.id));
      refreshSessions(activeCharacterId, session.id);
      if (result.source !== "llm" && llmStatus?.configured) {
        showToast("AI 暂时没响应，已改用模板回复", "info");
      }
      if (getChatCount() >= 10) grantTitle("chat_10");
    } else {
      setMessages((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
      showToast(result.reply, "error");
    }
  };

  const greeting =
    dialogueConfig?.greeting ??
    char?.dialogue?.greeting ??
    getGreetingFromConfig({
      greeting: `你好，我是${char?.name ?? "冥界居民"}。`,
      persona: "",
      keywords: {},
      fallbacks: [],
    });

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

      <div className="chat-char-tabs">
        {heroes.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chat-char-tab${c.id === activeCharacterId ? " active" : ""}`}
            style={{ "--accent": c.color } as React.CSSProperties}
            onClick={() => handleSelectCharacter(c.id)}
          >
            <span>{c.emoji}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="chat-layout">
        <aside className="chat-session-sidebar">
          <button type="button" className="chat-new-session" onClick={handleNewSession}>
            ＋ 新对话
          </button>
          <div className="chat-session-list">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chat-session-item${s.id === activeSessionId ? " active" : ""}`}
                onClick={() => handleSelectSession(s.id)}
              >
                <span className="chat-session-title">{s.title}</span>
                <span className="chat-session-meta">
                  {formatSessionTime(s.updatedAt)} · {s.messages.length} 条
                </span>
                <span
                  className="chat-session-delete"
                  role="button"
                  tabIndex={0}
                  aria-label="删除对话"
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDeleteSession(s.id, e as unknown as React.MouseEvent);
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="chat-main">
          <div className="chat-header">
            <span className="chat-header-emoji">{char?.emoji}</span>
            <div>
              <strong>{char?.name}</strong>
              <small>{char?.realName}</small>
            </div>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            <div className="chat-bubble assistant chat-greeting">
              <span className="bubble-avatar">{char?.emoji}</span>
              <div className="bubble-content">{greeting}</div>
            </div>
            {messages.map((m, i) => (
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
              disabled={typing}
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
