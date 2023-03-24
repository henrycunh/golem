<script lang="ts" setup>
</script>

<template>
    <div
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
            <div text-primary mt-1>
                Click here
            </div>
        </div>
    </div>
</template>
