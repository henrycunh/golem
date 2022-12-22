<script lang="ts" setup>
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue', 'send'])

const { currentPreset, clearPreset } = usePreset()

const onSend = () => {
    emit('send', props.modelValue)
    emit('update:modelValue', '')
}

const handleEnter = (e: KeyboardEvent) => {
    if (e.shiftKey) {
        return
    }
    e.preventDefault()
    onSend()
}

const rows = computed(() => {
    const lines = props.modelValue.split('\n')
    return Math.min(10, lines.length)
})
</script>

<template>
    <div relative>
        <textarea
            :value="modelValue"
            :rows="rows"
            w-full
            p-3 b-0 shadow-lg resize-none
            outline-none ring-2 ring-inset
            ring-gray-100 focus:ring-primary-400 focus:shadow-xl transition
            text-18px
            text-gray-600 placeholder:text-primary-400 placeholder:transition
            rounded-3 class="focus:placeholder:translate-x-2"
            placeholder="Type your prompt here..."
            overflow-hidden
            relative z-2
            @input="$emit('update:modelValue', ($event.target as any).value)" @keydown.enter="handleEnter"
        />
        <div absolute right-2 bottom-3 z-3>
            <UButton
                rounded-3
                py-6px
                @click="onSend"
            >
                <div i-tabler-send text-5 />
            </UButton>
        </div>
        <transition
            name="slide-in-bottom"
        >
            <div
                v-if="currentPreset"
                absolute top--10 left-0 right-0 z-1
                rounded-t-2 text-14px bg-primary-700 text-white p-2 px-4 pb-4
                flex gap-1 items-center op100
            >
                <div i-tabler-3d-cube-sphere />
                <span>Using preset</span>
                <strong>{{ currentPreset.title }}</strong>

                <div
                    ml-auto text-5 cursor-pointer p-1 rounded-2 hover:bg-primary-900 transition
                    @click="clearPreset"
                >
                    <div i-tabler-x />
                </div>
            </div>
        </transition>
    </div>
</template>

<style>
.slide-in-bottom-enter-active, .slide-in-bottom-leave-active {
    transition: all .2s ease;
}

.slide-in-bottom-enter, .slide-in-bottom-leave-to {
    transform: translateY(100%) scaleY(0);
    opacity: 0;
}
</style>
