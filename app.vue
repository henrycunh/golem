<script lang="ts" setup>
useHead({
    title: 'Golem',
    meta: [
        { name: 'description', content: 'Golem is an open-source, amazingly crafted conversational UI and alternative to ChatGPT.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1' },
    ],
    link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/image/logo-dark-square.svg' },
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
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none !important;
}
</style>
