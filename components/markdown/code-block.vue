<script lang="ts" setup>
import type { Lang } from 'shiki-es'

const props = defineProps<{
    content: string
    syntax: Lang
    isOnMaximizeScreen?: boolean
}>()

const colorMode = useColorMode()
const highlightedCode = ref(props.content)

watchEffect(() => {
    if (props.content && colorMode.value) {
        highlightedCode.value = highlightCode(props.content, props.syntax).match(/<code>(.*)<\/code>/s)?.[1] || ''
    }
})

const clipboard = useClipboard()
const copied = ref(false)
function copyToClipboard() {
    if (clipboard.isSupported) {
        clipboard.copy(props.content)
        copied.value = true
        setTimeout(() => {
            copied.value = false
        }, 1000)
    }
}

const isMaximized = ref(false)
function onMaximize() {
    isMaximized.value = !isMaximized.value
}
</script>

<template>
    <div
        p-1 rounded-2
        bg-gray-1 dark:bg-dark-1
        w-full relative overflow-hidden flex flex-col border shadow
        mt-2
    >
        <div pt-1 pb-2 px-3 text-gray-5 dark:text-gray-2 text-14px flex items-center font-bold>
            <div flex items-center gap-1>
                <div i-tabler-code />
                <span>
                    {{ syntax }}
                </span>
            </div>
            <UButton
                v-if="!isOnMaximizeScreen"
                secondary
                icon="i-tabler-maximize text-5"
                :disabled="copied"
                class="!p-1px !px-1"
                :class="[
                    copied && 'op-50',
                ]" ml-auto
                transition
                @click="onMaximize"
            />
            <UButton
                secondary
                icon="i-tabler-copy"
                class="!p-1px !px-2 !text-12px"
                :disabled="copied"
                ml-2 transition
                :class="[
                    copied && 'op-50',
                    isOnMaximizeScreen && 'ml-auto',
                ]"
                @click="copyToClipboard"
            >
                {{ copied ? 'copied!' : 'copy' }}
            </UButton>
        </div>
        <div
            rounded-1
            w-full
            overflow-x-auto
            whitespace-pre
            font-code
            bg-white
            class="dark:bg-white/5"
            p-2
            v-html="highlightedCode"
        />
        <Dialog v-model="isMaximized" w-80dvw max-h-90dvh>
            <MarkdownCodeBlock
                v-if="isMaximized"
                :content="props.content"
                :syntax="props.syntax"
                :is-on-maximize-screen="true"
            />
        </Dialog>
    </div>
</template>
