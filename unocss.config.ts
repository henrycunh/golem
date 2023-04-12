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
                ...Array.from({ length: 40 }, (_, i) => ({
                    name: 50 + i * 25,
                    lightness: 97 - i * 2.5,
                })).reduce((acc, { name }) => ({
                    ...acc,
                    [name]: `rgb(var(--color-primary-${name}))`,
                }), {}),
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
