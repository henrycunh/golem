<script lang="ts" setup>
definePageMeta({
    layout: 'blank',
})
const client = useClient()

const data = await client.deta.conversations.list.query()
</script>

<template>
    <div>
        hello
        {{ data }}
    </div>
</template>
