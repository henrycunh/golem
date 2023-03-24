<script lang="ts" setup>
const { token, login, apiKey } = useAuth()

watch(token, (newToken) => {
    if (!newToken) {
        return
    }
    apiKey.value = newToken
}, { immediate: true })

watch(apiKey, async (newApiKey) => {
    await login(newApiKey)
})
</script>

<template>
    <div text-gray-6 dark:text-gray-2>
        <div>
            To use the application you need to provide an OpenAI API key.
        </div>
        <div mt-3>
            You can get your API key from the <GpLink to="https://platform.openai.com/account/api-keys" target="_blank">
                OpenAI dashboard
            </GpLink>.
        </div>
        <div text-gray-5 dark:text-gray-1 mt-3>
            <UInput
                v-model="apiKey"
                placeholder="Enter your API Key"
                w-full text-gray-5 dark:text-gray-1
            />
        </div>
    </div>
</template>
