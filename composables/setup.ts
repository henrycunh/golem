import type { types } from '~~/utils/types'

export async function useSetup(options?: { disableStorage: boolean }) {
    if (process.client) {
        useColorMode()
        if (options?.disableStorage) {
            useIDB({ disableStorage: true })
        }

        const {
            currentConversation,
            conversationList,
            createConversation,
            updateConversationList,
            switchConversation,
        } = useConversations()

        const { updateKnowledgeList } = useKnowledge()

        await updateKnowledgeList()

        watchEffect(async () => {
            if (currentConversation.value === null) {
                if (conversationList.value === null) {
                    await updateConversationList()
                    return
                }

                if (conversationList.value && conversationList.value.length === 0) {
                    console.log('Creating new conversation')
                    const newConversation = await createConversation('Untitled Conversation')
                    await switchConversation(newConversation.id)
                }
                else {
                    const mostRecentConversation = conversationList.value.sort((a: types.Conversation, b: types.Conversation) => {
                        return b.updatedAt.getTime() - a.updatedAt.getTime()
                    })[0]
                    await switchConversation(mostRecentConversation.id)
                }
            }
        })
    }
}
