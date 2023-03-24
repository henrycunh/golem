import hyperid from 'hyperid'
import type { types } from '~~/utils/types'

export const useKnowledge = () => {
    const db = useIDB()
    const knowledgeList = useState<types.KnowledgeItem[] | null>(() => null)

    async function listKnowledge() {
        // Get only the title, type, id, and updatedAt fields
        return await db.table('knowledge').toArray() as types.KnowledgeItem[]
    }

    async function addKnowledgeItem(item: types.KnowledgeItem) {
        const newItem = {
            ...item,
            updatedAt: new Date(),
        }
        const newKey = await db.table('knowledge').add(newItem)
        if (!newKey) {
            throw new Error('Failed to create knowledge item')
        }
        await updateKnowledgeList()
    }

    async function deleteKnowledgeItem(id: string) {
        await db.table('knowledge').delete(id)
        await updateKnowledgeList()
    }

    async function extractFromUrl(options: {
        url: string
        title: string
    }) {
        const response = await $fetch('/api/knowledge', {
            method: 'POST',
            body: {
                type: 'url',
                url: options.url,
            },
        })
        const data = response as types.WebScraperResult
        const knowledgeItem = {
            id: hyperid()(),
            title: data.title,
            type: 'url',
            sections: [
                {
                    content: data.markdown,
                    url: options.url,
                },
            ],
            metadata: {
                favicon: data.favicon,
            },
            updatedAt: new Date(),
            createdAt: new Date(),
        }
        await addKnowledgeItem(knowledgeItem)
    }

    async function updateKnowledgeList() {
        knowledgeList.value = await listKnowledge()
    }

    return {
        listKnowledge,
        addKnowledgeItem,
        extractFromUrl,
        updateKnowledgeList,
        deleteKnowledgeItem,
        knowledgeList,
    }
}
