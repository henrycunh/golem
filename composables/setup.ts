export async function useSetup() {
    if (process.client) {
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
                    await switchConversation(conversationList.value[0].id)
                }
            }
        })
    }
}
