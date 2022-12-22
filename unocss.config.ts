import { defineConfig } from 'unocss'

export default defineConfig({
    shortcuts: [
        { link: 'text-primary-500 hover:text-primary-400 decoration-none ' },
    ],
    theme: {
        colors: {
            primary: {
                50: '#f3f7fb',
                100: '#e4ecf5',
                200: '#cfdeee',
                300: '#afc9e1',
                400: '#88acd2',
                500: '#6c91c5',
                600: '#587ab8',
                700: '#4e68a7',
                800: '#445789',
                900: '#3a4a6e',
            },
        },
    },
})
