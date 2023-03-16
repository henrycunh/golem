import { indexDocuments } from '../embedding'
import { scrapeUrl } from '../from/scraping'

export default defineEventHandler(async (event) => {
    const payload = await readBody(event)

    if (payload.type === 'url') {
        const { url, embeddings } = payload

        if (!url) {
            throw new Error('No URL provided')
        }

        const { markdown, favicon, title } = await scrapeUrl(url)
        if (embeddings) {
            return await indexDocuments([{
                url,
                content: markdown,
            }])
        }
        return { markdown, favicon, title }
    }
})
