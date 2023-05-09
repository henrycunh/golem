<script lang="ts" setup>
const { scrollToBottom, chatScrolledHeight, getScrollHeight } = useUI()

const isScrollToBottomButtonVisible = computed(() => {
    return chatScrolledHeight.value + 100 < getScrollHeight()
})
</script>

<template>
    <div>
        <Transition name="appear-right">
            <div
                v-if="isScrollToBottomButtonVisible"
            >
                <GoLongPressButton
                    icon="i-tabler-arrow-bar-down !text-4 sm:!text-6"
                    :duration="0"
                    success-style="!ring-primary !text-primary"
                    class="!absolute"
                    right-6 sm:right-7 lg:right-16
                    bottom-16
                    progress-bar-style="!bg-500/20"
                    w-8 sm:w-10
                    z-10
                    @success="scrollToBottom"
                />
            </div>
        </Transition>
    </div>
</template>
