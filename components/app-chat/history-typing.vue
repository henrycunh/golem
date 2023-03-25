<script lang="ts" setup>
defineProps<{ isTyping: boolean }>()
</script>

<template>
    <Transition name="appear-top">
        <div
            v-if="isTyping"
            absolute left-0 right-0 flex items-center gap-2 p-2 justify-center
        >
            <div i-eos-icons-bubble-loading text-primary />
            <div text-gray-5 dark:text-gray-2>
                Thinking...
            </div>
        </div>
    </Transition>
</template>
