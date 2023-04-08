export default defineNuxtRouteMiddleware((from) => {
    const { isPasswordRequired } = useSettings()
    const { isLoggedIn } = useSession()
    if (
        from.path !== '/password'
        && (
            isPasswordRequired.value
            && !isLoggedIn.value
        )
    ) {
        return navigateTo('/password')
    }
})
