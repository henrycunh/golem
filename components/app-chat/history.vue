<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { currentConversation, isTypingInCurrentConversation } = useConversations()

const isLastMessageFromAssistant = computed(() => {
    if (!currentConversation.value) {
        return false
    }
    const messages = currentConversation.value.messages
    if (messages.length === 0) {
        return false
    }
    return messages[messages.length - 1].role === 'assistant'
})

const messagesOrdered = computed(() => {
    return currentConversation.value?.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        || []
})

const isAssistantTyping = computed(() => isTypingInCurrentConversation.value && !isLastMessageFromAssistant.value)
</script>

<template>
    <AppChatHistoryContainer :key="currentConversation?.updatedAt.getTime()">
        <TransitionGroup name="fade">
            <Message
                v-for="message in currentConversation?.messages || []"
                :key="message.id + message.createdAt.getTime()"
                :message="message"
                mb-2 last:mb-0
            />
        </TransitionGroup>

        <AppChatHistoryTyping
            :is-typing="isAssistantTyping"
        />

        <AppChatHistoryEmpty
            v-if="messagesOrdered.length === 0"
        />
    </AppChatHistoryContainer>
</template>
