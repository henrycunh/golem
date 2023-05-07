import { nanoid } from 'nanoid'
import type { types } from '~~/utils/types'

export function usePersona() {
    const db = useIDB()

    const personaList = useState<types.Persona[]>('personaList', () => [])

    async function initPersonaList() {
        personaList.value = await db.table('personas').toArray()
        if (!personaList.value.length) {
            await createPersona({
                id: nanoid(),
                title: 'Golem',
                instructions: 'You are Golem, a large language model based assistant. Answer as concisely as possible.',
            })
        }
    }

    async function createPersona(persona: types.Persona) {
        const newPersona = {
            ...persona,
            id: nanoid(),
        }
        await db.table('personas').add(newPersona)
        personaList.value.push(newPersona)
        await updatePersonaList()
    }

    async function deletePersona(personaId: string) {
        await db.table('personas').delete(personaId)
        personaList.value = personaList.value.filter(p => p.id !== personaId)
        await updatePersonaList()
    }

    async function updatePersona(personaId: string, update: Partial<types.Persona>) {
        const persona = personaList.value.find(p => p.id === personaId)
        if (persona) {
            await db.table('personas').put({ ...persona, ...update })
        }
        await updatePersonaList()
    }

    async function updatePersonaList() {
        personaList.value = await db.table('personas').toArray()
    }

    return {
        initPersonaList,
        personaList,
        createPersona,
        deletePersona,
        updatePersona,
    }
}
