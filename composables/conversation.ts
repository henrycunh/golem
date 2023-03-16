import type { ChatMessage } from 'chatgpt-web'
import { ChatGPTAPI } from 'chatgpt-web'
import hyperid from 'hyperid'
import { Configuration, OpenAIApi } from 'openai'
import type { types } from '~~/utils/types'

export const useConversations = () => {
    const db = useIDB()
    const { token } = useAuth()
    const { knowledgeList } = useKnowledge()
    const currentConversationId = useState<string>(() => '')
    const currentConversation = useState<types.Conversation | null>(() => null)
    const conversationList = useState<types.Conversation[] | null>(() => null)
    const knowledgeUsedInConversation = computed(() => {
        if (currentConversation.value === null) {
            return []
        }
        return currentConversation.value.knowledge?.map((knowledgeId) => {
            return knowledgeList.value?.find(knowledge => knowledge.id === knowledgeId)
        }).filter(knowledge => knowledge !== undefined) || [] as types.KnowledgeItem[]
    })
    const isTyping = useState<boolean>(() => false)
    const followupQuestions = useState<Record<string, Array<string>> | null>(() => null)

    async function listConversations() {
        return await db.table('conversations').toArray()
    }

    async function updateConversationList() {
        conversationList.value = await listConversations()
    }

    async function getConversationById(id: string) {
        return await db.table('conversations').get(id)
    }

    async function createConversation(title: string) {
        const newConversation = {
            id: hyperid()(),
            title,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const newKey = await db.table('conversations').add(newConversation)
        if (!newKey) {
            throw new Error('Failed to create conversation')
        }
        await updateConversationList()
        return newConversation
    }

    async function addMessageToConversation(id: string, message: ChatMessage) {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const newConversation = {
            ...conversation,
            messages: [...conversation.messages, getUpdatedMessage(message)],
            updatedAt: new Date(),
        }
        await db.table('conversations').put(newConversation)
        currentConversation.value = newConversation
    }

    async function getMessageById(id: string) {
        const conversation = await db.table('conversations').get(currentConversationId.value)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        return conversation.messages.find((message: ChatMessage) => message.id === id) as ChatMessage
    }

    async function updateLastSystemMessageInConversation(message: string) {
        const conversation = await db.table('conversations').get(currentConversationId.value)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const systemMessages = conversation.messages.filter((message: ChatMessage) => message.role === 'assistant')
        if (systemMessages.length === 0) {
            return null
        }
        const lastSystemMessage = systemMessages[systemMessages.length - 1]
        if (!lastSystemMessage) {
            return null
        }

        const newConversation = {
            ...conversation,
            messages: conversation.messages.map((currentMessage: ChatMessage) => {
                if (currentMessage.id === lastSystemMessage.id) {
                    return {
                        ...currentMessage,
                        text: message,
                        updatedAt: new Date(),
                    }
                }
                return currentMessage
            }),
            updatedAt: new Date(),
        }
        await db.table('conversations').put(newConversation)
        currentConversation.value = newConversation
    }

    const deleteConversation = async (id: string) => {
        await db.table('conversations').delete(id)
        await updateConversationList()
    }

    const updateConversation = async (id: string, update: Partial<types.Conversation>) => {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const newConversation = {
            ...conversation,
            ...update,
            updatedAt: new Date(),
        }

        await db.table('conversations').put(newConversation)
        await updateConversationList()
        if (currentConversationId.value === id) {
            currentConversation.value = newConversation
        }
    }

    const sendMessage = async (message: string) => {
        // Creates the ChatGPT client
        if (!process.client) {
            return
        }
        const chatGPT = new ChatGPTAPI({ apiKey: token.value || '' })
        const systemMessageList = (currentConversation.value?.messages || []).filter((message: ChatMessage) => message.role === 'assistant')
        const lastSystemMessage = systemMessageList[systemMessageList.length - 1]

        const userMessage = {
            id: hyperid()(),
            role: 'user' as const,
            text: message,
            parentMessageId: lastSystemMessage?.id,
            updatedAt: new Date(),
        }

        // Adds the user message to the conversation
        addMessageToConversation(currentConversationId.value, userMessage)
        const lastMessages = [...(currentConversation.value?.messages || [])]

        if (knowledgeUsedInConversation.value.length > 0) {
            let lastMessageId = lastSystemMessage?.id
            for (const knowledge of knowledgeUsedInConversation.value) {
                const messageId = hyperid()()
                lastMessages.push({
                    id: messageId,
                    role: 'user',
                    text: `Use this as knowledge for the rest of our conversation:\n${knowledge?.sections[0]?.content}\n---`,
                    parentMessageId: lastMessageId,
                    updatedAt: new Date(),
                })
                lastMessageId = messageId
            }
            userMessage.parentMessageId = lastMessageId
        }

        if (lastMessages) {
            await chatGPT.loadMessages(lastMessages)
        }

        let thisMessage: ChatMessage | null = null
        const upsertSystemMessage = async (messageResponse: ChatMessage) => {
            if (!thisMessage) {
                thisMessage = await getMessageById(messageResponse.id)
            }
            if (thisMessage) {
                await updateLastSystemMessageInConversation(messageResponse.text)
            }
            else {
                await addMessageToConversation(currentConversationId.value, messageResponse)
            }
        }

        isTyping.value = true
        // Adds the bot message to the conversation
        const systemMessage = await chatGPT.sendMessage(message, {
            parentMessageId: lastMessages.length > 0 ? lastMessages[lastMessages.length - 1].id : undefined,
            messageId: userMessage.id,
            async onProgress(partial) {
                await upsertSystemMessage(partial)
            },
        })
        isTyping.value = false
        await upsertSystemMessage(systemMessage)
        await updateConversationList()
        // getFollowupQuestions(message)
    }

    const switchConversation = async (id: string) => {
        currentConversationId.value = id
        currentConversation.value = await getConversationById(id)
        await updateConversationList()
    }

    async function getFollowupQuestions(text: string) {
        const client = new OpenAIApi(new Configuration({
            apiKey: token.value || '',
        }))
        const response = await client.createCompletion({
            model: 'text-davinci-003',
            prompt: [
                'Given the last user question:',
                text,
                'Output 3 questions that the user might ask next, one by line, without list number. The last line has only ###:',
            ].join('\n'),
            stop: '###',
            max_tokens: 500,
        })
        followupQuestions.value = {
            ...followupQuestions.value,
            [currentConversationId.value]: (response.data.choices[0].text || '').split('\n').filter((text: string) => text.trim() !== ''),
        }
    }

    return {
        listConversations,
        getConversationById,
        createConversation,
        deleteConversation,
        updateConversation,
        switchConversation,
        sendMessage,
        updateConversationList,
        currentConversation,
        conversationList,
        isTyping,
        followupQuestions,
        knowledgeUsedInConversation,
    }
}

function getUpdatedMessage(message: ChatMessage): types.Message {
    return {
        ...message,
        updatedAt: new Date(),
    }
}
