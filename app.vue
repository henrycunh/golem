<script lang="ts" setup>
useHead({
    title: 'unGPT',
    meta: [
        { name: 'description', content: 'unGPT' },
    ],
    // Favicon SVG
    link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'https://api.iconify.design/fluent-emoji:robot.svg?color=%230fbd3b' },
    ],
})
</script>

<template>
    <div relative>
        <!-- <AppSidebar h-full /> -->
        <NuxtPage h-full />
    </div>
</template>
