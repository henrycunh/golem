<script lang="ts" setup>
const { sendMessage } = useConversations()
const { isMobile } = useDevice()
const { apiKey } = useSettings()

let monchoix = false
let monchoixGraph = ''
let monchoixIntData = ''

const userMessageInput = ref('')
const choices = ['interroger mes donnees', 'generer un graphe'] // Remplacez ces choix par les vôtres
const selectedChoices = ref([]) // Pour stocker les choix sélectionnés

const showChoices = ref(false)

const toggleChoice = () => {
    monchoix = true
    monchoixIntData = 'interroger mes donnees'
    monchoixGraph = ''
    logger.info('monchoix', monchoix)
    logger.info('monchoixGraph', monchoixGraph)
    logger.info('monchoix data', monchoixIntData)
}
logger.info('monchoix', monchoix)
logger.info('monchoixGraph', monchoixGraph)
logger.info('monchoix data', monchoixIntData)
const onSendMessage = () => {
    sendMessage(userMessageInput.value, monchoix, monchoixGraph, monchoixIntData)
    console.log(`MON CHOIX ${monchoix}`)
    userMessageInput.value = ''
    monchoix = false
    monchoixGraph = ''
    monchoixIntData = ''
    logger.info('monchoix', monchoix)
    logger.info('monchoixGraph', monchoixGraph)
    logger.info('monchoix data', monchoixIntData)
}

const showPromptTooltip = ref(false)
let tooltipTimeout: any

function onHandlePromptClick() {
    if (!apiKey.value && !showPromptTooltip.value) {
        showPromptTooltip.value = true
        tooltipTimeout = setTimeout(() => {
            showPromptTooltip.value = false
        }, 4000)
    }
    else {
        showPromptTooltip.value = false
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout)
        }
    }
}
</script>

<template>
    <div
        sticky left-0 right-0
        :class="[
            !isMobile ? 'bottom-3' : 'bottom-3.25rem',
        ]"
    >
        <div
            inset-0 absolute top--6 bottom--3.5rem
            bg-gradient-to-t from-white via-white
            dark:from-dark-2 dark:via-dark-2
            class="to-dark-2/0"
        />
        <div
            px-6 lg:px-16
        >
            <div
                relative p-2 pb-2px sm:p-3 sm:pb-2
                pr-11 sm:pr-20
                text-gray-600 placeholder:text-gray-400
                placeholder:transition
                class="flex items-center focus-within:placeholder:translate-x-2 bg-gray-1/80 dark:bg-white/5 dark:ring-white/5" ring-2
                ring-inset rounded-3 shadow-inset
                shadow ring-gray-100 focus-within:ring-primary focus-within:shadow-md
                transition
                backdrop-filter backdrop-blur-2px
                :class="[
                    !isLogged ? 'cursor-not-allowed' : '',
                ]"
            >
                <GoButton
                    text-12px
                    @click="toggleChoice"
                >
                    <svg class="w-3 h-3 sm:w-5 sm:h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </GoButton>

                <!-- Afficher la liste de choix si showChoices est vrai
                <div @click="toggleChoice(choice)" style="top: -80px;" class="absolute top-[-8px] left-0 p-2 bg-white rounded shadow transition-transform transform scale-100 translate-y-0">
                    Utilisez une boucle v-for pour afficher les choix avec des cases à cocher
                    <div v-for="(choice, index) in choices" :key="index" class="flex items-center space-x-2 cursor-pointer" @click="toggleChoice(choice)">
                        <input v-model="selectedChoices" :value="choice" type="checkbox" class="text-primary focus:ring-primary">
                        <label class="text-gray-800">{{ choice }}</label>
                    </div>
                </div> -->
                <AppPromptInput
                    v-model="userMessageInput"
                    v-tooltip="{
                        content: 'You have to add an API Key in the settings to send messages.',
                        shown: showPromptTooltip,
                        triggers: [],
                    }"
                    mx-auto
                    max-w-1080px
                    @send="onSendMessage"
                    @click="onHandlePromptClick"
                />
            </div>
            <AppChatScrollToBottomButton />
        </div>
    </div>
</template>
