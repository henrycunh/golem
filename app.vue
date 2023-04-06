<script lang="ts" setup>
useHead({
    title: 'geppeto',
    meta: [
        { name: 'description', content: 'Your brain on GPT' },
    ],
    // Favicon SVG
    link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'https://api.iconify.design/fluent-emoji:robot.svg?color=%230fbd3b' },
    ],
})
</script>

<template>
    <div relative h-100dvh overflow-hidden>
        <NuxtLayout>
            <NuxtPage h-full />
        </NuxtLayout>
    </div>
</template>

<style>
body {
    @apply dark:bg-dark-4 light:bg-gray-1/40 transition;
    margin: 0;
    /* background-color: #f9fafb; */
    font-family: ColfaxAI, -system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
</style>
