import type { inferAsyncReturnType } from '@trpc/server'
import { getDetaBase } from '../db/deta'
/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = () => ({
    deta: {
        conversations: getDetaBase('conversation'),
        messages: getDetaBase('messages'),
    },
})
export type Context = inferAsyncReturnType<typeof createContext>
