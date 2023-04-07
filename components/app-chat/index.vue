<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { isOnSharePage } = useSession()
</script>

<template>
    <div>
        <AppChatHeader
            :embedded="embedded"
        />
        <AppChatHistory
            :embedded="embedded"
        />
        <AppChatPrompt v-if="!isOnSharePage" />
    </div>
</template>
