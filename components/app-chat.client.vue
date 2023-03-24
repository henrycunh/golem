<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const {
    sendMessage,
    currentConversation,
    conversationList,
    isTyping,
    knowledgeUsedInConversation,
} = useConversations()

const userMessageInput = ref('')
const chatContainer = ref()
const autoScrollInterval = ref()

const onSendMessage = () => {
    sendMessage(userMessageInput.value)
    userMessageInput.value = ''
}

const messagesOrdered = computed(() => {
    if (!conversationList.value) {
        return []
    }
    return currentConversation.value?.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        || []
})

const lastMessageIsFromAssistant = computed(() => {
    if (!currentConversation.value) {
        return false
    }
    const messages = currentConversation.value.messages
    if (messages.length === 0) {
        return false
    }
    return messages[messages.length - 1].role === 'assistant'
})

const chatScroll = useScroll(chatContainer)

function scrollToBottom() {
    setTimeout(() => {
        chatScroll.y.value = chatContainer.value?.scrollHeight
    }, 10)
}
watch(() => currentConversation.value?.id, (newId, oldId) => {
    if (newId === oldId) {
        return
    }

    scrollToBottom()
})

scrollToBottom()

watch(isTyping, (newState, oldState) => {
    if (newState === oldState) {
        return
    }
    if (newState) {
        autoScrollInterval.value = setInterval(() => {
            chatScroll.y.value = chatContainer.value?.scrollHeight
        }, 100)
    }
    else {
        clearInterval(autoScrollInterval.value)
    }
})
</script>

<template>
    <div>
        <!-- Header -->
        <div
            v-if="!embedded"
            absolute top-0 left-0 right-0 b-0 b-b-1 b-gray-1 dark:b-dark-1 b-solid py-3
            z-1
            backdrop-blur-4
            mx-auto
            class="bg-white/90 dark:bg-dark-1/90"
            :class="[
                embedded && '!w-full !max-w-full',
            ]"
        >
            <div w-full mx-auto flex items-center px-14 max-w-1080px>
                <div>
                    <AnimatedText text-5 font-bold text-gray-7 dark:text-gray-2 :value="currentConversation?.title" />
                    <div v-if="knowledgeUsedInConversation.length" text-gray-5 dark:text-gray-3 text-14px>
                        Using {{ knowledgeUsedInConversation.length }} sources
                    </div>
                </div>
                <!-- TODO: implement sharing -->
                <!-- <UButton v-if="!embedded" ml-auto icon="i-tabler-share">
                    Share
                </UButton> -->
            </div>
        </div>
        <!-- Messages -->
        <div
            ref="chatContainer"
            :key="currentConversation?.id"
            px-16 max-w-1080px mx-auto relative pt-20 h-full overflow-y-scroll pb-50
            z-0
            :class="[
                embedded && '!pt-2',
            ]"
        >
            <Message
                v-for="message in currentConversation?.messages || []"
                :key="message.id + message.createdAt.getTime()"
                :message="message"
                mb-2 last:mb-0
            />
            <Transition name="appear-top">
                <div
                    v-if="isTyping && !lastMessageIsFromAssistant" absolute
                    left-0 right-0 flex items-center gap-2 p-2 justify-center
                >
                    <div i-eos-icons-bubble-loading text-primary />
                    <div text-gray-5 dark:text-gray-2>
                        Thinking...
                    </div>
                </div>
            </Transition>

            <div
                v-if="messagesOrdered.length === 0"
                text-center h-full
                flex items-center justify-center
            >
                <GpSplash
                    title="No messages yet!"
                    subtitle="Start a conversation by typing a message below."
                    icon="i-tabler-message-2-off"
                    op-70
                />
            </div>
        </div>
        <div sticky bottom-0 left-0 right-0 p-4>
            <div
                inset-0 absolute top--2
                bg-gradient-to-t from-white via-white
                dark:from-dark-2 dark:via-dark-2
                class="to-dark-2/0"
            />
            <div px-16>
                <AppPromptInput
                    v-model="userMessageInput" mx-auto
                    max-w-1080px
                    @send="onSendMessage"
                />
            </div>
        </div>
    </div>
</template>
