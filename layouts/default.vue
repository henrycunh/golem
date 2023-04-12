<script lang="ts" setup>
const { isMobile } = useDevice()
useSetup()
</script>

<template>
    <ClientOnly>
        <Transition name="scale">
            <div
                relative
                class="2xl:max-w-1366px 2xl:mx-auto"
                h-100dvh
                :class="[
                    // !isMobile ? 'm-0.5rem' : 'm-0.25rem',
                ]"
            >
                <div
                    v-if="!isMobile"
                    absolute top-1rem left-0 bottom-1rem
                    w-17.5rem
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
                    absolute top-1.5rem bottom-1.5rem right-0.5rem
                    bg-white dark:bg-primary-925 rounded-2 shadow-lg border
                    :class="[
                        !isMobile ? 'left-17.5rem' : 'left-0.5rem',
                    ]"
                >
                    <slot h-full />
                    <div
                        v-if="isMobile"
                        fixed bottom-4.75 left-0
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
