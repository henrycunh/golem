<script lang="ts" setup>
const { token } = useAuth()

const hasApiKey = computed(() => !token.value)
const isDialogOpen = ref(false)
const apiKey = ref('')

const onClick = () => {
    isDialogOpen.value = true
}

watch(token, (newToken) => {
    if (!newToken) {
        return
    }
    apiKey.value = newToken
}, { immediate: true })

watch(apiKey, (newApiKey) => {
    if (!newApiKey) {
        return
    }
    token.value = newApiKey
})
</script>

<template>
    <div>
        <div
            flex gap-1
            p-2 rounded-2 transition-all cursor-pointer
            :class="[!hasApiKey && 'bg-orange-50 hover:bg-orange-100/80 ring-1 ring-orange-300']"
            @click="onClick"
        >
            <div
                i-tabler-key text-primary text-5
                :class="[!hasApiKey && '!text-orange-500']"
            />
            <div text-15px>
                <div text-gray-5 font-bold :class="[!hasApiKey && 'text-orange-900']">
                    API Key
                </div>
                <div v-if="!hasApiKey" text-gray-4 :class="[!hasApiKey && 'text-red-700']">
                    Click to set your API Key
                </div>
            </div>
        </div>
        <Dialog v-model="isDialogOpen">
            <div font-bold text-5 text-gray-6 mb-4>
                API Key
            </div>
            <div text-gray-5>
                <p>
                    You need to set your OpenAI API Key to use Gepeto.
                </p>
                <p>
                    You can get your API Key from the <a href="https://platform.openai.com/account/api-keys" target="_blank" class="text-primary">OpenAI Dashboard</a>.
                </p>
                <UInput
                    v-model="apiKey"
                    placeholder="Enter your API Key"
                    w-full
                />
                <UButton
                    mt-2 text-18px
                    w-full
                    @click="isDialogOpen = false"
                >
                    Save
                </UButton>
            </div>
        </Dialog>
    </div>
</template>
