import { adminRouter } from "~/server/api/routers/admin";
import { authRouter } from "~/server/api/routers/auth";
import { chatRouter } from "~/server/api/routers/chat";
import { heroRouter } from "~/server/api/routers/hero";
import { createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  auth: authRouter,
  hero: heroRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
