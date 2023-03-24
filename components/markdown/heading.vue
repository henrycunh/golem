<script lang="ts" setup>
defineProps<{
    depth: number
}>()
</script>

<template>
    <component
        :is="`h${depth}`"
        text-gray-5
    >
        <slot />
    </component>
</template>
