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
</script>

<template>
    <div p-4>
        <div
            uppercase font-bold
            text-13px
            text-primary mb-2 flex items-center
        >
            <div>
                Chats
            </div>
            <div
                v-if="conversationList?.length" ml-auto
                text-9px sm:text-11px
                text-gray-5 dark:text-gray-4
            >
                {{ conversationList?.length }} conversations
            </div>
        </div>
        <div
            max-h-100 overflow-y-auto overflow-x-hidden w-full p-2
            rounded-2
            class="light:bg-gray-1/50 dark:bg-dark-3 dark:shadow-dark" shadow shadow-inset
        >
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
            />
        </div>
        <UButton
            secondary icon="i-tabler-plus"
            text-10px sm:text-4
            w-full mt-2
            @click="onCreateConversation"
        >
            New chat
        </UButton>
    </div>
</template>
