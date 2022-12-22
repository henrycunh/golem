export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'ungpt-session')
    const payload = await readBody(event)

    try {
        const response = await fetch(
            'https://chat.openai.com/backend-api/conversation',
            {
                headers: {
                    'accept': 'text/event-stream',
                    'authorization': `Bearer ${token}`,
                    'content-type': 'application/json',
                    'cookie': 'cf_clearance=e8D2wV8FIqZr_HzmtDbQu5heSRlUXslArjpJ6PyYMAg-1670815167-0-250',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                },
                method: 'POST',
                body: JSON.stringify(payload),
            })

        // Get stream
        const stream = response.body

        // Set stream
        if (stream) {
            // Set stream
            const reader = stream.getReader()

            // Read stream
            while (true) {
                const { done, value } = await reader.read()

                // Done
                if (done) {
                    event.node.res.end()
                    break
                }

                // Value
                if (value) {
                    event.node.res.write(value)
                }
            }
        }

        return response.text()
    }
    catch (e: any) {
        console.error(e)
    }
})
