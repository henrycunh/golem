<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { isOnSharePage } = useSession()
</script>

<template>
    <div>
        <AppChatHeader />
        <AppChatHistory
            :embedded="embedded"
        />
        <AppChatPrompt v-if="!isOnSharePage" />
    </div>
</template>
