import { z } from 'zod'
import { publicProcedure, router } from '~/server/trpc/trpc'

export const authRouter = router({
    login: publicProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
            const { password } = useRuntimeConfig()
            return input === password
        }),
})

export type AuthRouter = typeof authRouter
