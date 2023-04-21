import { useStorage } from '@vueuse/core'

export function useSettings() {
    const maxTokens = useStorage<string>('golem-model-max-tokens', '1024')
    const modelUsed = useStorage<string>('golem-model', 'gpt-3.5-turbo')
    const instanceApiKey = useState<string | null>('golem-instance-api-key', () => null)
    const apiKey = useStorage<string>('golem-api-key', null)
    const isPasswordRequired = useState<boolean>('golem-is-password-required', () => false)

    return {
        maxTokens,
        modelUsed,
        apiKey,
        instanceApiKey,
        isPasswordRequired,
    }
}
