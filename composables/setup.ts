export async function useSetup() {
    const { updateKnowledgeList } = useKnowledge()

    await updateKnowledgeList()
}
