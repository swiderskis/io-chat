import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/dist/api";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { TRPCError } from "@trpc/server";

const filterUserDetails = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

export const chatRouter = createTRPCRouter({
  getMessages: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { chatId: input.chatId },
        select: { id: true, message: true, userId: true, sentAt: true },
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

  sendMessage: privateProcedure
    .input(
      z.object({
        message: z
          .string()
          .trim()
          .min(1, { message: "You cannot send an empty message!" })
          .max(1000, {
            message:
              "Your message is too long! It may only contain up to 1000 characters",
          }),
        chatId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { success } = await ratelimit.limit(userId);

      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      await ctx.prisma.chatMessage.create({
        data: { message: input.message, chatId: input.chatId, userId: userId },
      });
    }),

  getChatList: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const chatList = await ctx.prisma.chatMember.findMany({
      where: { userId: userId },
      select: { chatId: true },
    });

    const chatListIds = chatList.map((id) => id.chatId);

    const chatDetails = await ctx.prisma.chatMessage.findMany({
      select: { chatId: true, message: true, sentAt: true, userId: true },
      where: { chatId: { in: chatListIds } },
      orderBy: { sentAt: "desc" },
      distinct: ["chatId"],
    });

    return chatDetails;
  }),

  getLastMessage: privateProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const lastMessage = await ctx.prisma.chatMessage.findFirst({
        where: { chatId: input.chatId },
        select: { message: true, userId: true, sentAt: true },
        orderBy: { id: "desc" },
      });

      return lastMessage;
    }),

  openOrCreateChat: privateProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const searchedUser = (
        await clerkClient.users.getUserList({
          username: [input.username],
        })
      ).map(filterUserDetails);

      if (!searchedUser || !searchedUser[0])
        throw new TRPCError({ code: "NOT_FOUND" });

      const chat = await ctx.prisma.chat.findFirst({
        where: {
          chatMembers: {
            every: { userId: { in: [userId, searchedUser[0]?.id] } },
          },
        },
      });

      if (!chat) {
        const newChat = await ctx.prisma.chat.create({
          data: {
            chatMembers: {
              createMany: {
                data: [{ userId: userId }, { userId: searchedUser[0]?.id }],
              },
            },
          },
        });

        return newChat.id;
      }

      return chat.id;
    }),
});
