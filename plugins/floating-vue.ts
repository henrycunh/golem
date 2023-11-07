import FloatingVue from 'floating-vue'
import { defineNuxtPlugin } from '#imports'
import 'floating-vue/dist/style.css'

export default defineNuxtPlugin(({ vueApp }) => {
    vueApp.use(FloatingVue)
})
