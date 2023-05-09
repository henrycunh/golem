<script lang="ts" setup>
const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits(['update:modelValue'])

const options = [
    { value: 'none', label: 'None', icon: 'i-tabler-antenna-bars-1', info: 'Totally deterministic results.' },
    { value: 'normal', label: 'Normal', icon: 'i-tabler-antenna-bars-3', info: 'Results are not too wild.' },
    { value: 'high', label: 'High', icon: 'i-tabler-antenna-bars-5', info: 'Results are really creative!' },
]

watchEffect(() => {
    if (props.modelValue === undefined) {
        emit('update:modelValue', options[0].value)
    }
})
</script>

<template>
    <div>
        <GoTypography title size="small" color="lighter" info="Determines ow random or deterministic the responses are.">
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
