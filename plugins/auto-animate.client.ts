import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

export default defineNuxtPlugin((nuxt) => {
    nuxt.vueApp.use(autoAnimatePlugin)
})
