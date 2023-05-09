<script lang="ts" setup>
const props = defineProps<{ modelValue?: string | null; options: { value: string; icon: string; label: string; info?: string }[] }>()
const emit = defineEmits(['update:modelValue'])

watchEffect(() => {
    if (props.modelValue === undefined) {
        emit('update:modelValue', props.options[0].value)
    }
})

function onClick(model: string) {
    emit('update:modelValue', model)
}
</script>

<template>
    <div flex gap-3>
        <div
            v-for="option in options"
            :key="option.value"
            v-tooltip="option.info"
            grow flex flex-col items-center
            p-2 rounded-2
            ring-1
            cursor-pointer
            class="dark:ring-white/10 ring-gray-2"
            text-gray-5 dark:text-gray-3
            gap-2 text-11px
            sm:text-4
            :class="[
                modelValue === option.value ? '!ring-primary-400 !dark:ring-primary-400 ring-2 !text-primary-600 dark:!text-primary-400' : '',
            ]"
            @click="onClick(option.value)"
        >
            <div :class="option.icon" text-5 sm:text-6 />
            <div>{{ option.label }}</div>
        </div>
    </div>
</template>
