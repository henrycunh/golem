import Fuse from 'fuse.js'
import type { types } from '~~/utils/types'
export function useSearch() {
    const searchTerm = useState<string>('search-term', () => '')

    const filterConversationsBySearchTerm = (conversations: types.Conversation[]) => {
        if (!searchTerm.value) {
            return conversations
        }
        const fuse = new Fuse(conversations, {
            keys: ['title', 'messages.text'],
            threshold: 0.3,
        })
        const results = fuse.search(searchTerm.value)
        return results.map(result => result.item)
    }

    return {
        searchTerm,
        filterConversationsBySearchTerm,
    }
}
