<script lang="ts" setup>
defineProps<{ value: any }>()
</script>

<template>
    <transition name="slide-fade" mode="out-in">
        <div :key="value" v-bind="{ ...$attrs }">
            {{ value }}
        </div>
    </transition>
</template>

<style scoped>
.slide-fade-enter-active {
    transition: all 100ms ease;
}
.slide-fade-leave-active {
    transition: all 100ms cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to{
    transform: translateY(-10px);
    opacity: 0;
}
</style>
