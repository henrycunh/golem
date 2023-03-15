type HandleReturn<T> = Promise<{ error: null; data: T } | { error: Error; data: null }>
export default async function handle<T>(promise: (Promise<T> | (() => Promise<T>))): HandleReturn<T> {
    try {
        if (typeof promise === 'function') {
            promise = promise()
        }
        const data = await promise
        return { error: null, data }
    }
    catch (error: any) {
        return { error, data: null }
    }
}
