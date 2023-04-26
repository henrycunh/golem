<script lang="ts" setup>
import type { types } from '~~/utils/types'

const props = defineProps<{
    conversation: types.Conversation
}>()

const {
    currentConversation,
    conversationList,
    isTyping,
    switchConversation,
    deleteConversation,
    createConversation,
    updateConversation,
} = useConversations()

const { isMobile } = useDevice()

const element = ref()
const inputElement = ref()
const isHovering = useElementHover(element)
const route = useRoute()

// Is current conversation
const isCurrentConversation = computed(() => {
    if (currentConversation.value === null) {
        return false
    }
    return currentConversation.value.id === props.conversation.id
        && (['/', '/chat'].includes(route.path))
})

// Is typing in the current conversation
const isTypingInCurrentConversation = computed(() => {
    if (currentConversation.value === null) {
        return false
    }
    return isTyping.value[props.conversation.id]
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

onClickOutside(inputElement, () => {
    isEditingTitle.value = false
})

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
        relative
    >
        <div
            transition text-gray-600 dark:text-gray-3 cursor-pointer
            p-1 px-3 sm:p-2 sm:px-3
            class="shadow-gray-900/5"
            text-12px sm:text-15px
            w-full box-border
            active:translate-y-2px
            :class="[
                isCurrentConversation
                    ? 'bg-white text-gray-600 shadow-md dark:bg-dark-1 dark:text-gray-1'
                    : 'hover:bg-gray-100 hover:dark:bg-dark-3',
            ]"
            @click="onClick"
        >
            <div class="grid" grid items-center w-full box-border>
                <div col-start-1 col-end-1>
                    <div flex items-center>
                        <transition name="appear-left">
                            <div v-if="isEditingTitle" i-tabler-edit text-18px mr-1 />
                        </transition>
                        <transition name="appear-left">
                            <div v-if="!isEditingTitle && isTypingInCurrentConversation" i-eos-icons-bubble-loading text-18px mr-1 />
                        </transition>
                        <transition name="appear-left">
                            <div
                                v-if="!isEditingTitle && !isTypingInCurrentConversation" text-18px mr-1
                                :class="[
                                    conversation?.metadata?.favorite
                                        ? 'i-tabler-star-filled text-amber'
                                        : 'i-tabler-message-chatbot',
                                ]"
                            />
                        </transition>
                        <input
                            ref="inputElement"
                            v-model="conversationTitle"
                            :readonly="!isEditingTitle"
                            bg-transparent border-none outline-none p-0
                            transition font-bold mr-3 truncate
                            text-10px sm:text-14px h-1.75em
                            w-full
                            :class="[
                                isEditingTitle
                                    ? 'text-gray-900 dark:text-gray-1 select-all'
                                    : 'text-gray-700 dark:text-gray-3 select-none cursor-pointer',
                            ]"
                            @blur="isEditingTitle = false"
                            @input="onInput"
                            @dblclick.stop="onTabDoubleClick"
                        >
                    </div>
                    <div
                        v-if="lastMessage"
                        text-gray-5
                        text-10px sm:text-13px
                        dark:text-gray-4
                        max-w-190px truncate inline-block
                    >
                        {{ lastMessage.text }}
                    </div>
                </div>

                <div
                    col-start-2 col-end-2
                >
                    <transition name="appear-right">
                        <GpLongPressButton
                            v-if="isHovering || isMobile"
                            :duration="800"
                            icon="i-tabler-x text-13px"
                            rounded-2px
                            small block
                            class="!relative"
                            success-style="!ring-red-500 !text-red-7"
                            progress-bar-style="bg-red/50"
                            @success="onDeleteConversation(props.conversation.id)"
                        />
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid {
    grid-template-columns: 1fr 20px;
}
</style>
