<script lang="ts" setup>
definePageMeta({
    layout: 'blank',
})

const password = ref('')
const error = ref(false)
const { isLoggedIn } = useSession()
const client = useClient()

async function onLogin() {
    const result = await client.auth.login.mutate(password.value)
    if (result) {
        error.value = false
        useCookie('golem-password').value = password.value
        isLoggedIn.value = true
        navigateTo('/')
    }
    else {
        error.value = true
    }
}
</script>

<template>
    <div flex="~ col gap-2" items-center justify-center h-full w-full text-color>
        <div mb-4>
            This instance is protected by a password.
        </div>
        <GoInput
            v-model="password"
            type="password"
            placeholder="Password"
            class="min-w-48 max-w-64"
            text-color
            @keydown.enter="onLogin"
        />
        <GoButton
            class="min-w-48 max-w-64"
            @click="onLogin"
        >
            Login
        </GoButton>
        <div v-if="error">
            Invalid password
        </div>
    </div>
</template>
