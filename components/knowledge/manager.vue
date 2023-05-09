<!-- <script lang="ts" setup>
import type { types } from '~~/utils/types'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:model-value'])
const onUpdateModelValue = (value: boolean) => {
    emit('update:model-value', value)
}

const { extractFromUrl, knowledgeList } = useKnowledge()
const { updateConversation, currentConversation } = useConversations()

const url = ref('')

const onAdd = () => {
    extractFromUrl({
        url: url.value,
        title: '',
    })
    url.value = ''
}

const onAddKnowledgeToConversation = async (knowledge: types.KnowledgeItem) => {
    if (!currentConversation.value?.id) {
        return
    }
    await updateConversation(currentConversation.value?.id, {
        knowledge: Array.from(new Set([
            ...currentConversation.value?.knowledge || [],
            knowledge.id,
        ])),
    })
}
</script>

<template>
    <div>
        <Dialog
            :model-value="modelValue"
            w-860px
            @update:model-value="onUpdateModelValue"
        >
            <div grid grid-cols-4 gap-6>
                <div flex flex-col gap-2 col-span-1>
                    <div font-bold text-gray-6 text-5>
                        URLs
                    </div>
                    <GoInput
                        v-model="url"
                        placeholder="Enter URL"
                    />
                    <GoButton @click="onAdd">
                        Add
                    </GoButton>
                </div>
                <div col-span-3>
                    <div font-bold text-gray-6 text-5>
                        Knowledge list
                    </div>
                    <div
                        v-for="knowledge in knowledgeList"
                        :key="knowledge.id"
                        bg-gray-1 p-2 rounded-2 w-full cursor-pointer
                    >
                        <div flex items-center gap-2>
                            <div>
                                <img :src="knowledge.metadata.favicon" w-4 h-4>
                            </div>
                            <div text-14px text-gray-6 font-bold>
                                {{ knowledge.title }}
                            </div>
                            <GoButton @click="onAddKnowledgeToConversation(knowledge)">
                                <div i-tabler-plus />
                            </GoButton>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template> -->
