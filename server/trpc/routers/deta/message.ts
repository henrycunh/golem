import { z } from 'zod'
import { publicProcedure, router } from '~/server/trpc/trpc'
import type { types } from '~~/utils/types'
import { parseDateFields } from '~/utils/object'

export const messageRouter = router({

    list: publicProcedure
        .input(
            z.object({
                conversationId: z.string().optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const query: Record<string, string> = {}
            if (input.conversationId) {
                query.conversationId = input.conversationId
            }
            const { items } = await ctx.deta.messages.fetch(query)
            return items.map<types.Message>(item => ({
                ...item as any,
                id: item.key as string,
            }))
        }),

    get: publicProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { id } = input
            const conversation = await ctx.deta.messages.get(id)
            return parseDateFields(
                conversation as any as types.deta.Message,
                ['updatedAt', 'createdAt'] as const,
            )
        }),

    create: publicProcedure
        .input(
            z.object({
                id: z.string(),
                updatedAt: z.string().or(z.string().or(z.date())),
                createdAt: z.string().or(z.string().or(z.date())),
                conversationId: z.string().optional(),
                text: z.string(),
                role: z.string(),
                parentMessageId: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id, updatedAt, createdAt, conversationId, text, role, parentMessageId } = input
            const message = await ctx.deta.messages.insert({
                key: id,
                conversationId,
                updatedAt: updatedAt as string,
                createdAt: createdAt as string,
                text,
                role,
                parentMessageId,
            })
            return message
        }),

    update: publicProcedure
        .input(
            z.object({
                id: z.string(),
                updatedAt: z.string().or(z.date()).optional(),
                createdAt: z.string().or(z.date()).optional(),
                conversationId: z.string().optional(),
                text: z.string().optional(),
                metadata: z.any().optional(),
                role: z.any().optional(),
                parentMessageId: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { updatedAt, createdAt } = input
            const patch = new Map<string, any>()
            if (updatedAt) {
                patch.set('updatedAt', updatedAt)
            }
            if (createdAt) {
                patch.set('createdAt', createdAt)
            }
            for (const field of ['conversationId', 'text', 'role', 'parentMessageId', 'metadata'] as const) {
                if (input[field]) {
                    patch.set(field, input[field])
                }
            }
            const message = await ctx.deta.messages.put({
                key: input.id,
                ...Object.fromEntries(patch),
            })
            return message
        }),

    delete: publicProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { id } = input
            const conversation = await ctx.deta.messages.delete(id)
            return conversation
        }),
})

export type MessageRouter = typeof messageRouter
