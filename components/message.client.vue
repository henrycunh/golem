<script lang="ts" setup>
import { marked } from 'marked'
import prismjs from 'prismjs'
// @ts-expect-error - No types
import langDetector from 'lang-detector'
import 'prismjs/themes/prism-tomorrow.css'
import type { ChatMessage } from 'chatgpt-web'

const props = defineProps<{ message: ChatMessage }>()

const { currentPreset } = usePreset()
let messageHTML = $ref('')

watch(() => [props.message.text], ([newContent]) => {
    if (props.message.role === 'assistant') {
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
        const html = marked.parse(newContent, {
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
        // const lastNode = html
        //     .trim()
        //     .split('</')
        //     .filter(node => node.trim().includes('>'))
        //     .slice(-10)
        //     .filter(node => !node.trim().match(/>$/))
        //     ?.pop()

        // if (lastNode && isTyping) {
        //     html = html.replace(lastNode, `${lastNode}<span class="cursor"> |</span>`)
        // }
        messageHTML = html
    }
}, { immediate: true })

const filteredUserMessage = computed(() =>
    currentPreset.value ? props.message.text.replace(currentPreset.value.content, '') : props.message.text,
)

const errorMessageMapping = {
    token_expired: 'Your session has expired. Please login again.',
}
</script>

<template>
    <div
        w-full
    >
        <div
            p-3 leading-6
            rounded-2
            text-14px flex justify-start text-gray-6
            :class="[
                // message.role === 'assistant' && '',
                message.role === 'user' && 'bg-gray-1',
            ]"
        >
            <div
                flex flex-col
                :class="[
                    // message.role === 'assistant' && 'items-start',
                    // message.role === 'user' && 'items-end',
                ]"
            >
                <!-- Agent name -->
                <div font-bold text-gray-7 mb-1>
                    {{ message.role === 'assistant' ? 'Gepeto' : 'You' }}
                </div>
                <div v-if="!message.text">
                    <div i-eos-icons-three-dots-loading text-primary-500 text-8 />
                </div>
                <!-- <div v-else-if="message.error" flex items-center gap-2>
                    <div i-tabler-send-off text-6 />
                    <div>
                        {{ (errorMessageMapping as any)[message.content] || message.content }}
                    </div>
                </div> -->
                <div v-else-if="message.role === 'assistant'" class="message-content">
                    <div v-html="messageHTML" />
                </div>
                <div v-else>
                    {{ filteredUserMessage }}
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
