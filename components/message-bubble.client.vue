<script lang="ts" setup>
import { marked } from 'marked'
import prismjs from 'prismjs'
// @ts-expect-error - No types
import langDetector from 'lang-detector'
import type { Message } from '~~/composables/chatgpt'
import 'prismjs/themes/prism-tomorrow.css'

const props = defineProps<{ message: Message }>()

const { currentPreset } = usePreset()
let messageHTML = $ref('')

watch(() => [props.message.content, props.message.isTyping], ([newContent, isTyping]) => {
    if (props.message.author === 'bot') {
        if (!newContent || typeof newContent !== 'string') {
            return
        }
        // If theres an unclosed ``` in the message, add a ``` to the end
        if ((newContent.match(/(```)/g)?.length || 2) % 2 === 1) {
            newContent += '\n```'
        }

        const detectedLanguage = newContent.match(/(python|javascript|typescript|css|bash|json|sql|markdown|text|node.js)/gi)
        const aliasMapping = {
            'node.js': 'javascript',
            'npm': 'bash',
        }
        const language = (detectedLanguage ? ((aliasMapping as any)[detectedLanguage[0]] || detectedLanguage[0]) : 'text').toLowerCase()
        let html = marked.parse(newContent, {
            highlight(code, lang) {
                try {
                    if (lang === 'text' || (!lang && language === 'text')) {
                        const detected = langDetector(code)
                        if (typeof detected === 'string') {
                            lang = detected.toLowerCase()
                        }
                        console.log(lang)
                    }
                    const highlighted = prismjs.highlight(code, prismjs.languages[lang || language], lang || language)
                    return highlighted
                }
                catch (e: any) {
                    console.error(e)
                    return code
                }
            },
        })

        // This was so annoying to figure out
        const lastNode = html
            .trim()
            .split('</')
            .filter(node => node.trim().includes('>'))
            .slice(-10)
            .filter(node => !node.trim().match(/>$/))
            ?.pop()
        console.log(lastNode)

        if (lastNode && isTyping) {
            html = html.replace(lastNode, `${lastNode}<span class="cursor"> |</span>`)
        }
        messageHTML = html
    }
})

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.content.replace(currentPreset.value.content, '') : props.message.content,
)

const errorMessageMapping = {
    token_expired: 'Your session has expired. Please login again.',
}
</script>

<template>
    <div
        flex
        :class="[
            message.author === 'user' && 'justify-end',
            message.author === 'bot' && 'justify-start',
        ]"
        class="max-w-100%"
        mb-2
        last:mb-0
    >
        <div
            p-3 leading-6
            :class="[
                message.author === 'user' && !message.error
                    && 'bg-primary-500 text-white rounded-b-3 rounded-tl-3',
                message.author === 'bot' && !message.error
                    && 'bg-white ring-1 ring-gray-100 shadow text-gray-800 rounded-b-3 rounded-tr-3',
                message.error
                    && 'bg-red-700 text-white rounded-3',
            ]"
        >
            <div v-if="message.author === 'bot' && message.isTyping && !message.content">
                <div i-eos-icons-three-dots-loading text-primary-500 text-8 />
            </div>
            <div v-else-if="message.error" flex items-center gap-2>
                <div i-tabler-send-off text-6 />
                <div>
                    {{ (errorMessageMapping as any)[message.content] || message.content }}
                </div>
            </div>
            <div v-else-if="message.author === 'bot'" class="message-content">
                <div v-html="messageHTML" />
            </div>
            <div v-else>
                <div
                    v-for="line in filteredUserMessage.split('\n')"
                    :key="line"
                >
                    {{ line }}
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.message-content {

    code {
        font-family: 'Fira Code', monospace !important;
        background-color: #ebeef5;
        border: 1px solid #f1f1f1;
        border-radius: 6px;
        padding: 2px 4px;
    }

    code * {
        font-family: 'Fira Code', monospace !important;
    }

    pre > code {
        background-color: #3e3e3e;
        color: white;
        border-radius: 4px;
        padding: 0.6em 1.2em;
        display: block;
    }

    p:first-of-type {
        margin: 0;
    }

    .cursor {
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
}
</style>
