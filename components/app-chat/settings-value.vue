<script lang="ts" setup>
const props = defineProps<{ setting: [string, string] }>()
const emit = defineEmits(['click'])

const settingsIconMapping = {
    model: 'i-tabler-3d-cube-sphere',
    creativity: 'i-tabler-brain',
} as any

const settingTitle = computed(() => {
    const [title] = props.setting
    // Separate words by capital letters
    return title.slice(0, 1).toUpperCase() + title.slice(1).replace(/([A-Z])/g, ' $1').trim()
})

const settingValueFormatter = computed(() =>
    mapValue({
        Model: (value: any) => mapValue({
            'gpt-3.5-turbo': 'GPT 3.5',
            'gpt-4': 'GPT 4',
        }, value),
        Creativity: (value: any) => value.slice(0, 1).toUpperCase() + value.slice(1),
    }, settingTitle.value, (value: any) => value))

const settingValue = computed(() => {
    const [, value] = props.setting
    return settingValueFormatter.value(value)
})

const { currentConversation, updateConversationSettings } = useConversations()
function onRemoveClick() {
    if (!currentConversation.value) {
        return
    }
    updateConversationSettings(currentConversation.value.id, {
        [props.setting[0]]: null,
    })
}

function onSettingClick() {
    emit('click')
}
</script>

<template>
    <div
        rounded-1 text-10px sm:text-14px shadow="~ dark/5"
        b="solid 1px dark:white/10 dark/10 t-dark/5 dark:t-white/20"
        flex items-center
        bg="white dark:dark-1" op-90
        text-color hover:op-100 hover:translate-y--2px
        active:translate-y-1px active:op-80 active:shadow-none
        transition cursor-pointer
        @click="onSettingClick"
    >
        <div flex items-center gap-1 p-6px>
            <div :class="settingsIconMapping[setting[0]]" text-primary dark:text-primary-400 text-15px sm:text-18px />
            <div font-bold font-title>
                {{ settingTitle }}
            </div>
        </div>
        <div p-6px bg="dark/4 dark:white/10" m-2px mr-0 rounded-l h-6 sm:h-7>
            {{ settingValue }}
        </div>
        <div
            px-6px py-7px
            bg="dark/4 dark:white/10 hover:dark/10 hover:dark:white/20"
            transition rounded-r-1 mr-3px h-6 sm:h-7
            @click.stop="onRemoveClick"
        >
            <div i-tabler-x />
        </div>
    </div>
</template>
