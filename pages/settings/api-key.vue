<script lang="ts" setup>
const { apiKey } = useSettings()
const apiKeyInput = syncStorageRef(apiKey)
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
                v-model="apiKeyInput"
                placeholder="Enter your API Key"
                w-full text-gray-5 dark:text-gray-1
            />
        </div>
    </div>
</template>
