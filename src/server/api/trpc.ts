import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { verifyAdminToken } from "~/server/auth/admin";

export interface TRPCContext {
  isAdmin: boolean;
  userOpenId: string | null;
  userNickname: string | null;
}

export const createTRPCContext = async (opts?: {
  req?: Request;
}): Promise<TRPCContext> => {
  const headers = opts?.req?.headers;
  const adminToken = headers?.get("x-admin-token");
  const userOpenId = headers?.get("x-user-openid");
  const userNickname = headers?.get("x-user-nickname");

  return {
    isAdmin: verifyAdminToken(adminToken),
    userOpenId: userOpenId?.trim() || null,
    userNickname: userNickname?.trim() || null,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** 需微信登录 */
export const userProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userOpenId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先微信登录" });
  }
  return next({ ctx });
});

/** 需管理员登录 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "需要管理员权限" });
  }
  return next({ ctx });
});
