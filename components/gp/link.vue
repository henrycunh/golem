<script lang="ts" setup>
defineProps<{ to: string }>()
</script>

<template>
    <a
        :href="to"
        text-gray-6 dark:text-gray-2
        cursor-pointer decoration-none
        b-0 b-b-2 b-solid b-primary
        hover:op-80 transition
    >
        <slot />
    </a>
</template>
