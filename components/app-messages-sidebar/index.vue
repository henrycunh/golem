<script lang="ts" setup>
const {
    createConversation,
    switchConversation,
    clearConversations,
} = useConversations()

const { apiKey } = useSettings()
const { isSidebarCompact } = useUI()
const colorMode = useColorMode()

const onCreateConversation = async () => {
    const newConversation = await createConversation('Untitled Conversation')
    await switchConversation(newConversation.id)
}

const isSearchBarVisible = ref(false)

function onToggleSearchBar() {
    isSearchBarVisible.value = !isSearchBarVisible.value
}
</script>

<template>
    <div
        h-full flex-col flex
        b-0 b-r-1 b-solid b="dark:white/15 dark-1/10"
    >
        <div text-color font-bold font-title text-5 px-3 my-4 flex items-center>
            <div>
                Messages
            </div>

            <GoButton
                secondary
                :icon="`${isSearchBarVisible ? 'i-tabler-search-off' : 'i-tabler-message-search'} text-18px`"
                ml-auto @click="onToggleSearchBar"
            />
        </div>

        <Transition name="fade">
            <div
                v-if="isSearchBarVisible"
                px-3 mb-4
            >
                <SearchBar w-full text-16px font-text />
            </div>
        </Transition>

        <AppMessagesSidebarFavoriteConversations />
        <AppMessagesSidebarRecentConversations />
        <div mt-auto>
            <div flex="~ col" children:grow gap-3 mt-2 px-3>
                <GoButton
                    secondary icon="i-tabler-plus"
                    @click="onCreateConversation"
                >
                    New chat
                </GoButton>
                <GoLongPressButton
                    :duration="1500"
                    icon="i-tabler-arrow-bar-to-up"
                    progress-bar-style="bg-red/50"
                    success-style="!ring-red"
                    @success="clearConversations"
                >
                    Clear all
                </GoLongPressButton>
            </div>
            <SidebarApiKeyAlert
                v-if="!apiKey"
                mt-3 mx-2
                @click="navigateTo('/settings/api-key')"
            />
            <div
                text-color-lighter my-6 text-5 tracking--1px w-full
                flex justify-center items-center
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
