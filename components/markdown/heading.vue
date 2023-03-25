<script lang="ts" setup>
defineProps<{
    depth: number
}>()
</script>

<template>
    <component
        :is="`h${depth}`"
        text-gray-7 dark:text-gray-1
    >
        <slot />
    </component>
</template>
