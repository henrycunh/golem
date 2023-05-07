import { createParser } from 'eventsource-parser'
import { fetch as crossFetch } from 'cross-fetch'

export async function fetchSSE(
    url: string,
    options: Parameters<typeof fetch>[1] & {
        onMessage: (data: string) => void
        onError?: (error: any) => void
    },
) {
    const f = (process.client ? window.fetch : crossFetch)
    const { onMessage, onError, ...fetchOptions } = options
    const res = await f(url, fetchOptions)
    if (!res.ok) {
        let reason: string

        try {
            reason = await res.text()
        }
        catch (err) {
            reason = res.statusText
        }

        const message = `ChatGPT error ${res.status}: ${reason}`
        const error = new OpenAIError({ message, cause: reason, statusCode: res.status })
        throw error
    }

    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data)
        }
    })

    // handle special response errors
    const feed = (chunk: string) => {
        let response = null

        try {
            response = JSON.parse(chunk)
        }
        catch {
        }

        if (response?.detail?.type === 'invalid_request_error') {
            const message = `ChatGPT error ${response.detail.message}: ${response.detail.code} (${response.detail.type})`
            const error = new OpenAIError({
                message,
                cause: response.detail,
                statusCode: response.detail.code,
            })

            if (onError) {
                onError(error)
            }
            else {
                console.error(error)
            }
            return
        }

        parser.feed(chunk)
    }

    if (!res?.body?.getReader) {
    // Vercel polyfills `fetch` with `node-fetch`, which doesn't conform to
    // web standards, so this is a workaround...
        const body: NodeJS.ReadableStream = res.body as any

        if (!body?.on || !body?.read) {
            throw new OpenAIError({ message: 'unsupported "fetch" implementation' })
        }

        body.on('readable', () => {
            let chunk: string | Buffer = body.read()
            while (chunk !== null) {
                feed(chunk.toString())
                chunk = body.read()
            }
        })
    }
    else {
        for await (const chunk of streamAsyncIterable(res.body)) {
            const str = new TextDecoder().decode(chunk)
            feed(str)
        }
    }
}

export async function* streamAsyncIterable<T>(stream: ReadableStream<T>) {
    const reader = stream.getReader()
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                return
            }
            yield value
        }
    }
    finally {
        reader.releaseLock()
    }
}

export async function* streamOpenAIResponse(stream: ReadableStream) {
    const iterator = streamAsyncIterable(stream)

    const queue: any[] = []
    const addData = (item: any) => {
        queue.push(item)
    }

    const onData = async (chunkDecoded: string) => {
        createParser(async (event) => {
            if (event.type === 'event') {
                if (event.data === '[DONE]') {
                    addData(undefined)
                    return
                }
                try {
                    const data = JSON.parse(event.data)
                    addData(data)
                }
                catch {
                    logger.error('Failed to parse chunk', event.data)
                }
            }
        }).feed(chunkDecoded)
    };

    (async () => {
        for await (const chunk of iterator) {
            const chunkDecoded = new TextDecoder().decode(chunk)
            await onData(chunkDecoded)
        }
    })()

    while (true) {
        if (queue.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 50))
            continue
        }

        const nextValue = queue.shift()
        if (nextValue === undefined) {
            break
        }

        yield nextValue
    }

    return null
}

export class OpenAIError extends Error {
    public cause
    public statusCode
    constructor(opts: { message: string; cause?: any; statusCode?: number }) {
        super(opts.message)
        this.cause = opts.cause
        this.statusCode = opts.statusCode
    }
}
