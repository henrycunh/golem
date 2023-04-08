import { useStorage } from '@vueuse/core'

export function useSettings() {
    const maxTokens = useStorage<string>('geppeto-model-max-tokens', '1024')
    const modelUsed = useStorage<string>('geppeto-model', 'gpt-3.5-turbo')
    const instanceApiKey = useState<string | null>('geppeto-instance-api-key', () => null)
    const apiKey = useStorage<string>('geppeto-api-key', null)
    const isPasswordRequired = useState<boolean>('geppeto-is-password-required', () => false)

    return {
        maxTokens,
        modelUsed,
        apiKey,
        instanceApiKey,
        isPasswordRequired,
    }
}
