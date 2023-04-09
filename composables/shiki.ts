import type { Highlighter, Lang } from 'shiki-es'

const langs = [
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
] as Lang[]

const HTML_ENTITIES = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '\'': '&apos;',
    '"': '&quot;',
} as Record<string, string>

export function useShiki() {
    const shiki = useState<Highlighter | null>('shiki-highlighter', () => null)
    const registeredLang = useState('shiki-registered-lang', () => new Map<string, boolean>())
    const shikiImport = useState<Promise<void> | undefined>('shiki-import', () => undefined)

    function initShiki() {
        if (!shikiImport.value) {
            shikiImport.value = import('shiki-es')
                .then(async (r) => {
                    r.setCDN('/shiki/')
                    shiki.value = await r.getHighlighter({
                        themes: [
                            'vitesse-dark',
                            'vitesse-light',
                        ],
                        langs,
                    })
                })
        }

        if (!shiki.value) {
            return undefined
        }
    }

    function useHighlighter(lang: Lang) {
        initShiki()

        if (!registeredLang.value.get(lang) && shiki.value) {
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

    function useShikiTheme() {
        return useColorMode().value === 'dark' ? 'vitesse-dark' : 'vitesse-light'
    }

    function escapeHtml(text: string) {
        return text.replace(/[<>&'"]/g, ch => HTML_ENTITIES[ch])
    }

    async function highlightCode(code: string, lang: Lang) {
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

    function setupShikiLanguages() {
        initShiki()
        if (!shiki.value) {
            return
        }
        for (const lang of langs) {
            shiki.value.loadLanguage(lang)
        }
    }

    return {
        highlightCode,
        setupShikiLanguages,
    }
}
