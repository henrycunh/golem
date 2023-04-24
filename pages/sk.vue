<script lang="ts" setup>
definePageMeta({
    layout: 'blank',
})
const { sendMessage } = useLanguageModel()

const data = ref()
const status = ref()
onMounted(async () => {
    try {
        const res = await sendMessage({
            messages: [
                { role: 'user', content: 'hello' },
                { role: 'user', content: 'my name is john' },
                { role: 'assistant', content: 'okay' },
                { role: 'user', content: 'whats my name?' },
            ],
            model: 'gpt-4.5-turbo',
            onProgress(partial: any) {
                console.log(partial)
            },
            stream: true,
        })
        data.value = res
        status.value = res.status
    }
    catch (e: any) {
        console.log(e)
        data.value = e.cause
    }
})
</script>

<template>
    <div>
        <pre>{{ data }}</pre>
    </div>
</template>
