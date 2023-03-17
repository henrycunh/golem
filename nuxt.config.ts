// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    css: ['~/assets/css/main.css'],
    experimental: {
        reactivityTransform: true,
    },
    modules: [
        '@unocss/nuxt',
        '@vueuse/nuxt',
    ],
    buildModules: [
        'floating-vue/nuxt',
    ],
    unocss: {
        attributify: true,
        uno: true,
        icons: true,
    },
})
