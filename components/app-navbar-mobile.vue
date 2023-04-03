<script lang="ts" setup>
const { apiKey } = useSettings()

const itemList = [
    {
        name: 'History',
        icon: 'i-tabler-history',
        path: '/history',
    },
    {
        name: 'Chat',
        icon: 'i-tabler-message-2',
        path: '/chat',
    },
    {
        name: 'Settings',
        icon: 'i-tabler-settings',
        path: '/settings',
    },
]

const hasSettingsNotification = computed(() => !apiKey.value)

const route = useRoute()
</script>

<template>
    <div
        text-color rounded-3
        p-1
        class="bg-gray-3/40 dark:bg-white/10 backdrop-blur-3px"
        text-12px
        flex gap-2 items-center
    >
        <div
            v-for="item in itemList"
            :key="item.path"
            rounded-2 p-2 py-1 text-color
            w-12 h-full
            flex flex-col items-center justify-center gap-1
            cursor-pointer
            active:translate-y-2px transition
            relative
            :class="[
                route.path.startsWith(item.path) ? '!bg-primary-50/50 dark:!bg-primary-600/30 !text-primary-600' : 'op-40',
            ]"
            @click="navigateTo(item.path)"
        >
            <div :class="item.icon" text-4 />
            <div
                v-if="hasSettingsNotification && item.path === '/settings'"
                bg-primary rounded-full text-white
                h-3 w-3 flex items-center justify-center
                text-10px
                absolute top-0 right-0
            >
                !
            </div>
        </div>
    </div>
</template>
