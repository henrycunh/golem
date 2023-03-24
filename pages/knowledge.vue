<script lang="ts" setup>
import type { types } from '~~/utils/types'

const { extractFromUrl, knowledgeList, deleteKnowledgeItem } = useKnowledge()
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

async function onDeleteKnowledge(knowledgeId: string) {
    await deleteKnowledgeItem(knowledgeId)
}
</script>

<template>
    <div p-4>
        <div text-gray-7 dark:text-gray-1 font-bold text-6>
            Knowledge
        </div>
        <div mt-2 text-gray-5 dark:text-gray-3 max-w-640px leading-6>
            You can ask about anything you want to know. <br>You just need to provide the knowledge.<br>
            Here you can add sources of knowledge from many different sources, from the web, through Notion, to your PDF files.
        </div>
        <div grid grid-cols-3 gap-2>
            <div
                v-for="knowledge in knowledgeList"
                :key="knowledge.id"
                p-3 rounded-2 dark:bg-dark-1 bg-gray-1
                cursor-pointer dark:text-gray-3
            >
                <div font-bold flex>
                    <div>
                        {{ knowledge.title }}
                    </div>
                    <div
                        text-gray-5 dark:text-gray-1 ml-2
                        class="bg-gray-2/50 hover:bg-gray-3/50 dark:bg-dark-2 hover:dark:bg-white/10"
                        hover:text-gray-7 dark:hover:text-gray-1
                        rounded active:scale-95 transition-all
                        w-6 h-6 flex items-center justify-center
                        @click.stop="onDeleteKnowledge(knowledge.id)"
                    >
                        <div i-tabler-x text-18px />
                    </div>
                </div>
                <div>
                    {{ knowledge.id }}
                </div>
            </div>
        </div>
    </div>
</template>
