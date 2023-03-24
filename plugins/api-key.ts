export default defineNuxtPlugin(async () => {
    const { apiKey, token } = useAuth()

    if (token.value) {
        apiKey.value = token.value
    }
})
