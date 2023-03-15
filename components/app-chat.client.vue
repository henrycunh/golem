<script lang="ts" setup>
// const { sendMessage, messageList } = useChatGPT()
const {
    sendMessage,
    currentConversation,
    conversationList,
    isTyping,
    followupQuestions,
    createConversation,
    updateConversationList,
    switchConversation,
} = useConversations()

const userMessageInput = ref('')
const chatContainer = ref()
const autoScrollInterval = ref()

const onSendMessage = () => {
    sendMessage(userMessageInput.value)
    userMessageInput.value = ''
}

const messagesOrdered = computed(() => {
    if (currentConversation.value === null) {
        return []
    }
    return currentConversation.value.messages
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
})

watchEffect(async () => {
    if (currentConversation.value === null) {
        if (conversationList.value === null) {
            await updateConversationList()
            return
        }
        console.log('updating conversation list', conversationList.value)

        if (conversationList.value && conversationList.value.length === 0) {
            console.log('Creating new conversation')
            const newConversation = await createConversation('Untitled Conversation')
            await switchConversation(newConversation.id)
        }
        else {
            await switchConversation(conversationList.value[0].id)
        }
    }
})

const chatScroll = useScroll(chatContainer, {
    behavior: 'smooth',
})

watch(() => currentConversation.value?.id, (newId, oldId) => {
    if (newId === oldId) {
        return
    }
    setTimeout(() => {
        chatScroll.y.value = chatContainer.value.scrollHeight
    }, 10)
})

watch(isTyping, (newState, oldState) => {
    if (newState === oldState) {
        return
    }
    if (newState) {
        autoScrollInterval.value = setInterval(() => {
            chatScroll.y.value = chatContainer.value.scrollHeight
        }, 100)
    }
    else {
        clearInterval(autoScrollInterval.value)
    }
})
</script>

<template>
    <div v-auto-animate h-98dvh overflow-hidden relative bg-white rounded-2 shadow-lg border>
        <!-- Header -->
        <div
            absolute top-0 left-0 right-0 b-0 b-b-1 b-gray-1 b-solid py-3 px-5 z-1
            backdrop-blur-4
            class="bg-white/90"
        >
            <div max-w-768px mx-auto flex items-center>
                <div text-5 font-bold text-gray-7>
                    {{ currentConversation?.title }}
                </div>

                <UButton ml-auto>
                    Share
                </UButton>
            </div>
        </div>
        <!-- Messages -->
        <div
            ref="chatContainer"
            mx-auto max-w-768px px-5 relative pt-20 h-full overflow-y-scroll pb-50 z-0
        >
            <Message
                v-for="message in messagesOrdered"
                :key="message.id"
                :message="message"
                mb-2 last:mb-0
            />
            <div v-if="followupQuestions && followupQuestions[currentConversation?.id || ''].length" flex gap-1>
                <div
                    v-for="question in followupQuestions[currentConversation?.id || '']"
                    :key="question"
                    p-2 rounded-2 bg-gray-1 cursor-pointer
                    text-14px text-gray-5
                    @click="sendMessage(question)"
                >
                    {{ question }}
                </div>
            </div>
            <div v-if="messagesOrdered.length === 0" text-center text-gray-5>
                No messages yet
            </div>
        </div>
        <div sticky bottom-0 left-0 right-0 p-4>
            <div
                inset-0 absolute top--8
                bg-gradient-to-t from-white via-white class="to-white/0"
            />
            <AppPromptInput
                v-model="userMessageInput" mx-auto
                max-w-768px
                @send="onSendMessage"
            />
        </div>
    </div>
</template>
