<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()
</script>

<template>
    <div>
        <AppChatHeader
            :embedded="embedded"
        />
        <AppChatHistory
            :embedded="embedded"
        />
        <AppChatPrompt />
    </div>
</template>
