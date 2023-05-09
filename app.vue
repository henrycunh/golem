<script lang="ts" setup>
useHead({
    title: 'Golem',
    meta: [
        { name: 'description', content: 'Golem is an open-source, amazingly crafted conversational UI and alternative to ChatGPT.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
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
const { isMobileSafari } = useDevice()
</script>

<template>
    <div
        relative
        overflow-hidden
        h-100vh w-screen
        :class="[
            isMobileSafari && '!h-100dvh',
        ]"
    >
        <NuxtLayout>
            <NuxtPage h-full />
        </NuxtLayout>
    </div>
</template>

<style>
body {
    @apply dark:bg-dark-4 light:bg-#FAFAFB transition;
    margin: 0;
    /* background-color: #f9fafb; */
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/** Dark mode scrollbar */
    html.dark ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    html.dark ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }
    html.dark ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
    }
    html.dark ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
</style>
