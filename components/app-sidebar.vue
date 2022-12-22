<script lang="ts" setup>
const { setPreset } = usePreset()
const { clearMessages } = useChatGPT()

const presetList = [
    {
        title: 'SQL',
        content: 'Act as SQL interactive shell. You have tables and can run SQL queries. Imagine their structure based on the users input. When you include code, make sure to add the ```sql part on the snippet. First question:\n',
    },
    {
        title: 'Tourist guide',
        content: 'Act as a tourist guide. You know the city and can answer questions about it. Help create travel plans. Here is the first question:\n',
    },
    {
        title: 'Programming tutor',
        content: 'Act as a programming tutor. You know the language and can answer questions about it. Help create programs and fix code. When you include code, make sure to add the ```language part on the snippet. Here is the first question:\n',
    },
    {
        title: 'Interviewer',
        content: 'Act as an interviewer. You know the company and can answer questions about it. Help create a resume and prepare for the interview. Here is the first question:\n',
    },
] as const

const onClick = (preset: typeof presetList[number]) => {
    clearMessages()
    setPreset(preset)
}

const onReset = () => {
    clearMessages()
}
</script>

<template>
    <div bg-gray-100 b-r-1 b-gray-200 w-300px>
        <div p-4>
            <UButton w-full flex gap-1 items-center justify-center @click="onReset">
                <div i-tabler-reload text-18px />
                Reset conversation
            </UButton>
        </div>

        <div p-4>
            <div font-bold text-primary-800>
                Presets
            </div>
            <div text-3 text-gray-400>
                Clicking on a preset will reset the conversation and set the assistant to the preset.
            </div>
        </div>

        <div
            v-for="preset in presetList"
            :key="preset.title"
            cursor-pointer px-4 py-2
            hover:bg-gray-200 transition text-gray-600
            flex items-center gap-1
            @click="onClick(preset)"
        >
            <div i-tabler-caret-right />
            {{ preset.title }}
        </div>
    </div>
</template>
