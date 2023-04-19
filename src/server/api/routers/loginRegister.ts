import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import isAlphanumeric from "validator/lib/isAlphanumeric";
import { TRPCError } from "@trpc/server";

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
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3, {
            message: "Username must be at least 3 characters in length",
          })
          .max(20, {
            message: "Username may only be up to 20 characters in length",
          })
          .refine((val) => isAlphanumeric(val), {
            message: "Username may only contain alphanumeric characters",
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const existingUsername = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        select: { username: true },
      });

      if (existingUsername) throw new TRPCError({ code: "CONFLICT" });

      const user = await ctx.prisma.user.create({
        data: { id: userId, username: input.username },
      });

      return user;
    }),
});
