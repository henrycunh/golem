<script lang="ts" setup>
defineProps<{
    modelValue: string
    placeholder?: string
}>()
defineEmits(['update:modelValue'])
</script>

<template>
    <input
        b-1 b-solid b-gray-300 focus:b-primary-500 transition p-2 rounded-2px ease-in-out
        focus:placeholder:translate-x-1 placeholder:transition placeholder:ease-in-out
        outline-none placeholder:text-coolgray-400
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', ($event.target as any).value)"
    >
</template>
