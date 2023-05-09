<script lang="ts" setup>
const client = useClient()
const { instanceApiKey, apiKey } = useSettings()
const { checkIfAPIKeyIsValid } = useLanguageModel()
const apiKeyInput = ref<string>(instanceApiKey.value || '')
const apiKeyError = ref<string | false>(false)

const updateAPIKeyOnDeta = useDebounceFn(async () => {
    const { error } = await handle(checkIfAPIKeyIsValid(apiKeyInput.value || ''))
    if (error) {
        apiKeyError.value = 'Invalid API key.'
        return
    }
    await client.deta.preferences.set.mutate({ key: 'api-key', value: apiKeyInput.value || '' })
    instanceApiKey.value = apiKeyInput.value || ''
    apiKey.value = apiKeyInput.value || ''
    apiKeyError.value = false
}, 300)

watch(apiKeyInput, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        updateAPIKeyOnDeta()
    }
})
</script>

<template>
    <div>
        <!-- <GoSplash title="No settings available" /> -->
        <div
            font-bold text-gray-6 dark:text-gray-3 mt-7
            text-14px sm:text-5
        >
            Instance API Key
        </div>
        <div my-3 text-color>
            You can set up a shared API key for this instance.
        </div>
        <GoInput
            v-model="apiKeyInput"
            placeholder="Enter your API Key"
            text-11px sm:text-4
            w-full text-gray-5 dark:text-gray-1
            :error="apiKeyError"
        />
    </div>
</template>
