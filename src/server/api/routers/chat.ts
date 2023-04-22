import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";

export const chatRouter = createTRPCRouter({
  getMessages: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { chatId: input.chatId },
        select: { id: true, message: true, userId: true },
      });

      return messages;
    }),
});
