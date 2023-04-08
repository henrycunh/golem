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

const { isMobile } = useDevice()

const element = ref()
const isHovering = useElementHover(element)
const route = useRoute()

// Is current conversation
const isCurrentConversation = computed(() => {
    if (currentConversation.value === null) {
        return false
    }
    return currentConversation.value.id === props.conversation.id
        && (['/', '/chat', '/history'].includes(route.path))
})

// Conversation message count
const messageCount = computed(() => {
    if (props.conversation.messages.length === 0) {
        return 0
    }
    return props.conversation.messages.length
})

// Last message
const lastMessage = computed(() => {
    if (props.conversation.messages.length === 0) {
        return null
    }
    return props.conversation.messages[props.conversation.messages.length - 1]
})

// On tab click
const onClick = async () => {
    if (route.path !== '/') {
        navigateTo('/')
    }
    if (isCurrentConversation.value) {
        return
    }
    await switchConversation(props.conversation.id)
}

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
        transition text-gray-600 dark:text-gray-3 cursor-pointer
        p-1 px-3 sm:p-2 sm:px-4
        rounded-2
        class="shadow-gray-900/5"
        text-12px sm:text-15px
        mb-1 last:mb-0
        active:translate-y-2px
        :class="[
            isCurrentConversation
                ? 'bg-white text-gray-600 shadow-md dark:bg-dark-1 dark:text-gray-1'
                : 'hover:bg-gray-100 hover:dark:bg-dark-3',
        ]"
        @click="onClick"
        @dblclick.stop="onTabDoubleClick"
    >
        <div flex items-center>
            <transition name="appear-left">
                <div v-if="isEditingTitle" i-tabler-edit mr-1 />
            </transition>
            <input
                v-model="conversationTitle"
                :readonly="!isEditingTitle"
                bg-transparent border-none outline-none p-0
                transition font-bold grow mr-2 truncate
                text-10px sm:text-15px

                :class="[
                    isEditingTitle
                        ? 'text-gray-900 dark:text-gray-1 select-all'
                        : 'text-gray-700 dark:text-gray-3 select-none cursor-pointer',
                ]"
                @blur="isEditingTitle = false"
                @input="onInput"
            >
            <div
                ml-auto
                text-9px sm:text-11px
                font-bold text-white py-2px px-6px rounded-full my-1
                :class="[
                    isCurrentConversation ? 'bg-primary' : 'bg-gray-2 !text-gray-4 dark:bg-dark-2 !text-gray-1',
                ]"
            >
                {{ messageCount }}
            </div>
            <transition name="appear-right">
                <div
                    v-if="isHovering || isMobile"
                    text-gray-5 dark:text-gray-1 ml-2
                    class="bg-gray-2/50 hover:bg-gray-3/50 dark:bg-dark-2 hover:dark:bg-white/10"
                    hover:text-gray-7 dark:hover:text-gray-1
                    rounded active:scale-95 transition-all
                    w-4 h-4 sm:w-6 sm:h-6
                    flex items-center justify-center
                    :class="[
                        isHovering || isMobile ? 'op100' : 'op0',
                    ]"
                    @click.stop="onDeleteConversation(conversation.id)"
                >
                    <div i-tabler-x text-3 sm:text-18px />
                </div>
            </transition>
        </div>
        <div
            v-if="lastMessage"
            text-gray-5
            text-10px sm:text-13px
            dark:text-gray-4
            w-full truncate inline-block
        >
            {{ lastMessage.text }}
        </div>
    </div>
</template>
