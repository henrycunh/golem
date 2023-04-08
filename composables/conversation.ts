import type { ChatGPTError, ChatMessage } from 'chatgpt-web'
import { ChatGPTAPI } from 'chatgpt-web'
import { nanoid } from 'nanoid'
import { Configuration, OpenAIApi } from 'openai'
import type { types } from '~~/utils/types'

export const useConversations = () => {
    const db = useIDB()
    const { isDetaEnabled, deta } = useDeta()
    const { apiKey } = useSettings()
    const client = useClient()
    const { maxTokens, modelUsed } = useSettings()
    const { knowledgeList } = useKnowledge()
    const { complete } = useLanguageModel()
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

    async function createConversation(title: string, options?: Partial<types.Conversation>) {
        const newConversation: types.Conversation = {
            id: nanoid(),
            title,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            knowledge: [],
            ...options,
        }
        const newKey = await db.table('conversations').add(newConversation)
        if (!newKey) {
            throw new Error('Failed to create conversation')
        }
        if (isDetaEnabled.value) {
            deta.conversation.create(newConversation)
        }
        await updateConversationList()
        return newConversation
    }

    async function addMessageToConversation(id: string, message: ChatMessage) {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const updatedMessage = getUpdatedMessage(message, conversation.id)

        const newConversation = {
            ...conversation,
            messages: [...conversation.messages, updatedMessage],
            updatedAt: new Date(),
        }
        await db.table('conversations').put(newConversation)
        if (isDetaEnabled.value) {
            deta.message.create(updatedMessage)
        }
        currentConversation.value = newConversation
    }

    async function getMessageById(conversationId: string, id: string) {
        const conversation = await db.table('conversations').get(conversationId)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        return conversation.messages.find((message: ChatMessage) => message.id === id) as ChatMessage
    }

    async function updateLastSystemMessageInConversation(conversationId: string, message: string) {
        const conversation = await db.table('conversations').get(conversationId)
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
        if (currentConversationId.value === conversationId) {
            currentConversation.value = newConversation
        }
    }

    const deleteConversation = async (id: string) => {
        await db.table('conversations').delete(id)
        if (isDetaEnabled.value) {
            deta.conversation.delete(id)
        }
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
        if (isDetaEnabled.value) {
            deta.conversation.update(newConversation)
        }
        await updateConversationList()
        if (currentConversationId.value === id) {
            currentConversation.value = newConversation
        }
    }

    async function addErrorMessage(message: string) {
        if (!currentConversation.value) {
            return
        }
        const newMessage: types.Message = {
            id: nanoid(),
            role: 'assistant' as const,
            text: message,
            updatedAt: new Date(),
            createdAt: new Date(),
            isError: true,
        }
        await addMessageToConversation(currentConversation.value.id, newMessage)
    }

    async function clearErrorMessages() {
        if (!currentConversation.value) {
            return
        }
        const conversation = await getConversationById(currentConversation.value.id)
        if (!conversation) {
            return
        }
        const newMessages = conversation.messages.filter((message: types.Message) => !message.isError)
        await updateConversation(currentConversation.value.id, {
            messages: [...newMessages],
        })
    }

    const sendMessage = async (message: string) => {
        // Creates the ChatGPT client
        if (!process.client) {
            return
        }

        const fromConversation = currentConversation.value
        if (!fromConversation) {
            return
        }
        const systemMessageList = (currentConversation.value?.messages || []).filter((message: ChatMessage) => message.role === 'assistant')
        const lastSystemMessage = systemMessageList[systemMessageList.length - 1]

        const userMessage = {
            id: nanoid(),
            role: 'user' as const,
            text: message,
            parentMessageId: lastSystemMessage?.id,
            updatedAt: new Date(),
        }

        // Adds the user message to the conversation
        addMessageToConversation(fromConversation.id, userMessage)
        // Checks if the message exceeds the maximum token count
        try {
            const tokenCount = await client.model.getTokenCount.query(message)
            if (tokenCount > 3200) {
                await addErrorMessage('Your message is too long, please try again.')
                return
            }
        }
        catch (e) {
            await addErrorMessage('Your message is too long, please try again.')
            return
        }

        const lastMessages = [...(fromConversation?.messages || [])]

        if (knowledgeUsedInConversation.value.length > 0) {
            let lastMessageId = lastSystemMessage?.id
            for (const knowledge of knowledgeUsedInConversation.value) {
                const messageId = nanoid()
                lastMessages.push({
                    id: messageId,
                    role: 'user',
                    text: `Use this as knowledge for the rest of our conversation:\n${knowledge?.sections[0]?.content}\n---`,
                    parentMessageId: lastMessageId,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                })
                lastMessageId = messageId
            }
            userMessage.parentMessageId = lastMessageId
        }

        let thisMessage: ChatMessage | null = null
        let messageCreated = false
        const upsertSystemMessage = async (messageResponse: ChatMessage, finalUpdate?: boolean) => {
            if (!thisMessage) {
                thisMessage = await getMessageById(fromConversation.id, messageResponse.id)
            }

            if (thisMessage) {
                await updateLastSystemMessageInConversation(fromConversation.id, messageResponse.text)
                if (finalUpdate) {
                    if (isDetaEnabled.value) {
                        deta.message.update(getUpdatedMessage(messageResponse, fromConversation.id))
                    }
                }
            }

            else if (!messageCreated) {
                messageCreated = true
                await addMessageToConversation(fromConversation.id, messageResponse)
            }
        }

        for (const tryNumber of Array(6).keys()) {
            const chatGPT = new ChatGPTAPI({
                apiKey: apiKey.value || '',
                completionParams: {
                    model: modelUsed.value,
                    max_tokens: Number(maxTokens.value) || undefined,
                },
            })
            chatGPT._getTokenCount = async (message: string) => message.length / 2
            if (lastMessages) {
                await chatGPT.loadMessages(lastMessages.slice(tryNumber))
            }

            try {
                isTyping.value = true
                // Adds the bot message to the conversation
                const systemMessage = await chatGPT.sendMessage(message, {
                    parentMessageId: lastMessages.length > 0 ? lastMessages[lastMessages.length - 1].id : undefined,
                    messageId: userMessage.id,
                    onProgress(partial: ChatMessage) {
                        upsertSystemMessage(partial)
                    },
                    systemMessage: fromConversation.systemMessage,
                })
                isTyping.value = false
                await upsertSystemMessage(systemMessage, true)
                await updateConversationList()

                if (fromConversation.title.trim() === 'Untitled Conversation') {
                    await generateConversationTitle(fromConversation.id)
                }
                break
            }
            catch (e: any) {
                const error = e as ChatGPTError
                let errorCode = ''
                try {
                    if (error.reason) {
                        const message = JSON.parse(error.reason)
                        errorCode = message.error.code
                    }
                }
                catch (e) {
                    console.error(e)
                }

                if (errorCode === 'model_not_found') {
                    await addErrorMessage('The model you are using is not available. Please select another model in the settings.')
                    break
                }
            }
            finally {
                isTyping.value = false
            }
        }
        // TODO: Add follow up questions feature
        // getFollowupQuestions(message)
    }

    const switchConversation = async (id: string) => {
        currentConversationId.value = id
        currentConversation.value = await getConversationById(id)
        logger.info('Switched to conversation', currentConversation.value?.id)
    }

    async function generateConversationTitle(conversationId: string) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return ''
        }
        const lastMessages = conversation.messages.slice(-3)
        const lastMessagesContent = lastMessages.map((message: ChatMessage) => message.text)
        const conversationTitle = await complete(lastMessagesContent.join('\n'), {
            systemMessage: 'You are a very clever machine that can determine a very short title for a conversation. The user sends you the content of a conversation and you only output a very short title for it, really concise. Title:',
            temperature: 0,
            maxTokens: Number(maxTokens),
        })

        conversation.title = conversationTitle?.replace(/Title\:/g, '').replace(/\"/g, '').trim()
        await updateConversation(conversationId, conversation)
    }

    async function removeMessageFromConversation(conversationId: string, messageId: string) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return
        }
        conversation.messages = conversation.messages.filter((message: ChatMessage) => message.id !== messageId)
        await updateConversation(conversationId, conversation)
        if (isDetaEnabled.value) {
            deta.message.delete(messageId)
        }
    }

    async function getFollowupQuestions(text: string) {
        const client = new OpenAIApi(new Configuration({
            apiKey: apiKey.value || '',
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
        clearErrorMessages,
        removeMessageFromConversation,
        currentConversation,
        conversationList,
        isTyping,
        followupQuestions,
        knowledgeUsedInConversation,
    }
}

function getUpdatedMessage(message: ChatMessage, conversationId: string): types.Message {
    return {
        ...message,
        updatedAt: new Date(),
        createdAt: (message as types.Message).createdAt || new Date(),
        conversationId,
    }
}
