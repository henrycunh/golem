<script lang="ts" setup>
defineProps<{ open: boolean }>()
const emit = defineEmits(['close'])
const { updateConversationSettings, currentConversation } = useConversations()
function onBackdropClick() {
    emit('close')
}

const conversationSettings = reactive({
    model: null,
    creativity: null,
    maxTokens: null,
})

watch(() => conversationSettings, async (newSettings) => {
    if (!currentConversation.value) {
        return
    }
    await updateConversationSettings(currentConversation.value?.id, newSettings)
}, { deep: true })
</script>

<template>
    <div>
        <Transition name="fade">
            <div v-if="open" fixed inset-0 bg="dark/20" backdrop-blur-2 z-99 @click="onBackdropClick" />
        </Transition>
        <Transition name="slide-right">
            <div
                v-if="open"
                fixed
                right-0 top-0 bottom-0
                w-60 sm:w-100 dark:bg-dark bg-white
                z-999 py-4 px-6
            >
                <GoTypography title>
                    Settings
                </GoTypography>

                <SettingsModelSelect v-model="conversationSettings.model" />

                <SettingsCreativitySelect v-model="conversationSettings.creativity" mt-6 />

                <SettingsMaxTokensInput v-model="conversationSettings.maxTokens" mt-6 />
            </div>
        </Transition>
    </div>
</template>
