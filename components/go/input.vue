<script lang="ts" setup>
defineProps<{
    modelValue: string | null
    placeholder?: string
    when?: Record<string, (e: any) => void>
    error?: string | false
}>()
defineEmits(['update:modelValue'])
</script>

<script lang="ts">
export default {
    inheritAttrs: false,
}
</script>

<template>
    <div w-full>
        <input
            b-1 b-solid b-gray-300 focus:b-primary-500 transition p-2 ease-in-out
            focus:placeholder:translate-x-1 placeholder:transition placeholder:ease-in-out
            outline-none placeholder:text-color placeholder:op-40 rounded-2
            class="dark:b-white/10 dark:focus:b-primary-400"
            bg-transparent text-color
            :class="[
                error && '!b-red-4',
            ]"
            :value="modelValue"
            :placeholder="placeholder"
            v-bind="{ ...$attrs }"
            @input="$emit('update:modelValue', ($event.target as any).value)"
            v-on="when || {}"
        >
        <div v-if="error" text-red-400 text-11px sm:text-14px mt-1>
            {{ error }}
        </div>
    </div>
</template>
