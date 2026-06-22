/** 客户端管理员 token 存取 */

const ADMIN_TOKEN_KEY = "cyberTomb_admin_token";
export const ADMIN_AUTH_EVENT = "cyberTomb:admin-auth";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EVENT, { detail: token }));
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EVENT, { detail: null }));
}
