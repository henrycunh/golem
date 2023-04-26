<script lang="ts" setup>
const { conversationList } = useConversations()
const { filterConversationsBySearchTerm } = useSearch()

const conversationsSortedByUpdatedAt = computed(() => {
    if (conversationList.value === null) {
        return null
    }
    return filterConversationsBySearchTerm(conversationList.value)
        .filter(conversation => !conversation.metadata?.favorite)
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
        <div uppercase font-bold font-text text-13px text-color-lighter my-2 flex items-center px-3>
            Recent
        </div>
        <div
            v-if="conversationsSortedByUpdatedAt?.length" max-h-100 overflow-y-auto overflow-x-hidden w-full
            pb-2
        >
            <ConversationTab
                v-for="conversation in conversationsSortedByUpdatedAt"
                :key="conversation.id"
                :conversation="conversation"
                w-full
            />
        </div>
        <div v-else>
            <div text-color flex="~ col" items-center justify-center gap-1 op-40>
                <div i-tabler-file-off text-7 />
                <div font-bold font-title>
                    No results
                </div>
                <div text-3>
                    Try a different search term
                </div>
            </div>
        </div>
    </div>
</template>
