<script lang="ts" setup>
defineProps<{ modelValue: string | null }>()
defineEmits(['update:modelValue'])
</script>

<template>
    <div>
        <GoTypography title size="small" color="lighter" info="The max amount of tokens per response.">
            Maximum Tokens
        </GoTypography>
        <GoTypography subtitle size="small" color="lighter">
            Leave blank to not limit.
        </GoTypography>
        <GoInput
            :model-value="modelValue"
            mt-2
            text-11px
            sm:text-4 placeholder="Maximum tokens"
            w-full
            text-gray-5 dark:text-gray-1 type="number" min="0"
            @update:model-value="$emit('update:modelValue', $event)"
        />
    </div>
</template>
