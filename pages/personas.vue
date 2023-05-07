<script lang="ts" setup>
const { personaList } = usePersona()

function onCreatePersona() {}
</script>

<template>
    <div p-4>
        <div
            font-bold font-title
            text-14px sm:text-22px
            text-color mb-2 flex items-center
        >
            <div>
                Personas
            </div>
        </div>
        <div
            max-h-100 overflow-y-auto overflow-x-hidden w-full p-2
            rounded-2 mt-6
            class="light:bg-gray-1/50 dark:bg-dark-3 dark:shadow-dark" shadow shadow-inset
        >
            {{ personaList }}
        </div>
        <div flex items-center children:grow gap-3 mt-2>
            <UButton
                secondary icon="i-tabler-plus"
                @click="onCreatePersona"
            >
                New persona
            </UButton>
        </div>
    </div>
</template>
