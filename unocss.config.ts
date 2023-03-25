import { defineConfig } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
    shortcuts: [
        { 'text-color': 'text-gray-7 dark:text-gray-2' },
    ],
    theme: {
        colors: {
            primary: {
                50: '#eadbf0',
                100: '#efd8f3',
                200: '#eed0f0',
                300: '#e0b1e7',
                400: '#cd83d8',
                500: '#b95ec9',
                600: '#a741aa',
                700: '#903597',
                800: '#762d7c',
                900: '#672862',
                DEFAULT: '#b95ec9',
            },
        },
    },
    transformers: [
        transformerDirectives(),
    ],
})
