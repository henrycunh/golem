import type { Highlighter, Lang } from 'shiki-es'

const shiki = ref<Highlighter>()

const registeredLang = ref(new Map<string, boolean>())
let shikiImport: Promise<void> | undefined

export function useHighlighter(lang: Lang) {
    if (!shikiImport) {
        shikiImport = import('shiki-es')
            .then(async (r) => {
                r.setCDN('/shiki/')
                shiki.value = await r.getHighlighter({
                    themes: [
                        'vitesse-dark',
                        'vitesse-light',
                    ],
                    langs: [
                        'js',
                        'css',
                        'html',
                        'json',
                        'yaml',
                        'md',
                        'rust',
                        'go',
                        'python',
                        'vue',
                        'ruby',
                    ],
                })
            })
    }

    if (!shiki.value) {
        return undefined
    }

    if (!registeredLang.value.get(lang)) {
        shiki.value.loadLanguage(lang)
            .then(() => {
                registeredLang.value.set(lang, true)
            })
            .catch(() => {
                const fallbackLang = 'md'
                shiki.value?.loadLanguage(fallbackLang).then(() => {
                    registeredLang.value.set(fallbackLang, true)
                })
            })
        return undefined
    }

    return shiki.value
}

export function useShikiTheme() {
    return useColorMode().value === 'dark' ? 'vitesse-dark' : 'vitesse-light'
}

const HTML_ENTITIES = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '\'': '&apos;',
    '"': '&quot;',
} as Record<string, string>

export function escapeHtml(text: string) {
    return text.replace(/[<>&'"]/g, ch => HTML_ENTITIES[ch])
}

export async function highlightCode(code: string, lang: Lang) {
    const shiki = useHighlighter(lang)
    if (!shiki) {
        return escapeHtml(code)
    }
    const theme = useShikiTheme()
    return shiki.codeToHtml(code, {
        lang,
        theme,
    })
}

export function useShiki() {
    return shiki
}

export function detectLang(message: string) {
    const lang = message.match(/```([a-z]+)\s+/)?.[1]
    if (lang) {
        return lang as Lang
    }
    const possibleLanguages = [
        'javascript',
        'typescript',
        'html',
        'css',
        'json',
        'markdown',
        'bash',
        'shell',
        'yaml',
        'yml',
        'toml',
        'python',
        'php',
        'java',
        'cpp',
        'csharp',
        'ruby',
        'rust',
    ]
    const matches = possibleLanguages.reduce((acc, lang) => {
        const regex = new RegExp(`\\b${lang}\\b`, 'i')
        if (!(lang in acc)) {
            acc[lang] = 0
        }
        acc[lang] += (message.match(regex) || []).length
        return acc
    }, {} as Record<string, number>)
    const topMatch = Object.entries(matches).sort((a, b) => b[1] - a[1])[0]
    if (topMatch[1] > 0) {
        return topMatch[0] as Lang
    }
    return 'md'
}
