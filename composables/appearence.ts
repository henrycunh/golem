import { tailwindcssPaletteGenerator } from '@bobthered/tailwindcss-palette-generator'
import { useStorage } from '@vueuse/core'

export function useAppearance() {
    const color = useStorage('golem-base-color', '#a633cc')
    const navigationBarPosition = useStorage<NavigationBarPosition>('golem-navbar-position', 'left')

    function setPalette(newColor?: string) {
        if (newColor) {
            color.value = newColor
        }
        const palette = tailwindcssPaletteGenerator(color.value)
        for (const [shade, color] of Object.entries(palette.primary)) {
            const hexToRgb = (hex: string) => {
                hex = hex.replace('#', '')
                const r = parseInt(hex.substring(0, 2), 16)
                const g = parseInt(hex.substring(2, 4), 16)
                const b = parseInt(hex.substring(4, 6), 16)
                return `${r}, ${g}, ${b}`
            }
            document.documentElement.style.setProperty(`--color-primary-${shade}`, hexToRgb(color))
        }
    }

    return {
        color,
        setPalette,
        navigationBarPosition,
    }
}

export type NavigationBarPosition = 'top' | 'bottom' | 'left' | 'right'
