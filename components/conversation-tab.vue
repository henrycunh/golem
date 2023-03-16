<script lang="ts" setup>
import type { types } from '~~/utils/types'

const props = defineProps<{
    conversation: types.Conversation
}>()

const {
    currentConversation,
    conversationList,
    switchConversation,
    deleteConversation,
    createConversation,
    updateConversation,
} = useConversations()

const element = ref()
const isHovering = useElementHover(element)

// Is current conversation
const isCurrentConversation = computed(() => {
    if (currentConversation.value === null) {
        return false
    }
    return currentConversation.value.id === props.conversation.id
})

// Conversation message count
const messageCount = computed(() => {
    if (props.conversation.messages.length === 0) {
        return 0
    }
    return props.conversation.messages.length
})

// Tab title editing
const conversationTitle = ref()
const isEditingTitle = ref(false)

watchEffect(() => {
    if (props.conversation.title) {
        conversationTitle.value = props.conversation.title
    }
})

const onTabDoubleClick = () => {
    isEditingTitle.value = true
}

const onInput = async (event: any) => {
    if (currentConversation.value === null) {
        return
    }
    await updateConversation(currentConversation.value?.id, {
        title: event.target.value,
    })
}

// Delete conversation
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
            isCurrentConversation
                ? 'bg-white text-gray-600 shadow-md'
                : 'hover:bg-gray-100',
        ]"
        @click="switchConversation(conversation.id)"
        @dblclick.stop="onTabDoubleClick"
    >
        <transition name="appear-left">
            <div v-if="isEditingTitle" i-tabler-edit mr-1 />
        </transition>
        <input
            v-model="conversationTitle"
            :readonly="!isEditingTitle"
            bg-transparent border-none outline-none p-0
            transition
            :class="[
                isEditingTitle
                    ? 'text-gray-600 select-all'
                    : 'text-gray-500 select-none cursor-pointer',
            ]"
            @blur="isEditingTitle = false"
            @input="onInput"
        >
        <div
            ml-auto text-11px font-bold text-white py-2px px-6px rounded-full my-1
            :class="[
                isCurrentConversation ? 'bg-primary' : 'bg-gray-2 !text-gray-4',
            ]"
        >
            {{ messageCount }}
        </div>
        <transition name="appear-right">
            <div
                v-if="isHovering"
                text-gray-5 ml-2
                class="bg-gray-2/50 hover:bg-gray-3/50"
                hover:text-gray-7
                rounded active:scale-95
                w-6 h-6 flex items-center justify-center
                :class="[
                    isHovering ? 'op100' : 'op0',
                ]"
                @click.stop="onDeleteConversation(conversation.id)"
            >
                <div i-tabler-x text-18px />
            </div>
        </transition>
    </div>
</template>
