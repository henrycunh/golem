<script lang="ts" setup>
const { sendMessage } = useConversations()

const userMessageInput = ref('')

const onSendMessage = () => {
    sendMessage(userMessageInput.value)
    userMessageInput.value = ''
}

const breakpoint = useBreakpoints({
    sm: '640px',
})
</script>

<template>
    <div
        sticky left-0 right-0
        :class="[
            breakpoint.isGreater('sm') ? 'bottom-0' : 'bottom-3.5rem',
        ]"
    >
        <div
            inset-0 absolute top--2
            bg-gradient-to-t from-white via-white
            dark:from-dark-2 dark:via-dark-2
            class="to-dark-2/0"
        />
        <div
            px-6 lg:px-16
        >
            <AppPromptInput
                v-model="userMessageInput" mx-auto
                max-w-1080px
                @send="onSendMessage"
            />
        </div>
    </div>
</template>
