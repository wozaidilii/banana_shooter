import { authRouter } from "~/server/api/routers/auth";
import { chatRouter } from "~/server/api/routers/chat";
import { createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
