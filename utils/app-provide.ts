export function appProvide(key: string, provided: any) {
    const { vueApp } = useNuxtApp()
    vueApp.provide(key, provided)
}
