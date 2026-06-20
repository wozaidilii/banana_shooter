import type { CharacterId } from "~/data/characters";
import { DIALOGUE_SETTINGS } from "~/characters/dialogue";
import type { StoredChatMessage } from "~/lib/storage";

const SESSIONS_KEY = "cyberTomb_chatSessions";
const LEGACY_HISTORY_KEY = "cyberTomb_chatHistory";

export interface ChatSession {
  id: string;
  characterId: CharacterId;
  title: string;
  messages: StoredChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatSessionStore {
  sessions: ChatSession[];
  activeByCharacter: Partial<Record<CharacterId, string>>;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadStore(): ChatSessionStore {
  if (typeof window === "undefined") {
    return { sessions: [], activeByCharacter: {} };
  }
  return safeParse<ChatSessionStore>(localStorage.getItem(SESSIONS_KEY), {
    sessions: [],
    activeByCharacter: {},
  });
}

function saveStore(store: ChatSessionStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function newSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTitle(): string {
  return "新对话";
}

/** 将旧版按角色聚合的历史迁移为会话 */
export function migrateLegacyChatHistory(): void {
  if (typeof window === "undefined") return;

  const store = loadStore();
  if (store.sessions.length > 0) return;

  const legacy = safeParse<Record<string, StoredChatMessage[]>>(
    localStorage.getItem(LEGACY_HISTORY_KEY),
    {},
  );

  for (const [characterId, messages] of Object.entries(legacy)) {
    if (!Array.isArray(messages) || messages.length === 0) continue;

    const session: ChatSession = {
      id: newSessionId(),
      characterId: characterId as CharacterId,
      title: "历史对话",
      messages,
      createdAt: messages[0]?.ts ?? Date.now(),
      updatedAt: messages[messages.length - 1]?.ts ?? Date.now(),
    };
    store.sessions.push(session);
    store.activeByCharacter[characterId as CharacterId] = session.id;
  }

  if (store.sessions.length > 0) {
    saveStore(store);
  }
}

export function getSessionsForCharacter(characterId: CharacterId): ChatSession[] {
  const store = loadStore();
  return store.sessions
    .filter((s) => s.characterId === characterId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSessionById(sessionId: string): ChatSession | null {
  return loadStore().sessions.find((s) => s.id === sessionId) ?? null;
}

export function getActiveSessionId(characterId: CharacterId): string | null {
  const store = loadStore();
  const id = store.activeByCharacter[characterId];
  if (id && store.sessions.some((s) => s.id === id && s.characterId === characterId)) {
    return id;
  }
  return null;
}

export function setActiveSession(characterId: CharacterId, sessionId: string): void {
  const store = loadStore();
  if (!store.sessions.some((s) => s.id === sessionId && s.characterId === characterId)) return;
  store.activeByCharacter[characterId] = sessionId;
  saveStore(store);
}

export function createSession(characterId: CharacterId): ChatSession {
  const store = loadStore();
  const now = Date.now();
  const session: ChatSession = {
    id: newSessionId(),
    characterId,
    title: defaultTitle(),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  store.sessions.unshift(session);
  store.activeByCharacter[characterId] = session.id;
  saveStore(store);
  return session;
}

/** 获取或创建当前角色的活跃会话 */
export function ensureActiveSession(characterId: CharacterId): ChatSession {
  return ensureSessionForCharacter(characterId);
}

export function getSessionMessages(sessionId: string): StoredChatMessage[] {
  return getSessionById(sessionId)?.messages ?? [];
}

export function appendSessionMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): void {
  if (!sessionId || !content) return;

  const store = loadStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;

  session.messages.push({ role, content, ts: Date.now() });
  session.updatedAt = Date.now();

  const max = DIALOGUE_SETTINGS.maxStoredMessages;
  if (session.messages.length > max) {
    session.messages = session.messages.slice(-max);
  }

  if (session.title === defaultTitle() && role === "user") {
    session.title = content.slice(0, 24) + (content.length > 24 ? "…" : "");
  }

  saveStore(store);
}

export function deleteSession(sessionId: string): ChatSession | null {
  const store = loadStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const { characterId } = session;
  store.sessions = store.sessions.filter((s) => s.id !== sessionId);

  const remaining = store.sessions
    .filter((s) => s.characterId === characterId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (remaining[0]) {
    store.activeByCharacter[characterId] = remaining[0].id;
    saveStore(store);
    return remaining[0];
  }

  delete store.activeByCharacter[characterId];
  saveStore(store);
  return createSession(characterId);
}

/** 确保角色至少有一个可对话的会话（无则自动创建） */
export function ensureSessionForCharacter(characterId: CharacterId): ChatSession {
  migrateLegacyChatHistory();
  const existing = getSessionsForCharacter(characterId);
  if (existing[0]) {
    const activeId = getActiveSessionId(characterId);
    if (activeId) {
      const active = getSessionById(activeId);
      if (active) return active;
    }
    setActiveSession(characterId, existing[0].id);
    return existing[0];
  }
  return createSession(characterId);
}

export function formatSessionTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}
