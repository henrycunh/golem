export default defineEventHandler(async (event) => {
    const { accessToken } = await readBody(event)
    setCookie(event, 'ungpt-session', accessToken, {
    })

    return accessToken
})
