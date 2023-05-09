<script lang="ts" setup>
const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits(['update:modelValue'])

const options = [
    { value: 'none', label: 'None', icon: 'i-tabler-antenna-bars-1' },
    { value: 'normal', label: 'Normal', icon: 'i-tabler-antenna-bars-3' },
    { value: 'high', label: 'High', icon: 'i-tabler-antenna-bars-5' },
]

watchEffect(() => {
    if (props.modelValue === undefined) {
        emit('update:modelValue', options[0].value)
    }
})
</script>

<template>
    <div>
        <GoTypography title size="small" color="lighter">
            Creativity
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
