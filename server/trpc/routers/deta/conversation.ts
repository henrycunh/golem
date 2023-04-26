import { z } from 'zod'
import { publicProcedure, router } from '~/server/trpc/trpc'
import type { types } from '~~/utils/types'

export const conversationRouter = router({

    list: publicProcedure
        .query(async ({ ctx }) => {
            const { items } = await ctx.deta.conversations.fetch()
            return items as any as types.deta.Conversation[]
        }),

    get: publicProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { id } = input
            const conversation = await ctx.deta.conversations.get(id)
            return conversation as any as types.deta.Conversation
        }),

    create: publicProcedure
        .input(
            z.object({
                title: z.string(),
                id: z.string(),
                updatedAt: z.string().or(z.date()),
                createdAt: z.string().or(z.date()),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { title, id, updatedAt, createdAt } = input
            const conversation = await ctx.deta.conversations.insert({
                key: id,
                title,
                updatedAt: updatedAt as string,
                createdAt: createdAt as string,
            })
            return conversation
        }),

    update: publicProcedure
        .input(
            z.object({
                title: z.string().optional(),
                id: z.string(),
                metadata: z.any().optional(),
                updatedAt: z.string().or(z.date()).optional(),
                createdAt: z.string().or(z.date()).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { title, id, updatedAt, createdAt, metadata } = input
            const patch = new Map()
            if (title) {
                patch.set('title', title)
            }
            if (updatedAt) {
                patch.set('updatedAt', updatedAt)
            }
            if (createdAt) {
                patch.set('createdAt', createdAt)
            }
            if (metadata !== undefined) {
                patch.set('metadata', metadata)
            }
            const conversation = await ctx.deta.conversations.put({
                key: id,
                ...Object.fromEntries(patch),
            })
            return conversation
        }),

    delete: publicProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id } = input
            const conversation = await ctx.deta.conversations.delete(id)
            return conversation
        }),
})

export type ConversationRouter = typeof conversationRouter
