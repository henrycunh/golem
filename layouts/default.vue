<script lang="ts" setup>
const { isMobile } = useDevice()
</script>

<template>
    <ClientOnly>
        <Transition name="scale">
            <div
                relative
                class="2xl:max-w-1366px 2xl:mx-auto"
                :class="[
                    !isMobile ? 'm-0.5rem' : 'm-0.25rem',
                ]"
            >
                <div
                    v-if="!isMobile"
                    absolute top-0.5rem left-0.5rem bottom-0.5rem
                    w-16rem
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
                    :class="[
                        !isMobile ? 'ml-17.5rem' : '',
                    ]"
                >
                    <div h-97.5dvh overflow-hidden relative bg-white dark:bg-dark-2 rounded-2 shadow-lg border>
                        <slot h-full />
                        <div
                            v-if="isMobile"
                            fixed bottom-1 left-0
                            right-0 flex items-center
                            justify-center
                        >
                            <AppNavbarMobile />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
        <template #placeholder>
            <AppSplashScreen />
        </template>
    </ClientOnly>
</template>
