import { publicProcedure, router } from '~/server/trpc/trpc'

export const detaInfoRouter = router({

    isEnabled: publicProcedure
        .query(async () => {
            return Boolean(process.env.DETA_PROJECT_KEY)
        }),

})

export type DetaInfoRouter = typeof detaInfoRouter
