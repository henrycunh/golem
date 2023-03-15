import { ChatGPTAPI } from 'chatgpt-web'

export const useChatGPT = () => {
    const { token } = useAuth()
    const { currentPreset } = usePreset()
    const messageList = useState<Message[]>(() => [])
    const currentConversationId = useState<string | null>(() => null)
    // const currentSystemMessage = useState<string>(() => '')

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

    async function sendMessage(message: string) {
        const chatGPT = new ChatGPTAPI({ apiKey: token.value || '' })
        addMessage(message, 'user')
        addMessage('', 'bot')
        const conversationMessage = await chatGPT.sendMessage(message, {
            systemMessage: currentPreset.value?.content,
            parentMessageId: getLastBotMessage()?.id,
            onProgress(partial) {
                updateLastBotMessage({
                    content: partial.text,
                    isTyping: true,
                    id: partial.id,
                })
            },
        })
        updateLastBotMessage({
            content: conversationMessage.text,
            isTyping: false,
        })
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

export interface Message {
    author: 'user' | 'bot'
    content: string
    isTyping?: boolean
    id: string
    error?: boolean
}
