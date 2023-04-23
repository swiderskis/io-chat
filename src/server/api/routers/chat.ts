import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/dist/api";

const filterUserDetails = (user: User) => {
  return { id: user.id, profileImageUrl: user.profileImageUrl };
};

export const chatRouter = createTRPCRouter({
  getMessages: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { chatId: input.chatId },
        select: { id: true, message: true, userId: true },
      });

      const users = (
        await clerkClient.users.getUserList({
          userId: messages.map((message) => message.userId),
        })
      ).map(filterUserDetails);

      return messages.map((message) => ({
        message,
        profileImageUrl: users.find((user) => user.id === message.userId),
      }));
    }),
});
