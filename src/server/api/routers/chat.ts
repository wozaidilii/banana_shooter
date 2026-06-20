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
      const endpoint =
        process.env.LLM_API_ENDPOINT ?? "https://api.deepseek.com/chat/completions";
      const apiKey = process.env.LLM_API_KEY;
      if (!apiKey) {
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
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL ?? "deepseek-v4-flash",
            messages: [
              systemMessage,
              ...(input.history ?? []),
              { role: "user", content: input.message },
            ],
            thinking: { type: "disabled" },
            temperature: 0.85,
            max_tokens: 512,
          }),
        });

        if (!res.ok) {
          return { ok: false as const, reply: null, reason: "LLM 请求失败" };
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content?.trim() ?? null;
        return {
          ok: true as const,
          reply,
          reason: null,
        };
      } catch {
        return { ok: false as const, reply: null, reason: "LLM 请求异常" };
      }
    }),
});
