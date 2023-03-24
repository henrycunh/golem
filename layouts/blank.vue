<script lang="ts" setup>
useSetup({ disableStorage: true })
</script>

<template>
    <div h-97.5dvh overflow-hidden relative bg-white dark:bg-dark-2 rounded-2 shadow-lg border m-0.25rem>
        <slot h-full />
    </div>
</template>
