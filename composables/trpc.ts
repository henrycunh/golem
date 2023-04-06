import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client'
import type { AppRouter } from '~~/server/trpc/routers'

export function useClient() {
    const client = createTRPCNuxtClient<AppRouter>({
        links: [
            httpBatchLink({
                url: '/api/trpc',
            }),
        ],
    })

    return client
}
