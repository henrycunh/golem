<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue', 'send'])

const { apiKey } = useSettings()
/* const choices = ['Interroger mes donnees'] // Remplacez ces choix par les vôtres
const selectedChoices = ref([]) // Pour stocker les choix sélectionnés */

const { isTypingInCurrentConversation, currentConversation, stopConversationMessageGeneration } = useConversations()
const textarea = ref()
const isLogged = computed(() => Boolean(apiKey.value))

const onSend = () => {
    // const choiceClicked = selectedChoices.value.length > 0  Vérifier si un choix a été cliqué
    // console.log(choiceClicked)
    if (!isTypingInCurrentConversation.value && props.modelValue) {
        emit('send', props.modelValue)
        emit('update:modelValue', '')
    }
}

/* const showChoices = ref(false)

const toggleChoice = (choice) => {
    const index = selectedChoices.value.indexOf(choice)
    if (index !== -1) {
        // Le choix est déjà sélectionné, le supprimer de selectedChoices
        selectedChoices.value.splice(index, 1)
    }
    else {
        // Le choix n'est pas encore sélectionné, l'ajouter à selectedChoices
        selectedChoices.value.push(choice)
    }
    // Masquer la liste après la sélection ou la désélection d'un choix
    showChoices.value = false
}

const displayChoices = () => {
    showChoices.value = !showChoices.value
    if (!showChoices.value) {
        selectedChoices.value = [] // Réinitialiser les choix sélectionnés
    }
} */
const onType = (event?: any) => {
    if (!textarea.value) {
        return
    }
    textarea.value.style.height = '1.75rem'
    textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 100)}px`

    if (event) {
        emit('update:modelValue', (event.target as any).value)
    }
}
const handleArrowUp = (e: KeyboardEvent) => {
    // do nothing if textarea is not empty
    if (textarea.value.value) {
        return
    }

    e.preventDefault()
    const userMessages = currentConversation.value?.messages.filter(message => message.role === 'user')
    const lastUserMessage = userMessages?.[userMessages.length - 1]

    if (lastUserMessage) {
        emit('update:modelValue', lastUserMessage.text)
    }
}

const handleEnter = (e: KeyboardEvent) => {
    if (e.shiftKey) {
        return
    }
    e.preventDefault()
    onSend()
    textarea.value.style.height = '1.75rem'
}

function onStopGenerationClick() {
    if (!currentConversation.value) {
        return
    }

    stopConversationMessageGeneration(currentConversation.value.id)
}
</script>

<template>
    <!-- <GoButton
            text-12px
            @click="displayChoices"
        >
            <svg class="w-3 h-3 sm:w-5 sm:h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </GoButton> -->

    <!-- Afficher la liste de choix si showChoices est vrai -->
    <!-- <div v-if="showChoices" style="top: -80px;" class="absolute top-[-8px] left-0 p-2 bg-white rounded shadow transition-transform transform scale-100 translate-y-0">
            Utilisez une boucle v-for pour afficher les choix avec des cases à cocher
            <div v-for="(choice, index) in choices" :key="index" class="flex items-center space-x-2 cursor-pointer" @click="toggleChoice(choice)">
                <input v-model="selectedChoices" :value="choice" type="checkbox" class="text-primary focus:ring-primary">
                <label class="text-gray-800">{{ choice }}</label>
            </div>
        </div> -->
    <!-- <div class="dropdown">
            <button class="dropdown-button" @click="toggleDropdown">
                <svg class="w-3 h-3 sm:w-5 sm:h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>
            <ul v-if="isDropdownOpen" class="dropdown-list">
            </ul>
        </div> -->
    <textarea
        ref="textarea"
        :value="modelValue"
        w-full
        text-12px sm:text-16px
        outline-none overflow-y-auto bg-transparent overflow-x-hidden
        placeholder="Ecrivez votre requete ici..." leading-6 font-text
        relative z-2 resize-none b-0 h-28px sm:h-7
        dark:placeholder:text-gray-4
        text-gray-8 dark:text-gray-1
        focus:placeholder:translate-x-6px placeholder:transition-all
        :disabled="!isLogged"
        :class="[
            !isLogged ? 'cursor-not-allowed' : '',
        ]"
        @input="onType"
        @keydown.up="handleArrowUp"
        @keydown.enter="handleEnter"
    />
    <div
        absolute right-2
        bottom-8px sm:bottom-10px
        z-3
    >
        <GoButton
            :disabled="!isLogged || !modelValue"
            text-12px
            @click="onSend"
        >
            <div
                text-3 sm:text-5
                :class="[
                    !isTypingInCurrentConversation ? 'i-tabler-send' : 'i-eos-icons-bubble-loading',
                ]"
            />
        </GoButton>

        <Transition name="appear-top">
            <div
                v-if="isTypingInCurrentConversation"
                absolute top-0
                right-18 sm:right-12
            >
                <GoButton @click="onStopGenerationClick">
                    <div i-tabler-player-stop-filled text-3 sm:text-5 />
                    <div whitespace-nowrap text-10px sm:text-14px>
                        Arrêter de parler!
                    </div>
                </GoButton>
            </div>
        </Transition>
    </div>
</template>

<style>
.slide-in-bottom-enter-active, .slide-in-bottom-leave-active {
    transition: all .2s ease;
}

.slide-in-bottom-enter, .slide-in-bottom-leave-to {
    transform: translateY(100%) scaleY(0);
    opacity: 0;
}
/* Animation de l'apparition par le haut */
.transition-transform {
  transition-property: transform;
  transition-duration: 0.2s;
}

/* État initial de la transformation */
.scale-0 {
  transform: scaleY(0);
  transform-origin: top;
}

/* État final de la transformation */
.scale-100 {
  transform: scaleY(1);
  transform-origin: top;
}
</style>
