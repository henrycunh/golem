import type { RemovableRef } from '@vueuse/core'

export function syncStorageRef(storageRef: RemovableRef<string>) {
    const newRef = ref<string>(storageRef.value)
    console.log('newRef', newRef.value)
    watch(newRef, (newValue) => {
        storageRef.value = newValue
    }, { immediate: true })

    return newRef
}
