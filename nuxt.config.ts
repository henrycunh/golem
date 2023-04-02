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
    buildModules: [
        'floating-vue/nuxt',
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
            },
        },
    },
    vite: {
        define: {
            'process.env.VSCODE_TEXTMATE_DEBUG': 'false',
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
})
