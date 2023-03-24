<script lang="ts" setup>
import type { Ref } from 'vue'
const props = defineProps<{ modelValue: boolean; persistent?: boolean }>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const { teleportTarget } = useTeleport()
const isMounted = useMounted()

const refCard = ref()
if (!props.persistent) {
    onClickOutside(refCard, () => {
    // If dialog is not open => Don't execute
        if (!props.modelValue) {
            return
        }

        emit('update:modelValue', false)
    })
}

// Lock DOM scroll when modelValue is `true`
// ℹ️ We need to use type assertion here because of this issue: https://github.com/johnsoncodehk/volar/issues/2219
useDOMScrollLock(toRef(props, 'modelValue') as Ref<boolean>)
</script>

<script lang="ts">
export default {
    name: 'UDialog',
    inheritAttrs: false,
}
</script>

<template>
    <Teleport
        v-if="isMounted"
        :to="teleportTarget"
    >
        <Transition name="bg">
            <div
                v-show="props.modelValue"
                class="z-[52] grid place-items-center fixed inset-0 bg-slate-900/50 backdrop-blur-3px"
            >
                <Transition name="scale">
                    <div
                        v-show="props.modelValue"
                        ref="refCard"
                        class="shadow-2xl w-[500px] z-[53] backface-hidden transform translate-z-0 max-w-[calc(100vw-2rem)] shadow-dark-900/20"
                        bg-white dark:bg-dark-1 rounded-2 overflow-hidden
                        v-bind="{ ...$attrs, ...props }"
                    >
                        <!-- ℹ️ Recursively pass down slots to child -->
                        <template
                            v-for="(_, name) in $slots"
                        >
                            <slot
                                :name="name"
                            />
                        </template>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
