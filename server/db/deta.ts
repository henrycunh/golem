import { Deta } from 'deta'
import type Base from 'deta/dist/types/base'

export function getDetaBase(collection: string) {
    const detaKey = useRuntimeConfig().detaKey || process.env?.DETA_PROJECT_KEY
    if (!detaKey) {
        return {} as Base
    }
    const deta = Deta(detaKey)
    const db = deta.Base(collection)
    return db
}
