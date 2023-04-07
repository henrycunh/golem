<script lang="ts" setup>
defineProps<{
    embedded?: boolean
}>()

const { currentConversation, knowledgeUsedInConversation } = useConversations()
const { isDetaEnabled } = useDeta()

const conversationTitle = computed(() => currentConversation.value?.title)

function onShare() {
    navigateTo(`/chat/${currentConversation.value?.id}`)
}
</script>

<template>
    <div
        v-if="!embedded"
        absolute top-0 left-0 right-0 b-0 b-b-1 b-gray-1 dark:b-dark-1 b-solid py-3
        z-1
        backdrop-blur-4
        mx-auto
        class="bg-white/90 dark:bg-dark-1/90"
        :class="[
            embedded && '!w-full !max-w-full',
        ]"
    >
        <div w-full mx-auto flex items-center px-4 sm:px-14 max-w-1080px>
            <div>
                <AnimatedText
                    text-14px sm:text-5
                    font-bold text-color
                    :value="conversationTitle"
                />
                <div v-if="knowledgeUsedInConversation.length" text-gray-5 dark:text-gray-3 text-14px>
                    Using {{ knowledgeUsedInConversation.length }} sources
                </div>
            </div>
            <!-- TODO: implement sharing -->
            <UButton
                v-if="!embedded && isDetaEnabled" ml-auto icon="i-tabler-share"
                @click="onShare"
            >
                Share
            </UButton>
        </div>
    </div>
</template>
