<script lang="ts" setup>
useHead({
    title: 'geppeto',
    meta: [
        { name: 'description', content: 'Your brain on GPT' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1' },
    ],
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
    @apply dark:bg-primary-950 light:bg-primary-50 transition;
    margin: 0;
    /* background-color: #f9fafb; */
    font-family: ColfaxAI, -system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none !important;
}
</style>
