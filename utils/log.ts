import consola from 'consola'

export const logger = consola.create({
    level: __DEV__ ? 4 : 3,
})
