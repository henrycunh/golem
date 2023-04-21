export default defineNuxtConfig({
    css: ['~/assets/css/main.css'],
    experimental: {
        reactivityTransform: true,
    },
    modules: [
        '@unocss/nuxt',
        '@vueuse/nuxt',
        '@nuxtjs/color-mode',
    ],
    colorMode: {
        classSuffix: '',
    },
    unocss: {
        attributify: true,
        uno: true,
        icons: true,
        webFonts: {
            fonts: {
                code: 'DM Mono:400',
                text: 'Rubik:400,700',
                title: 'Schibsted Grotesk:400,700',
            },
        },
    },
    vite: {
        define: {
            'process.env.VSCODE_TEXTMATE_DEBUG': 'false',
            '__DEV__': process.env.NODE_ENV === 'development',
        },

    },
    hooks: {
        'vite:extendConfig': function (config, { isServer }) {
            if (isServer) {
                const alias = config.resolve!.alias as Record<string, string>
                for (const dep of ['shiki-es', 'fuse.js']) {
                    alias[dep] = 'unenv/runtime/mock/proxy'
                }
            }
        },
    },
    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
    },
    runtimeConfig: {
        detaKey: process.env.DETA_PROJECT_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        password: process.env.GOLEM_PASSWORD,
    },
    build: {
        transpile: ['trpc-nuxt', 'dexie'],
    },
})
