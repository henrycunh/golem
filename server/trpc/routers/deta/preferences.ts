import { z } from 'zod'
import { publicProcedure, router } from '~/server/trpc/trpc'

const AvailablePreferences = [
    'api-key',
    'color',
] as const

export const preferencesRouter = router({

    get: publicProcedure
        .input(
            z.enum(AvailablePreferences),
        )
        .query(async ({ ctx, input }) => {
            return (await ctx.deta.preferences.get(input))?.value
        }),

    set: publicProcedure
        .input(
            z.object({
                key: z.enum(AvailablePreferences),
                value: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.deta.preferences.put({
                key: input.key,
                value: input.value,
            })
        }),
})

export type PreferencesRouter = typeof preferencesRouter
