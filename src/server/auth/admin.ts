import crypto from "node:crypto";

const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "cyber-tomb-dev-secret";
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}

function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME ?? "admin";
}

/** 校验管理员账号密码 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const u = String(username ?? "").trim();
  const p = String(password ?? "");
  if (!u || !p) return false;
  return u === getAdminUsername() && p === getAdminPassword();
}

/** 签发管理员 token */
export function createAdminToken(): string {
  const payload = {
    role: "admin" as const,
    exp: Date.now() + ADMIN_TOKEN_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getAdminSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** 验证管理员 token */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;

  const expected = crypto.createHmac("sha256", getAdminSecret()).update(data).digest("base64url");
  if (sig !== expected) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as {
      role?: string;
      exp?: number;
    };
    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
