<script lang="ts" setup>
defineProps<{ embedded?: boolean }>()

const { currentConversation, isTyping } = useConversations()
const container = ref()
const chatScroll = useScroll(container)
const autoScrollInterval = ref()

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

scrollToBottom()

watch(isTyping, (newState, oldState) => {
    if (newState === oldState) {
        return
    }
    if (newState) {
        autoScrollInterval.value = setInterval(() => {
            chatScroll.y.value = container.value?.scrollHeight
        }, 100)
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
        px-16 max-w-1080px mx-auto relative pt-20 h-full overflow-y-auto pb-50
        z-0
        :class="[
            embedded && '!pt-2',
        ]"
        @dragover.prevent @drop="onFileDrop"
    >
        <slot />
    </div>
</template>
