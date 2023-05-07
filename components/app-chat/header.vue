<script lang="ts" setup>
defineProps<{
    embedded?: boolean
}>()

const { currentConversation, updateConversation } = useConversations()
const { isDetaEnabled } = useDeta()
const { isOnSharePage } = useSession()
const { personaList } = usePersona()

const conversationTitle = ref<string>(currentConversation.value?.title || '')
const isEditingTitle = ref(false)

watchEffect(() => {
    if (currentConversation.value?.title) {
        conversationTitle.value = currentConversation.value.title
    }
})

const onInput = async (event: any) => {
    if (currentConversation.value === null) {
        return
    }
    await updateConversation(currentConversation.value?.id, {
        title: event.target.value,
    })
}

function onTabDoubleClick() {
    isEditingTitle.value = true
}

function onShare() {
    navigateTo(`/chat/share/${currentConversation.value?.id}`)
}

function onFavoriteConversation() {
    if (!currentConversation.value) {
        return
    }
    updateConversation(currentConversation.value.id, {
        metadata: {
            favorite: !currentConversation.value.metadata?.favorite,
        },
    })
}

const currentPersona = computed(() => {
    if (!currentConversation.value) {
        return null
    }
    return personaList.value.find(
        persona => persona.id === currentConversation.value?.metadata?.personaId,
    ) || personaList.value[0]
})
</script>

<template>
    <div
        absolute top-0 left-0 right-0 b="solid 0 b-1 dark:white/10 dark-1/10" py-3
        z-1
        backdrop-blur-4
        mx-auto
        class="bg-white/90 dark:bg-dark-1/80"
        :class="[
            embedded && '!w-full !max-w-full',
        ]"
    >
        <div w-full px-4 flex items-center>
            <div>
                <div flex items-center gap-1>
                    <Transition name="appear-left">
                        <div v-if="isEditingTitle && !isOnSharePage" i-tabler-edit text-18px text-color mr-1 />
                    </Transition>
                    <Transition name="appear-left">
                        <div
                            v-if="!isEditingTitle && !isOnSharePage"
                            text-5 mr-1
                            cursor-pointer
                            hover:scale-120
                            transition
                            :class="[
                                currentConversation?.metadata?.favorite
                                    ? 'i-tabler-star-filled text-amber'
                                    : 'i-tabler-star text-color',
                            ]"
                            @click="onFavoriteConversation"
                        />
                    </Transition>

                    <input
                        ref="inputElement"
                        v-model="conversationTitle"
                        :readonly="!isEditingTitle"
                        bg-transparent border-none outline-none p-0
                        transition font-bold grow mr-3 truncate
                        text-14px sm:text-18px h-1.75em
                        min-w-50dvw
                        :class="[
                            isEditingTitle
                                ? 'text-gray-900 dark:text-gray-1 select-all'
                                : 'text-gray-700 dark:text-gray-3 select-none',
                            isEditingTitle && !isOnSharePage && 'cursor-pointer',
                            isOnSharePage && 'w-94dvw',
                        ]"
                        @blur="isEditingTitle = false"
                        @input="onInput"
                        @dblclick.stop="onTabDoubleClick"
                    >
                </div>
            </div>
            <!-- TODO: implement sharing -->
            <UButton
                v-if="!isOnSharePage && isDetaEnabled" ml-auto icon="i-tabler-share"
                @click="onShare"
            >
                Share
            </UButton>
            <!-- TODO: Implement conversation settings -->
            <!-- <UButton ml-auto icon="i-tabler-settings text-5" /> -->
        </div>
    </div>
</template>
