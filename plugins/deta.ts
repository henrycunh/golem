export default defineNuxtPlugin(async () => {
    if (process.client) {
        const { isDetaEnabled } = useDeta()
        const client = useClient()
        isDetaEnabled.value = await client.deta.info.isEnabled.query()
    }
    else {
        const { isDetaEnabled } = useDeta()
        const { detaKey } = useRuntimeConfig()
        isDetaEnabled.value = Boolean(detaKey)
    }
})
