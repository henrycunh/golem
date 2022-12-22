<script lang="ts" setup>
const { token } = useAuth()
</script>

<template>
    <div px-6 py-4 b-b-1 b-gray-100 class="bg-white/70" flex items-center>
        <div text-coolgray-800 font-bold class="text-1.25em" tracking-tighter flex items-center gap-2>
            <div i-fluent-emoji-robot />
            unGPT
        </div>
    </div>
</template>
