<script lang="ts" setup>
useHead({
    title: 'Golem',
    meta: [
        { name: 'description', content: 'Golem is an open-source, amazingly crafted conversational UI and alternative to ChatGPT.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1' },
    ],
    link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '150x150', href: '/mstile-150x150.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '256x256', href: '/android-chrome-256x256.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' },
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
