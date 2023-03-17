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

useSetup()
</script>

<template>
    <div relative h-100dvh overflow-hidden>
        <NuxtLayout>
            <NuxtPage h-full />
        </NuxtLayout>
    </div>
</template>
