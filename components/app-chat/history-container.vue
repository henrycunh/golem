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

function getScrollHeight() {
    if (!container.value) {
        return false
    }
    const el = container.value
    return el.scrollHeight - el.clientHeight
}

const autoScrollInterval = ref()

function scrollToBottom() {
    logger.info('Scrolling to bottom')
    setTimeout(() => {
        chatScroll.y.value = container.value?.scrollHeight
    }, 10)
}

appProvide('scrollToBottom', scrollToBottom)
appProvide('getScrollHeight', getScrollHeight)
appProvide('chatScrolledHeight', chatScroll.y)

watch(() => currentConversation.value?.id, (newId, oldId) => {
    if (newId === oldId) {
        return
    }

    scrollToBottom()
})

onMounted(() => {
    setTimeout(() => scrollToBottom(), 300)
})

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
            isOnSharePage && '!pt-16',
        ]"
        @dragover.prevent @drop="onFileDrop"
    >
        <slot />
    </div>
</template>
