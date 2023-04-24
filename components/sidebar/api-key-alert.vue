<script lang="ts" setup>
const { isSidebarCompact } = useUI()
</script>

<template>
    <div
        v-if="isSidebarCompact"
        bg="dark:white/10 dark-1/10"
        hover="bg-white shadow-lg dark:!bg-gray-2/10"
        cursor-pointer transition
        p-2 py-3 flex justify-center rounded-2
        relative
    >
        <div i-tabler-key text-6 text-primary dark:text-primary-400 />
        <div
            bg-primary rounded-full text-white
            p-1 px-3 flex items-center justify-center
            text-16px
            absolute top--2 right--2
        >
            <div i-tabler-alert-octagon />
        </div>
    </div>
    <div
        v-else
        text-14px text-gray-5 dark:text-gray-2 py-3 px-5 rounded-2 relative overflow-hidden
        cursor-pointer transition
        bg="gray-2/20" hover="bg-white shadow-lg dark:!bg-gray-2/10"

        shadow="gray-9/5"
        active="translate-y-2px"
        class="group/item dark:!bg-dark-1/60"
    >
        <div
            absolute
            transition transition-right
            class="
                top--5 right--9
                group-hover/item:!text-gray-4/20 group-hover/item:right--5
                group-hover/item:dark:!text-gray-5/20
            "
            text="gray-4/10 30"
        >
            <div i-tabler-key />
        </div>
        <div relative>
            <div>
                Provide your API key to start a conversation.
            </div>
            <div text-primary-600 dark:text-primary-400 mt-1>
                Click here
            </div>
        </div>
    </div>
</template>
