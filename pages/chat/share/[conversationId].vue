<script lang="ts" setup>
import type { DetaError } from '~~/composables/deta'

const conversationId = useRoute().params.conversationId
const { switchConversation } = useConversations()
const conversationNotFound = ref(false)
const loading = ref(false)

if (process.client) {
    const { deta } = useDeta()
    loading.value = true
    deta.conversation.sync(conversationId as string)
        .then(() => {
            return switchConversation(conversationId as string)
        })
        .catch((e) => {
            const error = e as DetaError
            conversationNotFound.value = error.code === 'NOT_FOUND'
        })
        .finally(() => {
            loading.value = false
        })
}

definePageMeta({
    layout: 'blank',
})
</script>

<template>
    <div flex-col p-.25rem>
        <div v-if="loading">
            <Skeleton
                v-for="i in 5"
                :key="i"
                w-180 h-18 m-0.25rem rounded-4
                mx-auto
            />
        </div>
        <ClientOnly v-else>
            <div
                v-if="conversationNotFound"
                h-full w-full flex items-center justify-center
            >
                <GoSplash
                    title="Conversation not found"
                    subtitle="The conversation you are looking for does not exist."
                    icon="i-tabler-alert-circle"
                />
            </div>
            <AppChat v-else h-full embedded />
            <template #placeholder>
                <div>
                    <Skeleton
                        v-for="i in 5"
                        :key="i"
                        w-180 h-18 m-0.25rem rounded-4
                        mx-auto
                    />
                </div>
            </template>
        </ClientOnly>
    </div>
</template>
