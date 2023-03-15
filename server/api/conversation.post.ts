import { ChatGPTAPI } from 'chatgpt'

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'ungpt-session')
    const payload = await readBody(event)
    const chatGPT = new ChatGPTAPI({ apiKey: token || '' })

    const { error, data } = await handle(async () => {
        if (!token) {
            throw new Error('No token')
        }

        const { message, systemMessage, parentMessageId } = payload

        const conversationMessage = await chatGPT.sendMessage(message, {
            systemMessage,
            parentMessageId,
            onProgress(partial) {
                event.node.res.write(`data: ${JSON.stringify(partial)}\r`)
            },
        })

        event.node.res.write(`data: ${JSON.stringify(conversationMessage)}\r`)
        event.node.res.end()

        return conversationMessage
    })

    if (error) {
        console.log(error)
        event.node.res.statusCode = 500
        return {
            error: error.message,
        }
    }

    return data
})
