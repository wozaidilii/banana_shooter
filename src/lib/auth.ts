import { saveProfile } from "~/lib/storage";

const AUTH_KEY = "cyberTomb_auth";
const AUTH_EVENT = "cyberTomb:auth";

export interface AuthUser {
  openId: string;
  nickname: string;
  avatar: string;
  loginMethod: "wechat";
  loggedInAt: number;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 读取当前登录用户 */
export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const user = safeParse<AuthUser | null>(localStorage.getItem(AUTH_KEY), null);
  if (!user?.openId) return null;
  return user;
}

/** 登录并同步用户资料 */
export function loginWithWechat(user: Omit<AuthUser, "loginMethod" | "loggedInAt">): AuthUser {
  const authUser: AuthUser = {
    openId: user.openId,
    nickname: user.nickname || "微信用户",
    avatar: user.avatar || "",
    loginMethod: "wechat",
    loggedInAt: Date.now(),
  };

  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
  } catch {
    // 存储失败不阻断流程
  }

  // 同步到冥界档案
  saveProfile({
    nickname: authUser.nickname,
    avatar: authUser.avatar ? "" : "👻",
  });

  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: authUser }));
  return authUser;
}

/** 退出登录 */
export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

export { AUTH_EVENT };
