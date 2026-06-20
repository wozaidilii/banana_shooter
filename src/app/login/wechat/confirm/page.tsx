import { confirmLoginSession, getLoginSession } from "~/server/auth/sessions";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

/** 演示模式：手机扫码后打开的确认页 */
export default async function WechatConfirmPage({ searchParams }: PageProps) {
  const { session: sessionId } = await searchParams;
  const session = sessionId ? getLoginSession(sessionId) : null;

  let success = false;
  let message = "登录会话无效或已过期";

  if (session && session.mode === "demo" && session.status !== "confirmed") {
    confirmLoginSession(sessionId!, {
      openId: `demo_${sessionId!.slice(-8)}`,
      nickname: "微信冥友",
      avatar: "",
    });
    success = true;
    message = "扫码成功！请返回电脑端完成登录。";
  } else if (session?.status === "confirmed") {
    success = true;
    message = "已确认登录，请返回电脑端。";
  }

  return (
    <div className="wechat-confirm-page">
      <div className="wechat-confirm-card">
        <div className="wechat-confirm-icon">{success ? "✅" : "❌"}</div>
        <p className={success ? "wechat-confirm-ok" : "wechat-confirm-err"}>{message}</p>
        <small>赛博墓碑 · 微信登录</small>
      </div>
    </div>
  );
}
