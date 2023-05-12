<script lang="ts" setup>
import { encode } from 'gpt-token-utils'
import type { types } from '~~/utils/types'

const props = defineProps<{ message: types.Message }>()

const { currentPreset } = usePreset()
const { isOnSharePage } = useSession()
const element = ref()
const isActionBarVisible = ref(false)

const { clearErrorMessages, removeMessageFromConversation, currentConversation, updateConversationMessage, forkConversation } = useConversations()

// Action bar visibility
function onClick() {
    if (props.message.isError) {
        return
    }
    isActionBarVisible.value = true
}

onClickOutside(element, () => {
    if (props.message.isError) {
        return
    }
    isActionBarVisible.value = false
})

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.text.replace(currentPreset.value.content, '') : props.message.text,
)

// Action bar
async function removeMessage() {
    if (!currentConversation.value) {
        return
    }
    await removeMessageFromConversation(currentConversation.value?.id, props.message.id)
}

const tokenCount = computed(() => encode(props.message.text).length)

const isMessageFavorited = computed(() => props.message.metadata?.favorite)

function onFavoriteMessage() {
    if (!currentConversation.value) {
        return
    }
    updateConversationMessage(currentConversation.value.id, props.message.id, {
        metadata: {
            favorite: !isMessageFavorited.value,
        },
    })
}

const showForkConversationConfirmation = ref(false)
async function onForkConversationContent() {
    if (!currentConversation.value) {
        return
    }
    await forkConversation(currentConversation.value?.id, props.message.id)

    showForkConversationConfirmation.value = true
    setTimeout(() => {
        showForkConversationConfirmation.value = false
    }, 1250)
}

const showCopyMessageConfirmation = ref(false)
function onCopyMessageContent() {
    useClipboard().copy(props.message.text)
    showCopyMessageConfirmation.value = true
    setTimeout(() => {
        showCopyMessageConfirmation.value = false
    }, 1250)
}
</script>

<template>
    <div
        ref="element"
        w-full rounded-2 overflow-hidden
        ring-2 ring-transparent
        :class="[
            !message.isError && 'hover:ring-primary-200 active:ring-primary-300 cursor-pointer ',
            isActionBarVisible && '!ring-primary-300',
        ]"
        transition-all
        @click="onClick"
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
                <div flex items-center>
                    <div
                        font-bold font-title text-color mb-1 mx-7 sm:mx-10
                        :class="[
                            message.isError && 'text-red-9 dark:text-red-3',
                        ]"
                    >
                        {{ message.role === 'assistant' ? 'Golem' : 'You' }}
                    </div>
                    <div ml-auto>
                        <Transition name="appear-right">
                            <div v-if="isMessageFavorited" dark:text-amber-400 text-amber-600 flex items-center gap-1 uppercase font-bold font-title text-8px sm:text-12px>
                                <div i-tabler-star-filled />
                                Favorited
                            </div>
                        </Transition>
                    </div>
                </div>
                <div
                    w-5 h-5 sm:w-8 sm:h-8
                    rounded sm:rounded-2
                    absolute
                    left-0
                    top-1 flex items-center justify-center
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
                <div px-7 sm:px-10 cursor-auto>
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
                    </div>
                    <div v-else text-red-8 dark:text-red-4>
                        {{ message.text }}
                    </div>
                </div>
                <div v-if="message.isError" px-7 sm:px-10 flex mt-2>
                    <div
                        v-for="action in [...(message.actions || []), { label: 'Dismiss errors', action: clearErrorMessages }]" :key="action.label"
                        bg-red-200
                        text-red-7 class="dark:bg-red-5/20 dark:text-red-4" p-2px px-2 sm:py-1 sm:px-2
                        rounded-2 font-bold
                        text-9px sm:text-14px
                        active:translate-y-2px hover:op-80
                        cursor-pointer
                        select-none
                        transition
                        flex items-center gap-1
                        :class="action.classOverride"
                        @click="action.action"
                    >
                        <div v-if="action.icon" :class="action.icon" />
                        {{ action.label }}
                    </div>
                </div>
                <Transition name="slide-top">
                    <div
                        v-if="isActionBarVisible && !isOnSharePage"
                        mt-2
                        flex items-center h-10 p-2 border-box rounded-2
                    >
                        <div
                            flex items-center gap-1 text-color-lighter
                            text-14px
                        >
                            <div i-tabler-atom-2-filled />
                            {{ tokenCount }} tokens
                        </div>
                        <GoButton
                            secondary
                            class="dark:!bg-red"
                            :icon="`${isMessageFavorited ? 'i-tabler-star-filled' : 'i-tabler-star'} !text-10px sm:!text-16px`"
                            ml-3
                            @click="onFavoriteMessage"
                        />

                        <GoButton
                            ml-auto
                            secondary
                            :icon="`${showForkConversationConfirmation ? 'i-tabler-check' : 'i-tabler-arrow-fork'} !text-10px sm:!text-16px` "
                            :success="showForkConversationConfirmation"
                            mr-3
                            @click="onForkConversationContent"
                        />
                        <GoButton
                            secondary
                            :icon="`${showCopyMessageConfirmation ? 'i-tabler-check' : 'i-tabler-copy'} !text-10px sm:!text-16px` "
                            :success="showCopyMessageConfirmation"
                            mr-3
                            @click="onCopyMessageContent"
                        />
                        <GoLongPressButton
                            :duration="500"
                            progress-bar-style="bg-red/50"
                            success-style="!ring-red !scale-90 shadow-none"
                            icon="i-tabler-trash !text-10px sm:!text-16px"
                            gap-2px sm:gap-1
                            rounded-3 m-0 text-2 sm:text-14px
                            @success="removeMessage"
                        >
                            Delete
                        </GoLongPressButton>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</template>
