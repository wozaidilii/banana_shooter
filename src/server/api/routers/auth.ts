import QRCode from "qrcode";
import { z } from "zod";
import {
  confirmLoginSession,
  createLoginSession,
  getLoginSession,
  simulateDemoLogin,
} from "~/server/auth/sessions";
import {
  buildDemoConfirmUrl,
  buildWechatQrConnectUrl,
  isWechatConfigured,
} from "~/server/auth/wechat";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  /** 创建微信扫码登录会话，返回二维码 */
  createLoginSession: publicProcedure.mutation(async () => {
    const wechatMode = isWechatConfigured();
    const qrContent = wechatMode
      ? buildWechatQrConnectUrl("pending")
      : buildDemoConfirmUrl("pending");

    // 先占位创建，再用真实 sessionId 替换二维码内容
    const session = createLoginSession(qrContent, wechatMode ? "wechat" : "demo");
    const finalQrContent = wechatMode
      ? buildWechatQrConnectUrl(session.id)
      : buildDemoConfirmUrl(session.id);
    session.qrContent = finalQrContent;

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(finalQrContent, {
        width: 220,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch {
      qrDataUrl = "";
    }

    return {
      sessionId: session.id,
      qrDataUrl,
      expiresAt: session.expiresAt,
      mode: session.mode,
    };
  }),

  /** 轮询登录状态 */
  getSessionStatus: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(({ input }) => {
      const session = getLoginSession(input.sessionId);
      if (!session) {
        return { status: "expired" as const, user: null };
      }

      return {
        status: session.status,
        user: session.user
          ? {
              openId: session.user.openId,
              nickname: session.user.nickname,
              avatar: session.user.avatar,
            }
          : null,
      };
    }),

  /** 开发模式：模拟扫码成功 */
  simulateLogin: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(({ input }) => {
      const session = simulateDemoLogin(input.sessionId);
      if (!session?.user) {
        return { ok: false as const, user: null };
      }
      return {
        ok: true as const,
        user: {
          openId: session.user.openId,
          nickname: session.user.nickname,
          avatar: session.user.avatar,
        },
      };
    }),
});

export { confirmLoginSession };
