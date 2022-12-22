<script lang="ts" setup>
const { sendMessage, messageList } = useChatGPT()
let prompt = $ref('')

const onChat = async () => {
    sendMessage({
        message: prompt,
    })
    prompt = ''
}
</script>

<template>
    <div relative>
        <ClientOnly>
            <div v-auto-animate px-4 max-h-screen overflow-y-scroll pb-30 relative>
                <div w-768px mx-auto relative mt-10 h-full>
                    <MessageBubble
                        v-for="message in messageList"
                        :key="message.id"
                        :message="message"
                    />

                    <div sticky mt-20 bottom--30 left-0 right-0 p-4>
                        <AppPromptInput
                            v-model="prompt"
                            @send="onChat"
                        />
                    </div>
                </div>
            </div>
        </ClientOnly>
    </div>
</template>
