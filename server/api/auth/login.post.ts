export default defineEventHandler(async (event) => {
    const { accessToken } = await readBody(event)
    // Parse JWT token
    const token = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
    // Get token expiration date as a Date object
    const expires = new Date(token.exp * 1000)
    setCookie(event, 'ungpt-session', accessToken, {
        expires,
    })

    return token
})
