import { useStorage } from '@vueuse/core'

export function useSettings() {
    const maxTokens = useStorage<string>('geppeto-model-max-tokens', '256')
    const modelUsed = useStorage<string>('geppeto-model', 'gpt-3.5-turbo')
    const apiKey = useStorage<string>('geppeto-api-key', null)

    return {
        maxTokens,
        modelUsed,
        apiKey,
    }
}
