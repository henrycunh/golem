export function useUI() {
    const { isSmallDesktop } = useDevice()

    const scrollToBottom = inject('scrollToBottom') as () => void
    const getScrollHeight = inject('getScrollHeight') as () => number
    const chatScrolledHeight = inject('chatScrolledHeight') as Ref<number>
    const isSidebarCompact = computed(() => isSmallDesktop.value)

    return {
        scrollToBottom,
        getScrollHeight,
        chatScrolledHeight,
        isSidebarCompact,
    }
}
