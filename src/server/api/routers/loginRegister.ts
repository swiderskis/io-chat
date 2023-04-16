import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";

export const loginRegisterRouter = createTRPCRouter({
  getUsername: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const username = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    return username;
  }),

  setUsername: privateProcedure
    .input(
      z.object({
        username: z.string().trim().min(3).max(20).toLowerCase(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const user = await ctx.prisma.user.create({
        data: { id: userId, username: input.username },
      });

      return user;
    }),
});
