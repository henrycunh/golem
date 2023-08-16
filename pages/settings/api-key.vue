<script lang="ts" setup>
const { apiKey, instanceApiKey } = useSettings()
const { isDetaEnabled } = useDeta()
const { checkIfAPIKeyIsValid } = useLanguageModel()
const apiKeyInput = syncStorageRef(apiKey)
const client = useClient()

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
            apiKeyError.value = 'La cle de votre API est invalide.'
        }
    }
}

if (isDetaEnabled.value) {
    const updateAPIKeyOnDeta = useDebounceFn(async () => {
        const { error } = await handle(checkIfAPIKeyIsValid(apiKeyInput.value || ''))
        if (error) {
            apiKeyError.value = 'La cle de votre API est invalide.'
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
}
</script>

<template>
    <div
        text-gray-6 dark:text-gray-2
        text-11px sm:text-4
    >
        <div>
            Pour utiliser cette application vous devez fournir un API key de OpenAI .
        </div>
        <div mt-3>
            Vous pouvez obtenir une cle d'API via cette source<GoLink to="https://platform.openai.com/account/api-keys" target="_blank">
                Tableau de bord OpenAI
            </GoLink>.
        </div>
        <div v-if="!(instanceApiKey && !isDetaEnabled)" text-gray-5 dark:text-gray-1 mt-3>
            <GoInput
                v-model="apiKeyInput"
                placeholder="Entrer votre cle d'API"
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
                Instance de Cle d'API
            </div>
            <div my-3 />
            <div v-if="isDetaEnabled" text-color-lighter text-8px sm:text-13px>
                {{
                    isDetaEnabled
                        ? 'La cle API est configuré est stocker sur Deta.'
                        : 'Cette instance API ets déjà en cours de session.'
                }}
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
