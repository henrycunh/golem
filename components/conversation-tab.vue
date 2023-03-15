<script lang="ts" setup>
import type { types } from '~~/utils/types'

defineProps<{
    conversation: types.Conversation
}>()

const {
    currentConversation,
    conversationList,
    switchConversation,
    deleteConversation,
    createConversation,
} = useConversations()
const element = ref()
const isHovering = useElementHover(element)

const onDeleteConversation = async (id: string) => {
    if (conversationList.value === null) {
        return
    }
    const isCurrentConversation = currentConversation.value?.id === id
    if (!isCurrentConversation) {
        await deleteConversation(id)
        return
    }

    const index = conversationList.value.findIndex(conversation => conversation.id === id)
    const nextConversation = conversationList.value[index + 1] || conversationList.value[index - 1]

    if (nextConversation) {
        await switchConversation(nextConversation.id)
    }
    else if (conversationList.value.length === 1) {
        // If there are no more conversations, create a new one
        const newConversation = await createConversation('Untitled Conversation')
        await switchConversation(newConversation.id)
    }
    await deleteConversation(id)
}
</script>

<template>
    <div
        ref="element"
        transition text-gray-600 cursor-pointer
        p-2 px-4 rounded-2
        class="shadow-gray-900/5"
        text-14px mb-1 last:mb-0
        flex items-center
        active:translate-y-2px
        :class="[
            currentConversation?.id === conversation.id
                ? 'bg-white text-gray-600 shadow-md'
                : 'hover:bg-gray-100',
        ]"
        @click="switchConversation(conversation.id)"
    >
        <div text-gray-7>
            {{ conversation.title }}
        </div>

        <div
            ml-auto text-gray-5
            class="bg-gray-2/50 hover:bg-gray-3/50"
            transition hover:text-gray-7
            p-1 rounded active:scale-95
            :class="[
                isHovering ? 'op100' : 'op0',
            ]"
            @click.stop="onDeleteConversation(conversation.id)"
        >
            <div i-tabler-x text-18px />
        </div>
    </div>
</template>
