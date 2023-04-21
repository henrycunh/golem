<script lang="ts" setup>
</script>

<template>
    <div fixed inset-0 class="dark:bg-dark-4 light:bg-gray-1/40" flex items-center justify-center text-color text-7>
        <picture w-40>
            <source srcset="/image/logo-dark-square-transparent.svg" media="(prefers-color-scheme: dark)">
            <img src="/image/logo-light-square-transparent.svg">
        </picture>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.4);
    }
    100% {
        transform: scale(1);
    }
}

img {
    animation: pulse 2s infinite;
}
</style>
