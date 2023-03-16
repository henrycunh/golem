import stream from 'node:stream'
import Crawler from 'crawler'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import type { types } from '~~/utils/types'

const nhm = new NodeHtmlMarkdown()

function extractContentAndLinks($: cheerio.CheerioAPI) {
    try {
        // Get page title and favicon
        const title = $('title').text()
        const favicon = $('link[rel="icon"]').attr('href')

        const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code']
        const filteredHtml = $('*')
            .filter((i, el) => el.type === 'tag' && allowedTags.includes(el.tagName))
            .map((i, el) => $.html(el))
            .get()
            .join('')
        const markdown = nhm.translate(filteredHtml)

        // Remove images
        const markdownClean = markdown
            .replace(/!\[.*\]\(.*\)/g, '')
            // Remove everything before a heading
            .replace(/^(?!#).*/g, '')
            // Remove headings that are just links
            .replace(/#{1,6} \[.*\]\(.*\)/g, '')
            // Remove empty headings
            .replace(/#{1,6} ?\n/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n')
        // Get next links with the same domain
        const links = $('a')
            .filter((i, el) => {
                const href = $(el).attr('href')
                return Boolean(href?.startsWith('/') && !href.startsWith('//'))
            })
            .map((i, el) => $(el).attr('href'))
            .toArray()
            .map(link => (link as any as string).replace(/[#\?].+/g, ''))

        return { markdown: markdownClean, links, favicon, title }
    }
    catch (error) {
        console.log(error)
        return { markdown: '', links: [] }
    }
}

function normalizeLinkList(links: string[], baseUrl: string) {
    return links.map((link) => {
        const baseUrlWithoutParts = baseUrl.split('/').slice(0, 3).join('/')
        const completeLink = link.startsWith('http') ? link : baseUrlWithoutParts + link
        // Remove double slashes except for the protocol
        const normalizedLink = completeLink
            .replace(/([^:]\/)\/+/g, '$1')
            .replace(/\/$/, '')

        return normalizedLink
    }).filter(link => link.startsWith(baseUrl))
}

// Returns a stream of { url, markdown }
export function WebScraper(url: string, options?: {
    maxConnections?: number
    maxDepth?: number
    crawl?: boolean
}) {
    // Create a stream
    const readable = new stream.Readable({
        objectMode: true,
        read() {},
    })

    const visited = new Set()
    const c = new Crawler({
        maxConnections: options?.maxConnections || 5,
        callback(error, res, done) {
            if (error) {
                console.log(error)
            }
            else {
                console.log('Crawling', res.request.uri.href)
                const { $, request } = res
                const { markdown, links, favicon, title } = extractContentAndLinks($)
                const result = { url: request.uri.href, markdown, favicon, title }
                readable.push(result)
                if (options?.crawl) {
                    const normalizedLinks = normalizeLinkList(links, url)
                    normalizedLinks.forEach((link) => {
                        if (!visited.has(link)) {
                            visited.add(link)
                            c.queue(link)
                        }
                    })
                }
            }
            done()
        },
    })
    c.queue(url)

    c.on('drain', () => {
        readable.emit('end')
    })

    return readable
}

export async function scrapeUrl(url: string): Promise<types.WebScraperResult> {
    return new Promise((resolve, reject) => {
        const readable = WebScraper(url)
        let result: types.WebScraperResult
        readable.on('data', (data) => {
            result = data as types.WebScraperResult
        })
        readable.on('end', () => {
            resolve(result)
        })
        readable.on('error', (error) => {
            reject(error)
        })
    })
}
