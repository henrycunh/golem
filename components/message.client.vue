<script lang="ts" setup>
import type { types } from '~~/utils/types'

const props = defineProps<{ message: types.Message }>()

const { currentPreset } = usePreset()

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.text.replace(currentPreset.value.content, '') : props.message.text,
)

const errorMessageMapping = {
    token_expired: 'Your session has expired. Please login again.',
}
</script>

<template>
    <div
        w-full
    >
        <div
            p-3 leading-6
            rounded-2
            text-15px justify-start text-gray-6 dark:text-gray-2
            :class="[
                message.role === 'user' && 'bg-gray-1 dark:bg-gray-1/5',
            ]"
        >
            <div
                relative
            >
                <!-- Agent name -->
                <div font-bold text-gray-7 dark:text-gray-1 mb-1 mx-6>
                    {{ message.role === 'assistant' ? 'Gepeto' : 'You' }}
                </div>
                <div
                    w-8 h-8 rounded-2 absolute left--6 top-1 flex items-center justify-center
                    class="bg-gray-2/70 dark:!bg-white/10"
                >
                    <div
                        text-22px
                        :class="[
                            message.role === 'assistant' && 'i-tabler-robot text-primary-500',
                            message.role === 'user' && 'i-tabler-user text-gray-400',
                        ]"
                    />
                </div>
                <div px-6>
                    <MarkdownRenderer
                        v-if="message.role === 'assistant'"
                        :value="message.text"
                        text-14px
                    />
                    <div v-else>
                        <div
                            v-for="line in filteredUserMessage.split('\n')"
                            :key="line"
                            whitespace-pre-wrap
                        >
                            {{ line }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
