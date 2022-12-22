import axios from 'axios'

export const useChatGPT = () => {
    const { token } = useAuth()
    const { currentPreset } = usePreset()
    const messageList = useState<Message[]>(() => [])
    const currentConversationId = useState<string | null>(() => null)

    const addMessage = (content: string, author: 'user' | 'bot', id?: string) => {
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const newMessage = { author, content, id: id || randomId, isTyping: author === 'bot' }
        messageList.value.push(newMessage)
        return newMessage
    }

    const getLastBotMessage = () => {
        const lastBotMessage = messageList.value.filter(({ author }) => author === 'bot')
        if (lastBotMessage.length === 0) {
            return null
        }
        return lastBotMessage[lastBotMessage.length - 1]
    }

    const updateLastBotMessage = (patch: { content: string; isTyping?: boolean; id?: string; error?: boolean }) => {
        const lastBotMessage = getLastBotMessage()
        if (lastBotMessage) {
            messageList.value[messageList.value.indexOf(lastBotMessage)] = {
                ...messageList.value[messageList.value.indexOf(lastBotMessage)],
                ...patch,
            }
        }
    }

    const sendMessage = async (options: {
        message: string
        onChunk?: (chunk: ChatGPTMessage) => void
    }) => {
        addMessage(
            options.message,
            'user',
        )

        const payload: Payload = {
            action: 'next',
            messages: [
                {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: [
                            messageList.value.length === 1 && currentPreset.value
                                ? `${currentPreset.value.content} ${options.message}`
                                : options.message,
                        ],
                    },
                },
            ],
            parent_message_id: getLastBotMessage()?.id || crypto.randomUUID(),
            model: 'text-davinci-002-render',
        }

        if (currentConversationId.value) {
            payload.conversation_id = currentConversationId.value
        }

        const parseChunk = (chunk: any) => {
            const lines = chunk.split('\n').filter(Boolean)
            return JSON.parse(
                lines[Math.max(lines.length - 2, 0)].substring('data: '.length),
            ) as ChatGPTMessage
        }
        addMessage('', 'bot')
        try {
            const { data } = await axios.post(
                '/api/conversation',
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token.value}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    onDownloadProgress: (progressEvent) => {
                        const chunk = parseChunk(progressEvent.event.currentTarget.response)
                        const currentMessageContent = chunk.message.content.parts[0]
                        updateLastBotMessage({
                            content: currentMessageContent,
                            id: chunk.message.id,
                        })
                    },
                },
            )
            const messageComplete = parseChunk(data)
            console.log(messageComplete)
            currentConversationId.value = messageComplete.conversation_id
            updateLastBotMessage({
                content: messageComplete.message.content.parts[0],
                isTyping: false,
            })
        }
        catch (e: any) {
            console.error(e, e?.response?.data?.detail?.code)
            updateLastBotMessage({
                content: e?.response?.data?.detail?.code,
                isTyping: false,
                error: true,
            })
        }
    }

    const clearMessages = () => {
        messageList.value = []
        currentConversationId.value = null
    }

    return {
        sendMessage,
        clearMessages,
        messageList,
    }
}

export interface ChatGPTMessage {
    message: {
        id: string
        role: string
        user: any
        create_time: any
        update_time: any
        content: { content_type: string; parts: string[] }
        end_turn: any
        weight: number
        metadata: {}
        recipient: string
    }
    conversation_id: string
    error: any
}

interface PayloadMessage {
    id: string
    role: string
    content: { content_type: string; parts: string[] }
}

interface Payload {
    action: string
    messages: PayloadMessage[]
    parent_message_id: string
    model: string
    conversation_id?: string
}

export interface Message {
    author: 'user' | 'bot'
    content: string
    isTyping?: boolean
    id: string
    error?: boolean
}
