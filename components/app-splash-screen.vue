<template>
    <div fixed inset-0 class="dark:bg-dark-4 light:bg-gray-1/40" flex items-center justify-center text-color text-7>
        <img
            src="/image/logo-splash.svg"
            w-40
            z-2
        >
        <img
            absolute
            src="/image/logo-splash.svg"
            w-40 blur-30
            z-1
        >
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
