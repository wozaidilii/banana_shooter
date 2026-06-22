import { z } from "zod";
import {
  getHeroById,
  listApprovedHeroes,
  listHeroesBySubmitter,
  submitHero,
} from "~/server/db/heroes";
import {
  defaultDialogue,
  parseFallbackLines,
  toPublicHero,
} from "~/server/db/types";
import { createTRPCRouter, publicProcedure, userProcedure } from "~/server/api/trpc";

export const heroRouter = createTRPCRouter({
  /** 已审核通过的英雄列表（公开） */
  listApproved: publicProcedure.query(async () => {
    return listApprovedHeroes();
  }),

  /** 获取单个英雄详情 */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const hero = await getHeroById(input.id);
      if (!hero || hero.reviewStatus !== "approved") return null;
      return toPublicHero(hero);
    }),

  /** 用户提交英雄 — 需微信登录，进入待审核 */
  submit: userProcedure
    .input(
      z.object({
        name: z.string().min(1).max(30),
        realName: z.string().max(50).optional().default(""),
        emoji: z.string().max(4).optional().default("💀"),
        tagline: z.string().max(100).optional().default(""),
        epitaph: z.string().max(200).optional().default(""),
        color: z.string().max(20).optional().default("#00ffcc"),
        greeting: z.string().max(200).optional().default(""),
        persona: z.string().min(10).max(8000),
        fallbacksText: z.string().max(2000).optional().default(""),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const nickname = ctx.userNickname ?? "微信用户";
      const fallbacks = parseFallbackLines(input.fallbacksText);
      const hero = await submitHero(
        {
          name: input.name,
          realName: input.realName,
          emoji: input.emoji,
          tagline: input.tagline,
          epitaph: input.epitaph,
          color: input.color,
          dialogue: defaultDialogue(input.name, input.persona, input.greeting, fallbacks),
        },
        { openId: ctx.userOpenId!, nickname },
      );
      return { ok: true, hero: toPublicHero(hero) };
    }),

  /** 获取英雄对话配置（已审核） */
  getDialogue: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const hero = await getHeroById(input.id);
      if (!hero || hero.reviewStatus !== "approved") return null;
      return hero.dialogue;
    }),

  /** 我的提交记录 */
  mySubmissions: userProcedure.query(async ({ ctx }) => {
    const list = await listHeroesBySubmitter(ctx.userOpenId!);
    return list.map((h) => ({
      ...toPublicHero(h),
      reviewStatus: h.reviewStatus,
      reviewNote: h.reviewNote,
      submittedAt: h.createdAt,
    }));
  }),
});
