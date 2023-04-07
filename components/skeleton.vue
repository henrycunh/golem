<template>
    <div
        class="shimmer
        light:bg-gray-200 dark:bg-white/10
        "
    />
</template>

<style scoped>
.shimmer {
    background-repeat: no-repeat;
    background-size: 800px 1920px;
    display: block;
    position: relative;
    animation-duration: .8s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    animation-name: shimmer;
    animation-timing-function: ease-in;
}

@keyframes shimmer {
    0% {
        opacity: 0.2;
    }
    100% {
        opacity: 1;
    }
}
</style>
