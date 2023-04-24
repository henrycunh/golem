<script lang="ts" setup>
const { apiKey } = useSettings()
const { checkIfAPIKeyIsValid } = useLanguageModel()
const apiKeyInput = syncStorageRef(apiKey)
const { instanceApiKey } = useSettings()

const apiKeyError = ref<string | false>(false)

const maskedApiKey = computed(() => {
    if (!instanceApiKey.value) {
        return ''
    }
    const apiKeyLength = instanceApiKey.value.length
    return instanceApiKey.value.slice(0, 4) + '•'.repeat(apiKeyLength - 8) + instanceApiKey.value.slice(apiKeyLength - 4)
})

// Check if the API key is valid
async function onBlur(event: FocusEvent) {
    const apiKey = (event.target as HTMLInputElement)?.value
    if (apiKey) {
        try {
            await checkIfAPIKeyIsValid(apiKey)
            apiKeyError.value = false
        }
        catch (e) {
            apiKeyError.value = 'Invalid API key.'
        }
    }
}
</script>

<template>
    <div
        text-gray-6 dark:text-gray-2
        text-11px sm:text-4
    >
        <div>
            To use the application you need to provide an OpenAI API key.
        </div>
        <div mt-3>
            You can get your API key from the <GpLink to="https://platform.openai.com/account/api-keys" target="_blank">
                OpenAI dashboard
            </GpLink>.
        </div>
        <div v-if="!instanceApiKey" text-gray-5 dark:text-gray-1 mt-3>
            <UInput
                v-model="apiKeyInput"
                placeholder="Enter your API Key"
                text-11px sm:text-4
                w-full text-gray-5 dark:text-gray-1
                :when="{
                    blur: onBlur,
                }"
                :error="apiKeyError"
            />
        </div>
        <div v-else>
            <div
                font-bold text-gray-6 dark:text-gray-3 mt-7
                text-14px sm:text-5
            >
                Instance API Key
            </div>
            <div my-3>
                This instance has a shared API key already set up.
            </div>
            <div
                text-color mt-3 font-code
                p-1 sm:px-3 sm:py-2
                rounded
                text-6px sm:text-3 break-all
                class="bg-gray-1 dark:bg-gray-1/5 ring-1 ring-gray-2 dark:ring-white/10"
            >
                {{ maskedApiKey }}
            </div>
        </div>
    </div>
</template>
