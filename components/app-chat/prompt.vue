<script lang="ts" setup>
const { sendMessage } = useConversations()

const userMessageInput = ref('')

const onSendMessage = () => {
    sendMessage(userMessageInput.value)
    userMessageInput.value = ''
}
</script>

<template>
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
</template>
