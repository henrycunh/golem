<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { isOnSharePage } = useSession()
const isSettingsOpen = ref(false)

provide('is-chat-settings-open', isSettingsOpen)

function onSettingsClose() {
    isSettingsOpen.value = false
}
</script>

<template>
    <div>
        <AppChatHeader />
        <AppChatHistory
            :embedded="embedded"
        />
        <AppChatPrompt v-if="!isOnSharePage" />
        <AppChatSettings :open="isSettingsOpen" @close="onSettingsClose" />
    </div>
</template>
