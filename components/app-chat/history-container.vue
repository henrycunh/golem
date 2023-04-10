<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { currentConversation, isTypingInCurrentConversation } = useConversations()
const { isOnSharePage } = useSession()
const container = ref()
const lockToBottom = ref(true)
const chatScroll = useScroll(container, {
    onScroll: (event) => {
        if (event) {
            // Detect if the user is at the bottom of the chat
            const el = (event.target as HTMLElement)
            if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
                lockToBottom.value = true
            }
            else {
                lockToBottom.value = false
            }
        }
    },
})
const autoScrollInterval = ref()
const isScrollToBottomButtonVisible = computed(() => {
    if (!container.value) {
        return false
    }
    const el = container.value
    return chatScroll.y.value + 200 < el.scrollHeight - el.clientHeight
})
function scrollToBottom() {
    setTimeout(() => {
        chatScroll.y.value = container.value?.scrollHeight
    }, 10)
}

watch(() => currentConversation.value?.id, (newId, oldId) => {
    if (newId === oldId) {
        return
    }

    scrollToBottom()
})

onMounted(() => scrollToBottom())

watch(isTypingInCurrentConversation, (newState, oldState) => {
    if (newState === oldState) {
        return
    }
    if (newState) {
        autoScrollInterval.value = setInterval(() => {
            if (lockToBottom.value) {
                chatScroll.y.value = container.value?.scrollHeight
            }
        }, 300)
    }
    else {
        clearInterval(autoScrollInterval.value)
    }
})

// File dropping
function onFileDrop(event: any) {
    event.preventDefault()

    const files = event.dataTransfer.files

    if (files.length === 0) {
        return
    }

    const reader = new FileReader()
    reader.onload = (fileEvent: any) => {
        console.log('File content', fileEvent.target.result)
    }

    reader.readAsText(files[0])
}
</script>

<template>
    <div
        ref="container"
        :key="currentConversation?.id"
        pl-4 pr-4 lg:px-16
        max-w-1080px mx-auto relative
        pt-16 sm:pt-20
        h-full overflow-y-auto pb-50
        z-0
        :class="[
            embedded && '!pt-2',
            isOnSharePage && '!pt-6',
        ]"
        @dragover.prevent @drop="onFileDrop"
    >
        <!-- <div
                v-if="isScrollToBottomButtonVisible"
                fixed bottom-20
                right-20 z-0 w-10
                h-10 text-color
                text-5
                cursor-pointer
                class="dark:bg-white/10" flex items-center
                justify-center
                rounded-3
            >
                <div i-tabler-arrow-bar-down />
            </div> -->
        <Transition name="appear-right">
            <GpLongPressButton
                v-if="isScrollToBottomButtonVisible"
                icon="i-tabler-arrow-bar-down !text-4 sm:!text-6"
                :duration="0"
                success-style="!ring-primary !text-primary"
                progress-bar-style="!bg-500/20"
                class="!fixed"
                bottom-30
                right-8 sm:right-20
                w-8 sm:w-10
                z-10 @success="scrollToBottom"
            />
        </Transition>

        <slot />
    </div>
</template>
