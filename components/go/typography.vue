<script lang="ts" setup>
defineProps<{
    title?: boolean
    size?: 'small' | 'medium' | 'large'
    color?: 'lighter'
    info?: string
}>()
</script>

<template>
    <div
        text-color flex items-center
        :class="[
            title && `text-1em sm:text-1.5em font-bold font-title mb-2 `,
            size === 'small' && `text-0.75em sm:text-1em`,
            size === 'medium' && `text-1em sm:text-1.5em`,
            size === 'large' && `text-1.5em sm:text-2em`,
            color === 'lighter' && `text-color-lighter`,
        ]"
    >
        <slot />
        <div
            v-if="info" v-tooltip="info" i-tabler-info-circle ml-1 text-.85em relative top--0.35em
            op-50
        />
    </div>
</template>
