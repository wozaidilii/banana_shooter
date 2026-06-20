import { NextResponse } from "next/server";
import { confirmLoginSession, getLoginSession } from "~/server/auth/sessions";
import { exchangeCodeForUserInfo } from "~/server/auth/wechat";

/** 微信开放平台 OAuth 回调 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const sessionId = searchParams.get("state") ?? "";

  const session = getLoginSession(sessionId);
  if (!session) {
    return htmlResponse("登录会话已过期，请返回重新扫码。", false);
  }

  if (!code) {
    return htmlResponse("授权失败，未获取到 code。", false);
  }

  const userInfo = await exchangeCodeForUserInfo(code);
  if (!userInfo) {
    return htmlResponse("获取微信用户信息失败，请重试。", false);
  }

  confirmLoginSession(sessionId, userInfo);
  return htmlResponse(`欢迎，${userInfo.nickname}！请返回网页完成登录。`, true);
}

function htmlResponse(message: string, success: boolean): NextResponse {
  const color = success ? "#22c55e" : "#ff4444";
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>微信登录 - 赛博墓碑</title>
  <style>
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0a0a0f; color: #e8e8f0; font-family: system-ui, sans-serif;
      padding: 24px; text-align: center;
    }
    .card {
      max-width: 320px; padding: 32px 24px; border-radius: 16px;
      background: #12121a; border: 1px solid rgba(0,255,204,0.15);
    }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    p { line-height: 1.6; color: ${color}; }
    small { color: #8888a0; display: block; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "❌"}</div>
    <p>${message}</p>
    <small>可以关闭此页面了</small>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
