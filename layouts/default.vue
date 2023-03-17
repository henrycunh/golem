<script lang="ts" setup>
useSetup()
</script>

<template>
    <div relative m-0.5rem>
        <div absolute top-0.5rem left-0.5rem bottom-0.5rem w-16rem>
            <ClientOnly>
                <AppSidebar />
                <template #placeholder>
                    <div flex flex-col h-full>
                        <Skeleton h-full m-0.25rem rounded-4 />
                    </div>
                </template>
            </ClientOnly>
        </div>
        <div ml-17.5rem>
            <div h-97.5dvh overflow-hidden relative bg-white rounded-2 shadow-lg border>
                <slot h-full />
            </div>
        </div>
    </div>
</template>
