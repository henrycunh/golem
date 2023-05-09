<script lang="ts" setup>
defineProps<{
    title: string
    subtitle?: string
    icon?: string
}>()
</script>

<template>
    <div
        flex flex-col items-center gap-.375em
    >
        <div
            :class="icon"
            text-3em
            class="text-gray-6 dark:text-gray-2"
        />
        <div
            text-1.5em font-bold
            class="text-gray-6 dark:text-gray-2"
        >
            {{ title }}
        </div>
        <div
            text-.75em
            class="text-gray-5 dark:text-gray-3"
        >
            {{ subtitle }}
        </div>
    </div>
</template>
