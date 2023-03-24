<script lang="ts" setup>
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
]

const route = useRoute()
</script>

<template>
    <div>
        <div
            sticky top-0 left-0 right-0 b-0 b-b-1 b-gray-1 dark:b-dark-1 b-solid py-5 px-5 z-1
            backdrop-blur-4
            class="bg-white/90 dark:bg-dark-1/90"
        >
            <div max-w-1080px mx-auto px-16 flex items-center>
                <div>
                    <div text-5 font-bold text-gray-6 dark:text-gray-2>
                        Settings
                    </div>
                </div>
            </div>
        </div>
        <div mt-2 max-w-1080px mx-auto px-16 grid grid-cols-6 gap-12 items-start>
            <div
                col-span-2 p-2 mt-6 border b-solid b-gray-2 rounded-4
                class="dark:b-white/10"
            >
                <div
                    v-for="setting in settingsPageList"
                    :key="setting.path"
                    flex items-center gap-2
                    hover:bg-gray-1 hover:dark:bg-dark-1 p-3 rounded-3 cursor-pointer
                    text-gray-6 transition-all
                    active:translate-y-2px
                    @click="navigateTo(setting.path)"
                >
                    <div
                        text-5 text-primary-400
                        :class="[
                            setting.icon,
                            route.path === setting.path ? '!text-primary dark:!text-primary-400 !text-bold' : '',
                        ]"
                    />
                    <div
                        text-gray-5 dark:text-gray-2
                        :class="[
                            route.path === setting.path ? '!text-primary dark:!text-primary-400 !font-bold' : '',
                        ]"
                    >
                        {{ setting.name }}
                    </div>
                </div>
            </div>
            <div col-span-4 mt-8>
                <NuxtPage />
            </div>
        </div>
    </div>
</template>
