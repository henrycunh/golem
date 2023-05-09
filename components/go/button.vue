<script lang="ts" setup>
const props = defineProps<{
    outline?: boolean
    disabled?: boolean
    secondary?: boolean
    icon?: string
    color?: string
}>()

defineEmits(['click'])
// Theres a radial gradient in the background of the button
// that follows the mouse cursor

const buttonElement = ref()
const { elementX, elementY, elementWidth, isOutside } = useMouseInElement(buttonElement)
const backgroundCenterBase = computed(() =>
    !isOutside.value
        ? [elementX.value, elementY.value]
        // Else, pin to the top center
        : [elementWidth.value / 2, 0],
)
const [fromColor, toColor] = [
    'rgba(var(--color-primary-300), 1)',
    'rgba(var(--color-primary-700), 1)',
]

const backgroundCenter = useTransition(backgroundCenterBase, {
    duration: 200,
})

const gradientStyle = computed(() => {
    // If the mouse is outside the button, use `backgroundCenter`
    // Else, use the mouse position in the button
    const [x, y] = isOutside.value ? backgroundCenter.value : [elementX.value, elementY.value]

    return {
        background: `radial-gradient(circle at ${x}px ${y}px, ${fromColor} 0%, ${toColor} 100%)`,
    }
})
</script>

<template>
    <button
        ref="buttonElement"
        rounded-6px flex items-center
        justify-center bg-gradient-to-tr from-primary-600
        to-primary-100 border-0
        transition-all
        box-border shadow-md select-none
        class="shadow-900/10"
        active:scale-98 active:shadow-none cursor-pointer p-0
        :style="!disabled ? gradientStyle : {}"
        :class="[
            secondary && '!bg-none !bg-200/30 !shadow-none dark:!bg-500/20',
            disabled ? 'cursor-not-allowed !from-gray-5 !to-gray-2' : '',
        ]"
        @click="$emit('click')"
    >
        <div
            px-.75em py-.45em
            text-white text-1em font-bold
            transition-all
            box-border
            rounded-6px
            class="!w-full !m-0.12rem bg-600/65"
            :class="[
                secondary && '!bg-transparent !text-primary-600 dark:!text-primary-300',
                disabled ? '!bg-gray-5' : '',
            ]"
            flex items-center justify-center gap-1
        >
            <div v-if="icon" :class="icon" />
            <slot />
        </div>
    </button>
</template>
