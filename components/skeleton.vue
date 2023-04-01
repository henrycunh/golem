<template>
    <div class="shimmer" />
</template>

<style scoped>
.shimmer {
    background: #e2e9e4;
    background-image: linear-gradient(to right, #e2e9e4 0%, #d3ded6 20%, #e2e9e4 40%, #e2e9e4 100%);
    background-repeat: no-repeat;
    background-size: 800px 1920px;
    display: block;
    position: relative;
    animation-duration: .8s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: shimmer;
    animation-timing-function: ease-in;
}

@keyframes shimmer {
    0% {
        background-position: -768px 0;
    }
    100% {
        background-position: 768px 0;
    }
}
</style>
