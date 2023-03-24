<script lang="ts" setup>
const colorMode = useColorMode()
const onClick = (e: any) => {
    colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
    e.preventDefault()
}
</script>

<template>
    <div
        p-1 text-5 rounded cursor-pointer hover:bg-gray-1 transition
        class="dark:hover:bg-white/5"
        @click.stop="onClick"
    >
        <Transition name="appear-top">
            <div v-if="colorMode === 'light'" i-tabler-sun />
        </Transition>
        <Transition name="appear-top">
            <div v-if="colorMode === 'dark'" i-tabler-moon />
        </Transition>
    </div>
</template>
