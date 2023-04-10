import { defineConfig } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
    shortcuts: [
        { 'text-color': 'text-gray-7 dark:text-gray-2' },
        { 'text-color-lighter': 'text-gray-5 dark:text-gray-4' },
    ],
    rules: [
        [/^bg-([\d]+)\/(\d+)/, ([_, color, opacity]) => ({
            '--gp-bg-opacity': opacity,
            'background-color': `rgba(var(--color-primary-${color}), ${Number(opacity) / 100})`,
        })],

        [/^shadow-([\d]+)\/(\d+)/, ([_, color, opacity]) => ({
            '--gp-shadow-opacity': opacity,
            '--un-shadow-color': `rgba(var(--color-primary-${color}), ${Number(opacity) / 100})`,
        })],
    ],
    theme: {
        colors: {
            primary: {
                50: 'rgb(var(--color-primary-50))',
                100: 'rgb(var(--color-primary-100))',
                200: 'rgb(var(--color-primary-200))',
                300: 'rgb(var(--color-primary-300))',
                400: 'rgb(var(--color-primary-400))',
                500: 'rgb(var(--color-primary-500))',
                600: 'rgb(var(--color-primary-600))',
                700: 'rgb(var(--color-primary-700))',
                800: 'rgb(var(--color-primary-800))',
                900: 'rgb(var(--color-primary-900))',
                DEFAULT: 'rgb(var(--color-primary-500))',
                // 50: '#eadbf0',
                // 100: '#efd8f3',
                // 200: '#eed0f0',
                // 300: '#e0b1e7',
                // 400: '#cd83d8',
                // 500: '#b95ec9',
                // 600: '#a741aa',
                // 700: '#903597',
                // 800: '#762d7c',
                // 900: '#672862',
                // DEFAULT: '#b95ec9',
            },
        },
    },
    transformers: [
        transformerDirectives(),
    ],
})
