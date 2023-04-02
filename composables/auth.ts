export const useAuth = () => {
    const user = useState<any>(() => null)
    const token = useCookie('geppeto-api-key', {
        watch: 'shallow',
    })

    const login = async (accessToken: string) => {
        const response = await $fetch('/api/auth/login', {
            method: 'POST',
            body: { accessToken },
        })
        user.value = response
        token.value = accessToken
    }

    return {
        user,
        token,
        login,
    }
}
