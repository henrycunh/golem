<script lang="ts" setup>
</script>

<template>
    <button
        bg-primary-500
        text-white border-none px-3 py-2 rounded cursor-pointer
        hover:bg-primary-400 active:bg-primary-600
        transition-all
    >
        <slot />
    </button>
</template>
