import openai from 'openai'
import pLimit from 'p-limit'
import { splitMarkdownByHeadingLevel } from '../markdown'

export const createOpenAIClient = () => {
    const config = new openai.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
    return new openai.OpenAIApi(config)
}

/**
 * Create an embedding for a given text input.
 * @param {string} content
 * @returns {Promise<number[]>}
 * @throws {Error} if the request is invalid
 * */
export const createEmbedding = async (content: string) => {
    const client = createOpenAIClient()

    const embedding = await client.createEmbedding({
        model: 'text-embedding-ada-002',
        input: content,
    })

    return embedding.data.data[0].embedding
}

export async function indexDocuments(
    documentList: { url: string; content: string }[],
) {
    const documentsWithSections = await Promise.all(
        documentList.map(async document => ({
            ...document,
            // Split markdown into sections of ## headings
            sections: splitMarkdownByHeadingLevel(document.content, 3),
            fullEmbedding: await createEmbedding(document.content),
        })),
    )

    // Sections flattened
    const sections = documentsWithSections
        .reduce((acc, val) => {
            const sectionList = val.sections.map((section) => {
                const { sections: _, content: __, ...file } = val
                return { ...file, section }
            })
            return [...acc, ...sectionList]
        }, [] as { fullEmbedding: number[]; section: string; url: string }[])

    // Create embeddings for each section
    const limit = pLimit(20)

    const fileEmbeddingsFetch = sections.map(section => limit(async () => {
        const embedding = await createEmbedding(section.section)
        return { ...section, embedding }
    }))

    const embeddings = await Promise.all(fileEmbeddingsFetch)
    return embeddings
}
