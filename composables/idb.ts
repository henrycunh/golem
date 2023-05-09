import Dexie from 'dexie'

export function useIDB(options?: { disableStorage: boolean }) {
    const isStorageDisabled = useState<boolean>(() => false)

    if (options?.disableStorage) {
        isStorageDisabled.value = true
    }

    // Check if IDB and/or localStorage is available
    const isStorageAvailable = () => {
        if (isStorageDisabled.value) {
            return false
        }
        try {
            // LocalStorage
            const x = '__storage_test__'
            localStorage.setItem(x, x)
            localStorage.removeItem(x)
            // IndexedDB
            const db = new Dexie('test')
            db.version(1).stores({
                test: 'id',
            })
            return true
        }
        catch (e) {
            return false
        }
    }

    if (isStorageAvailable() && process.client) {
        const db = new Dexie('gepeto')

        db.version(3).stores({
            knowledge: 'id, title, type, sections, metadata, updatedAt, createdAt',
            conversations: 'id, title, messages, metadata, settings, createdAt, updatedAt',
            personas: 'id, title, instructions',
        })

        return db
    }
    else {
        // Return a mock database that uses useState instead of IDB
        return {
            table: (tableName: string) => {
                const state = useState<any[]>(`idb-${tableName}`, () => [])

                return {
                    async add(item: any) {
                        state.value.push(item)
                        return item.id
                    },

                    async delete(id: string) {
                        state.value = state.value.filter((item: any) => item.id !== id)
                    },

                    async toArray() {
                        return state.value
                    },

                    async get(id: string) {
                        return state.value.find((item: any) => item.id === id)
                    },

                    async put(item: any) {
                        const index = state.value.findIndex((i: any) => i.id === item.id)
                        state.value[index] = item
                    },

                    async clear() {
                        state.value = []
                    },
                }
            },
        }
    }
}
