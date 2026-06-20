/** 微信开放平台 — 网站应用扫码登录 */

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function isWechatConfigured(): boolean {
  return Boolean(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
}

/** 构建微信扫码登录 URL */
export function buildWechatQrConnectUrl(sessionId: string): string {
  const appId = process.env.WECHAT_APP_ID ?? "";
  const redirectUri = encodeURIComponent(`${getAppBaseUrl()}/api/auth/wechat/callback`);
  return (
    `https://open.weixin.qq.com/connect/qrconnect` +
    `?appid=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=snsapi_login` +
    `&state=${encodeURIComponent(sessionId)}` +
    `#wechat_redirect`
  );
}

/** 演示模式：扫码后打开的确认页 */
export function buildDemoConfirmUrl(sessionId: string): string {
  return `${getAppBaseUrl()}/login/wechat/confirm?session=${encodeURIComponent(sessionId)}`;
}

interface WechatTokenResponse {
  access_token?: string;
  openid?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatUserInfoResponse {
  nickname?: string;
  headimgurl?: string;
  errcode?: number;
  errmsg?: string;
}

/** 用授权 code 换取用户信息 */
export async function exchangeCodeForUserInfo(code: string): Promise<{
  openId: string;
  nickname: string;
  avatar: string;
} | null> {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret || !code) return null;

  try {
    const tokenUrl =
      `https://api.weixin.qq.com/sns/oauth2/access_token` +
      `?appid=${appId}&secret=${appSecret}&code=${encodeURIComponent(code)}&grant_type=authorization_code`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = (await tokenRes.json()) as WechatTokenResponse;

    if (!tokenData.access_token || !tokenData.openid) return null;

    const userUrl =
      `https://api.weixin.qq.com/sns/userinfo` +
      `?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;

    const userRes = await fetch(userUrl);
    const userData = (await userRes.json()) as WechatUserInfoResponse;

    if (userData.errcode) return null;

    return {
      openId: tokenData.openid,
      nickname: userData.nickname?.trim() || "微信用户",
      avatar: userData.headimgurl || "",
    };
  } catch {
    return null;
  }
}
