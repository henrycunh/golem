<script lang="ts" setup>
const { isMobile } = useDevice()
const { isSidebarCompact } = useUI()
const { navigationBarPosition } = useAppearance()

const navigationBarPositionClasses = computed(() => {
    const positionMapping = {
        top: 'top-0 left-0 right-0 h-4rem',
        bottom: 'bottom-0 left-0 right-0 h-4rem',
        right: 'top-0 bottom-0 right-0 w-4rem',
        left: 'top-0 bottom-0 left-0 w-4rem',
    } as const
    return positionMapping[navigationBarPosition.value]
})

const mainContainerClasses = computed(() => {
    if (isMobile.value) {
        return '!inset-0 !rounded-0'
    }
    const positionMapping = {
        top: (() => {
            if (isSidebarCompact.value) {
                return '!top-4rem'
            }
            return '!top-4rem !left-15rem'
        })(),
        bottom: (() => {
            if (isSidebarCompact.value) {
                return '!bottom-4rem'
            }
            return '!bottom-4rem !left-15rem'
        })(),
        right: (() => {
            if (isSidebarCompact.value) {
                return '!right-4rem'
            }
            return '!right-4rem !left-15rem'
        })(),
        left: (() => {
            if (isSidebarCompact.value) {
                return '!left-4rem'
            }
            return '!left-19rem'
        })(),
    } as const
    return positionMapping[navigationBarPosition.value]
})

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
                <AppNavbar
                    v-if="!isMobile"
                    :class="navigationBarPositionClasses"
                    absolute z-99
                />
                <div
                    v-if="!isMobile"
                    absolute top-0 left-0 bottom-0
                    w-15rem
                    :class="[
                        navigationBarPosition === 'left' ? 'left-4rem' : 'left-0',
                        navigationBarPosition === 'bottom' ? 'bottom-4rem' : 'bottom-0',
                        navigationBarPosition === 'top' ? 'top-4rem' : 'top-0',
                    ]"
                >
                    <ClientOnly>
                        <AppMessagesSidebar />
                        <template #placeholder>
                            <div flex flex-col h-full>
                                <Skeleton h-full m-0.25rem rounded-4 />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
                <div
                    overflow-hidden
                    absolute inset-0
                    bg-white dark:bg-dark-2 shadow border
                    :class="mainContainerClasses"
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
