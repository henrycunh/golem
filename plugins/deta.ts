export default defineNuxtPlugin(async () => {
    const { isDetaEnabled } = useDeta()
    if (process.client) {
        const client = useClient()
        isDetaEnabled.value = await client.deta.info.isEnabled.query()
    }
    else {
        const { detaKey } = useRuntimeConfig()
        isDetaEnabled.value = Boolean(detaKey)
    }
})
