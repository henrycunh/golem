<script lang="ts" setup>
const { navigationBarPosition } = useAppearance()

const sidebarItems = [
    {
        path: '/chat',
        icon: 'i-tabler-messages',
        title: 'Chat',
    },
    {
        path: '/history',
        icon: 'i-tabler-history',
        title: 'History',
    },
    // {
    //     path: '/personas',
    //     icon: 'i-tabler-users',
    //     title: 'Personas',
    // },
    {
        path: '/settings',
        icon: 'i-tabler-settings',
        title: 'Settings',
    },
]
const navigationBarPositionClasses = computed(() => {
    const positionMapping = {
        top: 'w-full flex justify-center items-center b-b-1',
        bottom: 'w-full flex justify-center items-center b-t-1',
        right: 'h-full flex flex-col justify-center items-center b-l-1',
        left: 'h-full flex flex-col justify-center items-center b-r-1',
    } as const
    return positionMapping[navigationBarPosition.value]
})

const itemClasses = computed(() => {
    const positionMapping = {
        top: 'h-full',
        bottom: 'h-full',
        right: 'w-full',
        left: 'w-full',
    } as const
    return positionMapping[navigationBarPosition.value]
})

const activeOverlayClasses = computed(() => {
    const positionMapping = {
        top: 'b-b-5 bg-gradient-to-t',
        bottom: 'b-t-5 bg-gradient-to-b',
        right: 'b-l-5 bg-gradient-to-r',
        left: 'b-r-5 bg-gradient-to-l',
    } as const
    return positionMapping[navigationBarPosition.value]
})

const isCurrentRoute = (item: typeof sidebarItems[0]) => {
    return useRoute().path.startsWith(item.path)
}

const tooltipPlacement = computed(() => {
    const positionMapping = {
        top: 'bottom',
        bottom: 'top',
        right: 'left',
        left: 'right',
    } as const
    return positionMapping[navigationBarPosition.value]
})
</script>

<template>
    <div
        b-0 b-solid b="dark:white/15 dark-1/10"
        dark:bg-dark-4
        :class="navigationBarPositionClasses"
    >
        <div
            v-for="item in sidebarItems"
            :key="item.path"
            v-tooltip="{
                content: item.title,
                placement: tooltipPlacement,
            }"
            p-4
            text-color
            cursor-pointer
            relative flex items-center
            justify-center
            transition-all
            group
            :class="itemClasses"
            @click="navigateTo(item.path)"
        >
            <div
                :class="[
                    item.icon,
                    isCurrentRoute(item) && '!op-100',
                ]"
                transition-all
                text-7 relative z-1 op-40
                class="group:hover:!op-100"
            />
            <Transition name="fade">
                <div
                    v-if="isCurrentRoute(item)"
                    absolute inset-0 z-0
                    b-0 b-solid b-primary
                    :class="activeOverlayClasses"
                    class="dark:from-dark-2 dark:to-dark-4/20"
                />
            </Transition>
        </div>
    </div>
</template>
