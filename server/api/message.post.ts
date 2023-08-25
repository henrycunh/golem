import { Readable } from 'node:stream'
import { z } from 'zod'
import type { ChatCompletionRequestMessage, CreateChatCompletionRequest } from 'openai'
import { Configuration, OpenAIApi } from 'openai'
import type { H3Event } from 'h3'
import { nanoid } from 'nanoid'
import { encoding_for_model } from '@dqbd/tiktoken'
import trimIndent from '~~/utils/string'
import { fetchSSE } from '~~/utils/fetch-sse'
const CHAT_COMPLETION_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

const TokenCounter = {
    'gpt-4': encoding_for_model('gpt-4'),
    'gpt-3.5-turbo': encoding_for_model('gpt-3.5-turbo'),
}

const MaxTokensPerModel = {
    'gpt-4': 8180,
    'gpt-3.5-turbo': 4080,
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Validate message with zod
    const messageSchema = z.object({
        messages: z.array(z.object({
            content: z.string(),
            role: z.enum(['user', 'assistant', 'system']),
        })),
        systemMessage: z.string().optional().default(getDefaultSystemMessage()),
        model: z.enum(['gpt-3.5-turbo', 'gpt-4']),
        maxTokens: z.number()
            .min(20)
            .optional(),
        stream: z.boolean().optional().default(false),
    })

    const message = messageSchema.safeParse(body)
    if (!message.success) {
        event.node.res.statusCode = 400
        return {
            error: 'Invalid message',
            message: message.error,
        }
    }

    const apiKey = getApiKey(event)
    if (!apiKey) {
        event.node.res.statusCode = 400
        return {
            error: 'Missing API key',
        }
    }

    const config = new Configuration({ apiKey })
    const openai = new OpenAIApi(config)

    const messageListWithSystemMessage: ChatCompletionRequestMessage[] = [
        { content: message.data.systemMessage, role: 'system' },
        ...message.data.messages.filter(({ role }) => role !== 'system'),
    ]

    const request: CreateChatCompletionRequest = {
        model: message.data.model,
        messages: messageListWithSystemMessage,
        max_tokens: message.data.maxTokens,
        stream: message.data.stream,
    }

    const getTokenCount = () => TokenCounter[message.data.model].encode(messageListWithSystemMessage.map(({ content }) => content).join('\n\n')).length
    let lastTokenCount = getTokenCount()
    if (getTokenCount() > MaxTokensPerModel[message.data.model]) {
        // Remove the first message that is not a system message
        // until the token count is less than the max or there are no more messages
        while (messageListWithSystemMessage.length > 1 && lastTokenCount > MaxTokensPerModel[message.data.model]) {
            messageListWithSystemMessage.shift()
            lastTokenCount = getTokenCount()
        }
        if (messageListWithSystemMessage.length === 1) {
            event.node.res.statusCode = 400
            return {
                error: {
                    error: 'Too many tokens',
                    code: 'context_length_exceeded',
                    message: `The token count for the messages is too high. The maximum is ${MaxTokensPerModel[message.data.model]}, but the current count is ${lastTokenCount}.`,
                },
            }
        }
    }

    const result = {
        role: 'assistant',
        id: nanoid(),
        text: '',
        delta: undefined,
        detail: undefined,
    }

    try {
        if (message.data.stream) {
            const stream = new Readable({
                read() {},
                encoding: 'utf8',
            })
            const response = await fetchSSE(CHAT_COMPLETION_ENDPOINT, {
                method: 'POST',
                headers: getChatCompletionRequestHeaders(event),
                body: JSON.stringify(request),
                onMessage: (data) => {
                    if (data === '[DONE]') {
                        result.text = result.text.trim()
                        // End the stream
                        stream.push(null)
                        return
                    }
                    try {
                        const response = JSON.parse(data)
                        if (response.id) {
                            result.id = response.id
                        }
                        if (response?.choices?.length) {
                            const delta = response.choices[0].delta
                            result.delta = delta.content
                            if (delta?.content) {
                                result.text += delta.content
                            }
                            result.detail = response
                            if (delta.role) {
                                result.role = delta.role
                            }
                            if (result.text) {
                                stream.push(JSON.stringify(result))
                            }
                        }
                    }
                    catch (err) {
                        console.log(data)
                    }
                },
            })
            // console.log(requestResponse)
            return sendStream(event, stream)
        }
        else {
            const res = await openai.createChatCompletion(request)
            if (res.data.id) {
                result.id = res.data.id
            }
            const message = res.data.choices[0].message
            if (!message) {
                throw new Error('No message in response')
            }
            result.text = message.content
            if (message.role) {
                result.role = message.role
            }
            result.detail = res.data as any
            return result
        }
    }
    catch (e: any) {
        // If the error is a 4xx or 5xx error, return the error message
        if (e.response?.data?.error) {
            event.node.res.statusCode = e.response.status
            return {
                error: e.response.data.error,
                message: e.response.data.message,
            }
        }
        event.node.res.statusCode = 500
        return e.cause
    }
})

function getApiKey(event: H3Event) {
    const { apiKey: instanceApiKey } = useRuntimeConfig()
    const headerApiKey = getHeader(event, 'x-openai-api-key')
    return headerApiKey || instanceApiKey
}

function getChatCompletionRequestHeaders(event: H3Event) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey(event)}`,
    }
}

function getDefaultSystemMessage() {
    const currentDate = new Date().toISOString().split('T')[0]
    return trimIndent(`
        You are ChatGPT, a large language model trained by OpenAI . Answer as concisely as possible or generate a python code when it necessary.
        Knowledge cutoff: 2021-09-01
        Current date: ${currentDate}
    `)
}
