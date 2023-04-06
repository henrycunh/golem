import { Deta } from 'deta'

export function getDetaBase(collection: string) {
    const { detaKey } = useRuntimeConfig()
    const deta = Deta(detaKey)
    const db = deta.Base(collection)
    return db
}
