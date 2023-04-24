<script lang="ts" setup>
const { isMobile } = useDevice()
const { isSidebarCompact } = useUI()
useSetup()
</script>

<template>
    <ClientOnly>
        <Transition name="scale">
            <div
                relative
                class="2xl:max-w-1366px 2xl:mx-auto"
                h-100dvh
            >
                <div
                    v-if="!isMobile"
                    absolute top-.25rem left-.25rem bottom-.25rem
                    w-17.5rem
                    :class="[
                        isSidebarCompact
                            ? 'w-5rem'
                            : 'w-17.5rem',
                    ]"
                >
                    <ClientOnly>
                        <AppSidebar />
                        <template #placeholder>
                            <div flex flex-col h-full>
                                <Skeleton h-full m-0.25rem rounded-4 />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
                <div
                    overflow-hidden
                    absolute top-0.5rem bottom-0.5rem right-0.5rem
                    bg-white dark:bg-dark-2 rounded-2 shadow-lg border
                    left-17.5rem
                    :class="[
                        isMobile && '!left-0 !top-0 !right-0 !bottom-0 !rounded-0',
                        isSidebarCompact && 'left-5rem',
                    ]"
                >
                    <slot h-full />
                    <div
                        v-if="isMobile"
                        fixed bottom-2.5 left-0
                        right-0 flex items-center
                        justify-center
                    >
                        <AppNavbarMobile />
                    </div>
                </div>
            </div>
        </Transition>
        <template #placeholder>
            <AppSplashScreen />
        </template>
    </ClientOnly>
</template>
