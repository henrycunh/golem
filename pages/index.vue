<script lang="ts" setup>
useSetup()
</script>

<template>
    <!-- 12 columns with gutter 24 -->
    <div relative m-0.5rem>
        <!-- First div is 3 columns -->
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
            <AppChat />
        </div>
    </div>
</template>
