import Dexie from 'dexie'

export function useIDB() {
    const db = new Dexie('gepeto')

    db.version(1).stores({
        knowledge: 'id, title, type, sections, metadata, updatedAt, createdAt',
        conversations: 'id, title, messages, createdAt, updatedAt',
    })

    return db
}
