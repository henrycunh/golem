<script lang="ts" setup>
const { conversationList } = useConversations()
const { filterConversationsBySearchTerm } = useSearch()

const conversationsSortedByUpdatedAt = computed(() => {
    if (conversationList.value === null) {
        return null
    }
    return filterConversationsBySearchTerm(conversationList.value)
        .filter(conversation => conversation.metadata?.favorite)
        .sort((a, b) => {
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
</script>

<template>
    <div>
        <div v-if="conversationsSortedByUpdatedAt?.length" uppercase font-bold font-text text-13px text-color-lighter my-2 flex items-center px-3>
            Favorites
        </div>
        <div
            max-h-100 overflow-y-auto overflow-x-hidden w-full pb-2
        >
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
            />
        </div>
    </div>
</template>
