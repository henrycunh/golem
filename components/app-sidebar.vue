<script lang="ts" setup>
const {
    conversationList,
    createConversation,
    switchConversation,
    clearConversations,
} = useConversations()

const route = useRoute()
const { apiKey } = useSettings()
const { isSidebarCompact } = useUI()
const colorMode = useColorMode()

const conversationsSortedByUpdatedAt = computed(() => {
    if (conversationList.value === null) {
        return null
    }
    return conversationList.value.sort((a, b) => {
        if (a.updatedAt === null) {
            return 1
        }
        if (b.updatedAt === null) {
            return -1
        }
        // Compare dates
        return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
})

const onCreateConversation = async () => {
    const newConversation = await createConversation('Untitled Conversation')
    await switchConversation(newConversation.id)
}

const isKnowledgeManagerOpen = ref(false)
const onOpenKnowledgeManager = () => {
    navigateTo('/knowledge')
    // isKnowledgeManagerOpen.value = true
}
</script>

<template>
    <div
        h-full flex-col flex
        px-2 pr-4
    >
        <div
            v-if="!isSidebarCompact"
            basis-150
        >
            <div uppercase font-bold text-13px text-primary-600 dark:text-primary-400 my-3 flex items-center>
                <div>
                    Chats
                </div>
                <div
                    v-if="conversationList?.length" ml-auto text-11px
                    text-gray-5 dark:text-gray-4
                >
                    {{ conversationList?.length }} conversations
                </div>
            </div>
            <div
                max-h-100 overflow-y-auto overflow-x-hidden w-full pb-2
            >
                <ConversationTab
                    v-for="conversation in conversationsSortedByUpdatedAt"
                    :key="conversation.id"
                    :conversation="conversation"
                />
            </div>
            <div flex items-center mt-2 gap-2>
                <UButton secondary icon="i-tabler-plus" grow @click="onCreateConversation">
                    New chat
                </UButton>
                <GpLongPressButton
                    :duration="1500"
                    icon="i-tabler-arrow-bar-to-up"
                    progress-bar-style="bg-red/50"
                    success-style="!ring-red"
                    @success="clearConversations"
                >
                    Clear
                </GpLongPressButton>
            </div>
        </div>
        <div v-else mt-1>
            <SidebarItem
                text-4
                :active="route.path.startsWith('/history')"
                :class="[
                    isSidebarCompact ? 'justify-center' : 'justify-start',
                ]"
                @click="navigateTo('/history')"
            >
                <span i-tabler-history text-primary-500 dark:text-primary-400 text-6 />
                <span v-if="!isSidebarCompact" ml-2>
                    Settings
                </span>
            </SidebarItem>
        </div>

        <div mt-auto>
            <SidebarItem
                text-4
                :active="route.path.startsWith('/settings')"
                :class="[
                    isSidebarCompact ? 'justify-center' : 'justify-end',
                ]"
                @click="navigateTo('/settings')"
            >
                <span i-tabler-settings text-primary-500 dark:text-primary-400 text-6 />
                <span v-if="!isSidebarCompact" ml-2>
                    Settings
                </span>
                <ColorModeToggle
                    v-if="!isSidebarCompact" ml-auto
                />
            </SidebarItem>

            <div v-if="isSidebarCompact" flex justify-center w-full>
                <ColorModeToggle text-6 />
            </div>
            <SidebarApiKeyAlert
                v-if="!apiKey"
                mt-3
                @click="navigateTo('/settings/api-key')"
            />
            <div
                text-color-lighter my-6 text-5 tracking--1px w-full
                flex-col flex justify-center items-center
            >
                <img
                    :src="
                        isSidebarCompact
                            ? `/image/logo-${colorMode.value}-square-transparent.svg`
                            : `/image/logo-${colorMode.value}-lettered.svg`
                    "
                    :class="[isSidebarCompact ? 'w-12' : 'w-24']" op-60
                >
            </div>
        </div>
    </div>
</template>
