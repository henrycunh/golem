<script lang="ts" setup>
defineProps<{ modelValue: string | null }>()
const emit = defineEmits(['update:modelValue'])

const options = [
    { value: 'gpt-3.5-turbo', label: 'GPT 3.5', icon: 'i-tabler-brand-openai' },
    { value: 'gpt-4', label: 'GPT 4', icon: 'i-tabler-brand-openai' },
]
</script>

<template>
    <div>
        <GoTypography title size="small" color="lighter" info="The model used for the text completions.">
            Model
        </GoTypography>
        <div flex gap-3>
            <GoButtonSelect
                :options="options" w-full
                :model-value="modelValue"
                @update:model-value="emit('update:modelValue', $event)"
            />
        </div>
    </div>
</template>
