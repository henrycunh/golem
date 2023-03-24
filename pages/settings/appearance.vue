<script lang="ts" setup>
import type { BasicColorSchema } from '@vueuse/core'

const currentColorMode = useColorMode({
    emitAuto: true,
})

const options = [
    { value: 'light', label: 'Light', icon: 'i-tabler-sun' },
    { value: 'dark', label: 'Dark', icon: 'i-tabler-moon' },
    { value: 'auto', label: 'System', icon: 'i-tabler-3d-cube-sphere' },
] as const

function onClick(colorMode: BasicColorSchema) {
    currentColorMode.value = colorMode
}
</script>

<template>
    <div>
        <div font-bold text-gray-6 dark:text-gray-3 mb-3>
            Color Mode
        </div>
        <div flex gap-3>
            <div
                v-for="option in options"
                :key="option.value"
                grow flex flex-col items-center p-2
                rounded-2 ring-1
                cursor-pointer
                class="dark:ring-white/10 ring-gray-2"
                text-gray-5
                dark:text-gray-3 gap-2
                :class="[
                    currentColorMode === option.value ? '!ring-primary-400 !dark:ring-primary-400 ring-2 !text-primary' : '',
                ]"
                @click="onClick(option.value)"
            >
                <div :class="option.icon" text-6 />
                <div>{{ option.label }}</div>
            </div>
        </div>
    </div>
</template>
