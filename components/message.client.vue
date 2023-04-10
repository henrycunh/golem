<script lang="ts" setup>
import type { types } from '~~/utils/types'

const props = defineProps<{ message: types.Message }>()

const { currentPreset } = usePreset()
const element = ref()

const isHovering = useElementHover(element)
const { clearErrorMessages, removeMessageFromConversation, currentConversation } = useConversations()

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.text.replace(currentPreset.value.content, '') : props.message.text,
)

async function removeMessage() {
    if (!currentConversation.value) {
        return
    }
    await removeMessageFromConversation(currentConversation.value?.id, props.message.id)
}
</script>

<template>
    <div
        ref="element"
        w-full
    >
        <div
            py-2 sm:py-3
            px-1 sm:px-3
            leading-4 sm:leading-6
            rounded-2
            text-11px sm:text-15px justify-start text-color
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
                    font-bold text-color mb-1 mx-3 sm:mx-6
                    :class="[
                        message.isError && 'text-red-9 dark:text-red-3',
                    ]"
                >
                    {{ message.role === 'assistant' ? 'Gepeto' : 'You' }}
                </div>
                <div
                    w-5 h-5 sm:w-8 sm:h-8
                    rounded sm:rounded-2
                    absolute
                    left--14px sm:left--6
                    top-0 flex items-center justify-center
                    class="bg-gray-2/70 dark:bg-white/10"
                    :class="[
                        message.isError && '!bg-red-3 dark:!bg-red-5/20',
                    ]"
                >
                    <div
                        text-3 sm:text-22px
                        :class="[
                            message.role === 'assistant' && 'i-tabler-robot text-primary-500 dark:text-primary-400',
                            message.role === 'user' && 'i-tabler-user text-gray-400',
                            message.isError && '!i-tabler-alert-triangle !text-red-700',
                        ]"
                    />
                </div>
                <div px-3 sm:px-6>
                    <MarkdownRenderer
                        v-if="message.role === 'assistant' && !message.isError"
                        :value="message.text"
                        text-10px sm:text-14px
                    />
                    <div v-else-if="message.role === 'user'">
                        <div
                            v-for="line in filteredUserMessage.split('\n')"
                            :key="line"
                            whitespace-pre-wrap overflow-x-auto max-w-full
                        >
                            {{ line }}
                        </div>
                        <Transition name="appear-right">
                            <GpLongPressButton
                                v-if="isHovering"
                                :duration="1500"
                                progress-bar-style="bg-red/50"
                                success-style="!ring-red !scale-110"
                                icon="i-tabler-trash !text-4 sm:!text-6"
                                right-1 sm:right--5
                                bottom-2
                                class="!absolute"
                                w-8 sm:w-10
                                rounded-3 m-0
                                @success="removeMessage"
                            />
                        </Transition>
                    </div>
                    <div v-else text-red-8 dark:text-red-4>
                        {{ message.text }}
                    </div>
                </div>

                <div v-if="message.isError" px-3 sm:px-6 flex mt-2>
                    <div
                        bg-red-200 text-red-7
                        class="dark:bg-red-5/20 dark:text-red-4"
                        p-2px px-2 sm:py-1 sm:px-2 rounded-2 font-bold
                        text-9px sm:text-14px
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
