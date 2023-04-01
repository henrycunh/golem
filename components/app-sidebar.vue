<script lang="ts" setup>
const {
    conversationList,
    createConversation,
    switchConversation,
} = useConversations()

const route = useRoute()
const { apiKey } = useSettings()

const conversationsSortedByUpdatedAt = computed(() => {
    if (conversationList.value === null) {
        return null
    }
    return conversationList.value.sort((a, b) => {
        if (a.updatedAt === null) {
            return 1
        }
        if (b.updatedAt === null) {
            return -1
        }
        // Compare dates
        return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
})

const onCreateConversation = async () => {
    const newConversation = await createConversation('Untitled Conversation')
    await switchConversation(newConversation.id)
}

const isKnowledgeManagerOpen = ref(false)
const onOpenKnowledgeManager = () => {
    navigateTo('/knowledge')
    // isKnowledgeManagerOpen.value = true
}
</script>

<template>
    <div flex flex-col h-full>
        <div uppercase font-bold text-13px text-primary mb-2 flex items-center>
            <div>
                Chats
            </div>
            <div
                v-if="conversationList?.length" ml-auto text-11px
                text-gray-5 dark:text-gray-4
            >
                {{ conversationList?.length }} conversations
            </div>
        </div>
        <div max-h-100 overflow-y-auto overflow-x-hidden w-full>
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
            />
        </div>
        <UButton secondary icon="i-tabler-plus" w-full mt-2 @click="onCreateConversation">
            New chat
        </UButton>

        <!-- TODO: Add knowledge section -->
        <!-- <div uppercase font-bold text-13px text-primary mb-2 mt-6>
            Knowledge
        </div>

        <div>
            <UButton w-full icon="i-tabler-brain" @click="onOpenKnowledgeManager">
                <span>Manage</span>
            </UButton>
        </div> -->

        <div mt-auto>
            <SidebarItem
                text-4
                :active="route.path.startsWith('/settings')"
                @click="navigateTo('/settings')"
            >
                <span i-tabler-settings mr-2 text-primary text-5 />
                <span>
                    Settings
                </span>
                <ColorModeToggle ml-auto />
            </SidebarItem>
            <SidebarApiKeyAlert
                v-if="!apiKey"
                mt-3
                @click="navigateTo('/settings/api-key')"
            />
            <div
                text-gray-4 dark:text-dark-1 my-6 text-5 tracking--1px w-full
                flex-col flex justify-center items-center
            >
                <div font-black>
                    geppeto
                </div>
                <div text-3 tracking-wide flex items-center gap-1 op-60>
                    made with <div i-tabler-heart-filled text-red /> by Caret
                </div>
            </div>
        </div>
    </div>
</template>
