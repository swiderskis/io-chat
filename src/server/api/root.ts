import { createTRPCRouter } from "~/server/api/trpc";
import { loginRegisterRouter } from "./routers/loginRegister";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  loginRegister: loginRegisterRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
