<script lang="ts" setup>
defineProps<{ active?: boolean }>()
defineEmits(['click', 'doubleClick'])
</script>

<template>
    <div
        ref="element"
        transition text-gray-600 dark:text-gray-1
        cursor-pointer
        p-3 px-4 rounded-2
        class="shadow-gray-900/5"
        text-14px mb-1 last:mb-0
        flex items-center
        active:translate-y-2px
        :class="[
            active
                ? 'bg-white dark:bg-primary-850 text-gray-600 shadow-md  dark:!text-gray-1'
                : 'hover:bg-gray-100 hover:dark:bg-dark-3',
        ]"
        @click="$emit('click')"
        @dblclick.stop="$emit('doubleClick')"
    >
        <slot />
    </div>
</template>
