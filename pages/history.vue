<script lang="ts" setup>
const {
    conversationList,
    createConversation,
    switchConversation,
    clearConversations,
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
            font-bold font-title
            text-14px sm:text-22px
            text-color mb-2 flex items-center
        >
            <div>
                History
            </div>
            <div
                v-if="conversationList?.length" ml-auto
                text-10px sm:text-13px
                text-color-lighter uppercase
            >
                {{ conversationList?.length }} conversations
            </div>
        </div>
        <div
            max-h-100 overflow-y-auto overflow-x-hidden w-full p-2
            rounded-2 mt-6
            class="light:bg-gray-1/50 dark:bg-dark-3 dark:shadow-dark" shadow shadow-inset
        >
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
            />
        </div>
        <div flex items-center children:grow gap-3 mt-2>
            <GoButton
                secondary icon="i-tabler-plus"
                @click="onCreateConversation"
            >
                New chat
            </GoButton>
            <GoLongPressButton
                :duration="1500"
                icon="i-tabler-arrow-bar-to-up"
                progress-bar-style="bg-red/50"
                success-style="!ring-red"
                @success="clearConversations"
            >
                Clear all
            </GoLongPressButton>
        </div>
    </div>
</template>
