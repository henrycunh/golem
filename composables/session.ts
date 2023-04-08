export function useSession() {
    const route = useRoute()
    const isLoggedIn = useState('is-logged-in', () => false)

    const isOnSharePage = computed(() => {
        return route.name === 'chat-conversationId'
    })

    return {
        isOnSharePage,
        isLoggedIn,
    }
}
