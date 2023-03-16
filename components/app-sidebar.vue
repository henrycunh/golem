<script lang="ts" setup>
const {
    conversationList,
    createConversation,
    switchConversation,
} = useConversations()

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
    isKnowledgeManagerOpen.value = true
}
</script>

<template>
    <div flex flex-col h-full>
        <div uppercase font-bold text-13px text-primary mb-2>
            Chats
        </div>
        <div>
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
            />
            <div
                hover:bg-primary-100 transition text-gray-600 cursor-pointer
                p-2 px-4 rounded-2 mt-2
                class="bg-primary-50/50 text-primary"
                active:scale-98 font-bold
                text-14px flex gap-1 justify-center items-center
                @click="onCreateConversation"
            >
                <div i-tabler-plus />
                <span>New chat</span>
            </div>
        </div>

        <div uppercase font-bold text-13px text-primary mb-2 mt-6>
            Knowledge
        </div>

        <div>
            <UButton w-full flex items-center justify-center gap-2 @click="onOpenKnowledgeManager">
                <div i-tabler-brain />
                <span>Manage</span>
            </UButton>

            <KnowledgeManager
                v-model="isKnowledgeManagerOpen"
            />
        </div>

        <div mt-auto>
            <ApiKeyStatus mb-6 />
            <div text-gray-3 mb-6 text-5 font-black tracking--1px w-full text-center>
                gepeto
            </div>
        </div>
    </div>
</template>
