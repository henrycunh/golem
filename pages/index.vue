<script lang="ts" setup>
definePageMeta({
    layout: 'default',
})
</script>

<template>
    <div>
        <ClientOnly>
            <AppChat h-full />
            <template #placeholder>
                <Skeleton w-full h-full m-1em />
            </template>
        </ClientOnly>
    </div>
</template>
