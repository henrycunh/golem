<script lang="ts" setup>
useSetup({ disableStorage: true, embedded: true })
</script>

<template>
    <ClientOnly>
        <div h-100dvh>
            <div
                absolute bg-white dark:bg-dark-2 rounded-2 shadow-lg border
                inset-0.75rem overflow-hidden
            >
                <slot h-full w-full />
            </div>
        </div>
        <template #placeholder>
            <AppSplashScreen />
        </template>
    </ClientOnly>
</template>
