import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import isAlphanumeric from "validator/lib/isAlphanumeric";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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

      try {
        await ctx.prisma.user.create({
          data: { id: userId, username: input.username },
        });
      } catch (err) {
        // Throws error if username exists (P2002 code = unique constraint violated)
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        )
          throw new TRPCError({ code: "UNPROCESSABLE_CONTENT" });

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
