<script lang="ts" setup>
const props = defineProps<{
    outline?: boolean
}>()
defineEmits(['click'])
// Theres a radial gradient in the background of the button
// that follows the mouse cursor

const buttonElement = ref()
const { elementX, elementY, elementWidth, isOutside } = useMouseInElement(buttonElement)
const backgroundCenterBase = computed(() =>
    !isOutside.value
        ? [elementX.value, elementY.value]
        // Else, pin to the right top corner
        : [elementWidth.value, 0],
)
const [toColor, fromColor] = ['#903597ff', '#e0b1e700']

const backgroundCenter = useTransition(backgroundCenterBase, {
    duration: 200,
})

const { pressed: isMousePressed } = useMousePressed({ target: buttonElement })

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
        rounded-2 flex items-center
        justify-center bg-gradient-to-tr from-primary-600
        to-primary-100 border-0
        transition-all
        box-border shadow-md select-none
        class="shadow-primary-900/10"
        active:scale-98 active:shadow-none cursor-pointer p-0
        :style="gradientStyle"
        @click="$emit('click')"
    >
        <div
            px-3 py-6px bg="primary-800/70"
            text-white text-sm font-bold
            transition-all
            box-border m-0.1rem
            rounded-6px w-full
        >
            <slot />
        </div>
    </button>
</template>
