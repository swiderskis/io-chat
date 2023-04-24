import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { User } from "@clerk/nextjs/dist/api";

const filterUserDetails = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

export const chatRouter = createTRPCRouter({
  getMessages: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { chatId: input.chatId },
        select: { id: true, message: true, userId: true },
        orderBy: { id: "desc" },
      });

      const users = (
        await clerkClient.users.getUserList({
          userId: messages.map((message) => message.userId),
        })
      ).map(filterUserDetails);

      return messages.map((message) => ({
        message,
        userDetails: users.find((user) => user.id === message.userId),
      }));
    }),

  getChatDetails: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const members = await ctx.prisma.chatMember.findMany({
        where: { chatId: input.chatId, NOT: { userId: userId } },
        select: { userId: true },
      });

      const users = (
        await clerkClient.users.getUserList({
          userId: members.map((member) => member.userId),
        })
      ).map(filterUserDetails);

      return members.map((member) => ({
        member,
        userDetails: users.find((user) => user.id === member.userId),
      }));
    }),
});
