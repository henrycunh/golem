<script lang="ts" setup>
const { sendMessage } = useConversations()
const { isMobile } = useDevice()
const { apiKey } = useSettings()

const userMessageInput = ref('')

const onSendMessage = () => {
    sendMessage(userMessageInput.value)
    userMessageInput.value = ''
}

const showPromptTooltip = ref(false)
let tooltipTimeout: any

function onHandlePromptClick() {
    if (!apiKey.value && !showPromptTooltip.value) {
        showPromptTooltip.value = true
        tooltipTimeout = setTimeout(() => {
            showPromptTooltip.value = false
        }, 4000)
    }
    else {
        showPromptTooltip.value = false
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout)
        }
    }
}
</script>

<template>
    <div
        sticky left-0 right-0
        :class="[
            !isMobile ? 'bottom-3' : 'bottom-3.25rem',
        ]"
    >
        <div
            inset-0 absolute top--6 bottom--3.5rem
            bg-gradient-to-t from-white via-white
            dark:from-dark-2 dark:via-dark-2
            class="to-dark-2/0"
        />
        <div
            px-6 lg:px-16
        >
            <AppPromptInput
                v-model="userMessageInput"
                v-tooltip="{
                    content: 'You have to add an API Key in the settings to send messages.',
                    shown: showPromptTooltip,
                    triggers: [],
                }"
                mx-auto
                max-w-1080px
                @send="onSendMessage"
                @click="onHandlePromptClick"
            />
        </div>
        <AppChatScrollToBottomButton />
    </div>
</template>
