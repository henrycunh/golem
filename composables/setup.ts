import pLimit from 'p-limit'
import type { types } from '~~/utils/types'
export async function useSetup(options?: { disableStorage: boolean; embedded?: boolean }) {
    if (process.client) {
        const { isOnSharePage } = useSession()
        const { setPalette } = useAppearance()
        useColorMode()
        setPalette()
        useShiki().setupShikiLanguages()
        if (options?.disableStorage) {
            useIDB({ disableStorage: true })
        }

        const { isDetaEnabled, deta } = useDeta()

        const {
            currentConversation,
            conversationList,
            createConversation,
            updateConversationList,
            switchConversation,
        } = useConversations()

        const { initPersonaList, personaList } = usePersona()

        watchEffect(async () => {
            if (personaList.value.length === 0) {
                await initPersonaList()
            }
        })

        const { updateKnowledgeList } = useKnowledge()

        await updateKnowledgeList()
        if (options?.embedded) {
            logger.info('Embedded mode enabled')
        }

        if (isDetaEnabled.value && !isOnSharePage.value) {
            logger.info('Deta is enabled, syncing conversations')
            deta.conversation.list().then((conversations) => {
                const limit = pLimit(10)
                logger.info(`Syncing ${conversations.length} conversations`)
                Promise.all(
                    conversations.map(conversation => limit(() => deta.conversation.sync(conversation.key as string))),
                ).then(() => {
                    logger.info('Finished syncing conversations')
                    updateConversationList()
                })
            })
        }

        watchEffect(async () => {
            if (currentConversation.value === null) {
                if (conversationList.value === null) {
                    await updateConversationList()
                    return
                }

                if (conversationList.value && conversationList.value.length === 0 && !options?.embedded) {
                    logger.info('No conversations present, creating a new one')
                    const newConversation = await createConversation('Untitled Conversation')
                    await switchConversation(newConversation.id)
                }
                else if (!options?.embedded) {
                    logger.info('Switching to most recent conversation')
                    const mostRecentConversation = conversationList.value.sort((a: types.Conversation, b: types.Conversation) => {
                        return b.updatedAt.getTime() - a.updatedAt.getTime()
                    })[0]
                    await switchConversation(mostRecentConversation.id)
                }
            }
        })
    }
}
