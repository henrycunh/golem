export const usePreset = () => {
    const currentPreset = useState<{
        title: string
        content: string
    } | null>(() => null)

    const setPreset = (preset: { title: string; content: string }) => {
        currentPreset.value = preset
    }

    const clearPreset = () => {
        currentPreset.value = null
    }

    return {
        currentPreset,
        setPreset,
        clearPreset,
    }
}
