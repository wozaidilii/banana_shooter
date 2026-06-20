import { z } from "zod";
import { buildSystemMessage, getSystemPrompt } from "~/characters/prompts";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

/** 聊天 tRPC 路由 — 预留服务端 LLM 调用入口 */
export const chatRouter = createTRPCRouter({
  /** 获取角色的 system prompt（供客户端或 API 网关使用） */
  getSystemPrompt: publicProcedure
    .input(z.object({ characterId: z.string() }))
    .query(({ input }) => {
      const prompt = getSystemPrompt(input.characterId as Parameters<typeof getSystemPrompt>[0]);
      const message = buildSystemMessage(input.characterId as Parameters<typeof buildSystemMessage>[0]);
      return { prompt, systemMessage: message };
    }),

  /** 服务端 LLM 代理（需配置 LLM_API_ENDPOINT 环境变量） */
  generateReply: publicProcedure
    .input(
      z.object({
        characterId: z.string(),
        message: z.string().min(1).max(500),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const endpoint = process.env.LLM_API_ENDPOINT;
      if (!endpoint) {
        return { ok: false as const, reply: null, reason: "LLM API 未配置" };
      }

      const systemMessage = buildSystemMessage(
        input.characterId as Parameters<typeof buildSystemMessage>[0],
      );

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.LLM_API_KEY
              ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` }
              : {}),
          },
          body: JSON.stringify({
            character: input.characterId,
            systemPrompt: systemMessage.content,
            message: input.message,
            history: input.history ?? [],
          }),
        });

        if (!res.ok) {
          return { ok: false as const, reply: null, reason: "LLM 请求失败" };
        }

        const data = (await res.json()) as { reply?: string; content?: string };
        return {
          ok: true as const,
          reply: data.reply ?? data.content ?? null,
          reason: null,
        };
      } catch {
        return { ok: false as const, reply: null, reason: "LLM 请求异常" };
      }
    }),
});
