import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAdminToken,
  verifyAdminCredentials,
  verifyAdminToken,
} from "~/server/auth/admin";
import {
  createHeroAsAdmin,
  deleteHero,
  listAllHeroes,
  listPendingHeroes,
  reviewHero,
  updateHero,
} from "~/server/db/heroes";
import {
  defaultDialogue,
  parseFallbackLines,
  type HeroInput,
} from "~/server/db/types";
import { adminProcedure, createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const dialogueSchema = z.object({
  greeting: z.string().max(200),
  persona: z.string().max(8000),
  keywords: z.record(z.array(z.string())).optional(),
  fallbacks: z.array(z.string()).max(20),
});

const heroFormSchema = z.object({
  name: z.string().min(1).max(30),
  realName: z.string().max(50).optional().default(""),
  emoji: z.string().max(4).optional().default("💀"),
  tagline: z.string().max(100).optional().default(""),
  epitaph: z.string().max(200).optional().default(""),
  color: z.string().max(20).optional().default("#00ffcc"),
  status: z.enum(["candidate", "resurrected"]).optional(),
  greeting: z.string().max(200).optional().default(""),
  persona: z.string().max(8000).optional().default(""),
  fallbacksText: z.string().max(2000).optional().default(""),
  dialogue: dialogueSchema.optional(),
});

function toHeroInput(data: z.infer<typeof heroFormSchema>): HeroInput {
  if (data.dialogue) {
    return {
      name: data.name,
      realName: data.realName,
      emoji: data.emoji,
      tagline: data.tagline,
      epitaph: data.epitaph,
      color: data.color,
      status: data.status,
      dialogue: {
        greeting: data.dialogue.greeting,
        persona: data.dialogue.persona,
        keywords: data.dialogue.keywords ?? {},
        fallbacks: data.dialogue.fallbacks,
      },
    };
  }

  const fallbacks = parseFallbackLines(data.fallbacksText);
  return {
    name: data.name,
    realName: data.realName,
    emoji: data.emoji,
    tagline: data.tagline,
    epitaph: data.epitaph,
    color: data.color,
    status: data.status,
    dialogue: defaultDialogue(data.name, data.persona, data.greeting, fallbacks),
  };
}

export const adminRouter = createTRPCRouter({
  /** 管理员登录 */
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(({ input }) => {
      if (!verifyAdminCredentials(input.username, input.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "账号或密码错误" });
      }
      return { token: createAdminToken() };
    }),

  /** 验证当前 token 是否有效 */
  verify: publicProcedure.query(({ ctx }) => ({
    isAdmin: ctx.isAdmin,
  })),

  /** 全部英雄 */
  listAll: adminProcedure.query(async () => {
    return listAllHeroes();
  }),

  /** 待审核 */
  listPending: adminProcedure.query(async () => {
    return listPendingHeroes();
  }),

  /** 管理员新建英雄（直接通过） */
  create: adminProcedure.input(heroFormSchema).mutation(async ({ input }) => {
    const hero = await createHeroAsAdmin(toHeroInput(input));
    return { ok: true, hero };
  }),

  /** 编辑英雄 */
  update: adminProcedure
    .input(z.object({ id: z.string(), data: heroFormSchema.partial() }))
    .mutation(async ({ input }) => {
      const patch = input.data.name ? toHeroInput(input.data as z.infer<typeof heroFormSchema>) : undefined;
      const partial: Partial<HeroInput> = patch ?? {};

      if (input.data.name) partial.name = input.data.name;
      if (input.data.realName !== undefined) partial.realName = input.data.realName;
      if (input.data.emoji !== undefined) partial.emoji = input.data.emoji;
      if (input.data.tagline !== undefined) partial.tagline = input.data.tagline;
      if (input.data.epitaph !== undefined) partial.epitaph = input.data.epitaph;
      if (input.data.color !== undefined) partial.color = input.data.color;
      if (input.data.status !== undefined) partial.status = input.data.status;
      if (input.data.dialogue) {
        partial.dialogue = {
          ...input.data.dialogue,
          keywords: input.data.dialogue.keywords ?? {},
        };
      } else if (input.data.persona !== undefined || input.data.greeting !== undefined || input.data.fallbacksText !== undefined) {
        const existing = await listAllHeroes();
        const current = existing.find((h) => h.id === input.id);
        if (current) {
          partial.dialogue = {
            greeting: input.data.greeting ?? current.dialogue.greeting,
            persona: input.data.persona ?? current.dialogue.persona,
            keywords: current.dialogue.keywords,
            fallbacks: input.data.fallbacksText
              ? parseFallbackLines(input.data.fallbacksText)
              : current.dialogue.fallbacks,
          };
        }
      }

      const hero = await updateHero(input.id, partial);
      if (!hero) {
        throw new TRPCError({ code: "NOT_FOUND", message: "英雄不存在" });
      }
      return { ok: true, hero };
    }),

  /** 删除英雄 */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const ok = await deleteHero(input.id);
      if (!ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "无法删除（不存在或为官方英雄）" });
      }
      return { ok: true };
    }),

  /** 审核用户提交 */
  review: adminProcedure
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["approved", "rejected"]),
        reviewNote: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const hero = await reviewHero(input.id, input.decision, input.reviewNote);
      if (!hero) {
        throw new TRPCError({ code: "NOT_FOUND", message: "待审核英雄不存在" });
      }
      return { ok: true, hero };
    }),
});
