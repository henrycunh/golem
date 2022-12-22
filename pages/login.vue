<script lang="ts" setup>
const { login } = useAuth()

const accessToken = $ref('')

const onLogin = async () => {
    let userAccessToken = ''
    console.log(accessToken)
    const safeJSONParse = (str: string) => {
        try {
            return JSON.parse(str)
        }
        catch (e) {
            return null
        }
    }

    const parsed = safeJSONParse(accessToken)
    userAccessToken = parsed?.accessToken || accessToken

    await login(userAccessToken)
    navigateTo('/')
}
</script>

<template>
    <div h-screen flex flex-col items-center>
        <div
            rounded-4 p-6 py-10
            flex items-center justify-center flex-col relative
            bg-white max-w-768px mt-20 b-1 b-gray-100 shadow-lg
            class="shadow-primary-900/10" transition
        >
            <Logo text-8 />
            <div mt-12 flex flex-col>
                <UInput
                    v-model="accessToken"
                    placeholder="Access Token"
                    w-80
                    relative
                />
                <UButton mt-2 text-18px @click="onLogin">
                    Start asking
                </UButton>
                <NuxtLink
                    href="https://chat.openai.com/api/auth/session" target="_blank"
                    flex items-center justify-center gap-1 text-3
                    mt-2
                    link
                >
                    <div i-tabler-help />
                    How to get the Access Token
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
