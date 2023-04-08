export default defineNuxtPlugin(() => {
    if (process.server) {
        const { apiKey: apiKeyFromEnv, password } = useRuntimeConfig()
        const { isPasswordRequired, instanceApiKey } = useSettings()
        const { isLoggedIn } = useSession()
        if (apiKeyFromEnv) {
            instanceApiKey.value = apiKeyFromEnv
        }
        if (password) {
            isPasswordRequired.value = true
            isLoggedIn.value = String(useCookie('geppeto-password').value) === String(password)
        }
    }
    else {
        const { apiKey, instanceApiKey } = useSettings()
        if (instanceApiKey.value) {
            apiKey.value = instanceApiKey.value
        }
    }
})
