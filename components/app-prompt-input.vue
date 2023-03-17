<script lang="ts" setup>
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue', 'send'])

const { token } = useAuth()
const { currentPreset, clearPreset } = usePreset()
const textarea = ref()

const isLogged = computed(() => Boolean(token.value))

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

const onType = (event: any) => {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${textarea.value.scrollHeight}px`

    emit('update:modelValue', (event.target as any).value)
}
</script>

<template>
    <div
        relative p-3
        pr-20 text-gray-600 placeholder:text-gray-400
        placeholder:transition
        class="focus-within:placeholder:translate-x-2 bg-gray-1/80" ring-2
        ring-inset rounded-3 shadow-inset
        shadow ring-gray-100 focus:ring-gray-200 focus-within:shadow-md
        transition
        :class="[
            !isLogged ? 'cursor-not-allowed' : '',
        ]"
    >
        <textarea
            ref="textarea"
            :value="modelValue"
            :disabled="!token"
            w-full
            text-14px outline-none overflow-hidden bg-transparent
            placeholder="Type your prompt here..."
            leading-6
            relative z-2 h-auto resize-none b-0
            @input="onType"
            @keydown.enter="handleEnter"
        />
        <div absolute right-2 bottom-10px z-3>
            <UButton
                rounded-3
                :disabled="!isLogged || !modelValue"
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
