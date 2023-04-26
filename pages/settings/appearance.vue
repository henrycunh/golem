<script lang="ts" setup>
import tinycolor from 'tinycolor2'
import { NavigationBarPosition } from '~~/composables/appearence'
const currentColorMode = useColorMode()
const { isDetaEnabled } = useDeta()
const client = useClient()
const { setPalette, color: currentColor, navigationBarPosition } = useAppearance()

const colorModeOptions = [
    { value: 'light', label: 'Light', icon: 'i-tabler-sun' },
    { value: 'dark', label: 'Dark', icon: 'i-tabler-moon' },
    { value: 'system', label: 'System', icon: 'i-tabler-3d-cube-sphere' },
] as const

const navigationBarPositionOptions = [
    { value: 'top', label: 'Top', icon: 'i-tabler-box-align-top' },
    { value: 'bottom', label: 'Bottom', icon: 'i-tabler-box-align-bottom' },
    { value: 'left', label: 'Left', icon: 'i-tabler-box-align-left' },
    { value: 'right', label: 'Right', icon: 'i-tabler-box-align-right' },
]

const hueSteppedThemeColorOptions = computed(() => {
    // hue goes from 0 to 360, so we have 24 steps
    const hueSteps = Array.from({ length: 24 }, (_, i) => i * 15)
    const mappedHueSteps = hueSteps.map((hue) => {
        const color = tinycolor({ h: hue, s: 0.6, l: 0.5 })
        return color.toHexString()
    })
    return mappedHueSteps.slice(19).concat(mappedHueSteps.slice(0, 19))
})

function onColorModeClick(colorMode: string) {
    currentColorMode.preference = colorMode
}

function onNavigationBarPositionClick(position: NavigationBarPosition) {
    navigationBarPosition.value = position
}

function onThemeColorClick(color: string) {
    setPalette(color)
    if (isDetaEnabled) {
        client.deta.preferences.set.mutate({ key: 'color', value: color })
    }
}
</script>

<template>
    <div>
        <div
            font-bold text-gray-6 dark:text-gray-3 mb-3
            text-14px sm:text-5
        >
            Color Mode
        </div>
        <div grid grid-cols-3 gap-2 sm:gap-3>
            <div
                v-for="option in colorModeOptions"
                :key="option.value"
                grow flex flex-col items-center p-2
                rounded-2 ring-1
                cursor-pointer
                class="dark:ring-white/10 ring-gray-2"
                text-gray-5
                dark:text-gray-3 gap-2
                text-11px sm:text-4
                :class="[
                    currentColorMode.preference === option.value ? '!ring-primary-400 !dark:ring-primary-400 ring-2 !text-primary-600 dark:!text-primary-400' : '',
                ]"
                @click="onColorModeClick(option.value)"
            >
                <div :class="option.icon" text-5 sm:text-6 />
                <div>{{ option.label }}</div>
            </div>
        </div>

        <!-- Theme color -->
        <div
            font-bold text-gray-6 dark:text-gray-3 mb-3 mt-6
            text-14px sm:text-5
        >
            Theme color
        </div>
        <div
            grid grid-gap-2
            class="grid-cols-[repeat(auto-fill,minmax(32px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(64px,1fr))]"
        >
            <div
                v-for="color in hueSteppedThemeColorOptions"
                :key="color"
                w-full h-8 sm:h-12
                :style="{ backgroundColor: color }"
                transition-all ring-0
                cursor-pointer rounded
                :class="[
                    color === currentColor ? 'ring-4 ring-primary-300 z-1' : '',
                ]"
                @click="onThemeColorClick(color)"
            />
        </div>

        <!-- Navigation bar position -->
        <div
            font-bold text-gray-6 dark:text-gray-3 mb-3 mt-6
            text-14px sm:text-5
        >
            Navigation bar position
        </div>

        <div grid grid-cols-4 gap-2 sm:gap-3>
            <div
                v-for="option in navigationBarPositionOptions"
                :key="option.value"
                grow flex flex-col items-center p-2
                rounded-2 ring-1
                cursor-pointer
                class="dark:ring-white/10 ring-gray-2"
                text-gray-5
                dark:text-gray-3 gap-2
                text-11px sm:text-4
                :class="[
                    navigationBarPosition === option.value ? '!ring-primary-400 !dark:ring-primary-400 ring-2 !text-primary-600 dark:!text-primary-400' : '',
                ]"
                @click="onNavigationBarPositionClick(option.value as NavigationBarPosition)"
            >
                <div :class="option.icon" text-5 sm:text-6 />
                <div>{{ option.label }}</div>
            </div>
        </div>
    </div>
</template>
