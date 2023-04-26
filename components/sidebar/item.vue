<script lang="ts" setup>
defineProps<{ active?: boolean }>()
defineEmits(['click', 'doubleClick'])
</script>

<template>
    <div
        ref="element"
        text-color font-bold font-title
        transition
        cursor-pointer
        p-2 px-4
        class="shadow-gray-900/5"
        mb-1 last:mb-0
        flex items-center
        active:translate-y-2px
        :class="[
            active
                ? 'bg-white text-gray-600 shadow-md dark:bg-dark-1 dark:!text-gray-1'
                : 'hover:bg-gray-100 hover:dark:bg-dark-3',
        ]"
        @click="$emit('click')"
        @dblclick.stop="$emit('doubleClick')"
    >
        <slot />
    </div>
</template>
