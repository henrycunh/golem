import { Configuration, OpenAIApi } from 'openai'
import type { NitroFetchOptions } from 'nitropack'
import { nanoid } from 'nanoid'

export function useLanguageModel() {
    const { apiKey } = useSettings()

    async function complete(prompt: string, params?: LMCompleteParams) {
        const client = new OpenAIApi(new Configuration({
            apiKey: apiKey.value || '',
        }))

        const additionalParams = {
            temperature: params?.temperature || 0.8,
            max_tokens: params?.maxTokens || 256,
            stop: params?.stop,
        }

        const response = await client.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'system',
                content: params?.systemMessage || 'This is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.',
            }, {
                role: 'user',
                content: prompt,
            }],
            ...additionalParams,
        })

        return response.data.choices[0].message?.content
    }

    async function sendMessage(options: any) {
        const { onProgress, signal, ...requestBody } = options
        const CHAT_COMPLETION_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

        const requestOptions: NitroFetchOptions<typeof CHAT_COMPLETION_ENDPOINT> = {
            method: 'POST',
            body: requestBody,
            headers: {
                Authorization: `Bearer ${apiKey.value}`,
            },
        }

        if (requestBody.stream) {
            requestOptions.responseType = 'stream'
        }

        if (options.signal) {
            requestOptions.signal = signal
        }

        // TODO: Discover why this is hitting maximum recursion depth on type inference
        const { data: response, error } = await handle<any>(($fetch as any)(CHAT_COMPLETION_ENDPOINT, requestOptions))

        if (error) {
            const cause = (error as any)?.response?._data.error
                ? (error as any)?.response?._data
                : JSON.parse(
                    new TextDecoder().decode(
                        (await ((error as any)?.response?._data as ReadableStream)
                            .getReader()
                            .read()
                        ).value,
                    ),
                )
            throw new OpenAIError({ cause, message: 'Failed to send message' })
        }

        const result = {
            role: 'assistant',
            id: nanoid(),
            text: '',
            delta: undefined,
            detail: undefined,
        }

        if (!requestBody.stream) {
            if (response.id) {
                result.id = response.id
            }
            const message = response.choices[0].message
            if (!message) {
                throw new Error('No message in response')
            }
            result.text = message.content
            if (message.role) {
                result.role = message.role
            }
            result.detail = response as any
            console.log(result)
            return result
        }
        else {
            const stream = (response as ReadableStream)
            const reader = stream.getReader()
            const decoder = new TextDecoder()
            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }
                const decoded = decoder.decode(value)
                const decodedData = decoded.split('data: ').map(s => s.trim()).filter(content => content.length > 0 && content !== '[DONE]')
                try {
                    const chunks = decodedData.map(data => JSON.parse(data)).filter(data => data.choices?.[0]?.delta?.content)
                    const [parsed] = chunks
                    if (!parsed) {
                        continue
                    }
                    if (parsed.id) {
                        result.id = parsed.id
                    }
                    if (parsed?.choices?.length) {
                        const delta = parsed.choices[0].delta
                        result.delta = delta.content
                        if (delta?.content) {
                            result.text += delta.content
                        }
                        result.detail = parsed
                        if (delta.role) {
                            result.role = delta.role
                        }
                    }
                    if (onProgress) {
                        await onProgress(result)
                    }
                }
                catch (e) {
                    console.log(e, decoded, decodedData)
                }
            }
            console.log({ result })
            return result
        }
    }

    return { complete, sendMessage }
}

interface LMCompleteParams {
    temperature?: number
    maxTokens?: number
    stop?: string
    systemMessage?: string
}
