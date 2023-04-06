export function useSession() {
    const route = useRoute()

    const isOnSharePage = computed(() => {
        return route.name === 'chat-conversationId'
    })

    return {
        isOnSharePage,
    }
}
