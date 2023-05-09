import type { ChatGPTError, ChatMessage } from 'chatgpt-web'
import { nanoid } from 'nanoid'
import { Configuration, OpenAIApi } from 'openai'
import pLimit from 'p-limit'
import { encode } from 'gpt-token-utils'
import type { types } from '~~/utils/types'
import trimIndent from '~~/utils/string'

const MaxTokensPerModel = {
    'gpt-4': 8180,
    'gpt-3.5-turbo': 4080,
} as Record<string, number>

export const useConversations = () => {
    const db = useIDB()

    const { isDetaEnabled, deta } = useDeta()
    const { apiKey } = useSettings()
    const { maxTokens, modelUsed } = useSettings()
    const { knowledgeList } = useKnowledge()
    const { complete } = useLanguageModel()

    const currentConversationId = useState<string>(() => '')
    const currentConversation = useState<types.Conversation | null>(() => null)
    const conversationList = useState<types.Conversation[] | null>(() => null)
    const conversationAbortMap = useState<Record<string, AbortController>>(() => ({}))

    const knowledgeUsedInConversation = computed(() => {
        if (currentConversation.value === null) {
            return []
        }
        return currentConversation.value.knowledge?.map((knowledgeId) => {
            return knowledgeList.value?.find(knowledge => knowledge.id === knowledgeId)
        }).filter(knowledge => knowledge !== undefined) || [] as types.KnowledgeItem[]
    })
    const isTyping = useState<Record<string, boolean>>(() => ({}))
    const isTypingInCurrentConversation = computed(() => {
        return isTyping.value[currentConversationId.value] || false
    })
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
        if (currentConversationId.value === id) {
            currentConversation.value = newConversation
        }
    }

    async function getMessageById(conversationId: string, id: string) {
        const conversation = await db.table('conversations').get(conversationId)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        return conversation.messages.find((message: ChatMessage) => message.id === id) as ChatMessage
    }

    async function updateLastAssistantMessage(conversationId: string, message: types.Message) {
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
                        ...message,
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

    const updateConversation = async (id: string, update: Partial<types.Conversation>) => {
        const conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const newConversation: types.Conversation = {
            ...conversation,
            ...update,
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

    const updateConversationSettings = async (id: string, update: Partial<types.ConversationSettings>) => {
        const conversation: types.Conversation = await db.table('conversations').get(id)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        const newConversation: types.Conversation = {
            ...conversation,
            settings: {
                ...conversation.settings,
                ...update,
            },
        }
        logger.info('Updating conversation settings')
        await updateConversation(id, newConversation)
    }

    const deleteConversation = async (id: string) => {
        await db.table('conversations').delete(id)
        if (isDetaEnabled.value) {
            deta.conversation.delete(id)
        }
        await updateConversationList()
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

        const assistantMessageList = (fromConversation.messages || []).filter((message: ChatMessage) => message.role === 'assistant')
        const lastAssistantMessage = assistantMessageList[assistantMessageList.length - 1]
        console.log('lastAssistantMessage', lastAssistantMessage)
        const userMessage = {
            id: nanoid(),
            role: 'user' as const,
            text: message,
            parentMessageId: lastAssistantMessage?.id,
            updatedAt: new Date(),
        }

        // Adds the user message to the conversation
        addMessageToConversation(fromConversation.id, userMessage)
        setConversationTypingStatus(fromConversation.id, true)

        let messageList: any[] = getMessageChain(fromConversation.messages, userMessage)
        messageList = [
            {
                role: 'system',
                text: fromConversation.systemMessage || getDefaultSystemMessage(),
                id: 'system-message',
            },
            ...messageList,
        ]
        messageList = messageList.map(message => ({
            role: message.role,
            content: message.text,
        }))

        // TODO: Add knowledge to the conversation
        // if (knowledgeUsedInConversation.value.length > 0) {
        //     let lastMessageId = lastSystemMessage?.id
        //     for (const knowledge of knowledgeUsedInConversation.value) {
        //         const messageId = nanoid()
        //         lastMessages.push({
        //             id: messageId,
        //             role: 'user',
        //             text: `Use this as knowledge for the rest of our conversation:\n${knowledge?.sections[0]?.content}\n---`,
        //             parentMessageId: lastMessageId,
        //             updatedAt: new Date(),
        //             createdAt: new Date(),
        //         })
        //         lastMessageId = messageId
        //     }
        //     userMessage.parentMessageId = lastMessageId
        // }

        // Count the tokens to see if message is too long
        const getTokenCount = () => encode(messageList.map(message => message.content).join('\n\n')).length
        let lastTokenCount = getTokenCount()
        if (getTokenCount() > MaxTokensPerModel[modelUsed.value]) {
            logger.info('Message is too long, removing messages...', { lastTokenCount, MaxTokensPerModel, modelUsed })
            // Remove the first message that is not a system message
            // until the token count is less than the max or there are no more messages
            while (messageList.length > 1 && lastTokenCount > MaxTokensPerModel[modelUsed.value]) {
                messageList = [
                    messageList[0],
                    ...(messageList.filter(({ role }) => role !== 'system').slice(1)),
                ]
                lastTokenCount = getTokenCount()
            }
            if (messageList.length === 1) {
                await addErrorMessage('Your message is too long, please try again.')
                return
            }
        }

        let thisMessage: ChatMessage | null = null
        let messageCreated = false

        const upsertAssistantMessage = async (messageResponse: types.Message, finalUpdate?: boolean) => {
            if (!thisMessage) {
                thisMessage = await getMessageById(fromConversation.id, messageResponse.id)
            }

            if (thisMessage) {
                await updateLastAssistantMessage(fromConversation.id, messageResponse)
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

        const { sendMessage } = useLanguageModel()
        const abortController = new AbortController()
        conversationAbortMap.value[fromConversation.id] = abortController
        const { data: assistantMessage, error: messageError } = await handle(sendMessage({
            messages: messageList,
            model: fromConversation.settings?.model || modelUsed.value,
            max_tokens: Number(maxTokens.value),
            temperature: resolveCreativity(fromConversation.settings?.creativity),
            async onProgress(partial: types.Message) {
                await upsertAssistantMessage(partial)
            },
            signal: abortController.signal,
            stream: true,
        }))

        if (messageError) {
            const error = messageError as ChatGPTError
            const errorCode = (error.cause as any)?.error.code as string
            logger.error('Error sending message', error.cause, error)
            const errorHandlerMapping = {
                async model_not_found() {
                    await addErrorMessage('The model you are using is not available. Please select another model in the settings.')
                },
                async context_length_exceeded() {
                    await addErrorMessage('Your message is too long, please try again.')
                },
                async invalid_api_key() {
                    await addErrorMessage('Your API key is invalid. Please check your API key in the settings.')
                },
            } as Record<string, () => Promise<void>>

            if (errorCode in errorHandlerMapping) {
                await errorHandlerMapping[errorCode]()
            }
        }
        else {
            assistantMessage.parentMessageId = userMessage.id
            setConversationTypingStatus(fromConversation.id, false)
            await upsertAssistantMessage(assistantMessage, true)
            await updateConversationList()

            if (fromConversation.title.trim() === 'Untitled Conversation') {
                await generateConversationTitle(fromConversation.id)
            }
        }

        setConversationTypingStatus(fromConversation.id, false)

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

    async function clearConversations() {
        if (!conversationList.value) {
            return
        }
        const limit = pLimit(10)
        await Promise.all(conversationList.value.map(
            (conversation: types.Conversation) => limit(() => deleteConversation(conversation.id)),
        ))
        const newConversation = await createConversation('Untitled Conversation')
        await switchConversation(newConversation.id)
    }

    function setConversationTypingStatus(conversationId: string, status: boolean) {
        isTyping.value = {
            ...isTyping.value,
            [conversationId]: status,
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

    async function stopConversationMessageGeneration(conversationId: string) {
        const abortController = conversationAbortMap.value[conversationId]
        if (abortController) {
            abortController.abort()
        }
    }

    async function updateConversationMessage(conversationId: string, messageId: string, message: Partial<types.Message>) {
        const conversation = await getConversationById(conversationId)
        if (!conversation) {
            return
        }
        const messageIndex = conversation.messages.findIndex((m: types.Message) => m.id === messageId)
        if (messageIndex === -1) {
            return
        }
        conversation.messages[messageIndex] = {
            ...conversation.messages[messageIndex],
            ...message,
        }
        await updateConversation(conversationId, conversation)
        if (isDetaEnabled.value) {
            deta.message.update(conversation.messages[messageIndex])
        }
    }

    return {
        clearConversations,
        clearErrorMessages,
        conversationList,
        createConversation,
        currentConversation,
        deleteConversation,
        followupQuestions,
        getConversationById,
        isTyping,
        isTypingInCurrentConversation,
        knowledgeUsedInConversation,
        listConversations,
        removeMessageFromConversation,
        sendMessage,
        stopConversationMessageGeneration,
        switchConversation,
        updateConversation,
        updateConversationSettings,
        updateConversationList,
        updateConversationMessage,
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

function getMessageChain(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
    const parentMessage = messages.find((m: ChatMessage) => m.id === message.parentMessageId)
    if (!parentMessage) {
        return [message]
    }
    return [...getMessageChain(messages, parentMessage), message]
}

function getDefaultSystemMessage() {
    const currentDate = new Date().toISOString().split('T')[0]
    return trimIndent(`
        You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.
        Knowledge cutoff: 2021-09-01
        Current date: ${currentDate}
    `)
}

function resolveCreativity(creativity?: types.Creativity | null) {
    if (!creativity) {
        return 0.7
    }
    return mapValue({
        none: 0.0,
        normal: 0.7,
        high: 1.2,
    }, creativity, 0.7)
}
