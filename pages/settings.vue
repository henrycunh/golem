<script lang="ts" setup>
const { isDetaEnabled } = useDeta()

const settingsPageList = [
    {
        name: 'API Key',
        icon: 'i-tabler-key',
        path: '/settings/api-key',
    },
    {
        name: 'Appearance',
        icon: 'i-tabler-palette',
        path: '/settings/appearance',
    },
    {
        name: 'Model',
        icon: 'i-tabler-box-model-2',
        path: '/settings/model',
    },
    // isDetaEnabled.value && {
    //     name: 'Deta',
    //     icon: 'i-tabler-database',
    //     path: '/settings/deta',
    // },
].filter(Boolean) as {
    name: string
    icon: string
    path: string
}[]

const route = useRoute()
</script>

<template>
    <div>
        <div
            sticky top-0 left-0 right-0 b-0 b-b-1 b-gray-1 dark:b-dark-1 b-solid py-5 z-1
            backdrop-blur-4
            class="bg-white/90 dark:bg-dark-1/90"
        >
            <div
                px-4
                flex items-center
            >
                <div>
                    <div
                        text-14px sm:text-6
                        font-bold font-title text-gray-6 dark:text-gray-2
                    >
                        Settings
                    </div>
                </div>
            </div>
        </div>
        <div
            mt-2 max-w-1080px mx-auto
            px-4 md:px-6
            grid
            grid-cols-12 sm:grid-cols-6
            gap-3 md:gap-6 items-start
            pt-2 sm:pt-6
        >
            <div
                col-span-4 sm:col-span-2
                p-1 sm:p-2
                border b-solid b-gray-2
                rounded-3 sm:rounded-4
                class="dark:b-white/10"
            >
                <div
                    v-for="setting in settingsPageList"
                    :key="setting.path"
                    flex items-center gap-2
                    hover:bg-gray-1 hover:dark:bg-dark-1
                    p-2 sm:p-3
                    rounded-2 sm:rounded-3
                    cursor-pointer
                    text-gray-6 transition-all
                    active:translate-y-2px
                    @click="navigateTo(setting.path)"
                >
                    <div
                        text-14px sm:text-5
                        class="!text-primary-500 dark:!text-primary-400"
                        :class="[
                            setting.icon,
                            route.path === setting.path ? '!text-primary !text-bold' : '',
                        ]"
                    />
                    <div
                        text-gray-5 dark:text-gray-2
                        text-9px sm:text-4
                        :class="[
                            route.path === setting.path ? '!text-primary-500 dark:!text-primary-400 !font-bold' : '',
                        ]"
                    >
                        {{ setting.name }}
                    </div>
                </div>
            </div>
            <div col-span-7 sm:col-span-4>
                <ClientOnly>
                    <NuxtPage />
                    <template #placeholder>
                        <Skeleton rounded-4 w-full min-h-128 m-0.25rem />
                    </template>
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
