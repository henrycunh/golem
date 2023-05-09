<!--
    This a long pressable button, that fills a progress
    fill until the action is executed
-->
<script lang="ts" setup>
const props = defineProps<{
    duration: number
    progressBarStyle?: string
    successStyle?: string
    icon?: string
    small?: boolean
}>()
const emit = defineEmits(['success'])

const element = ref<HTMLElement>()
const progress = ref(0)
onLongPress(element, () => {
    emit('success')
    setTimeout(() => {
        progress.value = 0
    }, 100)
}, { delay: props.duration, modifiers: { stop: true } })

function onMouseDown(e: Event) {
    progress.value = 100
    e.preventDefault()
}

function onMouseUp(e: Event) {
    progress.value = 0
    e.preventDefault()
}

watchEffect(() => {
    if (element.value) {
        element.value.addEventListener('contextmenu', (e) => {
            e.preventDefault()
        })
    }
})

const transitionStyle = computed(() => {
    return {
        'transition-duration': `${progress.value ? props.duration : 200}ms`,
        'transition-timing-function': 'cubic-bezier(0,-0.04, 0.28, 0.94)',
    }
})
</script>

<template>
    <button
        ref="element"
        ring-2
        b-0
        px-.75em py-.45em
        bg-transparent
        relative cursor-pointer
        class="ring-#EFEFF0 !bg-#FCFCFC hover:bg-white dark:!bg-#474747 dark:ring-#4F4F50 dark:hover:bg-#4C4C4C"
        rounded-6px
        overflow-hidden
        text-color font-bold
        select-none
        flex items-center justify-center
        gap-1
        :style="{
            transform: `translateY(${progress / 30}px)`,
            ...transitionStyle,
        }"
        :class="[
            progress > 0 && props.successStyle,
            small && '!p-.35em',
        ]"
        @mousedown.stop="onMouseDown"
        @mouseup.stop="onMouseUp"
        @mouseleave.stop="onMouseUp"
        @touchstart.stop="onMouseDown"
        @touchend.stop="onMouseUp"
    >
        <div
            absolute top-0 bottom-0 left-0 bg-red transition-all
            z-1
            :style="{
                width: `${progress}%`,
                ...transitionStyle,
            }"
            :class="[
                props.progressBarStyle,
            ]"
        />
        <div
            v-if="icon"
            relative z-1
            :class="icon"
        />
        <span v-if="$slots.default" relative z-1>
            <slot />
        </span>
    </button>
</template>

<style scoped>
button {
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}
</style>
