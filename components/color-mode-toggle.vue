<script lang="ts" setup>
const colorMode = useColorMode()
const onClick = (e: any) => {
    colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light'
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
            <div v-if="colorMode.value === 'light'" i-tabler-sun />
        </Transition>
        <Transition name="appear-top">
            <div v-if="colorMode.value === 'dark'" i-tabler-moon />
        </Transition>
    </div>
</template>
