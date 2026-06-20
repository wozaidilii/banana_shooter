/** 微信扫码登录会话（内存存储，生产环境可换 Redis） */

export type LoginSessionStatus = "waiting" | "scanned" | "confirmed" | "expired";

export interface WechatUserInfo {
  openId: string;
  nickname: string;
  avatar: string;
}

export interface LoginSession {
  id: string;
  status: LoginSessionStatus;
  createdAt: number;
  expiresAt: number;
  qrContent: string;
  mode: "wechat" | "demo";
  user?: WechatUserInfo;
}

const SESSION_TTL_MS = 5 * 60 * 1000;
const sessions = new Map<string, LoginSession>();

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) {
      session.status = "expired";
      sessions.delete(id);
    }
  }
}

function generateSessionId(): string {
  return `wx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 创建登录会话 */
export function createLoginSession(qrContent: string, mode: "wechat" | "demo"): LoginSession {
  cleanupExpired();
  const now = Date.now();
  const session: LoginSession = {
    id: generateSessionId(),
    status: "waiting",
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    qrContent,
    mode,
  };
  sessions.set(session.id, session);
  return session;
}

/** 获取会话（过期则标记并返回 null） */
export function getLoginSession(sessionId: string): LoginSession | null {
  if (!sessionId) return null;
  cleanupExpired();
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    session.status = "expired";
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

/** 标记已扫码 */
export function markSessionScanned(sessionId: string): boolean {
  const session = getLoginSession(sessionId);
  if (!session || session.status !== "waiting") return false;
  session.status = "scanned";
  return true;
}

/** 确认登录并写入用户信息 */
export function confirmLoginSession(
  sessionId: string,
  user: WechatUserInfo,
): LoginSession | null {
  const session = getLoginSession(sessionId);
  if (!session) return null;
  session.status = "confirmed";
  session.user = user;
  return session;
}

/** 开发模式：模拟扫码确认 */
export function simulateDemoLogin(sessionId: string): LoginSession | null {
  const session = getLoginSession(sessionId);
  if (!session || session.mode !== "demo") return null;

  return confirmLoginSession(sessionId, {
    openId: `demo_${sessionId.slice(-8)}`,
    nickname: "微信冥友",
    avatar: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjM/0",
  });
}
