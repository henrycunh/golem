const redirectMapping = {
    '/': '/chat',
    '/settings': '/settings/api-key',
} as Record<string, string>

export default defineNuxtRouteMiddleware((to) => {
    if (to.path in redirectMapping) {
        return navigateTo(redirectMapping[to.path])
    }
})
