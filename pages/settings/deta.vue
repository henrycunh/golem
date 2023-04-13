<script lang="ts" setup>
const { apiKey } = useSettings()
const apiKeyInput = syncStorageRef(apiKey)
</script>

<template>
    <div>
        <div
            font-bold text-gray-6 dark:text-gray-3 mt-7
            text-14px sm:text-5
        >
            Instance API Key
        </div>
        <div my-3 text-color>
            You can set up a shared API key for this instance.
        </div>
        <UInput
            v-model="apiKeyInput"
            placeholder="Enter your API Key"
            text-11px sm:text-4
            w-full text-gray-5 dark:text-gray-1
        />
    </div>
</template>
