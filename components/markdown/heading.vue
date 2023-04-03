<script lang="ts" setup>
defineProps<{
    depth: number
}>()
</script>

<template>
    <component
        :is="`h${depth}`"
        text-gray-7 dark:text-gray-1
        leading-6
    >
        <slot />
    </component>
</template>

<style scoped>
h1,h2,h3,h4,h5,h6 { margin: 0.5em 0; }
h1 { font-size: 1.5em; }
h2 { font-size: 1.25em; }
h3 { font-size: 1.125em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.75em; }
</style>
