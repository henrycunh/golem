export function useUI() {
    // Chat history scroll
    const scrollToBottom = inject('scrollToBottom') as () => void
    const getScrollHeight = inject('getScrollHeight') as () => number
    const chatScrolledHeight = inject('chatScrolledHeight') as Ref<number>

    return {
        scrollToBottom,
        getScrollHeight,
        chatScrolledHeight,
    }
}
