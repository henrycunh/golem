<script lang="ts" setup>
import type { types } from '~~/utils/types'

const props = defineProps<{ message: types.Message }>()

const { currentPreset } = usePreset()

const { clearErrorMessages } = useConversations()

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.text.replace(currentPreset.value.content, '') : props.message.text,
)
</script>

<template>
    <div
        w-full
    >
        <div
            p-3 leading-6
            rounded-2
            text-15px justify-start text-color
            :class="[
                message.role === 'user' && 'bg-gray-1 dark:bg-gray-1/5',
                message.isError && 'bg-red-100 dark:bg-red-9/20',
            ]"
        >
            <div
                relative
            >
                <!-- Agent name -->
                <div
                    font-bold text-color mb-1 mx-6
                    :class="[
                        message.isError && 'text-red-9 dark:text-red-3',
                    ]"
                >
                    {{ message.role === 'assistant' ? 'Gepeto' : 'You' }}
                </div>
                <div
                    w-8 h-8 rounded-2 absolute left--6 top-1 flex items-center justify-center
                    class="bg-gray-2/70 dark:bg-white/10"
                    :class="[
                        message.isError && '!bg-red-3 dark:!bg-red-5/20',
                    ]"
                >
                    <div
                        text-22px
                        :class="[
                            message.role === 'assistant' && 'i-tabler-robot text-primary-500',
                            message.role === 'user' && 'i-tabler-user text-gray-400',
                            message.isError && '!i-tabler-alert-triangle !text-red-700',
                        ]"
                    />
                </div>
                <div px-6>
                    <MarkdownRenderer
                        v-if="message.role === 'assistant' && !message.isError"
                        :value="message.text"
                        text-14px
                    />
                    <div v-else-if="message.role === 'user'">
                        <div
                            v-for="line in filteredUserMessage.split('\n')"
                            :key="line"
                            whitespace-pre-wrap
                        >
                            {{ line }}
                        </div>
                    </div>
                    <div v-else text-red-8 dark:text-red-4>
                        {{ message.text }}
                    </div>
                </div>

                <div v-if="message.isError" px-6 flex mt-2>
                    <div
                        bg-red-200 text-red-7
                        class="dark:bg-red-5/20 dark:text-red-4"
                        p-1 px-2 rounded-2 font-bold text-14px
                        active:translate-y-2px hover:op-80
                        cursor-pointer select-none
                        transition
                        @click="clearErrorMessages"
                    >
                        Dismiss errors
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
