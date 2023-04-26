<script lang="ts" setup>
const { searchTerm } = useSearch()
</script>

<template>
    <UInput
        v-model.trim="searchTerm"
        placeholder="Search..."
        w-full box-border
        b-2
    />
</template>
